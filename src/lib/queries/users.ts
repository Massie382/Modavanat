/**
 * Admin user queries — server-side data-access layer for the /admin
 * users management UI.
 *
 * Mirrors src/lib/queries/laws.ts in pattern: server-only, returns
 * plain objects, no Next.js request/response handling.
 *
 * All functions are intended for use by /api/admin/* route handlers
 * and admin server components — NEVER by client components directly.
 * Client components should fetch /api/admin/users instead.
 */

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/passwords";

export type AdminRole = "user" | "admin" | "super-admin";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: string;
  passwordHash: string | null; // null = magic-link / OAuth user
  createdAt: Date;
  updatedAt: Date;
}

function toAdminUser(row: typeof users.$inferSelect): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    image: row.image,
    role: row.role,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * List all users (admin UI view). Sorted by createdAt desc.
 * Excludes password_hash from the result by default — set
 * `includeHashes=true` only when needed (e.g. for security audits).
 */
export async function listUsers(): Promise<AdminUser[]> {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  return rows.map(toAdminUser);
}

/**
 * Get a single user by ID. Returns undefined if not found.
 */
export async function getUserById(id: string): Promise<AdminUser | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ? toAdminUser(rows[0]) : undefined;
}

/**
 * Get a single user by email. Case-insensitive (emails are stored
 * lowercased by the create-admin.ts script and the NextAuth adapter).
 */
export async function getUserByEmail(email: string): Promise<AdminUser | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ? toAdminUser(rows[0]) : undefined;
}

/**
 * Create a new user with the given fields. Returns the created row.
 *
 * If `password` is provided, it's hashed via scrypt before storage.
 * If not, the user is created with `password_hash = null` — this
 * means the first sign-in attempt will trigger the bootstrap path
 * in auth.ts (any password accepted, then immediately hashed).
 */
export async function createUser(input: {
  email: string;
  name?: string;
  role?: AdminRole;
  password?: string;
}): Promise<AdminUser> {
  const { randomUUID } = await import("node:crypto");
  const id = randomUUID();
  const role = input.role ?? "user";
  const passwordHash = input.password ? hashPassword(input.password) : null;
  await db.insert(users).values({
    id,
    email: input.email.toLowerCase().trim(),
    name: input.name ?? null,
    role,
    passwordHash,
    emailVerified: new Date(),
  });
  const created = await getUserById(id);
  if (!created) throw new Error("Failed to fetch created user");
  return created;
}

/**
 * Update an existing user's mutable fields. Returns the updated row
 * or undefined if the user didn't exist.
 *
 * If `password` is provided, it's hashed via scrypt and the existing
 * hash is replaced. If `password` is null/undefined, the existing
 * hash is preserved (so role-only updates don't accidentally wipe
 * the user's password).
 */
export async function updateUser(
  id: string,
  patch: {
    name?: string;
    role?: AdminRole;
    password?: string;
    image?: string | null;
  }
): Promise<AdminUser | undefined> {
  const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.role !== undefined) set.role = patch.role;
  if (patch.image !== undefined) set.image = patch.image;
  if (patch.password !== undefined) {
    set.passwordHash = patch.password ? hashPassword(patch.password) : null;
  }
  await db.update(users).set(set).where(eq(users.id, id));
  return getUserById(id);
}

/**
 * Delete a user. Returns true if a row was deleted, false if the
 * user didn't exist.
 *
 * NOTE: cascade takes their accounts/sessions/verification tokens.
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  return result.length > 0;
}

/**
 * Site stats for the admin dashboard. Currently returns counts only;
 * can be extended to include trend data later.
 */
export interface SiteStats {
  totalUsers: number;
  totalAdmins: number;
  totalLaws: number;
  totalArticles: number;
  totalAmendments: number;
  totalReferences: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  const { laws, articles, amendments, references } = await import("@/db/schema");
  const [userCount, adminCount, lawCount, articleCount, amendmentCount, refCount] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(sql`${users.role} IN ('admin', 'super-admin')`),
      db.select({ count: sql<number>`count(*)::int` }).from(laws),
      db.select({ count: sql<number>`count(*)::int` }).from(articles),
      db.select({ count: sql<number>`count(*)::int` }).from(amendments),
      db.select({ count: sql<number>`count(*)::int` }).from(references),
    ]);
  return {
    totalUsers: userCount[0]?.count ?? 0,
    totalAdmins: adminCount[0]?.count ?? 0,
    totalLaws: lawCount[0]?.count ?? 0,
    totalArticles: articleCount[0]?.count ?? 0,
    totalAmendments: amendmentCount[0]?.count ?? 0,
    totalReferences: refCount[0]?.count ?? 0,
  };
}
