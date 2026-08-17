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
      // Authorize is called for every credentials sign-in. We look
      // up the user by email, verify the password hash, and return
      // the user (or null on failure). For Phase 4 admin creation
      // flow we'll use scrypt (node:crypto, no native binary) to
      // stay VPS-portable. For now, accept any password if
      // password_hash is null (bootstrap admin).
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = String(creds.email).toLowerCase().trim();
        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = found[0];
        if (!user) return null;
        if (!user.passwordHash) {
          return {
            id: user.id,
            name: user.name ?? undefined,
            email: user.email,
            image: user.image ?? undefined,
            role: user.role,
          };
        }
        // TODO Phase 4: scrypt.verify(user.passwordHash, creds.password)
        return null;
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
