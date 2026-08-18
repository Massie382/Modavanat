/**
 * Admin bookmarks queries — server-side data-access layer for the
 * /admin/bookmarks management UI.
 *
 * Server-only. Caller is responsible for authorization (must be admin).
 */

import { db } from "@/db/client";
import { bookmarks, users, laws } from "@/db/schema";
import { eq, desc, ilike, or, sql, count } from "drizzle-orm";

export interface AdminBookmark {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  lawId: string;
  lawTitle: string;
  note: string | null;
  createdAt: string; // ISO
}

export interface BookmarkListResult {
  rows: AdminBookmark[];
  total: number;
}

export interface BookmarkListFilter {
  q?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated list of all bookmarks in the system, joined with the owning
 * user's email + name and the bookmarked law's title.
 *
 * Search (`q`) is ILIKE on user email + law title + law id + note.
 */
export async function listAllBookmarks(
  filter: BookmarkListFilter = {}
): Promise<BookmarkListResult> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filter.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const q = filter.q?.trim();

  const where = q
    ? or(
        ilike(users.email, `%${q}%`),
        ilike(laws.title, `%${q}%`),
        ilike(bookmarks.lawId, `%${q}%`),
        ilike(bookmarks.note, `%${q}%`)
      )
    : undefined;

  const rows = await db
    .select({
      id: bookmarks.id,
      userId: bookmarks.userId,
      userEmail: users.email,
      userName: users.name,
      lawId: bookmarks.lawId,
      lawTitle: laws.title,
      note: bookmarks.note,
      createdAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(users, eq(users.id, bookmarks.userId))
    .innerJoin(laws, eq(laws.id, bookmarks.lawId))
    .where(where ?? sql`true`)
    .orderBy(desc(bookmarks.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalRow = await db
    .select({ c: count() })
    .from(bookmarks)
    .innerJoin(users, eq(users.id, bookmarks.userId))
    .innerJoin(laws, eq(laws.id, bookmarks.lawId))
    .where(where ?? sql`true`);
  const total = Number(totalRow[0]?.c ?? 0);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      userName: r.userName,
      lawId: r.lawId,
      lawTitle: r.lawTitle,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}
