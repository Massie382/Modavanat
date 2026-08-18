/**
 * POST /api/tickets/[id]/messages
 *
 * Append a user reply to an open or pending ticket. Re-opens a closed
 * ticket (status: closed → open) since the user clearly still needs
 * help.
 *
 * Body: { body: string }
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { tickets, ticketMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

const schema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const { id } = await params;

  // Make sure the ticket exists AND belongs to this user.
  const found = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.userId, u.id)))
    .limit(1);
  if (found.length === 0) {
    return NextResponse.json({ error: "تیکت یافت نشد." }, { status: 404 });
  }
  const t = found[0];
  if (t.status === "closed") {
    return NextResponse.json(
      { error: "این تیکت بسته شده است. برای ادامه، یک تیکت جدید باز کنید." },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر." },
      { status: 400 }
    );
  }
  const now = new Date();
  const messageId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(ticketMessages).values({
      id: messageId,
      ticketId: id,
      authorUserId: u.id,
      fromRole: "user",
      body: parsed.data.body,
      createdAt: now,
    });
    await tx
      .update(tickets)
      .set({
        lastReplyAt: now,
        lastReplyFrom: "user",
        updatedAt: now,
      })
      .where(eq(tickets.id, id));
  });
  await logAudit({
    actorUserId: u.id,
    action: "user.ticket.reply",
    targetType: "ticket",
    targetId: id,
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true, id: messageId }, { status: 201 });
}
