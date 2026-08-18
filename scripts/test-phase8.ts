/**
 * Phase 8 smoke test — DB-level verification only.
 *
 * The route handlers (/api/users/me GET/PATCH/DELETE, /api/contact
 * POST, /api/purchases/[id]/invoice GET) are verified by tsc + next
 * build success + manual UI testing. The dynamic-import approach
 * hangs because the Next.js route module graph pulls in the entire
 * App Router runtime which doesn't initialize outside a request scope.
 *
 * Run: bun run scripts/test-phase8.ts
 */
import "dotenv/config";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

// ── 1. preferences column exists on users table ───────────────────
console.log("\n── Test 1: schema verification ──");
{
  const r: any = await db.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferences'
  `);
  const rows = r?.rows ?? r;
  const row = Array.isArray(rows) ? rows[0] : undefined;
  assert(!!row, "preferences column exists on users table");
  assert(row?.data_type === "jsonb", "preferences is jsonb");
  assert(row?.is_nullable === "NO", "preferences is NOT NULL");
  assert(String(row?.column_default ?? "").includes("::jsonb"), `preferences has jsonb default (got: ${row?.column_default})`);

  // Verify the image column still exists (we didn't drop it — just NULL
  // out rows that had __prefs blobs).
  const r2: any = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'image'
  `);
  const rows2 = r2?.rows ?? r2;
  assert(Array.isArray(rows2) && rows2.length === 1, "image column still exists (preserved for real avatar URLs)");
}

// ── 2. Test migration logic: insert __prefs blob, run migration UPDATEs ──
console.log("\n── Test 2: prefs migration (image → preferences) ──");
{
  const TEST_ID = "test-phase8-user-migrate";
  const oldImageJson = JSON.stringify({
    __prefs: true,
    prefs: { emailNotifications: false, weeklyDigest: true, bookmarkAlerts: false, smsNotifications: true },
  });
  await db.insert(users).values({
    id: TEST_ID,
    email: "test-migrate@example.com",
    name: "تستی مهاجرت",
    role: "user",
    passwordHash: null,
    image: oldImageJson,
    emailVerified: new Date(),
  }).onConflictDoNothing({ target: users.id });

  // Re-run the same UPDATEs from 0005_phase8.sql manually (they only
  // match rows whose image starts with `{"__prefs"`).
  await db.execute(sql`
    UPDATE "users"
    SET "preferences" = COALESCE(("image"::jsonb)->'prefs', '{}'::jsonb)
    WHERE "id" = ${TEST_ID} AND "image" LIKE '{"__prefs"%'
  `);
  await db.execute(sql`
    UPDATE "users" SET "image" = NULL
    WHERE "id" = ${TEST_ID} AND "image" LIKE '{"__prefs"%'
  `);

  const after = await db.select().from(users).where(eq(users.id, TEST_ID)).limit(1);
  const u: any = after[0];
  assert(u?.image === null, "image is NULLed out for __prefs user");
  const prefs = u?.preferences as Record<string, boolean> | undefined;
  assert(prefs?.emailNotifications === false, "preferences.emailNotifications migrated = false");
  assert(prefs?.weeklyDigest === true, "preferences.weeklyDigest migrated = true");
  assert(prefs?.bookmarkAlerts === false, "preferences.bookmarkAlerts migrated = false");
  assert(prefs?.smsNotifications === true, "preferences.smsNotifications migrated = true");

  await db.delete(users).where(eq(users.id, TEST_ID));
}

// ── 3. Insert a fresh user → preferences should default to {} ──────
console.log("\n── Test 3: new-user default ──");
{
  const TEST_ID = "test-phase8-new-user";
  await db.insert(users).values({
    id: TEST_ID,
    email: "test-new@example.com",
    name: "کاربر جدید",
    role: "user",
    passwordHash: null,
    emailVerified: new Date(),
  }).onConflictDoNothing({ target: users.id });

  const u: any = (await db.select().from(users).where(eq(users.id, TEST_ID)).limit(1))[0];
  // Default '{}' means an empty object — Drizzle returns it as {} or
  // null depending on driver; either is acceptable (the parsePrefs
  // helper in /api/users/me/route.ts handles both by spreading
  // defaults over it).
  const prefs = u?.preferences;
  const isEmpty = prefs === null || prefs === undefined ||
    (typeof prefs === "object" && Object.keys(prefs).length === 0);
  assert(isEmpty, "new user preferences is empty {} or null (parsePrefs will fill defaults)");

  await db.delete(users).where(eq(users.id, TEST_ID));
}

// ── 4. Test idempotency: re-running the migration on already-migrated user ──
console.log("\n── Test 4: migration idempotency ──");
{
  const TEST_ID = "test-phase8-idempotent";
  // Insert a user with a real avatar URL (not __prefs).
  await db.insert(users).values({
    id: TEST_ID,
    email: "test-idem@example.com",
    name: "کاربر آواتار",
    role: "user",
    passwordHash: null,
    image: "https://example.com/avatar.png",
    emailVerified: new Date(),
  }).onConflictDoNothing({ target: users.id });

  // Re-run the migration UPDATEs — should NOT touch this user (their
  // image doesn't start with `{"__prefs"`).
  await db.execute(sql`
    UPDATE "users"
    SET "preferences" = COALESCE(("image"::jsonb)->'prefs', '{}'::jsonb)
    WHERE "image" LIKE '{"__prefs"%'
  `);
  await db.execute(sql`
    UPDATE "users" SET "image" = NULL
    WHERE "image" LIKE '{"__prefs"%'
  `);

  const u: any = (await db.select().from(users).where(eq(users.id, TEST_ID)).limit(1))[0];
  assert(u?.image === "https://example.com/avatar.png", "real avatar URL preserved (migration WHERE clause works)");

  await db.delete(users).where(eq(users.id, TEST_ID));
}

// ── Summary ────────────────────────────────────────────────────────
console.log(`\n──────────────────────────────────────`);
console.log(`Phase 8 smoke tests: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
process.exit(0);
