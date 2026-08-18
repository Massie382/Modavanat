/**
 * /api/admin/laws
 *
 *   POST → create a new law (admin-only). Used by /admin/laws/new.
 *
 * Phase 7. Mutations are audit-logged. The public GET for laws lives
 * at /api/laws — this route handles admin-only POST.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { createLaw, type NewLawInput } from "@/lib/queries/laws";
import { logAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  let body: Partial<NewLawInput> & { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Required fields — light validation, business-logic matters more
  // than exact format here.
  const required: (keyof NewLawInput)[] = [
    "id",
    "title",
    "type",
    "year",
    "extent",
    "subject",
    "promulgatingAuthority",
    "approvedDate",
    "effectiveDate",
    "lastRevisionDate",
    "description",
  ];
  for (const k of required) {
    const v = body[k];
    if (v === undefined || v === null || v === "") {
      return NextResponse.json(
        { error: "bad_request", message: `Missing required field: ${k}` },
        { status: 400 }
      );
    }
  }
  if (typeof body.year !== "number" || body.year < 1200 || body.year > 1500) {
    return NextResponse.json(
      { error: "bad_request", message: "`year` must be a 4-digit Persian-calendar year" },
      { status: 400 }
    );
  }
  // Law ID must be kebab-case latin (used in URL: /law/<id>).
  if (!/^[a-z0-9-]+$/.test(String(body.id))) {
    return NextResponse.json(
      { error: "bad_request", message: "`id` must be kebab-case latin (used in URL)" },
      { status: 400 }
    );
  }

  try {
    const law = await createLaw(body as NewLawInput);
    await logAudit({
      actorUserId: guard.user.id,
      action: "admin.law.create",
      targetType: "law",
      targetId: law.id,
      metadata: {
        title: law.title,
        type: law.type,
        year: law.year,
      },
      ip: getClientIpFromReq(req),
    });
    return NextResponse.json({ law }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "conflict", message: `Law id "${body.id}" already exists` },
        { status: 409 }
      );
    }
    console.error("[/api/admin/laws POST]", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create law" },
      { status: 500 }
    );
  }
}
