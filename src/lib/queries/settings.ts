/**
 * App settings queries — server-side data-access layer for the
 * /api/admin/settings endpoint.
 *
 * Settings are stored as JSONB rows keyed by namespace
 * (e.g. "branding", "seo", "appearance", ...). The PATCH path deep-merges
 * the incoming partial into the existing JSON value so callers can
 * update a single sub-key without clobbering siblings.
 *
 * Server-only. Caller is responsible for authorization (must be admin).
 */

import { db } from "@/db/client";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Read a single settings namespace. Returns `undefined` if the row
 * doesn't exist yet (first-time read, no PATCH has been issued).
 */
export async function getSettings(
  key: string
): Promise<Record<string, unknown> | undefined> {
  const rows = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return rows[0]?.value as Record<string, unknown> | undefined;
}

/**
 * Read all settings namespaces — returns a Record<key, value>.
 */
export async function getAllSettings(): Promise<
  Record<string, Record<string, unknown>>
> {
  const rows = await db
    .select({ key: appSettings.key, value: appSettings.value })
    .from(appSettings);
  const out: Record<string, Record<string, unknown>> = {};
  for (const r of rows) {
    out[r.key] = r.value as Record<string, unknown>;
  }
  return out;
}

/**
 * Deep-merge `patch` into the existing settings namespace `key`.
 *
 * Uses Postgres `||` (jsonb concat) for top-level merge + a recursive
 * CTE-style merge for nested objects via `jsonb_strip_nulls` + manual
 * recursion. Simpler approach: use `jsonb_set` per path. We opt for the
 * simplest approach that handles the common admin case — shallow merge
 * at the top level + deep merge for one level of nesting.
 *
 * For now we use the pure-JS deep-merge approach (read → merge → write)
 * which is easier to reason about and still atomic enough for an admin
 * settings page (single-writer).
 */
export async function updateSettings(
  key: string,
  patch: Record<string, unknown>,
  updatedBy: string
): Promise<Record<string, unknown>> {
  const existing = (await getSettings(key)) ?? {};
  const merged = deepMerge(existing, patch);
  // Read-modify-write upsert — Drizzle's PGlite driver doesn't always
  // type-recognize `.onConflict` on insert, so we use the underlying
  // raw SQL when no row exists, else an explicit UPDATE.
  const existingRow = await db
    .select({ key: appSettings.key })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  if (existingRow.length === 0) {
    await db.insert(appSettings).values({
      key,
      value: merged,
      updatedAt: new Date(),
      updatedBy,
    });
  } else {
    await db
      .update(appSettings)
      .set({
        value: merged,
        updatedAt: new Date(),
        updatedBy,
      })
      .where(eq(appSettings.key, key));
  }
  return merged as Record<string, unknown>;
}

/**
 * Recursively deep-merge `patch` into `base`. Arrays are replaced (not
 * concatenated). `undefined` values in `patch` are dropped (they leave
 * the base value intact).
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>
): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof out[k] === "object" &&
      out[k] !== null &&
      !Array.isArray(out[k])
    ) {
      out[k] = deepMerge(
        out[k] as Record<string, unknown>,
        v as Record<string, unknown>
      );
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
