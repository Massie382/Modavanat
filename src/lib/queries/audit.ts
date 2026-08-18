/**
 * Audit log queries — server-side data-access layer for the
 * /admin/activity page and the dashboard recent-activity card.
 *
 * Server-only. Caller is responsible for authorization (must be admin).
 */

import { db } from "@/db/client";
import { auditLog, users } from "@/db/schema";
import { eq, desc, ilike, or, and, sql, count, type SQL } from "drizzle-orm";

export interface AdminAuditEntry {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string; // ISO
}

export interface AuditListResult {
  rows: AdminAuditEntry[];
  total: number;
}

export interface AuditListFilter {
  action?: string;
  targetType?: string;
  actorUserId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated audit log, joined with the actor's email + name.
 *
 * Filters:
 *   - action (exact match, e.g. "user.login.success")
 *   - targetType (exact match, e.g. "user" | "law" | "ticket" | ...)
 *   - actorUserId (exact match)
 *   - q (ILIKE on action + actor email + target id)
 */
export async function listAuditLog(
  filter: AuditListFilter = {}
): Promise<AuditListResult> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filter.pageSize ?? 50));
  const offset = (page - 1) * pageSize;
  const q = filter.q?.trim();

  const conditions: SQL[] = [];
  if (filter.action) conditions.push(eq(auditLog.action, filter.action));
  if (filter.targetType) conditions.push(eq(auditLog.targetType, filter.targetType));
  if (filter.actorUserId) conditions.push(eq(auditLog.actorUserId, filter.actorUserId));

  const search = q
    ? or(
        ilike(auditLog.action, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(auditLog.targetId, `%${q}%`)
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
      id: auditLog.id,
      actorUserId: auditLog.actorUserId,
      actorEmail: users.email,
      actorName: users.name,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      metadata: auditLog.metadata,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalRow = await db
    .select({ c: count() })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(where);
  const total = Number(totalRow[0]?.c ?? 0);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      actorEmail: r.actorEmail,
      actorName: r.actorName,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      metadata: r.metadata,
      ip: r.ip,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * Get the most recent N audit entries — used by the dashboard
 * "recent activity" card. Returns the same shape as AdminAuditEntry but
 * unpaginated.
 */
export async function getRecentAudit(
  limit = 8
): Promise<AdminAuditEntry[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      actorUserId: auditLog.actorUserId,
      actorEmail: users.email,
      actorName: users.name,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      metadata: auditLog.metadata,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    actorUserId: r.actorUserId,
    actorEmail: r.actorEmail,
    actorName: r.actorName,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: r.metadata,
    ip: r.ip,
    createdAt: r.createdAt.toISOString(),
  }));
}
