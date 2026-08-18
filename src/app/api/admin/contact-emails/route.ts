/**
 * GET /api/admin/contact-emails — anonymous contact-form submissions.
 *
 * These are stored as tickets owned by the synthetic "guest" user
 * (UUID `00000000-0000-0000-0000-000000000000`, see
 * /api/contact/route.ts). The visitor's email is in the first
 * message body, prefixed with `از: <email>\n\n`.
 *
 * Admin-only. Returns a list with the same shape as
 * AdminTicketListItem for client-side rendering parity.
 */

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { listContactFormTickets } from "@/lib/queries/tickets";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const rows = await listContactFormTickets();
  return NextResponse.json({ rows, total: rows.length });
}
