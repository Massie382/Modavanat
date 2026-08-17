/**
 * Seed DB — populates the dev (PGlite) or prod (postgres) database from
 * the static `src/data/laws.ts` file.
 *
 * Usage:
 *   bun run scripts/seed-db.ts [--reset]
 *
 * Behavior:
 *   - Reads the `laws` array from `src/data/laws.ts`.
 *   - For each law: upserts laws, toc_nodes, articles, commentary_items,
 *     amendments, diff_segments, outstanding_changes, references.
 *   - Idempotent: re-running updates in place (uses each row's `id`
 *     as the natural key, with on-conflict-update).
 *   - `--reset`: drops all data first (truncates every table). Useful
 *     for clean dev re-imports when the static data shape changes.
 *
 * This script is INTENDED for dev mode (PGlite). For prod, use
 * `scripts/import-laws.ts` with properly authored JSON Law Import
 * Files from `laws-import/` instead.
 */

import "dotenv/config";
import { db } from "../src/db/client";
import {
  laws,
  tocNodes,
  articles,
  commentaryItems,
  amendments,
  diffSegments,
  outstandingChanges,
  references,
} from "../src/db/schema";
import { sql, inArray } from "drizzle-orm";
import { laws as lawData } from "../src/data/laws";
import type { Law, TOCItem, AmendmentEvent, CommentaryItem, ReferenceRelation, OutstandingChange } from "../src/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────

// Set of all law IDs we're about to seed. Cross-references to laws NOT
// in this set get null'd out — the denormalized title/year on the row
// takes over so the UI still renders the reference correctly.
const knownLawIds = new Set<string>();
for (const l of lawData) {
  if (l.id) knownLawIds.add(l.id);
}
function resolveLawId(id: string | undefined): string | null {
  if (!id) return null;
  return knownLawIds.has(id) ? id : null;
}

// Flatten a TOC tree into (node, parentId) tuples in DFS order.
function flattenToc(
  nodes: TOCItem[],
  parentId: string | null,
  defaultOrder: { counter: number }
): { node: TOCItem; parentId: string | null; orderIndex: number }[] {
  const out: { node: TOCItem; parentId: string | null; orderIndex: number }[] = [];
  for (const n of nodes) {
    const orderIndex = defaultOrder.counter++;
    out.push({ node: n, parentId, orderIndex });
    if (n.children && n.children.length > 0) {
      out.push(...flattenToc(n.children, n.id, defaultOrder));
    }
  }
  return out;
}

async function upsertLaw(law: Law) {
  await db
    .insert(laws)
    .values({
      id: law.id,
      title: law.title,
      shortTitle: law.shortTitle,
      type: law.type,
      year: law.year,
      number: law.number,
      status: law.status,
      extent: law.extent,
      subject: law.subject,
      promulgatingAuthority: law.promulgatingAuthority,
      approvedDate: law.approvedDate,
      effectiveDate: law.effectiveDate,
      lastRevisionDate: law.lastRevisionDate,
      description: law.description,
      longDescription: law.longDescription,
      originalApprovedDate: law.originalVersion?.approvedDate,
      originalDescription: law.originalVersion?.description,
    })
    .onConflictDoUpdate({
      target: laws.id,
      set: {
        title: law.title,
        shortTitle: law.shortTitle,
        type: law.type,
        year: law.year,
        number: law.number,
        status: law.status,
        extent: law.extent,
        subject: law.subject,
        promulgatingAuthority: law.promulgatingAuthority,
        approvedDate: law.approvedDate,
        effectiveDate: law.effectiveDate,
        lastRevisionDate: law.lastRevisionDate,
        description: law.description,
        longDescription: law.longDescription,
        originalApprovedDate: law.originalVersion?.approvedDate,
        originalDescription: law.originalVersion?.description,
        updatedAt: new Date(),
      },
    });
}

