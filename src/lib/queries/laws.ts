/**
 * Data-access layer — single server-side source of truth for reading
 * law content from the database.
 *
 * All frontend code (server components, API routes, server actions)
 * MUST import from here instead of `@/data/laws`. The static
 * `src/data/laws.ts` file remains only as a seed source for dev mode
 * (when the DB is empty, scripts/seed-db.ts populates it from there).
 *
 * Functions exposed:
 *   - getLaws()              → Law[] (full nested shape, all laws)
 *   - getLawCardList()       → Law[] (metadata only — cheap list)
 *   - getLawById(id)         → Law | undefined (full nested shape)
 *   - getDecadeStats()       → DecadeStat[] (for browse histogram)
 *   - searchLaws(query)      → Law[] (ILIKE on title/subject/number/desc)
 *   - getReferencedLawTitles() → Record<id, {title, year}>
 *
 * All public functions include a dev-mode fallback to the static
 * `src/data/laws.ts` data so the site renders even before the DB is
 * seeded. In production the fallback is skipped — the DB MUST be
 * populated via `scripts/import-laws.ts` before the app is started.
 */

import { db } from "@/db/client";
import {
  laws as lawsTable,
  articles as articlesTable,
  commentaryItems as commentaryTable,
  tocNodes as tocNodesTable,
  amendments as amendmentsTable,
  diffSegments as diffSegmentsTable,
  outstandingChanges as outstandingChangesTable,
  references as referencesTable,
} from "@/db/schema";
import { eq, asc, inArray, sql } from "drizzle-orm";
import type {
  Law,
  ArticleNode,
  TOCItem,
  AmendmentEvent,
  OutstandingChange,
  ReferenceRelation,
  CommentaryItem,
  ProvisionRef,
  DiffSegment,
  DecadeStat,
} from "@/lib/types";

// ─── Internal row → domain-object mappers ───────────────────────────

function rowToProvisionRef(row: {
  affectingLawId?: string | null;
  affectingLawTitle: string;
  affectingLawYear: number;
  affectingLawNumber?: string | null;
  affectingLawProvisionLabel?: string | null;
}): ProvisionRef {
  return {
    lawId: row.affectingLawId ?? "",
    title: row.affectingLawTitle,
    year: row.affectingLawYear,
    number: row.affectingLawNumber ?? undefined,
    provisionLabel: row.affectingLawProvisionLabel ?? undefined,
  };
}

function rowToCommentary(
  row: typeof commentaryTable.$inferSelect
): CommentaryItem {
  return {
    marker: row.marker,
    effectType: row.effectType as CommentaryItem["effectType"],
    date: row.date,
    affectingLaw: {
      lawId: row.affectingLawId ?? "",
      title: row.affectingLawTitle,
      year: row.affectingLawYear,
      number: row.affectingLawNumber ?? undefined,
      provisionLabel: row.affectingLawProvisionLabel ?? undefined,
    },
    text: row.text,
  };
}

/**
 * Build the 4-level TOC tree (کتاب → فصل → باب → مبحث) from a flat
 * list of toc_node rows.
 *
 * Articles are NOT in this tree — they're attached to a مبحث via
 * `toc_node_id`, and the مبحث leaf carries `articleIds` so the
 * content tab knows which articles belong to it.
 */
function buildTocTree(
  nodes: (typeof tocNodesTable.$inferSelect)[],
  articlesByTocNode: Map<string, string[]>
): TOCItem[] {
  const nodeById = new Map<string, typeof tocNodesTable.$inferSelect>();
  for (const n of nodes) nodeById.set(n.id, n);

  const map = new Map<string, TOCItem>();
  for (const n of nodes) {
    map.set(n.id, {
      id: n.id,
      label: n.label,
      title: n.title ?? undefined,
      type: n.type as TOCItem["type"],
      children: [],
      articleIds: articlesByTocNode.get(n.id) ?? [],
    });
  }
  const roots: TOCItem[] = [];
  for (const n of nodes) {
    const item = map.get(n.id)!;
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children!.push(item);
    } else {
      roots.push(item);
    }
  }
  const sortRecursive = (items: TOCItem[]) => {
    items.sort((a, b) => {
      const aIdx = nodeById.get(a.id)?.orderIndex ?? 0;
      const bIdx = nodeById.get(b.id)?.orderIndex ?? 0;
      return aIdx - bIdx;
    });
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        sortRecursive(item.children);
      }
    }
  };
  sortRecursive(roots);
  return roots;
}

