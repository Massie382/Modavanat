/**
 * GET /api/auth/verify-email?token=...
 *
 * Verify an email-verification token. On success, mark the user's
 * `emailVerified` column and redirect to /signin?verified=1. On
 * failure, redirect to /verify-email?error=invalid.
 *
 * The token is consumed (marked as used) regardless of outcome so a
 * replay attack can't reuse it.
 *
 * Audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/auth/audit";

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=missing`);
  }

  const verified = await verifyToken("email_verification", token);
  if (!verified) {
    await logAudit({
      actorUserId: null,
      action: "user.verify_email.failed",
      targetType: "user",
      metadata: { reason: "invalid_or_expired_token" },
    });
    return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid`);
  }

  // Mark the user as verified.
  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.id, verified.userId));

  await logAudit({
    actorUserId: verified.userId,
    action: "user.verify_email.success",
    targetType: "user",
    targetId: verified.userId,
  });

  return NextResponse.redirect(`${APP_URL}/signin?verified=1`);
}

/**
 * POST /api/auth/verify-email/resend
 *
 * Re-send the verification email. Requires the caller to be already
 * authenticated (we look up their userId from the session) OR to
 * provide an email in the body (less secure, but simpler for the
 * pre-signin flow).
 *
 * Body: { email: string }
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "0.0.0.0";
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }
  const email = body.email.toLowerCase().trim();

  const found = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length === 0) {
    // Don't reveal — return 200 to avoid user enumeration.
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (found[0].emailVerified) {
    return NextResponse.json(
      { error: "این ایمیل قبلاً تأیید شده است." },
      { status: 409 }
    );
  }

  // Reuse the signup rate-limit (per-IP) to gate resend storms.
  const { checkSignupRate } = await import("@/lib/auth/rate-limit");
  const rate = checkSignupRate(ip);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const { createToken } = await import("@/lib/auth/tokens");
  const { plaintext } = await createToken(found[0].id, "email_verification");

  // Reuse the signup email sender.
  const SMTP_URL = process.env.SMTP_URL ?? "";
  const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@modavanat.ir";
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(plaintext)}`;
  if (!SMTP_URL) {
    console.log(`[verify-email][dev] Resend link for ${email} → ${verifyUrl}`);
  } else {
    const { createTransport } = await import("nodemailer");
    const transport = createTransport(SMTP_URL);
    await transport.sendMail({
      to: email,
      from: SMTP_FROM,
      subject: "فعال‌سازی حساب در قانون‌یاب",
      text: `سلام،\n\nبرای فعال‌سازی حساب خود روی پیوند زیر کلیک کنید:\n${verifyUrl}\n\nاین پیوند ۲۴ ساعت معتبر است.\n\nقانون‌یاب`,
    });
  }

  await logAudit({
    actorUserId: found[0].id,
    action: "user.verify_email.resend",
    targetType: "user",
    targetId: found[0].id,
    ip,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
