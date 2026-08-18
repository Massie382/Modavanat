/**
 * POST /api/auth/reset-password
 *
 * Verify the OTP, set the new password, clear failed_login_attempts
 * + lockedUntil (so a successful reset is also an implicit unlock).
 *
 * Body: { email: string, otp: string, password: string }
 *
 * Returns:
 *   200 { ok: true }                   — success
 *   400 { error: "..." }               — validation fail
 *   410 { error: "کد نامعتبر یا منقضی است" }  — token invalid/expired
 *
 * All OTPs are single-use — even a successful verify marks the token
 * as used, so a replay attack fails.
 *
 * Audit-logged.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";
import { logAudit } from "@/lib/auth/audit";
import { getClientIp } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().trim().length(6),
  password: z.string().min(8).max(200),
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
  const { email, otp, password } = parsed.data;

  // Look up user by email — we need their id to match the token.
  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length === 0) {
    // Don't reveal that the email doesn't exist — return a generic
    // "invalid OTP" error.
    return NextResponse.json(
      { error: "کد نامعتبر یا منقضی است." },
      { status: 410 }
    );
  }
  const userId = found[0].id;

  // Verify the OTP. verifyToken marks it as used if valid.
  const token = await verifyToken("password_reset", otp);
  if (!token || token.userId !== userId) {
    await logAudit({
      actorUserId: userId,
      action: "user.reset_password.failed",
      targetType: "user",
      targetId: userId,
      metadata: { reason: "invalid_or_expired_otp" },
      ip,
    });
    return NextResponse.json(
      { error: "کد نامعتبر یا منقضی است." },
      { status: 410 }
    );
  }

  // Update password + clear lockout counters.
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
    ip,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
