/**
 * POST /api/auth/signup
 *
 * Create a new regular user (role='user'). Branches on `kind`:
 *
 *   kind="email"  — Same flow as before: hash the password (scrypt),
 *                   insert the user, mint an `email_verification` token
 *                   (24h TTL), email a magic link.
 *
 *   kind="phone"  — Hash the password (scrypt), insert the user with
 *                   `phone` set + `phoneVerified=null`, mint a
 *                   `phone_signup` OTP token (5-min TTL), send the OTP
 *                   via sms.ir. The user enters the OTP on the signup
 *                   page (or POSTs /api/auth/verify-phone) to confirm
 *                   ownership and set `phoneVerified=now()`.
 *
 * Body variants:
 *   { kind: "email", name?, email, password }
 *   { kind: "phone", name?, phone, password }   ← phone accepts any
 *                                                 Persian / international
 *                                                 form; normalized to
 *                                                 989XXXXXXXXX.
 *
 * Returns:
 *   201 { ok: true, kind, message: "verification email/sms sent" }
 *   400 { error: "..." }                                   — validation
 *   409 { error: "email/phone already registered" }        — duplicate
 *   429 { error: "rate limited" }                          — too many
 *   502 { error: "sms delivery failed" }                   — sms.ir error
 *
 * Rate-limited per IP (signup-ip bucket) + per-phone (phone-otp bucket,
 * only when kind=phone). Audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/passwords";
import { createToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/auth/audit";
import {
  checkSignupRate,
  checkPhoneOtpRate,
  getClientIp,
} from "@/lib/auth/rate-limit";
import { sendOtp } from "@/lib/auth/sms";
import { normalizeEmail, normalizePhone } from "@/lib/auth/identifier";

// ── Schema ────────────────────────────────────────────────────────────
// One shape with optional fields + a refine so we can branch on `kind`
// without TS losing track of which fields are present. Accepts:
//   { kind: "email", email, password, name? }
//   { kind: "phone", phone, password, name? }
//   { email, password, name? }            ← backward compat (kind absent)
const signupSchema = z
  .object({
    kind: z.enum(["email", "phone"]).optional(),
    name: z.string().trim().min(3).max(80).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(4).max(20).optional(),
    password: z.string().min(8).max(200),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "phone" || (!data.kind && data.phone && !data.email)) {
      if (!data.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "شماره موبایل را وارد کنید.",
          path: ["phone"],
        });
      }
    } else {
      // email kind (explicit or implicit via missing kind+email)
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ایمیل را وارد کنید.",
          path: ["email"],
        });
      }
    }
  });

// ── Email plumbing (kept from the previous implementation) ───────────
const SMTP_URL = process.env.SMTP_URL ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@modavanat.ir";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

let mailer: ReturnType<typeof import("nodemailer").createTransport> | null = null;
async function getMailer() {
  if (mailer) return mailer;
  const { createTransport } = await import("nodemailer");
  if (!SMTP_URL) {
    console.warn("[signup] SMTP_URL not set — verification email will be logged to stdout.");
  }
  mailer = createTransport(SMTP_URL ? SMTP_URL : { jsonTransport: true });
  return mailer;
}

async function sendVerificationEmail(email: string, plaintext: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(plaintext)}`;
  const body = `سلام،\n\nبرای فعال‌سازی حساب خود در قانون‌یاب روی پیوند زیر کلیک کنید:\n${verifyUrl}\n\nاین پیوند تنها ۲۴ ساعت معتبر است.\n\nاگر شما درخواست ثبت‌نام نکرده‌اید، این پیام را نادیده بگیرید.\n\nقانون‌یاب`;
  if (!SMTP_URL) {
    console.log(`[signup][dev] Verification link for ${email} → ${verifyUrl}`);
    return;
  }
  const transport = await getMailer();
  await transport.sendMail({
    to: email,
    from: SMTP_FROM,
    subject: "فعال‌سازی حساب در قانون‌یاب",
    text: body,
  });
}

// ── Handler ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Per-IP signup gate (covers both kinds).
  const rate = checkSignupRate(ip);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  // Parse + validate body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "ورودی نامعتبر است." },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const kind: "email" | "phone" = data.kind === "phone" ? "phone" : "email";
  const name = data.name ?? null;
  const password = data.password;

  // ── Email-kind flow ──────────────────────────────────────────────
  if (kind === "email") {
    const email = normalizeEmail(data.email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
    }
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است. برای ورود از صفحهٔ ورود استفاده کنید." },
        { status: 409 }
      );
    }
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      name,
      email,
      role: "user",
      passwordHash: hashPassword(password),
      emailVerified: null,
    });
    const { plaintext } = await createToken(id, "email_verification");
    try {
      await sendVerificationEmail(email, plaintext);
    } catch (err) {
      console.error("[signup] Failed to send verification email:", err);
      // Don't fail the signup — the user can request a resend from the UI.
    }
    await logAudit({
      actorUserId: id,
      action: "user.signup",
      targetType: "user",
      targetId: id,
      metadata: { kind: "email", email },
      ip,
    });
    return NextResponse.json(
      { ok: true, kind: "email", message: "ایمیل فعال‌سازی ارسال شد." },
      { status: 201 }
    );
  }

  // ── Phone-kind flow ──────────────────────────────────────────────
  const phone = normalizePhone(data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "شماره موبایل نامعتبر است. باید با ۰۹ شروع شود و ۱۱ رقم باشد." },
      { status: 400 }
    );
  }
  // Phone OTP rate-limit (per-phone + per-IP). We DON'T trigger the
  // per-phone bucket if the row already exists (we 409 early below) —
  // but the per-IP bucket still catches enumeration attempts.
  const phoneRate = checkPhoneOtpRate(phone, ip);
  if (!phoneRate.ok) {
    return NextResponse.json({ error: phoneRate.message }, { status: 429 });
  }
  // Existing-phone check (partial unique index from the migration).
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "این شماره موبایل قبلاً ثبت شده است. برای ورود از صفحهٔ ورود استفاده کنید." },
      { status: 409 }
    );
  }

  // Create user. `phone` set, `phoneVerified=null` (set on verify).
  // `email` is NOT NULL in the schema (NextAuth convention), so we
  // synthesize a stable placeholder of the form
  //   `phone+989XXXXXXXXX@local.modavanat.ir`
  // This string is unique per phone, never surfaces to the user (the
  // real auth identifier is `phone`), and never receives email. If the
  // user later binds a real email via /account, we overwrite this.
  const placeholderEmail = `phone+${phone}@local.modavanat.ir`;
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name,
    email: placeholderEmail,
    phone,
    role: "user",
    passwordHash: hashPassword(password),
    emailVerified: null,
    phoneVerified: null,
  });

  const { plaintext } = await createToken(id, "phone_signup");
  const sms = await sendOtp(phone, "signup", plaintext);
  if (!sms.ok) {
    // SMS delivery failed — best-effort roll-back the user row so the
    // phone number isn't "burned" against an account that can't be
    // activated. The user can retry.
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (e) {
      console.error("[signup] Failed to roll back user after SMS failure:", e);
    }
    await logAudit({
      actorUserId: null,
      action: "user.signup.sms_failed",
      targetType: "user",
      targetId: phone,
      metadata: { kind: "phone", phone, status: sms.status, raw: sms.raw },
      ip,
    });
    return NextResponse.json(
      { error: sms.error ?? "ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید." },
      { status: 502 }
    );
  }

  await logAudit({
    actorUserId: id,
    action: "user.signup",
    targetType: "user",
    targetId: id,
    metadata: { kind: "phone", phone },
    ip,
  });

  return NextResponse.json(
    { ok: true, kind: "phone", message: "کد تأیید پیامک شد." },
    { status: 201 }
  );
}

/**
 * GET /api/auth/signup — discover whether a phone or email is already
 * registered (used by the signup page to show inline "already exists"
 * hints and prevent the user from typing a duplicate). Returns:
 *   200 { available: true }                  — identifier is free
 *   200 { available: false }                 — identifier is taken
 *   400 { error: "..." }                     — invalid input
 *
 * Query params: ?kind=email&value=foo@bar.com
 *               ?kind=phone&value=0912...
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "email";
  const value = (url.searchParams.get("value") ?? "").trim();
  if (!value) {
    return NextResponse.json(
      { error: "شناسه را وارد کنید." },
      { status: 400 }
    );
  }
  if (kind === "phone") {
    const phone = normalizePhone(value);
    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل نامعتبر است." },
        { status: 400 }
      );
    }
    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    return NextResponse.json({ available: found.length === 0 }, { status: 200 });
  }
  const email = normalizeEmail(value);
  if (!email) {
    return NextResponse.json(
      { error: "ایمیل معتبر نیست." },
      { status: 400 }
    );
  }
  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(eq(users.email, email), eq(users.phone, email))
    )
    .limit(1);
  return NextResponse.json({ available: found.length === 0 }, { status: 200 });
}
