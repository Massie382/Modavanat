/**
 * Vocabulary queries — server-side data-access layer for
 * /api/admin/vocabularies.
 *
 * Phase 7. The /admin/vocabularies UI was previously frontend-only
 * with inlined enums; now it's backed by the `vocabularies` table
 * (one row per namespace, entries stored as a JSONB array).
 */

import { db } from "@/db/client";
import { vocabularies } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { VocabEntry } from "@/db/schema/vocabularies";

export interface VocabRow {
  key: string;
  label: string;
  entries: VocabEntry[];
}

function row(row: typeof vocabularies.$inferSelect): VocabRow {
  return {
    key: row.key,
    label: row.label,
    entries: (row.entries as VocabEntry[]) ?? [],
  };
}

export async function listVocabularies(): Promise<VocabRow[]> {
  const rows = await db.select().from(vocabularies);
  return rows.map(row);
}

export async function getVocabulary(
  key: string
): Promise<VocabRow | undefined> {
  const r = await db
    .select()
    .from(vocabularies)
    .where(eq(vocabularies.key, key))
    .limit(1);
  return r[0] ? row(r[0]) : undefined;
}

/**
 * Replace the full entry list for a vocabulary namespace. Used by
 * /admin/vocabularies when the UI re-orders / toggles / edits entries
 * and submits the whole list back as one PATCH.
 */
export async function setVocabularyEntries(
  key: string,
  entries: VocabEntry[],
  updatedBy: string
): Promise<VocabRow | undefined> {
  const existing = await getVocabulary(key);
  if (!existing) return undefined;
  await db
    .update(vocabularies)
    .set({ entries, updatedAt: new Date(), updatedBy })
    .where(eq(vocabularies.key, key));
  return getVocabulary(key);
}

/**
 * Create a new vocabulary namespace (admin "add namespace" — rare).
 */
export async function createVocabulary(
  key: string,
  label: string,
  entries: VocabEntry[],
  updatedBy: string
): Promise<VocabRow> {
  await db.insert(vocabularies).values({
    key,
    label,
    entries,
    updatedAt: new Date(),
    updatedBy,
  });
  const r = await getVocabulary(key);
  if (!r) throw new Error("Failed to fetch created vocabulary");
  return r;
}