/**
 * Build the article list (مواد) for a law, ordered by `order_index`.
 * Each article carries its inline commentary items, ordered.
 */
function buildArticleList(
  articles: (typeof articlesTable.$inferSelect)[],
  commentaryByArticle: Map<string, CommentaryItem[]>
): ArticleNode[] {
  return articles
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((a) => ({
      id: a.id,
      number: a.number,
      title: a.title ?? undefined,
      text: a.text,
      commentary: commentaryByArticle.get(a.id) ?? [],
    }));
}

function buildAmendments(
  rows: (typeof amendmentsTable.$inferSelect)[],
  diffByAmendment: Map<string, DiffSegment[]>
): AmendmentEvent[] {
  return rows.map((row) => ({
    date: row.date,
    dateLabel: row.dateLabel,
    effectType: row.effectType as AmendmentEvent["effectType"],
    affectedProvision: row.affectedProvision,
    affectedProvisionId: row.affectedProvisionId ?? undefined,
    affectingLaw: rowToProvisionRef(row),
    description: row.description,
    appliedToText: row.appliedToText,
    note: row.note ?? undefined,
    beforeText: row.beforeText ?? undefined,
    afterText: row.afterText ?? undefined,
    diffSegments: diffByAmendment.get(row.id),
  }));
}

// ─── DB-backed (raw) implementations ────────────────────────────────

async function getLawByIdRaw(id: string): Promise<Law | undefined> {
  const lawRows = await db
    .select()
    .from(lawsTable)
    .where(eq(lawsTable.id, id))
    .limit(1);
  const lawRow = lawRows[0];
  if (!lawRow) return undefined;

  const [tocRows, articleRows, amendmentRows, outstandingRows, referenceRows] =
    await Promise.all([
      db.select().from(tocNodesTable).where(eq(tocNodesTable.lawId, id)),
      db.select().from(articlesTable).where(eq(articlesTable.lawId, id)),
      db.select().from(amendmentsTable).where(eq(amendmentsTable.lawId, id)),
      db.select().from(outstandingChangesTable).where(eq(outstandingChangesTable.lawId, id)),
      db.select().from(referencesTable).where(eq(referencesTable.sourceLawId, id)),
    ]);

  // Article IDs → used to fetch commentary + group by tocNodeId.
  const articleIds = articleRows.map((a) => a.id);
  const commentaryRows = articleIds.length
    ? await db
        .select()
        .from(commentaryTable)
        .where(inArray(commentaryTable.articleId, articleIds))
    : [];

  const commentaryByArticle = new Map<string, CommentaryItem[]>();
  for (const c of commentaryRows) {
    const arr = commentaryByArticle.get(c.articleId) ?? [];
    arr.push(rowToCommentary(c));
    commentaryByArticle.set(c.articleId, arr);
  }

  const articlesByTocNode = new Map<string, string[]>();
  for (const a of articleRows) {
    if (!a.tocNodeId) continue;
    const arr = articlesByTocNode.get(a.tocNodeId) ?? [];
    arr.push(a.id);
    articlesByTocNode.set(a.tocNodeId, arr);
  }

  // Amendment IDs → used to fetch diff segments.
  const amendmentIds = amendmentRows.map((a) => a.id);
  const diffRows = amendmentIds.length
    ? await db
        .select()
        .from(diffSegmentsTable)
        .where(inArray(diffSegmentsTable.amendmentId, amendmentIds))
    : [];
  const diffByAmendment = new Map<string, DiffSegment[]>();
  for (const d of diffRows) {
    const arr = diffByAmendment.get(d.amendmentId) ?? [];
    arr.push({ type: d.segmentType as DiffSegment["type"], text: d.text });
    diffByAmendment.set(d.amendmentId, arr);
  }

  const toc = buildTocTree(tocRows, articlesByTocNode);
  const articles = buildArticleList(articleRows, commentaryByArticle);
  const amendments = buildAmendments(amendmentRows, diffByAmendment);

  const outstandingChanges: OutstandingChange[] = outstandingRows.map((r) => ({
    affectedProvision: r.affectedProvision,
    effectType: r.effectType as OutstandingChange["effectType"],
    affectingLaw: rowToProvisionRef(r),
    description: r.description,
    expectedDate: r.expectedDate ?? undefined,
  }));

  const references: ReferenceRelation[] = referenceRows.map((r) => ({
    direction: r.direction as ReferenceRelation["direction"],
    target: {
      lawId: r.targetLawId ?? "",
      title: r.targetTitle,
      year: r.targetYear,
      number: r.targetNumber ?? undefined,
      provisionLabel: r.targetProvisionLabel ?? undefined,
    },
    context: r.context,
    sourceProvision: r.sourceProvision ?? undefined,
    targetProvision: r.targetProvision ?? undefined,
  }));

  return {
    id: lawRow.id,
    title: lawRow.title,
    shortTitle: lawRow.shortTitle ?? undefined,
    type: lawRow.type as Law["type"],
    year: lawRow.year,
    number: lawRow.number ?? undefined,
    status: lawRow.status as Law["status"],
    extent: lawRow.extent,
    subject: lawRow.subject,
    promulgatingAuthority: lawRow.promulgatingAuthority,
    approvedDate: lawRow.approvedDate,
    effectiveDate: lawRow.effectiveDate,
    lastRevisionDate: lawRow.lastRevisionDate,
    description: lawRow.description,
    longDescription: lawRow.longDescription ?? undefined,
    toc,
    articles,
    amendments,
    outstandingChanges,
    references,
    originalVersion: lawRow.originalApprovedDate
      ? {
          approvedDate: lawRow.originalApprovedDate,
          description: lawRow.originalDescription ?? "",
        }
      : undefined,
  };
}

