/**
 * /api/admin/laws/[id]/pdfs
 *
 *   GET  → list PDFs attached to a law
 *   POST → upload a new PDF (multipart: file + label + version? + isPrimary?)
 *
 * Phase 7. Admin-only. Mutations are audit-logged. Files are saved
 * to /upload/law-pdfs/<lawId>-<uuid>.pdf via /api/admin/upload logic
 * inlined here (no double-roundtrip).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { addLawPdf, listPdfsForLaw } from "@/lib/queries/law-pdfs";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  const pdfs = await listPdfsForLaw(id);
  return NextResponse.json({ pdfs });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id: lawId } = await ctx.params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  const label = form.get("label");
  const version = form.get("version");
  const isPrimary = form.get("isPrimary");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "bad_request", message: "`file` field is required" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "bad_request", message: `File too large (max ${MAX_BYTES} bytes)` },
      { status: 413 }
    );
  }
  if (!label || typeof label !== "string" || !label.trim()) {
    return NextResponse.json(
      { error: "bad_request", message: "`label` is required" },
      { status: 400 }
    );
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "bad_request", message: "Only PDF files are allowed" },
      { status: 400 }
    );
  }

  // Save file under /upload/law-pdfs/<lawId>-<uuid>.pdf
  const uuid = crypto.randomUUID();
  const fileName = `${lawId}-${uuid}.pdf`;
  const uploadRoot = join(process.cwd(), "upload", "law-pdfs");
  await mkdir(uploadRoot, { recursive: true });
  const absPath = join(uploadRoot, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);
  const relPath = `/upload/law-pdfs/${fileName}`;

  const isPrimaryBool = isPrimary === "true" || isPrimary === "1";
  const pdf = await addLawPdf({
    lawId,
    label: label.trim(),
    version: typeof version === "string" && version.trim() ? version.trim() : undefined,
    filePath: relPath,
    fileSize: file.size,
    isPrimary: isPrimaryBool,
    uploadedBy: guard.user.id,
  });

  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.law.pdf.upload",
    targetType: "law_pdf",
    targetId: pdf.id,
    metadata: { lawId, label: pdf.label, path: relPath, size: file.size },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ pdf }, { status: 201 });
}
