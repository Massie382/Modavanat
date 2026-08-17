import { pgTable, text, integer, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { laws } from "./laws";
import { tocNodeType } from "./_enums";

/**
 * toc_nodes — the 4-level structural tree of a law's فهرست مطالب:
 *
 *   کتاب (book) → فصل (chapter) → باب (section) → مبحث (topic)
 *
 * The tree is modeled as adjacency list: each node has a `parent_id`
 * pointing to its parent node (NULL for top-level کتاب entries).
 *
 * Articles (مواد) are deliberately NOT in this table — they live in
 * `articles` and are attached to a مبحث via `toc_node_id`. The TOC UI
 * renders only down to the مبحث level; drilling into a مبحث reveals
 * its articles in the content tab.
 *
 * `order_index` controls sibling ordering within the same parent.
 */
export const tocNodes = pgTable("toc_nodes", {
  id: text("id").primaryKey(), // e.g. "q-madani-1347/book-1"
  lawId: text("law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
  parentId: text("parent_id"), // self-ref; constraint below
  type: tocNodeType("type").notNull(),
  label: text("label").notNull(), // «کتاب اول»، «فصل دوم»
  title: text("title"), // «احکام عمومی»
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  parentFk: foreignKey({ columns: [t.parentId], foreignColumns: [t.id] })
    .onUpdate("cascade").onDelete("cascade"),
  lawFk: foreignKey({ columns: [t.lawId], foreignColumns: [laws.id] })
    .onUpdate("cascade").onDelete("cascade"),
}));

export type TocNode = typeof tocNodes.$inferSelect;
export type NewTocNode = typeof tocNodes.$inferInsert;
