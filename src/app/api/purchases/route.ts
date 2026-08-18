/**
 * GET /api/purchases
 *
 * List the current user's purchases, newest first.
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { purchases } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserFromSession } from "@/lib/auth/session";

export async function GET() {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const rows = await db
    .select({
      id: purchases.id,
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
    .where(eq(purchases.userId, u.id))
    .orderBy(desc(purchases.createdAt));
  const out = rows.map((r) => ({
    ...r,
    paidAt: r.paidAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    date: (r.paidAt ?? r.createdAt).toISOString(), // UI uses `date`
  }));
  return NextResponse.json({ purchases: out });
}
