import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { laws } from "./laws";
import { referenceDirection } from "./_enums";

/**
 * references — cross-references between laws (or specific provisions).
 * Direction is stored from the perspective of the source law:
 *   - "cites"        : source law cites the target law
 *   - "cited-by"     : target law cites the source law
 *   - "amends"       : source law amends the target law
 *   - "amended-by"   : target law amends the source law
 *   - "related"      : generic relationship (e.g. same subject area)
 *
 * `target_law_id` is nullable because the referenced law may not be in
 * our DB. The target's title/year/number are denormalized so the UI can
 * render the reference even when we don't host the target law.
 */
export const references = pgTable("references", {
  id: text("id").primaryKey(),
  sourceLawId: text("source_law_id").notNull().references(() => laws.id, { onDelete: "cascade" }),
  targetLawId: text("target_law_id").references(() => laws.id, { onDelete: "set null" }),
  direction: referenceDirection("direction").notNull(),
  // Denormalized target metadata — always populated, even if
  // target_law_id is null (because target isn't in our DB).
  targetTitle: text("target_title").notNull(),
  targetYear: integer("target_year").notNull(),
  targetNumber: text("target_number"),
  targetProvisionLabel: text("target_provision_label"),
  // Source provision (e.g. «ماده ۵») and target provision (e.g.
  // «تبصره ۲ ماده ۹») — both optional, since some refs are law-level.
  sourceProvision: text("source_provision"),
  targetProvision: text("target_provision"),
  context: text("context").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Reference = typeof references.$inferSelect;
export type NewReference = typeof references.$inferInsert;
