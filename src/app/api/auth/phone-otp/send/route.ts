/**
 * POST /api/auth/phone-otp/send
 *
 * Send a one-time code via SMS for the *signin* flow (user already has
 * an account). The OTP is verified in the second step by NextAuth's
 * CredentialsProvider — see `src/auth.ts` `authorize()` `purpose ===
 * "phone-otp"` branch. The OTP is stored in the `tokens` table under
 * the `phone_signin` type (3-min TTL, single-use).
 *
 * Body: { phone: string }
 *
 * Returns:
 *   200 { ok: true }                       — OTP sent (or user not found, silent anti-enumeration)
 *   400 { error: "..." }                   — invalid phone
 *   429 { error: "rate limited" }          — per-phone or per-IP exhausted
 *   502 { error: "sms delivery failed" }   — sms.ir error
 *
 * Anti-enumeration: if the phone is not registered, we still return
 * 200 with the same response shape so an attacker can't tell whether
 * the phone exists. The OTP is only sent for registered phones.
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
import { checkPhoneOtpRate, getClientIp } from "@/lib/auth/rate-limit";
import { sendOtp } from "@/lib/auth/sms";
import { normalizePhone } from "@/lib/auth/identifier";

const schema = z.object({
  phone: z.string().trim().min(4).max(20),
});

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
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است." },
      { status: 400 }
    );
  }
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "شماره موبایل نامعتبر است." },
      { status: 400 }
    );
  }

  // Per-phone + per-IP rate-limit (catches OTP-bombing of a victim's
  // phone + distributed enumeration of phone numbers from one IP).
  const rate = checkPhoneOtpRate(phone, ip);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  // Look up user. Anti-enumeration: silent 200 if not found.
  const found = await db
    .select({ id: users.id, phoneVerified: users.phoneVerified })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (found.length === 0) {
    await logAudit({
      actorUserId: null,
      action: "user.phone_otp.no_such_user",
      targetType: "user",
      targetId: phone,
      ip,
    });
    return NextResponse.json(
      { ok: true, message: "اگر این شماره در سیستم وجود داشته باشد، کد ورود ارسال شده است." },
      { status: 200 }
    );
  }
  const u = found[0];
  if (!u.phoneVerified) {
    // Phone not verified — refuse OTP signin (user must signin with
    // password first, or use email magic link). Don't reveal the
    // verification state of the account to the attacker — return the
    // same anti-enumeration 200.
    await logAudit({
      actorUserId: u.id,
      action: "user.phone_otp.phone_not_verified",
      targetType: "user",
      targetId: u.id,
      ip,
    });
    return NextResponse.json(
      { ok: true, message: "اگر این شماره در سیستم وجود داشته باشد، کد ورود ارسال شده است." },
      { status: 200 }
    );
  }

  const { plaintext } = await createToken(u.id, "phone_signin");
  const sms = await sendOtp(phone, "signin", plaintext);
  if (!sms.ok) {
    await logAudit({
      actorUserId: u.id,
      action: "user.phone_otp.send_failed",
      targetType: "user",
      targetId: u.id,
      metadata: { status: sms.status, raw: sms.raw },
      ip,
    });
    return NextResponse.json(
      { error: sms.error ?? "ارسال پیامک ناموفق بود." },
      { status: 502 }
    );
  }
  await logAudit({
    actorUserId: u.id,
    action: "user.phone_otp.requested",
    targetType: "user",
    targetId: u.id,
    ip,
  });
  return NextResponse.json(
    { ok: true, message: "کد ورود به شماره شما پیامک شد." },
    { status: 200 }
  );
}
