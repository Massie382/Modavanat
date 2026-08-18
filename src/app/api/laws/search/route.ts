/**
 * GET /api/laws/search?q=<query>&page=&pageSize=
 *
 * Real Persian full-text search across:
 *   - laws (title + subject + description + number + long_description)
 *   - articles (text + number + title)
 *
 * Uses Postgres `tsvector` generated columns + GIN indexes (see
 * drizzle/0003_search_tsv.sql) and the `'simple'` text-search config
 * (Postgres has no Persian dictionary — `simple` does whitespace +
 * punctuation tokenization, which is what we want for Persian).
 *
 * Two-stage query to keep response time bounded:
 *   Stage 1 (laws-level): SELECT from laws WHERE search_tsv matches,
 *     with a LATERAL join pulling the first matching article's
 *     `ts_headline` excerpt (so the UI can show WHY this law matched).
 *   Stage 2 (article-level, only when q contains digits OR «ماده»):
 *     SELECT from articles joined with laws, limit 10. These are
 *     surfaced as separate "matching articles" hits with deep-links
 *     to /law/[lawId]?article=[id].
 *
 * Always returns 200. Empty / whitespace-only query returns
 * `{ laws: [], articles: [], total: 0 }`.
 *
 * Cache: `public, max-age=10, s-maxage=60` — short browser cache,
 * longer CDN cache, since law content rarely changes.
 *
 * Drizzle doesn't yet have an FTS API, so we use `db.execute(sql\`...\`)`
 * with raw SQL. Parameters (`${q}`, `${pageSize}`, `${offset}`) are
 * bound safely by Drizzle — never string-interpolated raw.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import type {
  LawSearchHit,
  ArticleSearchHit,
  SearchResponse,
  LawStatus,
  LawType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
const ARTICLE_HIT_LIMIT = 10;

// Heuristic: should Stage 2 run (article-level FTS)?
//
// Runs only when the query looks like it's targeting a specific
// article — i.e. contains digits (ASCII or Persian) OR the literal
// word «ماده». This keeps the cheap title-only search fast for the
// common case where the user is just typing a law's name.
function shouldSearchArticles(q: string): boolean {
  if (!q) return false;
  if (q.includes("ماده")) return true;
  // Persian digits U+06F0..U+06F9 OR ASCII digits 0-9.
  return /[\d\u06f0-\u06f9]/.test(q);
}

// Validate the page/pageSize URL params. Returns sanitized integers.
function parsePaging(
  rawPage: string | null,
  rawPageSize: string | null
): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(rawPageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
    )
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// ─── SQL fragments ────────────────────────────────────────────────────
//
// We build the raw SQL with `sql\`...\`` template literals so Drizzle
// parameterizes every `${value}` safely. Note that Drizzle emits a
// fresh bind parameter for every `${value}` occurrence — so the query
// text below has $1, $2, $3, … bound in order of interpolation.

// `ts_headline` options shared between Stage 1's excerpt subquery and
// Stage 2. Kept as a string literal (no parameter binding) because
// `ts_headline`'s 4th argument is a fixed-format options string, not
// a parameterizable value.
const HEADLINE_OPTS =
  "MaxWords=35, MinWords=15, StartSel=<mark>, StopSel=</mark>, HighlightAll=true";

// Helper to normalize Drizzle's union return type from `db.execute()`.
//
// Drizzle's typings for the union PGlite + postgres-js drivers return
// either `Results<T>` (postgres-js, which has `.rows: T[]`) OR
// `RowList<T[]>` (PGlite, where the result IS the row array). The
// `Array.isArray` check narrows the union at runtime.
function getRows<T>(result: T[] | { rows: T[] }): T[] {
  return Array.isArray(result) ? result : (result as { rows: T[] }).rows;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const { pageSize, offset } = parsePaging(
    sp.get("page"),
    sp.get("pageSize")
  );

  // Short browser cache, longer CDN cache — law content rarely changes.
  const headers = { "Cache-Control": "public, max-age=10, s-maxage=60" };

  if (!q) {
    return NextResponse.json(
      { laws: [], articles: [], total: 0 } satisfies SearchResponse,
      { headers }
    );
  }

  try {
    // ── Stage 1 — laws-level FTS ────────────────────────────────────────
    //
    // For each law hit, also pull the first matching article's
    // ts_headline excerpt via a LATERAL join so the UI can show WHY
    // this law matched. If no article in this law matches the query,
    // the excerpt is NULL — the UI then falls back to the law's own
    // description.
    const lawRows = getRows(await db.execute<{
      id: string;
      title: string;
      subject: string;
      year: number;
      status: string;
      type: string;
      number: string | null;
      rank: string | number;
      excerpt: string | null;
    }>(sql`
      SELECT
        l.id,
        l.title,
        l.subject,
        l.year,
        l.status::text  AS status,
        l.type::text    AS type,
        l.number,
        ts_rank(l.search_tsv, plainto_tsquery('simple', ${q})) AS rank,
        fa.excerpt
      FROM laws l
      LEFT JOIN LATERAL (
        SELECT
          ts_headline(
            'simple',
            a.text,
            plainto_tsquery('simple', ${q}),
            ${HEADLINE_OPTS}
          ) AS excerpt
        FROM articles a
        WHERE a.law_id = l.id
          AND a.search_tsv @@ plainto_tsquery('simple', ${q})
        ORDER BY ts_rank(a.search_tsv, plainto_tsquery('simple', ${q})) DESC
        LIMIT 1
      ) fa ON true
      WHERE l.search_tsv @@ plainto_tsquery('simple', ${q})
      ORDER BY ts_rank(l.search_tsv, plainto_tsquery('simple', ${q})) DESC
      LIMIT ${pageSize}
      OFFSET ${offset};
    `));

    const laws: LawSearchHit[] = lawRows.map((r) => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      year: r.year,
      status: r.status as LawStatus,
      type: r.type as LawType,
      number: r.number ?? undefined,
      rank: Number(r.rank),
      excerpt: r.excerpt,
    }));

    // ── Stage 2 — article-level FTS (conditional) ───────────────────────
    let articles: ArticleSearchHit[] = [];
    if (shouldSearchArticles(q)) {
      const articleRows = getRows(await db.execute<{
        id: string;
        law_id: string;
        law_title: string;
        number: string;
        text: string;
        excerpt: string;
        rank: string | number;
      }>(sql`
        SELECT
          a.id,
          a.law_id,
          l.title AS law_title,
          a.number,
          a.text,
          ts_headline(
            'simple',
            a.text,
            plainto_tsquery('simple', ${q}),
            ${HEADLINE_OPTS}
          ) AS excerpt,
          ts_rank(a.search_tsv, plainto_tsquery('simple', ${q})) AS rank
        FROM articles a
        JOIN laws l ON l.id = a.law_id
        WHERE a.search_tsv @@ plainto_tsquery('simple', ${q})
        ORDER BY ts_rank(a.search_tsv, plainto_tsquery('simple', ${q})) DESC
        LIMIT ${ARTICLE_HIT_LIMIT};
      `));
      articles = articleRows.map((r) => ({
        id: r.id,
        lawId: r.law_id,
        lawTitle: r.law_title,
        label: r.number,
        text: r.text,
        excerpt: r.excerpt,
        rank: Number(r.rank),
      }));
    }

    // ── Total — count of laws matching Stage 1 ──────────────────────────
    //
    // Articles are surfaced as a separate "matching articles" section,
    // not as additional pages of the laws list, so the pager only
    // reflects law hits.
    const totalRowData = getRows(await db.execute<{ c: number }>(sql`
      SELECT count(*)::int AS c
      FROM laws
      WHERE search_tsv @@ plainto_tsquery('simple', ${q});
    `));
    const total = Number(totalRowData[0]?.c ?? 0);

    return NextResponse.json(
      { laws, articles, total } satisfies SearchResponse,
      { headers }
    );
  } catch (err) {
    console.error("[/api/laws/search] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: "Search failed" },
      { status: 500 }
    );
  }
}
