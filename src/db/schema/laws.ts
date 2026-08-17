import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { lawType, lawStatus } from "./_enums";

/**
 * laws — top-level legal instruments (قانون اساسی / قانون عادی / آیین‌نامه /
 * بخشنامه / مقررات).
 *
 * Each law owns:
 *   - a 4-level TOC tree (کتاب → فصل → باب → مبحث) stored in `toc_nodes`
 *   - its articles (مواد) stored in `articles`, each attached to a مبحث
 *   - an amendment timeline (`amendments`)
 *   - outstanding (pending) changes (`outstanding_changes`)
 *   - cross-references to/from other laws (`references`)
 *
 * Dates are stored as Jalali (Persian-calendar) text strings
 * (e.g. "۱۳۹۲/۰۱/۰۱") because that's what the UI displays — we don't
 * need arithmetic on them in SQL.
 */
export const laws = pgTable("laws", {
  id: text("id").primaryKey(), // e.g. "q-madani-1347"
  title: text("title").notNull(),
  shortTitle: text("short_title"),
  type: lawType("type").notNull(),
  year: integer("year").notNull(), // شماره سال خورشیدی
  number: text("number"), // شماره مصوبه
  status: lawStatus("status").notNull().default("in-force"),
  extent: text("extent").notNull(), // «کشوری»، «تهران»، ...
  subject: text("subject").notNull(), // «مدنی»، «کیفری»، ...
  promulgatingAuthority: text("promulgating_authority").notNull(),
  approvedDate: text("approved_date").notNull(),
  effectiveDate: text("effective_date").notNull(),
  lastRevisionDate: text("last_revision_date").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  // Original (pre-amendment) version metadata — nullable because not
  // every law has a meaningful "original version" record.
  originalApprovedDate: text("original_approved_date"),
  originalDescription: text("original_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Law = typeof laws.$inferSelect;
export type NewLaw = typeof laws.$inferInsert;
