/**
 * /api/bookmarks — user's saved-law list.
 *
 *   GET    /api/bookmarks           → list current user's bookmarks
 *   POST   /api/bookmarks           → add a bookmark
 *   DELETE /api/bookmarks?lawId=... → remove a bookmark
 *
 * All routes require an authenticated user (any role).
 */
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { bookmarks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getUserFromSession, getClientIpFromReq } from "@/lib/auth/session";
import { logAudit } from "@/lib/auth/audit";

const postSchema = z.object({
  lawId: z.string().trim().min(1).max(120),
  note: z.string().trim().max(2000).optional(),
});

export async function GET() {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const rows = await db
    .select({
      id: bookmarks.id,
      lawId: bookmarks.lawId,
      note: bookmarks.note,
      createdAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .where(eq(bookmarks.userId, u.id))
    .orderBy(bookmarks.createdAt);
  // Format createdAt as ISO for the client to format itself.
  const out = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
  return NextResponse.json({ bookmarks: out });
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
  const { lawId, note } = parsed.data;
  // Idempotent insert — if the (user_id, law_id) pair already exists,
  // we just update the note. We do this with an upsert via raw SQL on
  // the (user_id, law_id) pair; Drizzle doesn't have a composite
  // unique constraint pre-declared so we use onConflict do update with
  // the existing constraint name (bookmarks_pkey on id) — but that
  // wouldn't dedupe by (user,law). Easiest: select-then-update-or-insert.
  const existing = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, u.id), eq(bookmarks.lawId, lawId)))
    .limit(1);
  let id: string;
  if (existing.length > 0) {
    id = existing[0].id;
    await db
      .update(bookmarks)
      .set({ note: note ?? null })
      .where(eq(bookmarks.id, id));
  } else {
    id = crypto.randomUUID();
    await db.insert(bookmarks).values({
      id,
      userId: u.id,
      lawId,
      note: note ?? null,
    });
  }
  await logAudit({
    actorUserId: u.id,
    action: "user.bookmark.add",
    targetType: "law",
    targetId: lawId,
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true, id, lawId }, { status: 201 });
}

export async function DELETE(req: Request) {
  const u = await getUserFromSession();
  if (!u) {
    return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }
  const url = new URL(req.url);
  const lawId = url.searchParams.get("lawId");
  if (!lawId) {
    return NextResponse.json({ error: "lawId الزامی است." }, { status: 400 });
  }
  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, u.id), eq(bookmarks.lawId, lawId)));
  await logAudit({
    actorUserId: u.id,
    action: "user.bookmark.remove",
    targetType: "law",
    targetId: lawId,
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true });
}
