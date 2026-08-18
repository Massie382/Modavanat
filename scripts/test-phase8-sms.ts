/**
 * Phase 8 (SMS) smoke test — DB-level + lib-level verification.
 *
 * Tests:
 *   1. Schema: `phone` + `phone_verified` columns exist on `users`.
 *   2. Schema: partial unique index `users_phone_unique` exists.
 *   3. Lib: `normalizePhone()` accepts all common Iranian mobile forms
 *      and rejects invalid ones.
 *   4. Lib: `normalizeEmail()` lowercases + trims.
 *   5. Lib: `maskIdentifier()` masks both kinds without leaking the
 *      full identifier.
 *   6. Lib: `tokens.createToken` + `verifyToken` round-trip for the
 *      new token types (`phone_signup`, `phone_signin`).
 *   7. End-to-end: a user with a phone column can be looked up by it.
 *   8. End-to-end: two users with NULL phones don't conflict on the
 *      partial unique index (the migration's whole point).
 *   9. End-to-end: trying to insert two users with the same phone
 *      fails on the unique index.
 *
 * The route handlers (/api/auth/signup, /api/auth/verify-phone,
 * /api/auth/phone-otp/send, /api/auth/forgot-password with kind=phone,
 * /api/auth/reset-password with kind=phone) are verified by tsc + next
 * build success + dev-server curl tests. Direct route-handler
 * invocation hangs (same issue as Phase 8 — see worklog).
 *
 * Run: bun run scripts/test-phase8-sms.ts
 */
import "dotenv/config";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  normalizePhone,
  normalizeEmail,
  maskIdentifier,
  isValidPhone,
} from "../src/lib/auth/identifier";
import { createToken, verifyToken, purgeExpiredTokens } from "../src/lib/auth/tokens";

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}
function assertEq<T>(actual: T, expected: T, msg: string) {
  const ok = actual === expected;
  if (ok) { pass++; console.log(`  ✅ ${msg} (got: ${String(actual)})`); }
  else { fail++; console.log(`  ❌ ${msg} — expected ${String(expected)}, got ${String(actual)}`); }
}

// ── 1. phone + phone_verified columns exist ────────────────────────
console.log("\n── Test 1: phone + phone_verified columns ──");
{
  const r: any = await db.execute(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name IN ('phone', 'phone_verified')
    ORDER BY column_name
  `);
  const rows = r?.rows ?? r;
  const cols = Array.isArray(rows) ? rows : [];
  assert(cols.length === 2, `both columns exist (got ${cols.length})`);
  const phone = cols.find((c: any) => c.column_name === "phone");
  const phoneVerified = cols.find((c: any) => c.column_name === "phone_verified");
  assert(phone?.data_type === "text", "phone is text");
  assert(phone?.is_nullable === "YES", "phone is nullable");
  assert(phoneVerified?.data_type === "timestamp with time zone", "phone_verified is timestamptz");
  assert(phoneVerified?.is_nullable === "YES", "phone_verified is nullable");
}

// ── 2. partial unique index on phone ───────────────────────────────
console.log("\n── Test 2: users_phone_unique partial index ──");
{
  const r: any = await db.execute(sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_phone_unique'
  `);
  const rows = r?.rows ?? r;
  const row = Array.isArray(rows) ? rows[0] : undefined;
  assert(!!row, "users_phone_unique index exists");
  assert(
    String(row?.indexdef ?? "").includes("WHERE (phone IS NOT NULL)"),
    "index is partial (WHERE phone IS NOT NULL)"
  );
  assert(
    String(row?.indexdef ?? "").includes("UNIQUE INDEX"),
    "index is UNIQUE"
  );
}

