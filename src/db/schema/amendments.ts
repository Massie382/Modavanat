import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { laws } from "./laws";
import { articles } from "./articles";
import { effectType, diffSegmentType } from "./_enums";

/**
 * amendments — خط زمانی اصلاحات: every change applied (or pending
 * application) to a law. Each amendment records:
 *   - what was changed (`affected_provision` like «ماده ۱۰»)
 *   - which law made the change (`affecting_law_*` denormalized —
 *     nullable FK because the amending law may not be in our DB)
 *   - when the change was made (`date`, stored as Jalali text)
 *   - whether it has been applied to the published text
 *     (`applied_to_text`)
 *   - optional before/after text for the diff view, OR pre-computed
 *     `diff_segments` if the author prefers.
 */
export const amendments = pgTable("amendments", {
  id: text("id").primaryKey(),
  lawId: text("law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  dateLabel: text("date_label").notNull(), // «اردیبهشت ۱۳۹۲»
  effectType: effectType("effect_type").notNull(),
  affectedProvision: text("affected_provision").notNull(),
  affectedProvisionId: text("affected_provision_id").references(() => articles.id, { onDelete: "set null" }),
  affectingLawId: text("affecting_law_id").references(() => laws.id, { onDelete: "set null" }),
  affectingLawTitle: text("affecting_law_title").notNull(),
  affectingLawYear: integer("affecting_law_year").notNull(),
  affectingLawNumber: text("affecting_law_number"),
  affectingLawProvisionLabel: text("affecting_law_provision_label"),
  description: text("description").notNull(),
  appliedToText: boolean("applied_to_text").notNull().default(false),
  note: text("note"),
  beforeText: text("before_text"),
  afterText: text("after_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * diff_segments — optional pre-computed diff segments for an
 * amendment, used when the author doesn't want the front-end to
 * re-compute the diff from before/after text on every render.
 * `side` distinguishes the before/after halves of the diff;
 * `order_index` controls segment ordering within a side.
 */
export const diffSegments = pgTable("diff_segments", {
  id: text("id").primaryKey(),
  amendmentId: text("amendment_id").notNull().references(() => amendments.id, { onDelete: "cascade" }),
  segmentType: diffSegmentType("segment_type").notNull(),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

/**
 * outstanding_changes — pending amendments whose effective date hasn't
 * arrived yet. Surfaced separately from `amendments` because the UI
 * treats them as "in wait" (highlighted box on the law page).
 */
export const outstandingChanges = pgTable("outstanding_changes", {
  id: text("id").primaryKey(),
  lawId: text("law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
  affectedProvision: text("affected_provision").notNull(),
  effectType: effectType("effect_type").notNull(),
  affectingLawId: text("affecting_law_id").references(() => laws.id, { onDelete: "set null" }),
  affectingLawTitle: text("affecting_law_title").notNull(),
  affectingLawYear: integer("affecting_law_year").notNull(),
  affectingLawNumber: text("affecting_law_number"),
  description: text("description").notNull(),
  expectedDate: text("expected_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Amendment = typeof amendments.$inferSelect;
export type NewAmendment = typeof amendments.$inferInsert;
export type DiffSegment = typeof diffSegments.$inferSelect;
export type OutstandingChange = typeof outstandingChanges.$inferSelect;
