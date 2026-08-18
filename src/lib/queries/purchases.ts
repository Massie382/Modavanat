/**
 * Admin purchases queries — server-side data-access layer for the
 * /admin/purchases management UI.
 *
 * Server-only. Caller is responsible for authorization (must be admin).
 */

import { db } from "@/db/client";
import { purchases, users } from "@/db/schema";
import { eq, desc, ilike, or, sql, count, and, type SQL } from "drizzle-orm";
import { logAudit } from "@/lib/auth/audit";

export interface AdminPurchaseListItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  invoiceNumber: string | null;
  paidAt: string | null; // ISO
  createdAt: string; // ISO
}

export interface PurchaseListResult {
  rows: AdminPurchaseListItem[];
  total: number;
}

export interface PurchaseListFilter {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const VALID_STATUSES = new Set(["paid", "pending", "refunded", "failed"]);

/**
 * Paginated list of all purchases, joined with the owning user's email.
 * Search (`q`) is ILIKE on user email + description + invoice number.
 */
export async function listAllPurchases(
  filter: PurchaseListFilter = {}
): Promise<PurchaseListResult> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filter.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const q = filter.q?.trim();

  const conditions: SQL[] = [];
  if (filter.status && VALID_STATUSES.has(filter.status)) {
    conditions.push(eq(purchases.status, filter.status));
  }
  const search = q
    ? or(
        ilike(users.email, `%${q}%`),
        ilike(purchases.description, `%${q}%`),
        ilike(purchases.invoiceNumber, `%${q}%`),
        ilike(purchases.id, `%${q}%`)
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
      id: purchases.id,
      userId: purchases.userId,
      userEmail: users.email,
      userName: users.name,
      description: purchases.description,
      amount: purchases.amount,
      currency: purchases.currency,
      status: purchases.status,
      method: purchases.method,
      invoiceNumber: purchases.invoiceNumber,
      paidAt: purchases.paidAt,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .innerJoin(users, eq(users.id, purchases.userId))
    .where(where)
    .orderBy(desc(purchases.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalRow = await db
    .select({ c: count() })
    .from(purchases)
    .innerJoin(users, eq(users.id, purchases.userId))
    .where(where);
  const total = Number(totalRow[0]?.c ?? 0);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      userName: r.userName,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      method: r.method,
      invoiceNumber: r.invoiceNumber,
      paidAt: r.paidAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

export interface CreatePurchaseInput {
  userId: string;
  description: string;
  amount: number;
  currency?: string;
  status?: string;
  method?: string | null;
  invoiceNumber?: string | null;
  paidAt?: Date | null;
  actorUserId: string;
  ip?: string | null;
}

/**
 * Admin manually records a purchase (e.g. bank-transfer receipt entered
 * by hand). Audit-logged.
 */
export async function createPurchase(
  input: CreatePurchaseInput
): Promise<{ id: string } | { error: string }> {
  if (input.amount <= 0) return { error: "invalid_amount" };
  if (input.status && !VALID_STATUSES.has(input.status)) {
    return { error: "invalid_status" };
  }
  // Verify the target user exists.
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (userRows.length === 0) return { error: "user_not_found" };

  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(purchases).values({
    id,
    userId: input.userId,
    description: input.description,
    amount: input.amount,
    currency: input.currency ?? "IRT",
    status: input.status ?? "paid",
    method: input.method ?? null,
    invoiceNumber: input.invoiceNumber ?? null,
    paidAt: input.paidAt ?? now,
    createdAt: now,
  });
  await logAudit({
    actorUserId: input.actorUserId,
    action: "admin.purchase.create",
    targetType: "purchase",
    targetId: id,
    metadata: {
      userId: input.userId,
      amount: input.amount,
      currency: input.currency ?? "IRT",
      status: input.status ?? "paid",
    },
    ip: input.ip ?? null,
  });
  return { id };
}

/**
 * Count all purchases + sum amounts grouped by status — used by the
 * dashboard tiles.
 */
export async function getPurchasesSummary(): Promise<{
  total: number;
  paid: number;
  pending: number;
  refunded: number;
  failed: number;
  revenue: number;
}> {
  const rows = await db
    .select({
      status: purchases.status,
      c: count(),
      revenue: sql<number>`coalesce(sum(${purchases.amount})::bigint, 0)::bigint`,
    })
    .from(purchases)
    .groupBy(purchases.status);
  const out = { total: 0, paid: 0, pending: 0, refunded: 0, failed: 0, revenue: 0 };
  for (const r of rows) {
    const n = Number(r.c);
    out.total += n;
    if (r.status === "paid") {
      out.paid = n;
      out.revenue = Number(r.revenue ?? 0);
    } else if (r.status === "pending") out.pending = n;
    else if (r.status === "refunded") out.refunded = n;
    else if (r.status === "failed") out.failed = n;
  }
  return out;
}