async function upsertTocTree(law: Law) {
  // Wipe existing TOC nodes for this law (cascade takes children).
  await db.delete(tocNodes).where(sql`${tocNodes.lawId} = ${law.id}`);

  const flat = flattenToc(law.toc, null, { counter: 0 });
  if (flat.length === 0) return;

  for (const { node, parentId, orderIndex } of flat) {
    await db.insert(tocNodes).values({
      id: node.id,
      lawId: law.id,
      parentId,
      type: node.type,
      label: node.label,
      title: node.title,
      orderIndex,
    });
  }

  // Resolve article ↔ topic linkage: for each topic node, set
  // articles.toc_node_id for the IDs in articleIds.
  for (const { node } of flat) {
    if (node.type !== "topic" || !node.articleIds || node.articleIds.length === 0) {
      continue;
    }
    await db
      .update(articles)
      .set({ tocNodeId: node.id })
      .where(inArray(articles.id, node.articleIds));
  }
}

async function upsertArticles(law: Law) {
  // Wipe existing articles for this law (cascade takes commentary).
  await db.delete(articles).where(sql`${articles.lawId} = ${law.id}`);

  for (let i = 0; i < law.articles.length; i++) {
    const a = law.articles[i];
    await db.insert(articles).values({
      id: a.id,
      lawId: law.id,
      tocNodeId: undefined, // gets set by upsertTocTree pass
      number: a.number,
      title: a.title,
      text: a.text,
      orderIndex: i,
    });

    // Commentary items
    if (a.commentary && a.commentary.length > 0) {
      for (let j = 0; j < a.commentary.length; j++) {
        const c: CommentaryItem = a.commentary[j];
        await db.insert(commentaryItems).values({
          id: `${a.id}/com/${j}`,
          articleId: a.id,
          marker: c.marker,
          effectType: c.effectType,
          date: c.date,
          affectingLawId: resolveLawId(c.affectingLaw.lawId),
          affectingLawTitle: c.affectingLaw.title,
          affectingLawYear: c.affectingLaw.year,
          affectingLawNumber: c.affectingLaw.number,
          affectingLawProvisionLabel: c.affectingLaw.provisionLabel,
          text: c.text,
          orderIndex: j,
        });
      }
    }
  }
}

async function upsertAmendments(law: Law) {
  if (law.amendments.length === 0) return;
  // Wipe existing amendments (cascade takes diff_segments).
  await db.delete(amendments).where(sql`${amendments.lawId} = ${law.id}`);

  for (let i = 0; i < law.amendments.length; i++) {
    const a: AmendmentEvent = law.amendments[i];
    const amendmentId = `${law.id}/amd/${i}`;
    await db.insert(amendments).values({
      id: amendmentId,
      lawId: law.id,
      date: a.date,
      dateLabel: a.dateLabel,
      effectType: a.effectType,
      affectedProvision: a.affectedProvision,
      affectedProvisionId: a.affectedProvisionId,
      affectingLawId: resolveLawId(a.affectingLaw.lawId),
      affectingLawTitle: a.affectingLaw.title,
      affectingLawYear: a.affectingLaw.year,
      affectingLawNumber: a.affectingLaw.number,
      affectingLawProvisionLabel: a.affectingLaw.provisionLabel,
      description: a.description,
      appliedToText: a.appliedToText,
      note: a.note,
      beforeText: a.beforeText,
      afterText: a.afterText,
    });

    // Optional pre-computed diff segments
    if (a.diffSegments && a.diffSegments.length > 0) {
      for (let j = 0; j < a.diffSegments.length; j++) {
        const s = a.diffSegments[j];
        await db.insert(diffSegments).values({
          id: `${amendmentId}/seg/${j}`,
          amendmentId,
          segmentType: s.type,
          text: s.text,
          orderIndex: j,
        });
      }
    }
  }
}

async function upsertOutstandingChanges(law: Law) {
  if (law.outstandingChanges.length === 0) return;
  await db.delete(outstandingChanges).where(sql`${outstandingChanges.lawId} = ${law.id}`);

  for (let i = 0; i < law.outstandingChanges.length; i++) {
    const o: OutstandingChange = law.outstandingChanges[i];
    await db.insert(outstandingChanges).values({
      id: `${law.id}/oc/${i}`,
      lawId: law.id,
      affectedProvision: o.affectedProvision,
      effectType: o.effectType,
      affectingLawId: resolveLawId(o.affectingLaw.lawId),
      affectingLawTitle: o.affectingLaw.title,
      affectingLawYear: o.affectingLaw.year,
      affectingLawNumber: o.affectingLaw.number,
      description: o.description,
      expectedDate: o.expectedDate,
    });
  }
}

