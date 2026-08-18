import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * App settings — single-row-style key/value store for admin-tunable
 * site configuration.
 *
 * The `key` column is the primary key (e.g. "branding", "navigation",
 * "seo", "appearance", "home", "auth", "account", "law-detail",
 * "browse-search"). The `value` column holds the JSON-serialized
 * settings object for that namespace.
 *
 * On PATCH, the admin's partial update is merged into the existing
 * JSON value (deep-merge), so callers can update a single sub-key
 * without clobbering the rest of the namespace.
 *
 * `updated_by` is set to the admin's user id on every write, with
 * ON DELETE SET NULL so deleting an admin doesn't break the audit
 * trail on the settings row.
 */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
