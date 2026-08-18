/**
 * /api/admin/purchases — list all purchases + admin manual record.
 *
 *   GET  /api/admin/purchases?q=&status=&page=&pageSize=
 *        → { rows: AdminPurchaseListItem[], total: number }
 *   POST /api/admin/purchases { userId, description, amount, currency?, status?, method?, invoiceNumber?, paidAt? }
 *        → 201 { ok: true, id }
 *
 * Admin-only. Mutations are audit-logged inside the query helper.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import { listAllPurchases, createPurchase } from "@/lib/queries/purchases";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const result = await listAllPurchases({
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined,
  });
  return NextResponse.json(result);
}

const postSchema = z.object({
  userId: z.string().trim().min(1),
  description: z.string().trim().min(1).max(500),
  amount: z.number().int().positive(),
  currency: z.string().trim().max(8).optional(),
  status: z.enum(["paid", "pending", "refunded", "failed"]).optional(),
  method: z.string().trim().max(120).nullable().optional(),
  invoiceNumber: z.string().trim().max(120).nullable().optional(),
  paidAt: z.string().nullable().optional(),
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
  const paidAt =
    parsed.data.paidAt === null || parsed.data.paidAt === undefined
      ? null
      : new Date(parsed.data.paidAt);
  if (paidAt && isNaN(paidAt.getTime())) {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid paidAt date" },
      { status: 400 }
    );
  }

  const result = await createPurchase({
    userId: parsed.data.userId,
    description: parsed.data.description,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    status: parsed.data.status,
    method: parsed.data.method ?? null,
    invoiceNumber: parsed.data.invoiceNumber ?? null,
    paidAt,
    actorUserId: guard.user.id,
    ip: getClientIpFromReq(req),
  });
  if ("error" in result) {
    const status =
      result.error === "user_not_found" ? 404 :
      result.error === "invalid_amount" || result.error === "invalid_status" ? 400 :
      400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
