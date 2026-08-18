/**
 * /api/admin/vocabularies
 *
 *   GET  → list all vocabularies (with entries)
 *   POST → create a new vocabulary namespace {key, label, entries?}
 *
 * Phase 7. Admin-only. Mutations are audit-logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import {
  listVocabularies,
  createVocabulary,
} from "@/lib/queries/vocabularies";
import { logAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const vocab = await listVocabularies();
  return NextResponse.json({ vocabularies: vocab });
}

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  let body: { key?: string; label?: string; entries?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.key || typeof body.key !== "string") {
    return NextResponse.json(
      { error: "bad_request", message: "`key` required" },
      { status: 400 }
    );
  }
  if (!body.label || typeof body.label !== "string") {
    return NextResponse.json(
      { error: "bad_request", message: "`label` required" },
      { status: 400 }
    );
  }
  if (body.entries !== undefined && !Array.isArray(body.entries)) {
    return NextResponse.json(
      { error: "bad_request", message: "`entries` must be an array" },
      { status: 400 }
    );
  }

  const entries = (body.entries ?? []) as Awaited<
    ReturnType<typeof listVocabularies>
  >[number]["entries"];

  try {
    const v = await createVocabulary(body.key, body.label, entries, guard.user.id);
    await logAudit({
      actorUserId: guard.user.id,
      action: "admin.vocabulary.create",
      targetType: "vocabulary",
      targetId: v.key,
      metadata: { label: v.label, entryCount: v.entries.length },
      ip: getClientIpFromReq(req),
    });
    return NextResponse.json({ vocabulary: v }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "conflict", message: `Vocabulary "${body.key}" already exists` },
        { status: 409 }
      );
    }
    console.error("[/api/admin/vocabularies POST]", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create vocabulary" },
      { status: 500 }
    );
  }
}
