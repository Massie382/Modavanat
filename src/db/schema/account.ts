import { pgTable, text, integer, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { laws } from "./laws";

/**
 * Account + support tables — user-generated content that lives OUTSIDE
 * of the law-content schema. These cover the /account panel and the
 * /admin support/admin surfaces.
 *
 *   bookmarks         — saved-law shortcuts per user
 *   tickets           — support tickets opened by users
 *   ticket_messages   — chat-style messages inside a ticket
 *   purchases         — invoiced transactions (subscription, API bundle, etc.)
 *   audit_log          — append-only trail of admin / auth actions
 *   tokens            — short-TTL single-use tokens (email-verify + password-reset OTPs)
 *
 * Cascade rules: deleting a user takes down all of their bookmarks /
 * tickets / messages / purchases. Deleting a law takes down bookmarks
 * pointing at it (but NOT tickets — a ticket's `law_id` is nullable and
 * informational, not a hard FK). Deleting a ticket takes down its
 * messages.
 */

// ── Bookmarks ──────────────────────────────────────────────────────────
export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lawId: text("law_id")
    .notNull()
    .references(() => laws.id, { onDelete: "cascade" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

// ── Tickets ────────────────────────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  // open | pending | closed — matches the existing /account UI.
  status: text("status").notNull().default("open"),
  // low | medium | high — admin-side prioritization.
  priority: text("priority").notNull().default("medium"),
  // Optional pointer to the law this ticket is about — nullable because
  // most tickets are general. NOT a FK because we don't want ticket
  // inserts to fail just because the referenced law was just deleted
  // (race condition).
  lawId: text("law_id"),
  lastReplyAt: timestamp("last_reply_at", { withTimezone: true }),
  lastReplyFrom: text("last_reply_from"), // "user" | "support" | "system"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

// ── Ticket messages ────────────────────────────────────────────────────
export const ticketMessages = pgTable("ticket_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  // Who sent this message. If `fromRole='support'`, `authorUserId` may
  // be null (anonymous support bot) or point at the admin user who
  // replied. If `fromRole='system'`, `authorUserId` is null and the
  // row represents an automated status change (e.g. "ticket closed").
  authorUserId: text("author_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  fromRole: text("from_role").notNull().default("user"), // user | support | system
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type NewTicketMessage = typeof ticketMessages.$inferInsert;

// ── Purchases ──────────────────────────────────────────────────────────
export const purchases = pgTable("purchases", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  // Amount in Iranian Toman — integer, no decimals. The UI formats
  // with toFa() + thousand separators.
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("IRT"),
  // paid | pending | refunded | failed
  status: text("status").notNull().default("paid"),
  method: text("method"), // e.g. "درگاه بانکی (زرین‌پال)"
  invoiceNumber: text("invoice_number"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

// ── Audit log ─────────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  // Who performed the action. Null for system-initiated actions
  // (e.g. "cron expired tokens deleted").
  actorUserId: text("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // Machine-readable action key, e.g.:
  //   "user.login.success", "user.login.failed",
  //   "admin.user.create", "admin.user.delete",
  //   "admin.ticket.close", "law.import"
  action: text("action").notNull(),
  // Optional target entity metadata.
  targetType: text("target_type"), // user | law | ticket | purchase | etc.
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;

// ── Tokens (email verification + password reset OTP) ──────────────────
//
// A single table for both flows because the shape is identical: a
// short-TTL, single-use, hashed secret tied to a user. The `type`
// column distinguishes them.
//
//   type='email_verification' — sent on signup; URL is /verify-email?token=...
//   type='password_reset'    — sent on forgot-password; the email contains
//                              a 6-digit OTP that the user types back.
//
// We store the SHA-256 hash of the token/OTP, never the plaintext. The
// plaintext is sent in the email (out-of-band) and only re-computed by
// the verify endpoint when the user submits it.
export const tokens = pgTable("tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // email_verification | password_reset
  // SHA-256 hex of the plaintext token/OTP. 16 bytes random for URL
  // tokens; 6-digit numeric OTP for password_reset.
  tokenHash: text("token_hash").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
