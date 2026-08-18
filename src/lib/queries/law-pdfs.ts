/**
 * Law PDF queries — server-side data-access layer for
 * /api/admin/laws/[id]/pdfs.
 *
 * Phase 7. Each law can have multiple PDFs (original, amended,
 * summary-of-changes, etc.). One PDF can be marked `is_primary` —
 * that one drives the public "دانلود PDF" button on /law/[id].
 */

import { db } from "@/db/client";
import { lawPdfs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface LawPdfRow {
  id: string;
  lawId: string;
  label: string;
  version: string | null;
  filePath: string;
  fileSize: number | null;
  pageCount: number | null;
  isPrimary: boolean;
  uploadedBy: string | null;
  createdAt: Date;
}

function row(r: typeof lawPdfs.$inferSelect): LawPdfRow {
  return {
    id: r.id,
    lawId: r.lawId,
    label: r.label,
    version: r.version,
    filePath: r.filePath,
    fileSize: r.fileSize,
    pageCount: r.pageCount,
    isPrimary: r.isPrimary,
    uploadedBy: r.uploadedBy,
    createdAt: r.createdAt,
  };
}

export async function listPdfsForLaw(lawId: string): Promise<LawPdfRow[]> {
  const rows = await db
    .select()
    .from(lawPdfs)
    .where(eq(lawPdfs.lawId, lawId));
  return rows.map(row);
}

export async function getLawPdf(
  id: string
): Promise<LawPdfRow | undefined> {
  const r = await db
    .select()
    .from(lawPdfs)
    .where(eq(lawPdfs.id, id))
    .limit(1);
  return r[0] ? row(r[0]) : undefined;
}

export interface NewPdfInput {
  lawId: string;
  label: string;
  version?: string;
  filePath: string;
  fileSize?: number;
  pageCount?: number;
  isPrimary?: boolean;
  uploadedBy: string;
}

export async function addLawPdf(input: NewPdfInput): Promise<LawPdfRow> {
  const id = crypto.randomUUID();
  // If this PDF is marked primary, unset any existing primary for
  // the same law (only one primary allowed).
  if (input.isPrimary) {
    await db
      .update(lawPdfs)
      .set({ isPrimary: false })
      .where(
        and(eq(lawPdfs.lawId, input.lawId), eq(lawPdfs.isPrimary, true))
      );
  }
  await db.insert(lawPdfs).values({
    id,
    lawId: input.lawId,
    label: input.label,
    version: input.version ?? null,
    filePath: input.filePath,
    fileSize: input.fileSize ?? null,
    pageCount: input.pageCount ?? null,
    isPrimary: input.isPrimary ?? false,
    uploadedBy: input.uploadedBy,
    createdAt: new Date(),
  });
  const r = await getLawPdf(id);
  if (!r) throw new Error("Failed to fetch created law PDF row");
  return r;
}

/**
 * Set a PDF as the primary one for its law (unsets any other primary
 * on the same law in a single UPDATE).
 */
export async function setPrimaryPdf(lawId: string, pdfId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(lawPdfs)
      .set({ isPrimary: false })
      .where(eq(lawPdfs.lawId, lawId));
    await tx
      .update(lawPdfs)
      .set({ isPrimary: true })
      .where(eq(lawPdfs.id, pdfId));
  });
}

export async function deleteLawPdf(id: string): Promise<boolean> {
  const r = await db.delete(lawPdfs).where(eq(lawPdfs.id, id)).returning();
  return r.length > 0;
}

// Re-export sql for callers that import from this module.
export { sql };
