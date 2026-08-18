/**
 * Phase F smoke test — verify the Persian FTS migration + the new
 * search endpoint work end-to-end on the dev PGlite DB.
 *
 * What it does:
 *   1. Inserts a test law + a test article (both with the Persian
 *      word «مدنی» in their text).
 *   2. Verifies the `search_tsv` generated column is populated by
 *      selecting against it directly.
 *   3. Runs `plainto_tsquery('simple', 'مدنی')` against both the
 *      laws + articles tables and asserts non-empty hits with a
 *      non-zero `ts_rank` and a `<mark>`-wrapped `ts_headline`
 *      excerpt.
 *   4. Runs the same Stage 2 query the API route would run
 *      (articles joined with laws) and asserts the joined row
 *      shape.
 *   5. Cleans up the test rows.
 *
 * Usage:
 *   bun run scripts/test-search.ts
 *
 * NOTE: this script assumes migrations 0000–0003 have been applied.
 * If the DB is empty, run `bun run db:migrate` first.
 */

import "dotenv/config";
import { db } from "../src/db/client";
import {
  laws as lawsTable,
  articles as articlesTable,
} from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

// Helper to normalize Drizzle's union return type from `db.execute()`.
// PGlite returns a RowList (array); postgres-js returns a Results
// object with `.rows`. The `Array.isArray` check narrows at runtime.
function getRows<T>(result: T[] | { rows: T[] }): T[] {
  return Array.isArray(result) ? result : (result as { rows: T[] }).rows;
}

const TEST_LAW_ID = "test-search-fts-law";
const TEST_ARTICLE_ID = "test-search-fts-art-1";
const TEST_QUERY = "مدنی";

async function cleanup() {
  await db.delete(articlesTable).where(eq(articlesTable.id, TEST_ARTICLE_ID));
  await db.delete(lawsTable).where(eq(lawsTable.id, TEST_LAW_ID));
}