// ── 3. normalizePhone accepts all forms ─────────────────────────────
console.log("\n── Test 3: normalizePhone ──");
{
  // Accept all common Iranian mobile forms
  assertEq(normalizePhone("09123456789"), "989123456789", "local 09XXXXXXXXX form");
  assertEq(normalizePhone("9123456789"), "989123456789", "bare 9XXXXXXXXX form");
  assertEq(normalizePhone("+989123456789"), "989123456789", "+98 form");
  assertEq(normalizePhone("989123456789"), "989123456789", "98 form");
  assertEq(normalizePhone("۰۹۱۲۳۴۵۶۷۸۹"), "989123456789", "Persian digits");
  assertEq(normalizePhone("0912 345 6789"), "989123456789", "with spaces");
  assertEq(normalizePhone("0912-345-6789"), "989123456789", "with dashes");
  assertEq(normalizePhone("(0912) 345-6789"), "989123456789", "with parens");

  // Reject invalid
  assert(normalizePhone("") === null, "empty string rejected");
  assert(normalizePhone(undefined) === null, "undefined rejected");
  assert(normalizePhone(null) === null, "null rejected");
  assert(normalizePhone("not a phone") === null, "garbage rejected");
  assert(normalizePhone("12345") === null, "too short rejected");
  assert(normalizePhone("08123456789") === null, "non-mobile prefix (0812) rejected");
  assert(normalizePhone("0912345678") === null, "10 digits (one short) rejected");
  assert(normalizePhone("091234567890") === null, "12 digits (one long) rejected");

  // isValidPhone matches
  assert(isValidPhone("09123456789"), "isValidPhone true for valid");
  assert(!isValidPhone("garbage"), "isValidPhone false for invalid");
}

// ── 4. normalizeEmail ──────────────────────────────────────────────
console.log("\n── Test 4: normalizeEmail ──");
{
  assertEq(normalizeEmail("Foo@Bar.COM"), "foo@bar.com", "lowercases");
  assertEq(normalizeEmail("  foo@bar.com  "), "foo@bar.com", "trims");
  assert(normalizeEmail("") === null, "empty rejected");
  assert(normalizeEmail(undefined) === null, "undefined rejected");
  assert(normalizeEmail("not-an-email") === null, "garbage rejected");
  assert(normalizeEmail("foo@bar") === null, "missing TLD rejected");
}

// ── 5. maskIdentifier ──────────────────────────────────────────────
console.log("\n── Test 5: maskIdentifier ──");
{
  const maskedEmail = maskIdentifier("email", "modavanat@gmail.com");
  assert(maskedEmail.includes("•"), "email masked with bullets");
  assert(!maskedEmail.includes("modavanat"), "email local-part not leaked");
  assert(maskedEmail.endsWith("@gmail.com"), "email domain preserved");

  const maskedPhone = maskIdentifier("phone", "09123456789");
  assert(maskedPhone.includes("•"), "phone masked with bullets");
  assert(maskedPhone.startsWith("989"), "phone country code preserved");
  assert(maskedPhone.endsWith("89"), "phone last 2 digits preserved");
  assert(!maskedPhone.includes("12345"), "phone middle digits not leaked");
}

// ── 6. tokens round-trip for phone_signup + phone_signin ────────────
console.log("\n── Test 6: phone token create + verify ──");
{
  // Insert a throwaway user row so we have a userId to attach the
  // token to.
  const userId = crypto.randomUUID();
  const phone = "989120000011";
  await db.insert(users).values({
    id: userId,
    name: "Phase 8 SMS Test",
    email: `phase8test+${userId}@local.modavanat.ir`,
    phone,
    role: "user",
    passwordHash: null,
    emailVerified: null,
    phoneVerified: null,
  });

  try {
    // phone_signup token — 6-digit OTP, 5-min TTL, single-use.
    const { plaintext: signupOtp } = await createToken(userId, "phone_signup");
    assert(/^\d{6}$/.test(signupOtp), `phone_signup plaintext is 6-digit OTP (got: ${signupOtp})`);
    const verifiedSignup = await verifyToken("phone_signup", signupOtp);
    assert(!!verifiedSignup, "phone_signup token verified");
    assertEq(verifiedSignup?.userId, userId, "phone_signup token userId matches");
    assertEq(verifiedSignup?.type, "phone_signup", "phone_signup token type stored");

    // Single-use — second verify returns null.
    const replay = await verifyToken("phone_signup", signupOtp);
    assert(replay === null, "phone_signup token is single-use (replay rejected)");

    // phone_signin token — 6-digit OTP, 3-min TTL, single-use.
    const { plaintext: signinOtp } = await createToken(userId, "phone_signin");
    assert(/^\d{6}$/.test(signinOtp), `phone_signin plaintext is 6-digit OTP (got: ${signinOtp})`);
    const verifiedSignin = await verifyToken("phone_signin", signinOtp);
    assert(!!verifiedSignin, "phone_signin token verified");
    assertEq(verifiedSignin?.userId, userId, "phone_signin token userId matches");

    // Wrong OTP doesn't verify.
    const wrong = await verifyToken("phone_signin", "000000");
    assert(wrong === null, "wrong OTP rejected");
  } finally {
    // Cleanup — tokens cascade-delete with the user row.
    await db.delete(users).where(eq(users.id, userId));
  }
}

