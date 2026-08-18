/**
 * NextAuth v5 — full server-side config.
 *
 * Two files:
 *   - src/auth.config.ts  — Edge-safe (no DB import), used by middleware.
 *   - src/auth.ts (this) — server-only, adds the Drizzle adapter +
 *     full providers (Email magic link via nodemailer, Credentials
 *     with scrypt hashing).
 *
 * Session strategy is JWT (not "database") so the middleware doesn't
 * hit the DB on every request. The Drizzle adapter is still installed
 * so OAuth account-linking / account management work, but the JWT
 * carries role+uid and is checked statelessly.
 */

import NextAuth from "next-auth";
// Side-effect import so the `next-auth/jwt` module is loaded before
// we try to augment its types below.
import "next-auth/jwt";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { createTransport } from "nodemailer";
import { db } from "@/db/client";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { verifyPassword, hashPassword, needsRehash } from "@/lib/auth/passwords";
import {
  preLoginCheck,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/auth/rate-limit";
import { logAudit } from "@/lib/auth/audit";

const SMTP_URL = process.env.SMTP_URL ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@modavanat.ir";

// ── Mailer (lazily built; reused across requests) ───────────────────
let mailer: ReturnType<typeof createTransport> | null = null;
function getMailer() {
  if (mailer) return mailer;
  // Production: SMTP_URL points at local Postfix/Exim on 127.0.0.1:25
  // Dev: we still configure the same URL — nodemailer can target
  // mailhog / gmail / etc.
  if (!SMTP_URL) {
    console.warn(
      "[auth] SMTP_URL is not set — magic-link emails will be logged to stdout instead of sent."
    );
  }
  mailer = createTransport(SMTP_URL ? SMTP_URL : { jsonTransport: true });
  return mailer;
}

async function sendVerificationRequest({
  identifier,
  url,
  provider,
}: {
  identifier: string;
  url: string;
  provider: { from?: string };
}) {
  const body = `سلام،\n\nبرای ورود به قانون‌یاب روی پیوند زیر کلیک کنید:\n${url}\n\nاین پیوند تنها برای استفادهٔ یک‌بار و در مدت کوتاهی معتبر است.\n\nاگر شما درخواست ورود نکرده‌اید، این پیام را نادیده بگیرید.\n\nقانون‌یاب`;
  try {
    if (!SMTP_URL) {
      console.log("[auth][dev] Magic link for", identifier, "→", url);
      return;
    }
    await getMailer().sendMail({
      to: identifier,
      from: provider.from ?? SMTP_FROM,
      subject: "پیوند ورود به قانون‌یاب",
      text: body,
    });
  } catch (err) {
    console.error("[auth] Failed to send verification email:", err);
    throw err;
  }
}

// ── Auth config ─────────────────────────────────────────────────────
// Merge the Edge-safe base config with server-only additions:
//   - Drizzle adapter (for OAuth account-linking / management)
//   - Full Credentials provider (with `authorize` that reads DB)
//   - Full Email provider (with `sendVerificationRequest` that sends
//     mail via nodemailer + local SMTP)
//
// NOTE: session.strategy stays "jwt" from authConfig — we DON'T want
// the DB hit on every middleware run.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Drizzle adapter is wired so OAuth accounts (and the user records
  // we manage via the admin UI) get persisted. The JWT session
  // strategy means we don't use sessions table for request-time auth,
  // but the adapter still creates user records when an email magic
  // link completes its first sign-in.
  adapter: DrizzleAdapter(
    db as any,
    {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    } as any
  ),
  providers: [
    EmailProvider({
      server: SMTP_URL || "smtp://127.0.0.1:25",
      from: SMTP_FROM,
      maxAge: 60 * 15, // 15-minute window
      sendVerificationRequest,
    }),
    CredentialsProvider({
      name: "ایمیل و گذرواژه",
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "گذرواژه", type: "password" },
      },
      // Authorize is called for every credentials sign-in. Flow:
      //   1. Pre-flight rate-limit check (IP + email buckets, account
      //      lockout). If locked, return null — the user sees a generic
      //      "invalid credentials" message on the form, but the audit
      //      log + lockout column capture the truth.
      //   2. Lookup user by email. If not found, record failure + return null.
      //   3. Bootstrap path: if passwordHash is null (e.g. admin
      //      created via create-admin.ts before a password was set,
      //      or a magic-link user who's never set a password), accept
      //      ANY password and immediately upgrade the row by hashing
      //      the provided password. First sign-in sticks.
      //   4. Normal path: scrypt verify. On mismatch, record failure +
      //      return null. On match, record success, silently upgrade
      //      weak hashes, return the user object.
      //
      // Note on the IP plumbing: NextAuth v5 passes the Next.js
      // Request object as the second `authorize` arg, but typing it is
      // awkward. We cast to any and read the headers we care about.
      async authorize(creds, req) {
        if (!creds?.email || !creds?.password) return null;
        const email = String(creds.email).toLowerCase().trim();
        const password = String(creds.password);
        // Resolve client IP from request headers (set by nginx/Caddy).
        const r = req as unknown as { headers?: Record<string, string | null> } | undefined;
        const ip =
          (r?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim()) ||
          r?.headers?.["x-real-ip"]?.trim() ||
          "0.0.0.0";

        // 1) Pre-flight rate-limit + lockout check.
        const pre = await preLoginCheck(email, ip);
        if (!pre.ok) {
          await logAudit({
            actorUserId: null,
            action: "user.login.blocked",
            targetType: "user",
            targetId: email,
            metadata: { reason: "rate_limit", retryAfterMs: pre.retryAfterMs },
            ip,
          });
          return null;
        }

        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = found[0];
        if (!user) {
          // User not found — still record a "failure" so the IP bucket
          // fills (catches user enumeration attacks where the attacker
          // tries many emails to enumerate accounts).
          await recordLoginFailure(email);
          await logAudit({
            actorUserId: null,
            action: "user.login.failed",
            targetType: "user",
            targetId: email,
            metadata: { reason: "no_such_user" },
            ip,
          });
          return null;
        }

        // 2) Bootstrap path — no password set yet, accept + persist.
        if (!user.passwordHash) {
          await db
            .update(users)
            .set({
              passwordHash: hashPassword(password),
              failedLoginAttempts: 0,
              lockedUntil: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
          await recordLoginSuccess(email);
          await logAudit({
            actorUserId: user.id,
            action: "user.login.success",
            targetType: "user",
            targetId: user.id,
            metadata: { bootstrap: true },
            ip,
          });
          return {
            id: user.id,
            name: user.name ?? undefined,
            email: user.email,
            image: user.image ?? undefined,
            role: user.role,
          };
        }

        // 3) Normal path — verify against stored scrypt hash.
        if (!verifyPassword(password, user.passwordHash)) {
          await recordLoginFailure(email);
          await logAudit({
            actorUserId: user.id,
            action: "user.login.failed",
            targetType: "user",
            targetId: user.id,
            metadata: { reason: "wrong_password" },
            ip,
          });
          return null;
        }

        // 4) Silent upgrade: re-hash if params are weaker than current.
        if (needsRehash(user.passwordHash)) {
          await db
            .update(users)
            .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
            .where(eq(users.id, user.id));
        }

        await recordLoginSuccess(email);
        await logAudit({
          actorUserId: user.id,
          action: "user.login.success",
          targetType: "user",
          targetId: user.id,
          ip,
        });

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
});

declare module "next-auth" {
  interface User {
    role?: string;
    passwordHash?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
  }
}
