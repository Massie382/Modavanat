/**
 * /api/admin/vocabularies/[key]
 *
 *   GET    → fetch a single vocabulary by key
 *   PATCH  → replace the full entries list {entries: VocabEntry[]}
 *   DELETE → (not implemented yet — would cascade-break laws using
 *            entries; admin must instead mark entries inactive)
 *
 * Phase 7. Admin-only. Mutations are audit-logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import {
  getVocabulary,
  setVocabularyEntries,
} from "@/lib/queries/vocabularies";
import { logAudit } from "@/lib/auth/audit";
import type { VocabEntry } from "@/db/schema/vocabularies";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ key: string }>;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { key } = await ctx.params;
  const v = await getVocabulary(key);
  if (!v) {
    return NextResponse.json(
      { error: "not_found", message: `Vocabulary "${key}" not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({ vocabulary: v });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { key } = await ctx.params;

  let body: { entries?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (!body.entries || !Array.isArray(body.entries)) {
    return NextResponse.json(
      { error: "bad_request", message: "`entries` (array) required" },
      { status: 400 }
    );
  }

  // Light validation — each entry must have id + label + active.
  for (const e of body.entries as unknown[]) {
    if (typeof e !== "object" || e === null) {
      return NextResponse.json(
        { error: "bad_request", message: "Each entry must be an object" },
        { status: 400 }
      );
    }
    const eo = e as Record<string, unknown>;
    if (typeof eo.id !== "string" || typeof eo.label !== "string" || typeof eo.active !== "boolean") {
      return NextResponse.json(
        { error: "bad_request", message: "Each entry needs {id, label, active}" },
        { status: 400 }
      );
    }
  }

  const entries = body.entries as VocabEntry[];
  const v = await setVocabularyEntries(key, entries, guard.user.id);
  if (!v) {
    return NextResponse.json(
      { error: "not_found", message: `Vocabulary "${key}" not found` },
      { status: 404 }
    );
  }
  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.vocabulary.update",
    targetType: "vocabulary",
    targetId: key,
    metadata: { entryCount: entries.length },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ vocabulary: v });
}