async function upsertReferences(law: Law) {
  if (law.references.length === 0) return;
  await db.delete(references).where(sql`${references.sourceLawId} = ${law.id}`);

  for (let i = 0; i < law.references.length; i++) {
    const r: ReferenceRelation = law.references[i];
    await db.insert(references).values({
      id: `${law.id}/ref/${i}`,
      sourceLawId: law.id,
      targetLawId: resolveLawId(r.target.lawId),
      direction: r.direction,
      targetTitle: r.target.title,
      targetYear: r.target.year,
      targetNumber: r.target.number,
      targetProvisionLabel: r.target.provisionLabel,
      sourceProvision: r.sourceProvision,
      targetProvision: r.targetProvision,
      context: r.context,
    });
  }
}

async function resetDb() {
  console.log("⚠ Resetting DB — truncating all tables…");
  // Truncate in dependency order (children before parents).
  await db.delete(diffSegments);
  await db.delete(commentaryItems);
  await db.delete(references);
  await db.delete(outstandingChanges);
  await db.delete(amendments);
  await db.delete(articles);
  await db.delete(tocNodes);
  await db.delete(laws);
  // Truncate auth tables too so admin/users reset as well.
  const { users, accounts, sessions, verificationTokens } = await import("../src/db/schema");
  await db.delete(verificationTokens);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(users);
  console.log("   ✓ All tables truncated\n");
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--reset")) {
    await resetDb();
  }

  console.log(`Seeding ${lawData.length} laws from src/data/laws.ts…\n`);

  // ── Pass 1: insert all law rows (just metadata) ────────────────────
  // Pass 1 inserts ONLY the laws table rows. This ensures every law ID
  // exists in the DB before we insert any child row that might FK to
  // it (commentary_items.affecting_law_id, amendments.affecting_law_id,
  // references.target_law_id, etc.).
  console.log("── Pass 1: laws (metadata only) ───────────────────────────");
  let lawsOk = 0;
  let lawsSkipped = 0;
  for (const law of lawData) {
    if (!law.id) {
      console.warn(`⚠ Law without id — skipping:`, law.title);
      lawsSkipped++;
      continue;
    }
    try {
      await upsertLaw(law);
      lawsOk++;
    } catch (err) {
      console.error(`✗ Pass 1 ERROR on ${law.id}:`, err);
      lawsSkipped++;
    }
  }
  console.log(`   ${lawsOk} laws inserted, ${lawsSkipped} skipped\n`);

  // ── Pass 2: TOC + articles + commentary ────────────────────────────
  // All laws exist now, so FK references to affecting_law_id resolve.
  console.log("── Pass 2: TOC + articles + commentary ──────────────────");
  for (const law of lawData) {
    if (!law.id) continue;
    process.stdout.write(`• ${law.id}… `);
    try {
      await upsertArticles(law);
      await upsertTocTree(law); // also sets articles.toc_node_id
      console.log(`✓ (${law.articles.length} articles, ${law.toc.length} TOC roots)`);
    } catch (err) {
      console.error(`\n  Pass 2 ERROR on ${law.id}:`, err);
    }
  }

  // ── Pass 3: amendments + outstanding + references ─────────────────
  // Articles exist now, so amendments.affectedProvisionId resolves.
  console.log("\n── Pass 3: amendments + outstanding + references ──────────");
  for (const law of lawData) {
    if (!law.id) continue;
    process.stdout.write(`• ${law.id}… `);
    try {
      await upsertAmendments(law);
      await upsertOutstandingChanges(law);
      await upsertReferences(law);
      console.log(
        `✓ (${law.amendments.length} amd, ${law.outstandingChanges.length} pending, ${law.references.length} refs)`
      );
    } catch (err) {
      console.error(`\n  Pass 3 ERROR on ${law.id}:`, err);
    }
  }

  console.log(`\nDone. ${lawsOk} laws seeded, ${lawsSkipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
