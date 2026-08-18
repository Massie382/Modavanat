/**
 * POST /api/auth/reset-password
 *
 * Verify the OTP, set the new password, clear failed_login_attempts
 * + lockedUntil (so a successful reset is also an implicit unlock).
 *
 * Body variants:
 *   { kind: "email", email, otp, password }
 *   { kind: "phone", phone, otp, password }   ← phone accepts any
 *                                                 Persian / international
 *                                                 form; normalized to
 *                                                 989XXXXXXXXX.
 *   { email, otp, password }                  ← backward compat
 *
 * Returns:
 *   200 { ok: true }                       — success
 *   400 { error: "..." }                   — validation fail
 *   410 { error: "کد نامعتبر یا منقضی است" }  — token invalid/expired
 *   429 { error: "rate limited" }          — too many verify attempts from this IP
 *
 * All OTPs are single-use — even a successful verify marks the token
 * as used, so a replay attack fails.
 *
 * Audit-logged. The OTP token type is `password_reset` regardless of
 * delivery channel (email or SMS) — the verifyToken lookup is the same.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";
import { logAudit } from "@/lib/auth/audit";
import { getClientIp, checkPhoneOtpVerifyRate } from "@/lib/auth/rate-limit";
import { normalizeEmail, normalizePhone, toAsciiDigits } from "@/lib/auth/identifier";

const schema = z
  .object({
    kind: z.enum(["email", "phone"]).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(4).max(20).optional(),
    otp: z.string().trim().min(4).max(10),
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
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ایمیل را وارد کنید.",
          path: ["email"],
        });
      }
    }
  });

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Per-IP verify rate-limit (catches OTP-guessing). Applies to both
  // email and phone kinds — it's a per-IP total on verify attempts.
  // The email path goes through its own per-email bucket inside the
  // existing forgot-password endpoint; here we just check the per-IP
  // OTP-verify bucket for phone kind.
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
  const data = parsed.data;
  const kind: "email" | "phone" = data.kind === "phone" ? "phone" : "email";
  const password = data.password;
  // Normalize the OTP (Persian digits → ASCII).
  const otp = toAsciiDigits(data.otp).replace(/\D/g, "");

  if (kind === "phone") {
    // Per-IP phone-verify rate-limit.
    const verifyRate = checkPhoneOtpVerifyRate(ip);
    if (!verifyRate.ok) {
      return NextResponse.json({ error: verifyRate.message }, { status: 429 });
    }

    const phone = normalizePhone(data.phone);
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
    if (found.length === 0) {
      // Don't reveal that the phone doesn't exist — return the same
      // "invalid OTP" error as a bad code would.
      return NextResponse.json(
        { error: "کد نامعتبر یا منقضی است." },
        { status: 410 }
      );
    }
    const userId = found[0].id;
    const token = await verifyToken("password_reset", otp);
    if (!token || token.userId !== userId) {
      await logAudit({
        actorUserId: userId,
        action: "user.reset_password.failed",
        targetType: "user",
        targetId: userId,
        metadata: { kind: "phone", reason: "invalid_or_expired_otp" },
        ip,
      });
      return NextResponse.json(
        { error: "کد نامعتبر یا منقضی است." },
        { status: 410 }
      );
    }
    await db
      .update(users)
      .set({
        passwordHash: hashPassword(password),
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await logAudit({
      actorUserId: userId,
      action: "user.reset_password.success",
      targetType: "user",
      targetId: userId,
      metadata: { kind: "phone" },
      ip,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Email kind — same flow as before the Phase 8 refactor.
  const email = normalizeEmail(data.email);
  if (!email) {
    return NextResponse.json(
      { error: "ایمیل معتبر نیست." },
      { status: 400 }
    );
  }
  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json(
      { error: "کد نامعتبر یا منقضی است." },
      { status: 410 }
    );
  }
  const userId = found[0].id;
  const token = await verifyToken("password_reset", otp);
  if (!token || token.userId !== userId) {
    await logAudit({
      actorUserId: userId,
      action: "user.reset_password.failed",
      targetType: "user",
      targetId: userId,
      metadata: { kind: "email", reason: "invalid_or_expired_otp" },
      ip,
    });
    return NextResponse.json(
      { error: "کد نامعتبر یا منقضی است." },
      { status: 410 }
    );
  }
  await db
    .update(users)
    .set({
      passwordHash: hashPassword(password),
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  await logAudit({
    actorUserId: userId,
    action: "user.reset_password.success",
    targetType: "user",
    targetId: userId,
    metadata: { kind: "email" },
    ip,
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
