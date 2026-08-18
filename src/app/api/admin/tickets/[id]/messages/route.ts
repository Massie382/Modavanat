/**
 * POST /api/admin/tickets/[id]/messages — admin reply to a ticket.
 *
 * Body: { body: string }
 *
 * Audit-logged inside the query helper.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { replyToTicket } from "@/lib/queries/tickets";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const result = await replyToTicket(id, {
    fromUserId: guard.user.id,
    fromRole: "support",
    body: parsed.data.body,
    ip: getClientIpFromReq(req),
  });
  if (!result) {
    return NextResponse.json(
      { error: "not_found", message: `Ticket ${id} not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true, id: result.messageId }, { status: 201 });
}