async function getLawsRaw(): Promise<Law[]> {
  const lawRows = await db
    .select()
    .from(lawsTable)
    .orderBy(asc(lawsTable.year));
  const laws: Law[] = [];
  for (const row of lawRows) {
    const law = await getLawByIdRaw(row.id);
    if (law) laws.push(law);
  }
  return laws;
}

function toCard(row: typeof lawsTable.$inferSelect): Law {
  return {
    id: row.id,
    title: row.title,
    shortTitle: row.shortTitle ?? undefined,
    type: row.type as Law["type"],
    year: row.year,
    number: row.number ?? undefined,
    status: row.status as Law["status"],
    extent: row.extent,
    subject: row.subject,
    promulgatingAuthority: row.promulgatingAuthority,
    approvedDate: row.approvedDate,
    effectiveDate: row.effectiveDate,
    lastRevisionDate: row.lastRevisionDate,
    description: row.description,
    longDescription: row.longDescription ?? undefined,
    toc: [],
    articles: [],
    amendments: [],
    outstandingChanges: [],
    references: [],
    originalVersion: row.originalApprovedDate
      ? {
          approvedDate: row.originalApprovedDate,
          description: row.originalDescription ?? "",
        }
      : undefined,
  };
}

async function getLawCardListRaw(): Promise<Law[]> {
  const rows = await db.select().from(lawsTable).orderBy(asc(lawsTable.year));
  return rows.map(toCard);
}

async function getDecadeStatsRaw(): Promise<DecadeStat[]> {
  const rows = await db
    .select({ year: lawsTable.year })
    .from(lawsTable)
    .orderBy(asc(lawsTable.year));
  const byDecade = new Map<string, Map<number, number>>();
  for (const row of rows) {
    const decadeStart = Math.floor(row.year / 10) * 10;
    const decadeLabel = `${decadeStart}-${decadeStart + 9}`;
    const decade = byDecade.get(decadeLabel) ?? new Map<number, number>();
    decade.set(row.year, (decade.get(row.year) ?? 0) + 1);
    byDecade.set(decadeLabel, decade);
  }
  const result: DecadeStat[] = [];
  for (const [decade, yearMap] of byDecade) {
    const counts = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    result.push({ decade, counts });
  }
  return result.sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
}

async function searchLawsRaw(query: string): Promise<Law[]> {
  const q = query.trim();
  if (!q) return getLawCardListRaw();
  // Phase F: real Persian full-text search via the `search_tsv`
  // GENERATED column + GIN index (see drizzle/0003_search_tsv.sql).
  //
  // Uses `plainto_tsquery('simple', $q)` so multi-word queries are
  // AND-ed together (the standard search UX expectation). We use the
  // 'simple' text-search config because Postgres doesn't ship a
  // Persian dictionary — `simple` does whitespace + punctuation
  // tokenization (no stemming, no stop-word removal), which is what
  // we want for Persian: stemming would actually hurt because
  // Persian prefixes/suffixes aren't recognized by the default
  // stemmers.
  //
  // Ranked by `ts_rank` (descending), with year ascending as a
  // tie-breaker so older laws surface first when scores are equal.
  //
  // Drizzle's query builder accepts raw `sql\`...\`` fragments in
  // `.where()` and `.orderBy()`, so we can reference the generated
  // column even though it isn't declared in our Drizzle schema.
  const rows = await db
    .select()
    .from(lawsTable)
    .where(sql`search_tsv @@ plainto_tsquery('simple', ${q})`)
    .orderBy(
      sql`ts_rank(search_tsv, plainto_tsquery('simple', ${q})) DESC`,
      asc(lawsTable.year)
    );
  return rows.map(toCard);
}

