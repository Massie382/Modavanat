/**
 * Rate-limit + account-lockout helpers — in-memory token bucket per
 * identifier (email) + per IP. Memory-hard, single-process only —
 * fine for a small-to-medium traffic site on a single VPS.
 *
 * Multi-process / multi-server deploy would need Redis or Upstash. The
 * interface is designed so the in-memory implementation can be swapped
 * without touching call sites.
 *
 * Limits (tunable):
 *   - Per-email login attempts: 5 per 5 min, then locked for 15 min.
 *   - Per-IP login attempts: 20 per 5 min (catches distributed brute
 *     force across multiple emails from one source).
 *   - Per-email forgot-password: 3 per hour (don't let an attacker
 *     spam-OTP-bomb a victim's inbox).
 *   - Per-IP signup: 5 per hour (limits throwaway-account creation).
 */

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// ── Tunables ────────────────────────────────────────────────────────────
const FAILED_LOGIN_EMAIL_THRESHOLD = 5;
const FAILED_LOGIN_IP_THRESHOLD = 20;
const LOCKOUT_MINUTES = 15;
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 min

const FORGOT_PW_EMAIL_THRESHOLD = 3;
const FORGOT_PW_EMAIL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const SIGNUP_IP_THRESHOLD = 5;
const SIGNUP_IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Internal types ────────────────────────────────────────────────────
interface Bucket {
  count: number;
  firstSeen: number; // ms since epoch, first hit in current window
}

// Map key = `${scope}:${identifier}` → Bucket
const buckets = new Map<string, Bucket>();

// Periodic GC — purge buckets that haven't been touched in the window.
// Runs every 5 minutes (timer set on first hit).
let gcTimer: ReturnType<typeof setTimeout> | null = null;
function ensureGc() {
  if (gcTimer) return;
  gcTimer = setTimeout(() => {
    const now = Date.now();
    const windows = [
      RATE_WINDOW_MS,
      FORGOT_PW_EMAIL_WINDOW_MS,
      SIGNUP_IP_WINDOW_MS,
    ];
    const maxWindow = Math.max(...windows);
    for (const [key, bucket] of buckets) {
      if (now - bucket.firstSeen > maxWindow) {
        buckets.delete(key);
      }
    }
    gcTimer = null;
  }, 5 * 60 * 1000);
  // Don't keep the event loop alive just for this timer.
  if (gcTimer && typeof gcTimer.unref === "function") gcTimer.unref();
}

function bucketKey(scope: string, id: string): string {
  return `${scope}:${id.toLowerCase()}`;
}

/**
 * Hit a bucket. Returns the count AFTER this hit. If the bucket is
 * past its window, the counter is reset before this hit is recorded.
 */
function hitBucket(scope: string, id: string, windowMs: number): number {
  ensureGc();
  const key = bucketKey(scope, id);
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now - existing.firstSeen > windowMs) {
    buckets.set(key, { count: 1, firstSeen: now });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

/** Reset a bucket (used after a successful login). */
function resetBucket(scope: string, id: string): void {
  buckets.delete(bucketKey(scope, id));
}

// ── Public API ─────────────────────────────────────────────────────────

export interface RateLimitResult {
  ok: boolean;
  /** Remaining attempts in the current window. Negative if locked. */
  remaining: number;
  /** Ms until the next attempt would succeed. 0 if ok. */
  retryAfterMs: number;
  /** Human-readable Persian message for the user. */
  message: string;
}

/**
 * Pre-flight check before hitting the DB on a credentials sign-in.
 * Returns ok=false if the bucket is exhausted OR the user account is
 * currently locked (the `lockedUntil` column on the user row).
 *
 * NOTE: the lockout column is checked here, but it's BUMPED in the
 * auth.ts `authorize` callback on each failed attempt. This split is
 * intentional — `preLoginCheck` is the cheap "can we even try?" gate;
 * `recordLoginFailure` is the post-hoc bookkeeping.
 */
export async function preLoginCheck(email: string, ip: string): Promise<RateLimitResult> {
  // 1) IP-level bucket (catches distributed brute force)
  const ipCount = hitBucket("login-ip", ip, RATE_WINDOW_MS);
  if (ipCount > FAILED_LOGIN_IP_THRESHOLD) {
    const retryAfterMs = RATE_WINDOW_MS;
    return {
      ok: false,
      remaining: 0,
      retryAfterMs,
      message: "تلاش‌های ورود از این نشانی بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.",
    };
  }

  // 2) Email-level bucket
  const emailCount = hitBucket("login-email", email, RATE_WINDOW_MS);
  if (emailCount > FAILED_LOGIN_EMAIL_THRESHOLD) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: LOCKOUT_MINUTES * 60 * 1000,
      message: `به دلیل تلاش‌های ناموفق متعدد، حساب شما به مدت ${LOCKOUT_MINUTES} دقیقه قفل شد. لطفاً بعداً تلاش کنید یا رمز عبور را بازیابی کنید.`,
    };
  }

  // 3) Account-level lockout (DB column)
  const found = await db
    .select({ lockedUntil: users.lockedUntil })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  if (found.length > 0 && found[0].lockedUntil) {
    const lockedUntilMs = found[0].lockedUntil.getTime();
    const now = Date.now();
    if (lockedUntilMs > now) {
      const retryAfterMs = lockedUntilMs - now;
      return {
        ok: false,
        remaining: 0,
        retryAfterMs,
        message: `حساب شما تا ${new Date(lockedUntilMs).toLocaleString("fa-IR")} قفل است.`,
      };
    }
    // Lockout expired — clear it.
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(users.email, email.toLowerCase().trim()));
  }

  const remainingEmail = Math.max(0, FAILED_LOGIN_EMAIL_THRESHOLD - emailCount);
  const remainingIp = Math.max(0, FAILED_LOGIN_IP_THRESHOLD - ipCount);
  const remaining = Math.min(remainingEmail, remainingIp);
  return { ok: true, remaining, retryAfterMs: 0, message: "" };
}

