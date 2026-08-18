/**
 * POST /api/auth/forgot-password
 *
 * Send a 6-digit OTP to the user's email. Idempotent in form (always
 * returns 200 "if the email exists, an OTP was sent") to avoid user
 * enumeration, BUT internally:
 *   - 404 → user not found (silently — no email sent)
 *   - 429 → rate-limited (we DO surface this so the user knows to wait)
 *
 * Body: { email: string }
 *
 * Audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/auth/audit";
import { checkForgotPasswordRate, getClientIp } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const SMTP_URL = process.env.SMTP_URL ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@modavanat.ir";

let mailer: ReturnType<typeof import("nodemailer").createTransport> | null = null;
async function getMailer() {
  if (mailer) return mailer;
  const { createTransport } = await import("nodemailer");
  mailer = createTransport(SMTP_URL ? SMTP_URL : { jsonTransport: true });
  return mailer;
}

async function sendOtpEmail(email: string, otp: string) {
  const body = `سلام،\n\nکد بازنشانی رمز عبور شما در قانون‌یاب:\n\n${otp}\n\nاین کد تنها ۱۵ دقیقه معتبر است.\n\nاگر شما درخواست بازنشانی نکرده‌اید، این پیام را نادیده بگیرید.\n\nقانون‌یاب`;
  if (!SMTP_URL) {
    console.log(`[forgot-password][dev] OTP for ${email} → ${otp}`);
    return;
  }
  const transport = await getMailer();
  await transport.sendMail({
    to: email,
    from: SMTP_FROM,
    subject: "کد بازنشانی رمز عبور — قانون‌یاب",
    text: body,
  });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ایمیل معتبر نیست." },
      { status: 400 }
    );
  }
  const email = parsed.data.email;

  // Rate-limit per email AND per IP. We surface 429 so the user knows.
  const rate = checkForgotPasswordRate(email, ip);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  // Look up user. If not found, we still return 200 with a generic
  // message — the rate-limit bucket was already bumped, so an
  // attacker probing many emails can't distinguish 404 from 200.
  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length === 0) {
    await logAudit({
      actorUserId: null,
      action: "user.forgot_password.no_such_user",
      targetType: "user",
      targetId: email,
      ip,
    });
    return NextResponse.json(
      { ok: true, message: "اگر این ایمیل در سیستم وجود داشته باشد، کد بازنشانی ارسال شده است." },
      { status: 200 }
    );
  }
  const userId = found[0].id;

  // Mint the OTP.
  const { plaintext: otp } = await createToken(userId, "password_reset");
  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("[forgot-password] Failed to send OTP email:", err);
    return NextResponse.json(
      { error: "ارسال ایمیل موفق نبود. لطفاً بعداً تلاش کنید." },
      { status: 500 }
    );
  }

  await logAudit({
    actorUserId: userId,
    action: "user.forgot_password.requested",
    targetType: "user",
    targetId: userId,
    ip,
  });

  return NextResponse.json(
    { ok: true, message: "کد بازنشانی به ایمیل شما ارسال شد." },
    { status: 200 }
  );
}
