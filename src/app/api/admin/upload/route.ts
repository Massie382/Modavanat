/**
 * /api/admin/upload
 *
 *   POST multipart/form-data  →  save a file under /upload/<subdir>/
 *   and return its path. Admin-only. Used by the PDF upload flow
 *   and (eventually) by branding logo uploads.
 *
 * Body (multipart):
 *   file:   File (required) — the binary payload
 *   subdir: string (optional, default "misc") — sub-directory under /upload
 *   prefix: string (optional) — filename prefix (slug-style)
 *
 * Response: { path: "/upload/<subdir>/<prefix>-<uuid>.<ext>" }
 *
 * Note: this route does NOT record anything in the DB. The caller
 * is responsible for inserting a row in `law_pdfs` (or wherever
 * the file belongs) using the returned path.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "svg"]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (matches nginx config)

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

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
  const subdir = (form.get("subdir") as string | null)?.trim() || "misc";
  const prefix = (form.get("prefix") as string | null)?.trim() || "";

  // Validate subdir — no path traversal.
  if (!/^[a-z0-9-]+$/.test(subdir)) {
    return NextResponse.json(
      { error: "bad_request", message: "`subdir` must be kebab-case (latin, no spaces)" },
      { status: 400 }
    );
  }
  if (prefix && !/^[a-z0-9-]+$/.test(prefix)) {
    return NextResponse.json(
      { error: "bad_request", message: "`prefix` must be kebab-case (latin, no spaces)" },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "bad_request", message: "`file` field is required" },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json(
      { error: "bad_request", message: "File is empty" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "bad_request", message: `File too large (max ${MAX_BYTES} bytes)` },
      { status: 413 }
    );
  }

  const originalName = file.name.toLowerCase();
  const ext = originalName.includes(".")
    ? originalName.split(".").pop() ?? ""
    : "";
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      {
        error: "bad_request",
        message: `Extension ".${ext}" not allowed. Allowed: ${[...ALLOWED_EXT].join(", ")}`,
      },
      { status: 400 }
    );
  }

  const uuid = crypto.randomUUID();
  const safePrefix = prefix ? `${prefix}-` : "";
  const fileName = `${safePrefix}${uuid}.${ext}`;
  const uploadRoot = join(process.cwd(), "upload", subdir);
  await mkdir(uploadRoot, { recursive: true });
  const absPath = join(uploadRoot, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  const relPath = `/upload/${subdir}/${fileName}`;
  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.upload",
    targetType: "file",
    targetId: relPath,
    metadata: {
      originalName: file.name,
      size: file.size,
      mime: file.type,
    },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ path: relPath, size: file.size, mime: file.type });
}