// ── 7. user with phone column can be looked up ─────────────────────
console.log("\n── Test 7: user lookup by phone ──");
{
  const userId = crypto.randomUUID();
  const phone = "989120000022";
  await db.insert(users).values({
    id: userId,
    name: "Phone Lookup Test",
    email: `lookuptest+${userId}@local.modavanat.ir`,
    phone,
    role: "user",
    passwordHash: null,
    emailVerified: null,
    phoneVerified: null,
  });
  try {
    const found = await db
      .select({ id: users.id, phone: users.phone })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    assert(found.length === 1, "user found by phone column");
    assertEq(found[0].id, userId, "found user id matches");
    assertEq(found[0].phone, phone, "found user phone matches");
  } finally {
    await db.delete(users).where(eq(users.id, userId));
  }
}

// ── 8. multiple NULL phones don't conflict ──────────────────────────
console.log("\n── Test 8: multiple NULL phones ──");
{
  const u1 = crypto.randomUUID();
  const u2 = crypto.randomUUID();
  await db.insert(users).values({
    id: u1,
    name: "Null Phone 1",
    email: `null1+${u1}@local.modavanat.ir`,
    phone: null,
    role: "user",
    passwordHash: null,
    emailVerified: null,
    phoneVerified: null,
  });
  let secondInserted = false;
  try {
    await db.insert(users).values({
      id: u2,
      name: "Null Phone 2",
      email: `null2+${u2}@local.modavanat.ir`,
      phone: null,
      role: "user",
      passwordHash: null,
      emailVerified: null,
      phoneVerified: null,
    });
    secondInserted = true;
    assert(true, "second user with NULL phone inserted (no conflict)");
  } catch (err: any) {
    assert(false, `second NULL phone user should insert — got: ${err?.message ?? err}`);
  } finally {
    if (secondInserted) await db.delete(users).where(eq(users.id, u2));
    await db.delete(users).where(eq(users.id, u1));
  }
}

// ── 9. duplicate phone rejected by partial unique index ────────────
console.log("\n── Test 9: duplicate phone rejected ──");
{
  const phone = "989120000033";
  const u1 = crypto.randomUUID();
  await db.insert(users).values({
    id: u1,
    name: "Phone Unique 1",
    email: `uniq1+${u1}@local.modavanat.ir`,
    phone,
    role: "user",
    passwordHash: null,
    emailVerified: null,
    phoneVerified: null,
  });
  const u2 = crypto.randomUUID();
  let duplicateRejected = false;
  try {
    await db.insert(users).values({
      id: u2,
      name: "Phone Unique 2",
      email: `uniq2+${u2}@local.modavanat.ir`,
      phone,
      role: "user",
      passwordHash: null,
      emailVerified: null,
      phoneVerified: null,
    });
    // Should NOT reach here — the unique index should reject.
    assert(false, "duplicate phone insert should fail (unique index)");
    await db.delete(users).where(eq(users.id, u2));
  } catch (err: any) {
    duplicateRejected = true;
    const cause = err?.cause ?? err;
    assert(
      String(cause?.message ?? "").includes("users_phone_unique") ||
        String(err?.message ?? "").includes("users_phone_unique") ||
        cause?.code === "23505",
      `duplicate phone rejected with unique violation (code: ${cause?.code ?? "?"})`
    );
  } finally {
    await db.delete(users).where(eq(users.id, u1));
  }
}

// ── 10. purgeExpiredTokens still works with new token types ────────
console.log("\n── Test 10: purgeExpiredTokens ──");
{
  const purged = await purgeExpiredTokens();
  assert(typeof purged === "number", `purgeExpiredTokens returns number (got: ${typeof purged})`);
}

// ── Summary ────────────────────────────────────────────────────────
console.log(`\n──────────────────────────────────────────`);
console.log(`  ${pass} passed, ${fail} failed (${pass + fail} total)`);
console.log(`──────────────────────────────────────────\n`);
if (fail > 0) process.exit(1);
process.exit(0);
