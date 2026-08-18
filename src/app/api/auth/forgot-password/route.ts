/**
 * POST /api/auth/forgot-password
 *
 * Send a 6-digit OTP to the user's email OR phone. Idempotent in form
 * (always returns 200 "if the identifier exists, an OTP was sent") to
 * avoid user enumeration, BUT internally:
 *   - user not found → silently no-op (still 200)
 *   - 429 → rate-limited (we DO surface this so the user knows to wait)
 *   - 502 → sms.ir delivery failed (phone kind only — surfaced so the
 *     user can retry or switch to email)
 *
 * Body variants:
 *   { kind: "email", email }      ← email delivery (15-min OTP TTL, password_reset type)
 *   { kind: "phone", phone }      ← SMS delivery via sms.ir (same 15-min OTP, same token type)
 *
 * The token type is `password_reset` for BOTH kinds — the token's
 * purpose is "reset a password", and the channel of delivery is just
 * a routing concern. The verify-side in /api/auth/reset-password
 * branches on kind to know which user column to query against.
 *
 * Audit-logged. Per-email/per-phone + per-IP rate-limited.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/auth/audit";
import {
  checkForgotPasswordRate,
  checkPhoneOtpRate,
  getClientIp,
} from "@/lib/auth/rate-limit";
import { sendOtp } from "@/lib/auth/sms";
import { normalizeEmail, normalizePhone } from "@/lib/auth/identifier";

const schema = z
  .object({
    kind: z.enum(["email", "phone"]).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(4).max(20).optional(),
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
      { error: "ورودی نامعتبر است." },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const kind: "email" | "phone" = data.kind === "phone" ? "phone" : "email";

  // ── Email kind ──────────────────────────────────────────────────
  if (kind === "email") {
    const email = normalizeEmail(data.email);
    if (!email) {
      return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
    }

    // Rate-limit per email AND per IP. We surface 429 so the user knows.
    const rate = checkForgotPasswordRate(email, ip);
    if (!rate.ok) {
      return NextResponse.json({ error: rate.message }, { status: 429 });
    }

    // Look up user. If not found, return 200 generic — anti-enumeration.
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
      metadata: { kind: "email" },
      ip,
    });
    return NextResponse.json(
      { ok: true, kind: "email", message: "کد بازنشانی به ایمیل شما ارسال شد." },
      { status: 200 }
    );
  }

  // ── Phone kind ──────────────────────────────────────────────────
  const phone = normalizePhone(data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "شماره موبایل نامعتبر است." },
      { status: 400 }
    );
  }

  // Reuse the per-email rate-limiter by feeding the phone as the
  // "email" arg — the thresholds (3/hour per identifier, 15/hour per
  // IP) are the same shape. The bucket key includes the phone string,
  // so it's tracked separately from any email with the same literal
  // value (which would be a coincidence anyway).
  const rate = checkForgotPasswordRate(phone, ip);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  // Also bump the phone-otp bucket (per-phone + per-IP) so the
  // SMS-specific rate-limits apply on top of the email-style bucket.
  const phoneRate = checkPhoneOtpRate(phone, ip);
  if (!phoneRate.ok) {
    return NextResponse.json({ error: phoneRate.message }, { status: 429 });
  }

  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (found.length === 0) {
    // Anti-enumeration — return the same 200 generic message.
    await logAudit({
      actorUserId: null,
      action: "user.forgot_password.no_such_user",
      targetType: "user",
      targetId: phone,
      metadata: { kind: "phone" },
      ip,
    });
    return NextResponse.json(
      { ok: true, kind: "phone", message: "اگر این شماره در سیستم وجود داشته باشد، کد بازنشانی ارسال شده است." },
      { status: 200 }
    );
  }
  const userId = found[0].id;
  const { plaintext: otp } = await createToken(userId, "password_reset");
  const sms = await sendOtp(phone, "reset", otp);
  if (!sms.ok) {
    await logAudit({
      actorUserId: userId,
      action: "user.forgot_password.sms_failed",
      targetType: "user",
      targetId: userId,
      metadata: { kind: "phone", status: sms.status, raw: sms.raw },
      ip,
    });
    return NextResponse.json(
      { error: sms.error ?? "ارسال پیامک ناموفق بود." },
      { status: 502 }
    );
  }
  await logAudit({
    actorUserId: userId,
    action: "user.forgot_password.requested",
    targetType: "user",
    targetId: userId,
    metadata: { kind: "phone" },
    ip,
  });
  return NextResponse.json(
    { ok: true, kind: "phone", message: "کد بازنشانی به شماره شما پیامک شد." },
    { status: 200 }
  );
}
