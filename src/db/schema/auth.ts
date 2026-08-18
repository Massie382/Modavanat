import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";

/**
 * Auth tables — modeled per NextAuth v5 + @auth/drizzle-adapter
 * convention. The adapter expects these exact table names and column
 * shapes; renaming anything here will break the adapter.
 *
 * Reference: https://authjs.dev/getting-started/adapters/drizzle
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // cuid
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  // App-level role: regular user / admin / super-admin. NextAuth itself
  // doesn't read this field — it's for our authorization checks in
  // API routes (e.g. /api/admin/*).
  role: text("role").notNull().default("user"),
  // bcrypt-style hash. Stored separately from OAuth users (who have
  // no password). For Phase 4 admin creation flow we'll use scrypt
  // (node:crypto, no native binary) to stay VPS-portable.
  passwordHash: text("password_hash"),
  // Brute-force protection: count of consecutive failed credentials
  // sign-ins. Reset to 0 on success. When it reaches the threshold
  // (default 5), `lockedUntil` is set to now + 15min and the next
  // attempt is short-circuited at the credentials provider level.
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  // NOTE: per the canonical NextAuth Drizzle adapter schema, the
  // `accounts` table has NO separate `id` column — its primary key
  // is the composite (provider, providerAccountId). Adding a separate
  // id PK here would create two PRIMARY KEY constraints on the same
  // table, which Postgres rejects.
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // oauth | oidc | email | credentials
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
}, (t) => ({
  // Composite unique on (provider, providerAccountId) — required by the
  // NextAuth adapter so it can upsert by external identity. This IS
  // the primary key; no separate `id` column on this table.
  providerPk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
}));

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (t) => ({
  tokenPk: primaryKey({ columns: [t.identifier, t.token] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
