/**
 * /api/admin/tickets/[id] — admin ticket detail + status/priority update.
 *
 *   GET   /api/admin/tickets/[id]                 → { ticket: AdminTicketDetail }
 *   PATCH /api/admin/tickets/[id] { status?, priority? }
 *         → { ok: true } | 404 | 400
 *
 * Admin-only. Mutations are audit-logged inside the query helper.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
} from "@/lib/queries/tickets";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) {
    return NextResponse.json(
      { error: "not_found", message: `Ticket ${id} not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({ ticket });
}

const patchSchema = z.object({
  status: z.enum(["open", "pending", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  if (!parsed.data.status && !parsed.data.priority) {
    return NextResponse.json(
      { error: "bad_request", message: "Provide at least one of: status, priority" },
      { status: 400 }
    );
  }

  const ip = getClientIpFromReq(req);
  if (parsed.data.status) {
    const ok = await updateTicketStatus(id, parsed.data.status, guard.user.id, ip);
    if (!ok) {
      return NextResponse.json(
        { error: "not_found", message: `Ticket ${id} not found` },
        { status: 404 }
      );
    }
  }
  if (parsed.data.priority) {
    const ok = await updateTicketPriority(id, parsed.data.priority, guard.user.id, ip);
    if (!ok) {
      return NextResponse.json(
        { error: "not_found", message: `Ticket ${id} not found` },
        { status: 404 }
      );
    }
  }
  return NextResponse.json({ ok: true });
}