async function main() {
  console.log("=== Phase F: FTS smoke test ===\n");

  // ── Step 0: cleanup any leftover rows from a previous run ──────
  await cleanup();

  // ── Step 1: insert a test law + article ──────────────────────────
  console.log("Step 1 — inserting test law + article…");
  await db
    .insert(lawsTable)
    .values({
      id: TEST_LAW_ID,
      title: "قانون آزمایشی برای جستجوی مدنی",
      shortTitle: null,
      type: "قانون عادی",
      year: 1400,
      number: "۹۹۹۹۹",
      status: "in-force",
      extent: "کشوری",
      subject: "مدنی",
      promulgatingAuthority: "مجلس آزمایشی",
      approvedDate: "۱۴۰۰/۰۱/۰۱",
      effectiveDate: "۱۴۰۰/۰۱/۰۱",
      lastRevisionDate: "۱۴۰۰/۰۱/۰۱",
      description: "این قانون صرفاً برای آزمایش جستجوی متن کامل مدنی است.",
      longDescription:
        "توضیحات بلند برای آزمایش جستجوی مدنی در متن قانون.",
    })
    .onConflictDoUpdate({
      target: lawsTable.id,
      set: {
        title: "قانون آزمایشی برای جستجوی مدنی",
        subject: "مدنی",
        description:
          "این قانون صرفاً برای آزمایش جستجوی متن کامل مدنی است.",
        longDescription:
          "توضیحات بلند برای آزمایش جستجوی مدنی در متن قانون.",
        updatedAt: new Date(),
      },
    });

  await db
    .insert(articlesTable)
    .values({
      id: TEST_ARTICLE_ID,
      lawId: TEST_LAW_ID,
      tocNodeId: null,
      number: "ماده ۱",
      title: null,
      text: "هر قرارداد مدنی معتبر است مگر دلایل قانونی دیگری موجود باشد.",
      orderIndex: 0,
    })
    .onConflictDoUpdate({
      target: articlesTable.id,
      set: {
        text: "هر قرارداد مدنی معتبر است مگر دلایل قانونی دیگری موجود باشد.",
        updatedAt: new Date(),
      },
    });
  console.log("  ✓ inserted\n");

  // ── Step 2: verify the search_tsv generated column is populated ──
  console.log("Step 2 — verify search_tsv is populated on laws…");
  const lawTsv = getRows(await db.execute<{ search_tsv: string }>(sql`
    SELECT search_tsv::text
    FROM laws
    WHERE id = ${TEST_LAW_ID};
  `));
  const lawTsvText = lawTsv[0]?.search_tsv ?? "";
  if (!lawTsvText) {
    throw new Error("laws.search_tsv is empty — migration 0003 not applied?");
  }
  if (!lawTsvText.includes("مدنی")) {
    throw new Error(
      `laws.search_tsv doesn't contain "مدنی" — got: ${lawTsvText}`
    );
  }
  console.log(`  ✓ laws.search_tsv contains «مدنی» (length=${lawTsvText.length})`);

  const articleTsv = getRows(await db.execute<{ search_tsv: string }>(sql`
    SELECT search_tsv::text
    FROM articles
    WHERE id = ${TEST_ARTICLE_ID};
  `));
  const articleTsvText = articleTsv[0]?.search_tsv ?? "";
  if (!articleTsvText) {
    throw new Error("articles.search_tsv is empty — migration 0003 not applied?");
  }
  if (!articleTsvText.includes("مدنی")) {
    throw new Error(
      `articles.search_tsv doesn't contain "مدنی" — got: ${articleTsvText}`
    );
  }
  console.log(
    `  ✓ articles.search_tsv contains «مدنی» (length=${articleTsvText.length})\n`
  );

  // ── Step 3: Stage 1 query — laws-level FTS ───────────────────────
  console.log("Step 3 — Stage 1 (laws-level) FTS query…");
  const lawHits = getRows(await db.execute<{
    id: string;
    title: string;
    rank: string | number;
  }>(sql`
    SELECT
      id,
      title,
      ts_rank(search_tsv, plainto_tsquery('simple', ${TEST_QUERY})) AS rank
    FROM laws
    WHERE search_tsv @@ plainto_tsquery('simple', ${TEST_QUERY})
    ORDER BY rank DESC;
  `));
  const lawRows = lawHits;
  const testLawHit = lawRows.find((r) => r.id === TEST_LAW_ID);
  if (!testLawHit) {
    throw new Error(
      `Stage 1: test law not found in hits (got ${lawRows.length} hits total)`
    );
  }
  if (Number(testLawHit.rank) <= 0) {
    throw new Error(
      `Stage 1: test law rank should be > 0, got ${testLawHit.rank}`
    );
  }
  console.log(
    `  ✓ test law found in Stage 1 hits (rank=${testLawHit.rank}, total=${lawRows.length})\n`
  );

  // ── Step 4: Stage 2 query — article-level FTS + ts_headline ──────
  console.log("Step 4 — Stage 2 (article-level) FTS + ts_headline…");
  const articleHits = getRows(await db.execute<{
    id: string;
    law_id: string;
    law_title: string;
    number: string;
    excerpt: string;
    rank: string | number;
  }>(sql`
    SELECT
      a.id,
      a.law_id,
      l.title AS law_title,
      a.number,
      ts_headline(
        'simple',
        a.text,
        plainto_tsquery('simple', ${TEST_QUERY}),
        'MaxWords=35, MinWords=15, StartSel=<mark>, StopSel=</mark>'
      ) AS excerpt,
      ts_rank(a.search_tsv, plainto_tsquery('simple', ${TEST_QUERY})) AS rank
    FROM articles a
    JOIN laws l ON l.id = a.law_id
    WHERE a.search_tsv @@ plainto_tsquery('simple', ${TEST_QUERY})
    ORDER BY rank DESC;
  `));
  const articleRows = articleHits;
  const testArticleHit = articleRows.find((r) => r.id === TEST_ARTICLE_ID);
  if (!testArticleHit) {
    throw new Error(
      `Stage 2: test article not found in hits (got ${articleRows.length} hits total)`
    );
  }
  if (!testArticleHit.excerpt.includes("<mark>")) {
    throw new Error(
      `Stage 2: excerpt should contain <mark> tag, got: ${testArticleHit.excerpt}`
    );
  }
  if (!testArticleHit.excerpt.includes("مدنی")) {
    throw new Error(
      `Stage 2: excerpt should contain «مدنی», got: ${testArticleHit.excerpt}`
    );
  }
  console.log(
    `  ✓ test article found in Stage 2 hits (rank=${testArticleHit.rank})`
  );
  console.log(`  ✓ excerpt contains <mark>: ${testArticleHit.excerpt}\n`);

  // ── Step 5: cleanup ──────────────────────────────────────────────
  console.log("Step 5 — cleaning up test rows…");
  await cleanup();
  console.log("  ✓ cleaned up\n");

  console.log("✅ All Phase F FTS checks passed.");
  process.exit(0);
}

main().catch(async (err) => {
  console.error("FAILED:", err?.message ?? err);
  // Best-effort cleanup before exiting.
  try {
    await cleanup();
  } catch {}
  process.exit(1);
});
