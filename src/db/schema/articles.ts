import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { laws } from "./laws";
import { tocNodes } from "./toc_nodes";
import { effectType } from "./_enums";

/**
 * articles — مواد (the actual legal text). Each article is attached to
 * a مبحث (toc_node of type 'topic') via `toc_node_id`. Articles are
 * intentionally NOT in the toc_nodes tree — they're leaf content that
 * the TOC UI navigates INTO from a مبحث, not standalone TOC entries.
 *
 * `text` may contain F-marker tokens like [ت1]...[ت1] that are paired
 * with `commentary_items` entries via the `marker` field.
 *
 * `order_index` controls ordering within the parent مبحث.
 */
export const articles = pgTable("articles", {
  id: text("id").primaryKey(), // e.g. "q-madani-1347/art-1"
  lawId: text("law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
  tocNodeId: text("toc_node_id").references(() => tocNodes.id, { onDelete: "set null" }),
  number: text("number").notNull(), // «ماده ۱»
  title: text("title"),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * commentary_items — یادداشت‌های ویرایشی attached to a specific
 * location in an article's text, identified by an F-marker (e.g. "ت1").
 * The marker token appears inline in the article's `text` field as
 * `[ت1]` (open) and `[ت1]` (close); the front-end parses these tokens
 * and renders them as superscripts paired with the commentary item.
 */
export const commentaryItems = pgTable("commentary_items", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  marker: text("marker").notNull(), // «ت1»
  effectType: effectType("effect_type").notNull(),
  date: text("date").notNull(),
  // The affecting law is denormalized here (rather than just an FK to
  // `laws`) because the affecting law may not be in our DB at all —
  // e.g. a regulation that we don't host but that amended an article
  // in a law we do host. `affecting_law_id` is nullable for the same
  // reason.
  affectingLawId: text("affecting_law_id").references(() => laws.id, { onDelete: "set null" }),
  affectingLawTitle: text("affecting_law_title").notNull(),
  affectingLawYear: integer("affecting_law_year").notNull(),
  affectingLawNumber: text("affecting_law_number"),
  affectingLawProvisionLabel: text("affecting_law_provision_label"),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type CommentaryItem = typeof commentaryItems.$inferSelect;
export type NewCommentaryItem = typeof commentaryItems.$inferInsert;
