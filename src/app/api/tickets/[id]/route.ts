/**
 * /api/tickets/[id]
 *
 *   GET  /api/tickets/[id]            → ticket + all messages
 *   POST /api/tickets/[id]/messages   → append a user reply
 *
 * The POST is on the [id] route with a sub-path `messages`. Next.js
 * App Router represents this as a `messages` folder inside `[id]`.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { tickets, ticketMessages } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const { id } = await params;
  const found = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.userId, u.id)))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }
  const t = found[0];
  const msgs = await db
    .select({
      id: ticketMessages.id,
      fromRole: ticketMessages.fromRole,
      body: ticketMessages.body,
      createdAt: ticketMessages.createdAt,
      authorUserId: ticketMessages.authorUserId,
    })
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, id))
    .orderBy(asc(ticketMessages.createdAt));

  return NextResponse.json({
    ticket: {
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      lastReplyAt: t.lastReplyAt?.toISOString() ?? null,
    },
    messages: msgs.map((m) => ({
      ...m,
      from: m.fromRole, // the existing UI uses `from`, not `fromRole`
      at: m.createdAt.toISOString(),
      text: m.body,
    })),
  });
}
