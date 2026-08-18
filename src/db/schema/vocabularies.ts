import { pgTable, text, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { laws } from "./laws";

/**
 * Vocabularies — controlled-vocabulary tables for the admin UI.
 *
 * Phase 7: replaces the inlined `lawStatusVocab` / `lawTypeVocab` /
 * `effectTypeVocab` / `referenceDirectionVocab` / `tocTypeVocab`
 * constants on /admin/vocabularies with DB-backed CRUD.
 *
 * One row per vocabulary namespace (e.g. "status", "type", "effect",
 * "direction", "toc"). Each row's `entries` field holds the array
 * of { id, label, englishLabel?, description?, active } objects.
 *
 * Seed: `scripts/seed-vocabularies.ts` populates the initial set on
 * first migration. Admin UI then mutates entries via
 * /api/admin/vocabularies.
 */
export interface VocabEntry {
  id: string;
  label: string;
  englishLabel?: string;
  description?: string;
  active: boolean;
}

export const vocabularies = pgTable("vocabularies", {
  key: text("key").primaryKey(), // "status" | "type" | "effect" | "direction" | "toc"
  label: text("label").notNull(),
  entries: jsonb("entries").notNull().default([]), // VocabEntry[]
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export type Vocabulary = typeof vocabularies.$inferSelect;
export type NewVocabulary = typeof vocabularies.$inferInsert;

// ── Static pages ───────────────────────────────────────────────────────
// Replaces the inlined `staticPagesMock` on /admin/pages with
// DB-backed CRUD. Each row is a single static page (privacy, about,
// terms, contact, custom). The `sections` field holds the body
// blocks (heading + body markdown). Visibility toggle controls
// whether the public route renders the page.

export interface StaticPageSection {
  id: string;
  heading: string;
  body: string; // Markdown
  visible: boolean;
}

export const staticPages = pgTable("static_pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(), // used in URL: /<slug>
  title: text("title").notNull(),
  eyebrow: text("eyebrow"),
  subtitle: text("subtitle"),
  sections: jsonb("sections").notNull().default([]), // StaticPageSection[]
  visible: boolean("visible").notNull().default(true),
  version: text("version").notNull().default("1.0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export type StaticPage = typeof staticPages.$inferSelect;
export type NewStaticPage = typeof staticPages.$inferInsert;

// ── Law PDFs ───────────────────────────────────────────────────────────
// Multiple PDFs per law (original, amended, change summary, etc.).
// One can be marked `is_primary` — that one drives the "دانلود PDF"
// button on the public law detail page. Others are listed under the
// "منابع بیشتر" tab.

export const lawPdfs = pgTable("law_pdfs", {
  id: text("id").primaryKey(),
  lawId: text("law_id")
    .notNull()
    .references(() => laws.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // "نسخه اصلی" | "نسخه اصلاح‌شده" | ...
  version: text("version"), // "1.0", "1392-08-15", ...
  filePath: text("file_path").notNull(), // /upload/law-pdfs/<lawId>-<uuid>.pdf
  fileSize: integer("file_size"), // bytes (nullable so legacy rows don't break)
  pageCount: integer("page_count"),
  isPrimary: boolean("is_primary").notNull().default(false),
  uploadedBy: text("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type LawPdf = typeof lawPdfs.$inferSelect;
export type NewLawPdf = typeof lawPdfs.$inferInsert;
