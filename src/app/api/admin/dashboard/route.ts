/**
 * GET /api/admin/dashboard — real counts for the admin dashboard tiles.
 *
 * Returns the same shape the dashboard page needs to render:
 *   - stats: SiteStats from getSiteStats()
 *   - ticketsByStatus: { open, pending, closed }
 *   - purchasesSummary: { total, paid, pending, refunded, failed, revenue }
 *   - totalBookmarks: number
 *   - recentActivity: AdminAuditEntry[] (8 most recent entries — replaces the
 *     old `defaultActivity` mock)
 *   - lawTypeDistribution: { name, value (percent), color }[] computed from
 *     the laws table
 *   - monthlyVisits: null (visit analytics not tracked yet — the chart
 *     shows an empty state)
 *   - topSearchedLaws: null (search analytics not tracked yet)
 *   - notifications: [] (no persisted notifications table — the SSE
 *     notifications system is runtime-only)
 *
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getSiteStats } from "@/lib/queries/users";
import { countTicketsByStatus } from "@/lib/queries/tickets";
import { getPurchasesSummary } from "@/lib/queries/purchases";
import { getRecentAudit } from "@/lib/queries/audit";
import { db } from "@/db/client";
import { bookmarks, laws } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Static color map for law type distribution — matches the old
// admin mock colors so the chart doesn't change visually.
const LAW_TYPE_COLORS: Record<string, string> = {
  "قانون عادی": "#d4a574",
  "آیین‌نامه": "#4a6c8a",
  "بخشنامه": "#4a7c4a",
  "قانون اساسی": "#7a5c8a",
  "مقررات": "#c08a3e",
};

export async function GET() {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const [stats, ticketsByStatus, purchasesSummary, recentActivity, totalBookmarksRow, typeRows] =
    await Promise.all([
      getSiteStats(),
      countTicketsByStatus(),
      getPurchasesSummary(),
      getRecentAudit(8),
      db.select({ c: count() }).from(bookmarks),
      db
        .select({ type: laws.type, c: count() })
        .from(laws)
        .groupBy(laws.type),
    ]);

  const totalBookmarks = Number(totalBookmarksRow[0]?.c ?? 0);
  const totalLawsByType = typeRows.reduce((s, r) => s + Number(r.c), 0);
  const lawTypeDistribution = typeRows
    .map((r) => ({
      name: r.type,
      value: totalLawsByType > 0 ? Math.round((Number(r.c) / totalLawsByType) * 100) : 0,
      color: LAW_TYPE_COLORS[r.type] ?? "#8a8a8a",
    }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({
    stats,
    ticketsByStatus,
    purchasesSummary,
    totalBookmarks,
    recentActivity,
    lawTypeDistribution,
    // Visit + search analytics are not tracked yet — return null so the
    // client can render empty states without crashing.
    monthlyVisits: null,
    topSearchedLaws: null,
    // SSE notifications are runtime-only; no persisted list to return.
    notifications: [],
  });
}
