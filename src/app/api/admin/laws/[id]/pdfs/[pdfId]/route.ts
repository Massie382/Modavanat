/**
 * /api/admin/laws/[id]/pdfs/[pdfId]
 *
 *   PATCH  → { isPrimary?: boolean, label?: string, version?: string }
 *   DELETE → remove the PDF row + delete the file from disk
 *
 * Phase 7. Admin-only. Mutations are audit-logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import {
  deleteLawPdf,
  getLawPdf,
  setPrimaryPdf,
} from "@/lib/queries/law-pdfs";
import { db } from "@/db/client";
import { lawPdfs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string; pdfId: string }>;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id: lawId, pdfId } = await ctx.params;

  let body: { isPrimary?: boolean; label?: string; version?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const existing = await getLawPdf(pdfId);
  if (!existing || existing.lawId !== lawId) {
    return NextResponse.json(
      { error: "not_found", message: "PDF not found for this law" },
      { status: 404 }
    );
  }

  // Handle isPrimary — must unset siblings first.
  if (body.isPrimary === true) {
    await setPrimaryPdf(lawId, pdfId);
  } else if (body.isPrimary === false) {
    await db
      .update(lawPdfs)
      .set({ isPrimary: false })
      .where(eq(lawPdfs.id, pdfId));
  }

  // Handle label/version.
  const set: Partial<typeof lawPdfs.$inferInsert> = {};
  if (body.label !== undefined) set.label = body.label;
  if (body.version !== undefined) set.version = body.version || null;
  if (Object.keys(set).length > 0) {
    await db.update(lawPdfs).set(set).where(eq(lawPdfs.id, pdfId));
  }

  const updated = await getLawPdf(pdfId);
  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.law.pdf.update",
    targetType: "law_pdf",
    targetId: pdfId,
    metadata: { lawId, keys: Object.keys(body) },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ pdf: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id: lawId, pdfId } = await ctx.params;

  const existing = await getLawPdf(pdfId);
  if (!existing || existing.lawId !== lawId) {
    return NextResponse.json(
      { error: "not_found", message: "PDF not found for this law" },
      { status: 404 }
    );
  }

  const ok = await deleteLawPdf(pdfId);
  if (!ok) {
    return NextResponse.json(
      { error: "internal_error", message: "Failed to delete PDF" },
      { status: 500 }
    );
  }

  // Best-effort file deletion — DB row is already gone.
  try {
    const abs = join(process.cwd(), existing.filePath);
    await unlink(abs);
  } catch (err) {
    // File may have been moved or already removed — non-fatal.
    console.warn(
      `[admin.law.pdf.delete] Could not delete file ${existing.filePath}:`,
      err instanceof Error ? err.message : err
    );
  }

  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.law.pdf.delete",
    targetType: "law_pdf",
    targetId: pdfId,
    metadata: { lawId, label: existing.label, path: existing.filePath },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true });
}
