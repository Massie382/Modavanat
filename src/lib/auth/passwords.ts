/**
 * Password hashing — scrypt-based, no native binary deps.
 *
 * Why scrypt (not bcrypt/argon2)?
 *   - bcrypt/argon2 need native binaries (node-gyp compile on install)
 *     which makes the Docker image larger and breaks on Alpine/musl.
 *   - scrypt is built into Node.js via `node:crypto` since v10. It's
 *     production-grade (memory-hard, GPU-resistant) and ships with the
 *     runtime. The Drizzle adapter already references scrypt as the
 *     intended Phase 4 algorithm.
 *
 * Storage format (a single text column):
 *   "scrypt:N:r:p:hashHex:saltHex"
 * where N=2^16, r=8, p=4 by default. The prefix lets us migrate to
 * a different algorithm later without breaking existing hashes.
 *
 * Verification is constant-time on the hash bytes (timingSafeEqual).
 */

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const DEFAULT_N = 16384; // 2^14 — OWASP-recommended as of 2023
const DEFAULT_R = 8;
const DEFAULT_P = 4;
const KEY_LEN = 64; // 512-bit derived key
const SALT_LEN = 16; // 128-bit salt

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

const DEFAULT_PARAMS: ScryptParams = {
  N: DEFAULT_N,
  r: DEFAULT_R,
  p: DEFAULT_P,
};

/**
 * Hash a password using scrypt with the given (or default) parameters.
 * Returns a string of the form "scrypt:N:r:p:hashHex:saltHex" suitable
 * for storage in a single text column.
 */
export function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_PARAMS
): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: 128 * 1024 * 1024, // 128MB upper bound
  });
  return `scrypt:${params.N}:${params.r}:${params.p}:${hash.toString("hex")}:${salt.toString("hex")}`;
}

/**
 * Verify a password against a stored hash. Constant-time on the hash
 * bytes. Returns false on:
 *   - Malformed hash string (wrong prefix, missing fields, etc.)
 *   - Hash mismatch (password is wrong)
 *
 * Throws only on infrastructure-level errors (e.g. crypto.scrypt
 * failing with invalid params) — those should never happen with
 * stored hashes that were created via `hashPassword`.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 6) return false;
  const [algo, nStr, rStr, pStr, hashHex, saltHex] = parts;
  if (algo !== "scrypt") return false;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }
  let salt: Buffer;
  let expectedHash: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expectedHash = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || expectedHash.length === 0) return false;

  const actualHash = scryptSync(password, salt, expectedHash.length, {
    N,
    r,
    p,
    maxmem: 128 * 1024 * 1024,
  });
  // timingSafeEqual throws if the buffers are different lengths; we
  // catch that case by comparing lengths first and returning false.
  if (actualHash.length !== expectedHash.length) return false;
  return timingSafeEqual(actualHash, expectedHash);
}

/**
 * Check whether a stored hash needs to be re-hashed (e.g. because
 * the parameters are weaker than the current default). The admin UI
 * can use this to silently upgrade hashes on next login.
 */
export function needsRehash(stored: string, params: ScryptParams = DEFAULT_PARAMS): boolean {
  const parts = stored.split(":");
  if (parts.length !== 6) return true;
  const [, nStr, rStr, pStr] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  return N < params.N || r < params.r || p < params.p;
}
