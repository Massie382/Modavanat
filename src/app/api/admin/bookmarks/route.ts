/**
 * GET /api/admin/bookmarks — list all bookmarks across all users.
 *
 * Query params: ?q=&page=&pageSize=
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { listAllBookmarks } from "@/lib/queries/bookmarks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const result = await listAllBookmarks({
    q: sp.get("q") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}