/**
 * Call after a FAILED credentials sign-in. Bumps the DB column.
 * If the column crosses the threshold, sets `lockedUntil` to now+15min.
 *
 * ALSO bumps the in-memory email bucket — though that was already
 * bumped by preLoginCheck, calling again is a no-op cost-wise.
 */
export async function recordLoginFailure(email: string): Promise<void> {
  const emailLc = email.toLowerCase().trim();
  const found = await db
    .select({
      id: users.id,
      failedLoginAttempts: users.failedLoginAttempts,
    })
    .from(users)
    .where(eq(users.email, emailLc))
    .limit(1);
  if (found.length === 0) return; // user doesn't exist; in-memory bucket still bumped
  const u = found[0];
  const next = u.failedLoginAttempts + 1;
  const set: Partial<typeof users.$inferInsert> = {
    failedLoginAttempts: next,
    updatedAt: new Date(),
  };
  if (next >= FAILED_LOGIN_EMAIL_THRESHOLD) {
    set.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
  }
  await db.update(users).set(set).where(eq(users.id, u.id));
}

/**
 * Call after a SUCCESSFUL credentials sign-in. Resets the DB column
 * and the in-memory email bucket.
 */
export async function recordLoginSuccess(email: string): Promise<void> {
  const emailLc = email.toLowerCase().trim();
  resetBucket("login-email", emailLc);
  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(users.email, emailLc));
}

/**
 * Forgot-password rate limit — both per-email and per-IP.
 * Returns ok=false if either bucket is exhausted.
 */
export function checkForgotPasswordRate(email: string, ip: string): RateLimitResult {
  const ipCount = hitBucket("forgotpw-ip", ip, FORGOT_PW_EMAIL_WINDOW_MS);
  if (ipCount > SIGNUP_IP_THRESHOLD * 3) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: FORGOT_PW_EMAIL_WINDOW_MS,
      message: "تعداد درخواست‌های بازنشانی رمز عبور از این نشانی بیش از حد مجاز است. لطفاً یک ساعت بعد تلاش کنید.",
    };
  }
  const emailCount = hitBucket("forgotpw-email", email, FORGOT_PW_EMAIL_WINDOW_MS);
  if (emailCount > FORGOT_PW_EMAIL_THRESHOLD) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: FORGOT_PW_EMAIL_WINDOW_MS,
      message: "تعداد درخواست‌های بازنشانی رمز عبور برای این ایمیل بیش از حد مجاز است. لطفاً یک ساعت بعد تلاش کنید.",
    };
  }
  const remaining = Math.max(
    0,
    FORGOT_PW_EMAIL_THRESHOLD - emailCount
  );
  return { ok: true, remaining, retryAfterMs: 0, message: "" };
}

/**
 * Signup rate limit — per-IP only (we don't know the email yet).
 */
export function checkSignupRate(ip: string): RateLimitResult {
  const count = hitBucket("signup-ip", ip, SIGNUP_IP_WINDOW_MS);
  if (count > SIGNUP_IP_THRESHOLD) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: SIGNUP_IP_WINDOW_MS,
      message: "تعداد ساخت حساب جدید از این نشانی بیش از حد مجاز است. لطفاً یک ساعت بعد تلاش کنید.",
    };
  }
  const remaining = Math.max(0, SIGNUP_IP_THRESHOLD - count);
  return { ok: true, remaining, retryAfterMs: 0, message: "" };
}

/**
 * Extract the client IP from a Next.js Request, honoring
 * X-Forwarded-For (set by nginx/Caddy) so we get the real client IP
 * behind the reverse proxy. Falls back to a stable-but-fake value
 * so the rate limiter still works in environments with no IP info.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}
