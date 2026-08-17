/**
 * GET /api/admin/stats — site-wide stats for the admin dashboard.
 *
 * Returns counts: totalUsers, totalAdmins, totalLaws, totalArticles,
 * totalAmendments, totalReferences. Admin-only.
 */

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getSiteStats } from "@/lib/queries/users";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const stats = await getSiteStats();
  return NextResponse.json({ stats });
}
