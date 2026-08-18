/**
 * /api/admin/settings — read + write app settings namespaces.
 *
 *   GET   /api/admin/settings                → all namespaces
 *   GET   /api/admin/settings?key=branding   → single namespace
 *   PATCH /api/admin/settings?key=branding { ...partial }
 *         → merged value for that namespace
 *
 * Admin-only. Mutations are audit-logged.
 *
 * The settings sub-pages under /admin/settings/* are still frontend-only
 * mocks in Phase E — they don't yet call this endpoint. The route is
 * scaffolded so Phase 7 can wire the settings pages to it without
 * adding more tables.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { getSettings, getAllSettings, updateSettings } from "@/lib/queries/settings";
import { logAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const key = sp.get("key");
  if (key) {
    const value = await getSettings(key);
    return NextResponse.json({ key, value: value ?? {} });
  }
  const all = await getAllSettings();
  return NextResponse.json({ settings: all });
}

export async function PATCH(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const key = sp.get("key");
  if (!key) {
    return NextResponse.json(
      { error: "bad_request", message: "`key` query param is required" },
      { status: 400 }
    );
  }

  let patch: unknown;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (
    patch === null ||
    typeof patch !== "object" ||
    Array.isArray(patch)
  ) {
    return NextResponse.json(
      { error: "bad_request", message: "Body must be a JSON object" },
      { status: 400 }
    );
  }

  const merged = await updateSettings(key, patch as Record<string, unknown>, guard.user.id);
  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.settings.update",
    targetType: "settings",
    targetId: key,
    metadata: { keys: Object.keys(patch as Record<string, unknown>) },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ key, value: merged });
}
