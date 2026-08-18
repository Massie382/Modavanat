/**
 * POST /api/auth/verify-phone
 *
 * Verify a phone-signup OTP. The user POSTs their 6-digit code; we
 * look it up via `verifyToken("phone_signup", code)` — which checks the
 * SHA-256 hash in the `tokens` table, the `usedAt` column (single-use),
 * and the `expires` column (5-min TTL). On success, marks the token as
 * used and sets `users.phoneVerified = now()`.
 *
 * Flow: signup POST creates user + OTP → user types OTP in the signup
 * UI → this route verifies it → redirect to /signin?verified=1.
 *
 * Body: { phone: string, otp: string }
 *   - `phone` accepts any Persian / international form (normalized to
 *     989XXXXXXXXX for the lookup).
 *   - `otp` is a 6-digit string (Persian digits accepted, normalized).
 *
 * Returns:
 *   200 { ok: true }                       — verified, phoneVerified set
 *   400 { error: "..." }                   — validation fail
 *   410 { error: "کد نامعتبر یا منقضی است" }  — bad / expired OTP
 *   429 { error: "rate limited" }          — too many verify attempts from this IP
 *
 * Audit-logged. Single-use — even a successful verify marks the OTP
 * as used so a replay attack fails.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/tokens";
import { logAudit } from "@/lib/auth/audit";
import { getClientIp, checkPhoneOtpVerifyRate } from "@/lib/auth/rate-limit";
import { normalizePhone, toAsciiDigits } from "@/lib/auth/identifier";

const schema = z.object({
  phone: z.string().trim().min(4).max(20),
  otp: z.string().trim().min(4).max(10),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Per-IP verify rate-limit (catches OTP-guessing).
  const verifyRate = checkPhoneOtpVerifyRate(ip);
  if (!verifyRate.ok) {
    return NextResponse.json({ error: verifyRate.message }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." },
      { status: 400 }
    );
  }
  // Normalize the phone + OTP (Persian digits → ASCII).
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "شماره موبایل نامعتبر است." },
      { status: 400 }
    );
  }
  const otp = toAsciiDigits(parsed.data.otp).replace(/\D/g, "");

  // Look up user by phone.
  const found = await db
    .select({ id: users.id, phoneVerified: users.phoneVerified })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (found.length === 0) {
    // Don't reveal — return a generic "invalid code" so the endpoint
    // can't be used to enumerate which phone numbers are registered.
    return NextResponse.json(
      { error: "کد نامعتبر یا منقضی است." },
      { status: 410 }
    );
  }
  const u = found[0];
  if (u.phoneVerified) {
    // Already verified — idempotent OK.
    return NextResponse.json({ ok: true, alreadyVerified: true }, { status: 200 });
  }

  // Verify the OTP. verifyToken marks it as used if valid.
  const token = await verifyToken("phone_signup", otp);
  if (!token || token.userId !== u.id) {
    await logAudit({
      actorUserId: u.id,
      action: "user.verify_phone.failed",
      targetType: "user",
      targetId: u.id,
      metadata: { reason: "invalid_or_expired_otp" },
      ip,
    });
    return NextResponse.json(
      { error: "کد نامعتبر یا منقضی است." },
      { status: 410 }
    );
  }

  await db
    .update(users)
    .set({ phoneVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.id, u.id));

  await logAudit({
    actorUserId: u.id,
    action: "user.verify_phone.success",
    targetType: "user",
    targetId: u.id,
    ip,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * PUT /api/auth/verify-phone (resend)
 *
 * Re-send the phone-signup OTP. Looks up the user by phone, only
 * re-sends if the user is still un-verified, mints a fresh OTP, sends
 * via sms.ir. Per-phone + per-IP rate limits apply (via the phone-otp
 * send rate-limit).
 *
 * Body: { phone: string }
 *
 * Returns:
 *   200 { ok: true }                       — OTP re-sent (or user already verified / not found, both silent)
 *   400 { error: "..." }                   — invalid phone
 *   429 { error: "rate limited" }          — too many requests
 *   502 { error: "sms delivery failed" }   — sms.ir error
 */
export async function PUT(req: Request) {
  const ip = getClientIp(req);

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ error: "شماره موبایل نامعتبر است." }, { status: 400 });
  }

  // Look up user (don't reveal whether the user exists).
  const found = await db
    .select({ id: users.id, phoneVerified: users.phoneVerified })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (found.length === 0 || found[0].phoneVerified) {
    // Silent 200 — anti-enumeration.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Reuse the phone-OTP rate-limit (per-phone + per-IP).
  const { checkPhoneOtpRate } = await import("@/lib/auth/rate-limit");
  const rate = checkPhoneOtpRate(phone, ip);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const { createToken } = await import("@/lib/auth/tokens");
  const { plaintext } = await createToken(found[0].id, "phone_signup");
  const { sendOtp } = await import("@/lib/auth/sms");
  const sms = await sendOtp(phone, "signup", plaintext);
  if (!sms.ok) {
    await logAudit({
      actorUserId: found[0].id,
      action: "user.verify_phone.resend_failed",
      targetType: "user",
      targetId: found[0].id,
      metadata: { status: sms.status, raw: sms.raw },
      ip,
    });
    return NextResponse.json(
      { error: sms.error ?? "ارسال پیامک ناموفق بود." },
      { status: 502 }
    );
  }

  await logAudit({
    actorUserId: found[0].id,
    action: "user.verify_phone.resend",
    targetType: "user",
    targetId: found[0].id,
    ip,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