async function getReferencedLawTitlesRaw(): Promise<
  Record<string, { title: string; year: number }>
> {
  const refs = await db
    .select({
      id: referencesTable.targetLawId,
      title: referencesTable.targetTitle,
      year: referencesTable.targetYear,
    })
    .from(referencesTable);
  const out: Record<string, { title: string; year: number }> = {};
  for (const r of refs) {
    const key = r.id ?? `${r.title}-${r.year}`;
    if (!out[key]) out[key] = { title: r.title, year: r.year };
  }
  const allLaws = await db
    .select({ id: lawsTable.id, title: lawsTable.title, year: lawsTable.year })
    .from(lawsTable);
  for (const l of allLaws) {
    if (!out[l.id]) out[l.id] = { title: l.title, year: l.year };
  }
  return out;
}

// ─── Dev-mode fallback ──────────────────────────────────────────────
//
// In dev mode (PGlite, no DATABASE_URL), if the DB hasn't been seeded
// yet, we fall back to the static `src/data/laws.ts` so the site still
// renders. This makes local development zero-config: just `bun dev`,
// no need to run a seed script first.
//
// In production, the fallback is skipped — the DB MUST be populated
// (via import-laws.ts) before the app is started.

let _devFallbackChecked = false;
let _useDevFallback = false;

async function shouldUseDevFallback(): Promise<boolean> {
  // Use the dev fallback (read from src/data/laws.ts) whenever:
  //   - We're in dev mode (NODE_ENV !== "production"), OR
  //   - There's no DATABASE_URL configured (so no real Postgres to hit)
  //     AND we're not in a production RUNTIME (i.e. we're in a build
  //     phase where PGlite isn't safe to initialize).
  //
  // The third case is critical: `next build` sets NODE_ENV=production
  // even at build time, but during the build there's no actual HTTP
  // request happening, so PGlite initialization via process.cwd()
  // resolves to a different path than what the dev server uses, and
  // there's no DATABASE_URL either. Falling back to the static data
  // file during build is safe — the static data shape mirrors the DB
  // schema exactly (see scripts/seed-db.ts).
  if (!process.env.DATABASE_URL) return true;
  if (process.env.NODE_ENV !== "production") return true;
  if (_devFallbackChecked) return _useDevFallback;
  _devFallbackChecked = true;
  try {
    const rows = await db.select().from(lawsTable).limit(1);
    _useDevFallback = rows.length === 0;
  } catch {
    // DB unreachable — fall back to static data.
    _useDevFallback = true;
  }
  return _useDevFallback;
}

// ─── Public API (with dev fallback) ──────────────────────────────────

export async function getLawById(id: string): Promise<Law | undefined> {
  if (await shouldUseDevFallback()) {
    const { getLawById: staticGet } = await import("@/data/laws");
    return staticGet(id);
  }
  return getLawByIdRaw(id);
}

export async function getLaws(): Promise<Law[]> {
  if (await shouldUseDevFallback()) {
    const { laws } = await import("@/data/laws");
    return laws;
  }
  return getLawsRaw();
}

export async function getLawCardList(): Promise<Law[]> {
  if (await shouldUseDevFallback()) {
    const { laws } = await import("@/data/laws");
    return laws;
  }
  return getLawCardListRaw();
}

export async function getDecadeStats(): Promise<DecadeStat[]> {
  if (await shouldUseDevFallback()) {
    const { decadeStats } = await import("@/data/laws");
    return decadeStats;
  }
  return getDecadeStatsRaw();
}

export async function searchLaws(query: string): Promise<Law[]> {
  if (await shouldUseDevFallback()) {
    const { laws } = await import("@/data/laws");
    if (!query.trim()) return laws;
    const q = query.trim().toLowerCase();
    return laws.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.subject.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.number?.toLowerCase().includes(q) ?? false)
    );
  }
  return searchLawsRaw(query);
}

export async function getReferencedLawTitles(): Promise<
  Record<string, { title: string; year: number }>
> {
  if (await shouldUseDevFallback()) {
    const { referencedLawTitles } = await import("@/data/laws");
    return referencedLawTitles;
  }
  return getReferencedLawTitlesRaw();
}
