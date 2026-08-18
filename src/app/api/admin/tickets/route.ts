/**
 * /api/admin/tickets — admin-side support ticket list + create.
 *
 *   GET  /api/admin/tickets?status=&priority=&q=&page=&pageSize=
 *        → { rows: AdminTicketListItem[], total: number }
 *   POST /api/admin/tickets { userId, subject, category, body, priority?, lawId? }
 *        → 201 { ok: true, id }
 *
 * Admin-only. Mutations are audit-logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { listAllTickets, adminCreateTicket } from "@/lib/queries/tickets";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const result = await listAllTickets({
    status: sp.get("status") ?? undefined,
    priority: sp.get("priority") ?? undefined,
    q: sp.get("q") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

const postSchema = z.object({
  userId: z.string().trim().min(1),
  subject: z.string().trim().min(5).max(200),
  category: z.string().trim().min(1).max(80),
  body: z.string().trim().min(5).max(8000),
  priority: z.enum(["low", "medium", "high"]).optional(),
  lawId: z.string().trim().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const result = await adminCreateTicket({
    userId: parsed.data.userId,
    subject: parsed.data.subject,
    category: parsed.data.category,
    body: parsed.data.body,
    priority: parsed.data.priority,
    lawId: parsed.data.lawId,
    actorUserId: guard.user.id,
    ip: getClientIpFromReq(req),
  });
  if ("error" in result) {
    const status =
      result.error === "user_not_found" ? 404 :
      result.error === "invalid_priority" ? 400 :
      400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, id: result.ticketId }, { status: 201 });
}
