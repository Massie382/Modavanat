/**
 * /api/tickets — user's support tickets.
 *
 *   GET  /api/tickets           → list current user's tickets (with last message preview)
 *   POST /api/tickets           → open a new ticket (creates ticket + first message atomically)
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { tickets, ticketMessages } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

const postSchema = z.object({
  subject: z.string().trim().min(5).max(200),
  category: z.string().trim().min(1).max(80),
  body: z.string().trim().min(5).max(8000),
  lawId: z.string().trim().max(120).optional(),
});

export async function GET() {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const rows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      category: tickets.category,
      status: tickets.status,
      priority: tickets.priority,
      lawId: tickets.lawId,
      lastReplyAt: tickets.lastReplyAt,
      lastReplyFrom: tickets.lastReplyFrom,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .where(eq(tickets.userId, u.id))
    .orderBy(desc(tickets.updatedAt));

  // For each ticket, fetch the latest message body so the list view
  // can show a preview. We do this in a follow-up query to avoid the
  // join-from-hell (Drizzle's relational API doesn't yet support
  // LIMIT 1 sub-select cleanly for "last message in a thread").
  const ticketIds = rows.map((r) => r.id);
  const lastMessages = new Map<string, string>();
  if (ticketIds.length > 0) {
    // Drizzle doesn't support DISTINCT ON directly — use raw SQL.
    const result = await db.execute(sql`
      SELECT tm.ticket_id, tm.body
      FROM ticket_messages tm
      WHERE tm.id IN (
        SELECT MAX(id) FROM ticket_messages
        WHERE ticket_id = ANY(${ticketIds}::text[])
        GROUP BY ticket_id
      )
    `);
    // Drizzle's execute() returns either a rows-array (pglite) or a
    // { rows: [] } object (postgres-js). Handle both shapes.
    const list =
      (result as unknown as Array<{ ticket_id: string; body: string }>) ??
      ((result as unknown as { rows?: Array<{ ticket_id: string; body: string }> })?.rows ?? []);
    for (const row of list) {
      lastMessages.set(row.ticket_id, row.body);
    }
  }

  const out = rows.map((r) => ({
    ...r,
    lastReply: lastMessages.get(r.id) ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    lastReplyAt: r.lastReplyAt?.toISOString() ?? null,
  }));
  return NextResponse.json({ tickets: out });
}

export async function POST(req: Request) {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر." }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر." },
      { status: 400 }
    );
  }
  const { subject, category, body: text, lawId } = parsed.data;

  const ticketId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = new Date();
  // Insert the ticket + the first message in a transaction.
  await db.transaction(async (tx) => {
    await tx.insert(tickets).values({
      id: ticketId,
      userId: u.id,
      subject,
      category,
      status: "open",
      priority: "medium",
      lawId: lawId ?? null,
      lastReplyAt: now,
      lastReplyFrom: "user",
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(ticketMessages).values({
      id: messageId,
      ticketId,
      authorUserId: u.id,
      fromRole: "user",
      body: text,
      createdAt: now,
    });
  });
  await logAudit({
    actorUserId: u.id,
    action: "user.ticket.create",
    targetType: "ticket",
    targetId: ticketId,
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true, id: ticketId }, { status: 201 });
}
