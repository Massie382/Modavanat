/**
 * POST /api/auth/signup
 *
 * Create a new regular user (role='user'). Hashes the password via
 * scrypt, sends an email-verification token via the `tokens` table.
 *
 * Body: { name?: string, email: string, password: string }
 *
 * Returns:
 *   201 { ok: true, message: "verification email sent" }  — success
 *   400 { error: "..." }                                    — validation fail
 *   409 { error: "email already registered" }               — duplicate
 *   429 { error: "rate limited" }                           — too many signups from this IP
 *
 * Rate-limited per IP. See src/lib/auth/rate-limit.ts.
 * Audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/passwords";
import { createToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/auth/audit";
import { checkSignupRate, getClientIp } from "@/lib/auth/rate-limit";

const signupSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

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

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate-limit check.
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
  const { name, email, password } = parsed.data;

  // Existing-email check.
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

  // Create user (role=user, emailVerified=null).
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name: name ?? null,
    email,
    role: "user",
    passwordHash: hashPassword(password),
    emailVerified: null,
  });

  // Mint a verification token.
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
    metadata: { email },
    ip,
  });

  return NextResponse.json(
    { ok: true, message: "ایمیل فعال‌سازی ارسال شد." },
    { status: 201 }
  );
}
