/**
 * Admin tickets queries — server-side data-access layer for the
 * /admin/tickets management UI.
 *
 * Server-only. Caller is responsible for authorization (must be admin).
 *
 * Mirrors src/lib/queries/users.ts in pattern.
 */

import { db } from "@/db/client";
import { tickets, ticketMessages, users } from "@/db/schema";
import {
  eq,
  desc,
  ilike,
  or,
  and,
  sql,
  count,
  asc,
  inArray,
} from "drizzle-orm";
import { logAudit } from "@/lib/auth/audit";

export interface AdminTicketListItem {
  id: string;
  subject: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  category: string;
  status: string;
  priority: string;
  lawId: string | null;
  lastReplyAt: string | null; // ISO
  lastReplyFrom: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TicketListResult {
  rows: AdminTicketListItem[];
  total: number;
}

export interface TicketListFilter {
  status?: string;
  priority?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

const VALID_STATUSES = new Set(["open", "pending", "closed"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high"]);

/**
 * Paginated list of all tickets in the system, joined with the owning
 * user's email + name. Sorted by updatedAt desc (most-recently-active
 * first — the admin's natural queue order).
 */
export async function listAllTickets(
  filter: TicketListFilter = {}
): Promise<TicketListResult> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filter.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const q = filter.q?.trim();

  const conditions: ReturnType<typeof eq>[] = [];
  if (filter.status && VALID_STATUSES.has(filter.status)) {
    conditions.push(eq(tickets.status, filter.status));
  }
  if (filter.priority && VALID_PRIORITIES.has(filter.priority)) {
    conditions.push(eq(tickets.priority, filter.priority));
  }
  const search = q
    ? or(
        ilike(tickets.subject, `%${q}%`),
        ilike(tickets.id, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.name, `%${q}%`)
      )
    : undefined;

  const where =
    conditions.length > 0
      ? search
        ? and(...conditions, search)
        : and(...conditions)
      : search ?? sql`true`;

  const rows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      userId: tickets.userId,
      userEmail: users.email,
      userName: users.name,
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
    .innerJoin(users, eq(users.id, tickets.userId))
    .where(where)
    .orderBy(desc(tickets.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const totalRow = await db
    .select({ c: count() })
    .from(tickets)
    .innerJoin(users, eq(users.id, tickets.userId))
    .where(where);
  const total = Number(totalRow[0]?.c ?? 0);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      userId: r.userId,
      userEmail: r.userEmail,
      userName: r.userName,
      category: r.category,
      status: r.status,
      priority: r.priority,
      lawId: r.lawId,
      lastReplyAt: r.lastReplyAt?.toISOString() ?? null,
      lastReplyFrom: r.lastReplyFrom,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    total,
  };
}

export interface AdminTicketMessage {
  id: string;
  fromRole: string;
  body: string;
  createdAt: string; // ISO
  authorUserId: string | null;
  authorEmail: string | null;
  authorName: string | null;
}

export interface AdminTicketDetail {
  id: string;
  subject: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  category: string;
  status: string;
  priority: string;
  lawId: string | null;
  lastReplyAt: string | null;
  lastReplyFrom: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AdminTicketMessage[];
}

/**
 * Get a single ticket + all its messages, joined with author email/name
 * for each message.
 */
export async function getTicketById(
  id: string
): Promise<AdminTicketDetail | undefined> {
  const ticketRows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      userId: tickets.userId,
      userEmail: users.email,
      userName: users.name,
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
    .innerJoin(users, eq(users.id, tickets.userId))
    .where(eq(tickets.id, id))
    .limit(1);
  const t = ticketRows[0];
  if (!t) return undefined;

  const msgRows = await db
    .select({
      id: ticketMessages.id,
      fromRole: ticketMessages.fromRole,
      body: ticketMessages.body,
      createdAt: ticketMessages.createdAt,
      authorUserId: ticketMessages.authorUserId,
      authorEmail: users.email,
      authorName: users.name,
    })
    .from(ticketMessages)
    .leftJoin(users, eq(users.id, ticketMessages.authorUserId))
    .where(eq(ticketMessages.ticketId, id))
    .orderBy(asc(ticketMessages.createdAt));

  return {
    id: t.id,
    subject: t.subject,
    userId: t.userId,
    userEmail: t.userEmail,
    userName: t.userName,
    category: t.category,
    status: t.status,
    priority: t.priority,
    lawId: t.lawId,
    lastReplyAt: t.lastReplyAt?.toISOString() ?? null,
    lastReplyFrom: t.lastReplyFrom,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    messages: msgRows.map((m) => ({
      id: m.id,
      fromRole: m.fromRole,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      authorUserId: m.authorUserId,
      authorEmail: m.authorEmail,
      authorName: m.authorName,
    })),
  };
}

export interface ReplyToTicketInput {
  fromUserId: string; // admin's user id
  fromRole: "user" | "support" | "system";
  body: string;
  ip?: string | null;
}

/**
 * Append an admin reply to a ticket + bump last_reply_at/updated_at/
 * last_reply_from. Audit-logged.
 */
export async function replyToTicket(
  ticketId: string,
  input: ReplyToTicketInput
): Promise<{ messageId: string } | undefined> {
  const found = await db
    .select({ id: tickets.id, status: tickets.status })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (found.length === 0) return undefined;

  const now = new Date();
  const messageId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(ticketMessages).values({
      id: messageId,
      ticketId,
      authorUserId: input.fromUserId,
      fromRole: input.fromRole,
      body: input.body,
      createdAt: now,
    });
    await tx
      .update(tickets)
      .set({
        lastReplyAt: now,
        lastReplyFrom: input.fromRole,
        updatedAt: now,
        // If admin replies to a closed ticket, re-open it.
        status: found[0].status === "closed" ? "pending" : found[0].status,
      })
      .where(eq(tickets.id, ticketId));
  });
  await logAudit({
    actorUserId: input.fromUserId,
    action: "admin.ticket.reply",
    targetType: "ticket",
    targetId: ticketId,
    metadata: { fromRole: input.fromRole },
    ip: input.ip ?? null,
  });
  return { messageId };
}

/**
 * Update ticket status (open | pending | closed). Admin can close or
 * re-open. Audit-logged.
 */
export async function updateTicketStatus(
  ticketId: string,
  status: string,
  actorUserId: string,
  ip?: string | null
): Promise<boolean> {
  if (!VALID_STATUSES.has(status)) return false;
  const now = new Date();
  const existing = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (existing.length === 0) return false;
  await db
    .update(tickets)
    .set({ status, updatedAt: now })
    .where(eq(tickets.id, ticketId));
  await logAudit({
    actorUserId,
    action: "admin.ticket.status",
    targetType: "ticket",
    targetId: ticketId,
    metadata: { status },
    ip: ip ?? null,
  });
  return true;
}

/**
 * Update ticket priority (low | medium | high). Audit-logged.
 */
export async function updateTicketPriority(
  ticketId: string,
  priority: string,
  actorUserId: string,
  ip?: string | null
): Promise<boolean> {
  if (!VALID_PRIORITIES.has(priority)) return false;
  const now = new Date();
  const existing = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (existing.length === 0) return false;
  await db
    .update(tickets)
    .set({ priority, updatedAt: now })
    .where(eq(tickets.id, ticketId));
  await logAudit({
    actorUserId,
    action: "admin.ticket.priority",
    targetType: "ticket",
    targetId: ticketId,
    metadata: { priority },
    ip: ip ?? null,
  });
  return true;
}

/**
 * Admin creates a ticket on behalf of a user (e.g. phone-in support).
 *
 * Inserts the ticket row + the first user-side message in a transaction.
 * Audit-logged.
 */
export async function adminCreateTicket(input: {
  userId: string;
  subject: string;
  category: string;
  body: string;
  priority?: string;
  lawId?: string | null;
  actorUserId: string;
  ip?: string | null;
}): Promise<{ ticketId: string } | { error: string }> {
  const priority = input.priority ?? "medium";
  if (!VALID_PRIORITIES.has(priority)) {
    return { error: "invalid_priority" };
  }
  // Verify the target user exists.
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (userRows.length === 0) return { error: "user_not_found" };

  const ticketId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(tickets).values({
      id: ticketId,
      userId: input.userId,
      subject: input.subject,
      category: input.category,
      status: "open",
      priority,
      lawId: input.lawId ?? null,
      lastReplyAt: now,
      lastReplyFrom: "user",
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(ticketMessages).values({
      id: messageId,
      ticketId,
      authorUserId: input.userId,
      fromRole: "user",
      body: input.body,
      createdAt: now,
    });
  });
  await logAudit({
    actorUserId: input.actorUserId,
    action: "admin.ticket.create",
    targetType: "ticket",
    targetId: ticketId,
    metadata: {
      userId: input.userId,
      subject: input.subject,
      category: input.category,
    },
    ip: input.ip ?? null,
  });
  return { ticketId };
}

/**
 * Count tickets grouped by status — used by the dashboard tile.
 */
export async function countTicketsByStatus(): Promise<{
  open: number;
  pending: number;
  closed: number;
}> {
  const rows = await db
    .select({ status: tickets.status, c: count() })
    .from(tickets)
    .groupBy(tickets.status);
  const out = { open: 0, pending: 0, closed: 0 };
  for (const r of rows) {
    if (r.status === "open") out.open = Number(r.c);
    else if (r.status === "pending") out.pending = Number(r.c);
    else if (r.status === "closed") out.closed = Number(r.c);
  }
  return out;
}

/**
 * Count tickets where the user is the sentinel guest UUID — used by
 * /api/admin/contact-emails to surface anonymous contact-form tickets.
 */
export async function listContactFormTickets(): Promise<
  AdminTicketListItem[]
> {
  const GUEST_USER_ID = "00000000-0000-0000-0000-000000000000";
  // Only count tickets whose owner is the guest sentinel. These are
  // contact-form submissions; the visitor's email is in the first
  // message body (see /api/contact/route.ts).
  const rows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      userId: tickets.userId,
      userEmail: users.email,
      userName: users.name,
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
    .innerJoin(users, eq(users.id, tickets.userId))
    .where(eq(tickets.userId, GUEST_USER_ID))
    .orderBy(desc(tickets.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    userId: r.userId,
    userEmail: r.userEmail,
    userName: r.userName,
    category: r.category,
    status: r.status,
    priority: r.priority,
    lawId: r.lawId,
    lastReplyAt: r.lastReplyAt?.toISOString() ?? null,
    lastReplyFrom: r.lastReplyFrom,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

// Re-exported for callers that need to use IN clauses on ticket IDs.
export { inArray };
