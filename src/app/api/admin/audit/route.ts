/**
 * GET /api/admin/audit — paginated audit log.
 *
 * Query params: ?action=&targetType=&actorUserId=&q=&page=&pageSize=
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { listAuditLog } from "@/lib/queries/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const result = await listAuditLog({
    action: sp.get("action") ?? undefined,
    targetType: sp.get("targetType") ?? undefined,
    actorUserId: sp.get("actorUserId") ?? undefined,
    q: sp.get("q") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}
