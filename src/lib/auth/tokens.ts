/**
 * Token helpers — create + verify short-TTL, single-use tokens for:
 *   - Email verification (on signup) — 32-byte URL token
 *   - Password reset (on forgot-password) — 6-digit numeric OTP
 *
 * Both are stored in the `tokens` table as a SHA-256 hex hash of the
 * plaintext. The plaintext is sent to the user (via email). We never
 * log the plaintext.
 *
 * Flow:
 *   createToken(userId, "email_verification")   →  { token, hash, expires }
 *   createToken(userId, "password_reset")      →  { otp, hash, expires }
 *   verifyToken(type, plaintext)               →  Token | null  (also marks as used)
 */

import { createHash, randomBytes, randomInt } from "node:crypto";
import { db } from "@/db/client";
import { tokens } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 min

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Generate a 32-byte URL-safe token (43 base64url chars). */
function genUrlToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Generate a 6-digit numeric OTP as a string like "012345". */
function genOtp(): string {
  // randomInt(0, 1000000) → 0..999999, then zero-pad to 6 digits.
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Mint a new token. Stores the SHA-256 hash in the DB and returns the
 * plaintext (to be sent via email). Caller is responsible for sending
 * the email — this function is DB-only.
 */
export async function createToken(
  userId: string,
  type: "email_verification" | "password_reset"
): Promise<{ plaintext: string; hash: string; expires: Date }> {
  const plaintext = type === "email_verification" ? genUrlToken() : genOtp();
  const hash = sha256Hex(plaintext);
  const expires = new Date(
    Date.now() +
      (type === "email_verification"
        ? EMAIL_VERIFICATION_TTL_MS
        : PASSWORD_RESET_TTL_MS)
  );
  await db.insert(tokens).values({
    id: crypto.randomUUID(),
    userId,
    type,
    tokenHash: hash,
    expires,
  });
  return { plaintext, hash, expires };
}

/**
 * Verify a plaintext token/OTP. If valid AND not-yet-expired AND
 * not-yet-used, marks the row as used and returns the row. Otherwise
 * returns null.
 *
 * Safe to call with an invalid plaintext — returns null without
 * throwing.
 */
export async function verifyToken(
  type: "email_verification" | "password_reset",
  plaintext: string
): Promise<typeof tokens.$inferSelect | null> {
  if (!plaintext) return null;
  const hash = sha256Hex(plaintext);
  const found = await db
    .select()
    .from(tokens)
    .where(and(eq(tokens.type, type), eq(tokens.tokenHash, hash)))
    .limit(1);
  const row = found[0];
  if (!row) return null;
  if (row.usedAt) return null; // already consumed
  if (row.expires.getTime() < Date.now()) return null; // expired
  // Mark as used.
  await db
    .update(tokens)
    .set({ usedAt: new Date() })
    .where(eq(tokens.id, row.id));
  return row;
}

/**
 * Garbage-collect expired tokens. Safe to call periodically. Returns
 * the number of rows deleted.
 */
export async function purgeExpiredTokens(): Promise<number> {
  const result = await db
    .delete(tokens)
    .where(lt(tokens.expires, new Date()))
    .returning();
  return result.length;
}
