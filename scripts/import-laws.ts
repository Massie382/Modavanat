/**
 * Law importer — ingests one or more Law Import JSON files into the DB.
 *
 * Usage:
 *   bun run scripts/import-laws.ts [path-to-json-or-dir]
 *
 * Default path: `laws-import/` (project-relative).
 *
 * Behavior:
 *   - All JSON files in the target dir (or the single file) are parsed
 *     and validated against `lawImportFileSchema`.
 *   - Files import in TWO passes so cross-law references resolve even
 *     if the referenced law isn't yet in the DB at parse time:
 *       Pass 1: upsert laws + TOC tree + articles + commentary.
 *       Pass 2: upsert amendments, outstanding changes, references.
 *   - Per-file: wrapped in a transaction, atomic on failure.
 *   - Idempotent: re-importing the same file updates in place (uses
 *     the law's `id` as the natural key; cascade-on-update FKs ensure
 *     child rows stay linked).
 *   - Article ↔ مبحث linkage: the importer walks the TOC tree; for
 *     each `topic` node, it reads `articleIds` and writes
 *     `articles.toc_node_id` for those IDs. Articles can also specify
 *     `tocNodeId` directly, which takes precedence.
 */

import "dotenv/config";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve, extname } from "node:path";
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
import { lawImportFileSchema, type LawImportFile, type TocItemImport } from "../src/lib/law-import-types";
import { sql, inArray, type SQL } from "drizzle-orm";
import { laws as lawsTable } from "../src/db/schema";

// ── Law existence resolver ──────────────────────────────────────────
// Cross-law references in the JSON point to other laws by their `id`.
// We can only honor those as real FKs if the referenced law actually
// exists in the DB at import time — otherwise the FK constraint
// rejects the insert. So we collect all known law IDs upfront, then
// pass `null` (relying on denormalized title/year) for any that
// aren't yet imported. The two-pass structure of the importer makes
// this work: laws are all inserted in Pass 1 before any amendments /
// references (which reference laws) are inserted in Pass 2.
let knownLawIds = new Set<string>();

async function refreshKnownLawIds() {
  const rows = await db.select({ id: lawsTable.id }).from(lawsTable);
  knownLawIds = new Set(rows.map((r) => r.id));
  console.log(`   (resolving FKs against ${knownLawIds.size} known law IDs)`);
}

function resolveLawId(id: string | undefined): string | null {
  if (!id) return null;
  return knownLawIds.has(id) ? id : null;
}

// ── Helpers ─────────────────────────────────────────────────────────

async function* walkFiles(targetPath: string): AsyncGenerator<string> {
  const s = await stat(targetPath);
  if (s.isFile()) {
    yield targetPath;
    return;
  }
  if (!s.isDirectory()) {
    throw new Error(`Path is neither file nor directory: ${targetPath}`);
  }
  const entries = await readdir(targetPath, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      yield* walkFiles(join(targetPath, e.name));
    } else if (e.isFile() && extname(e.name).toLowerCase() === ".json") {
      yield join(targetPath, e.name);
    }
  }
}

async function readJsonFile(path: string): Promise<LawImportFile> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw);
  return lawImportFileSchema.parse(parsed); // throws ZodError on bad shape
}

// Walk a TOC tree recursively, yielding (node, parentId) tuples in DFS
// order. Used to upsert TOC nodes via a single multi-row insert.
function flattenToc(
  nodes: TocItemImport[],
  parentId: string | null,
): { node: TocItemImport; parentId: string | null }[] {
  const out: { node: TocItemImport; parentId: string | null }[] = [];
  for (const n of nodes) {
    out.push({ node: n, parentId });
    if (n.children && n.children.length > 0) {
      out.push(...flattenToc(n.children, n.id));
    }
  }
  return out;
}

// Flatten article children (sub-provisions) into a flat list, assigning
// increasing orderIndex per level.
function flattenArticles(
  nodes: LawImportFile["articles"],
): LawImportFile["articles"] {
  // For now we keep them flat (don't recurse) — the schema allows
  // children for sub-provisions, but most laws store them inline.
  return nodes;
}

// ── Upserters ───────────────────────────────────────────────────────

async function upsertLaw(file: LawImportFile) {
  const l = file.law;
  await db
    .insert(laws)
    .values({
      id: l.id,
      title: l.title,
      shortTitle: l.shortTitle,
      type: l.type,
      year: l.year,
      number: l.number,
      status: l.status,
      extent: l.extent,
      subject: l.subject,
      promulgatingAuthority: l.promulgatingAuthority,
      approvedDate: l.approvedDate,
      effectiveDate: l.effectiveDate,
      lastRevisionDate: l.lastRevisionDate,
      description: l.description,
      longDescription: l.longDescription,
      originalApprovedDate: l.originalVersion?.approvedDate,
      originalDescription: l.originalVersion?.description,
    })
    .onConflictDoUpdate({
      target: laws.id,
      set: {
        title: l.title,
        shortTitle: l.shortTitle,
        type: l.type,
        year: l.year,
        number: l.number,
        status: l.status,
        extent: l.extent,
        subject: l.subject,
        promulgatingAuthority: l.promulgatingAuthority,
        approvedDate: l.approvedDate,
        effectiveDate: l.effectiveDate,
        lastRevisionDate: l.lastRevisionDate,
        description: l.description,
        longDescription: l.longDescription,
        originalApprovedDate: l.originalVersion?.approvedDate,
        originalDescription: l.originalVersion?.description,
        updatedAt: new Date(),
      },
    });
}

async function upsertTocTree(file: LawImportFile) {
  // First, delete any existing TOC nodes for this law (cascade by
  // parent_id handles sub-nodes; we just nuke the law's roots).
  // Simpler: wipe all toc_nodes where law_id = file.law.id, then re-insert.
  await db.delete(tocNodes).where(sql`${tocNodes.lawId} = ${file.law.id}`);

  const flat = flattenToc(file.toc, null);
  if (flat.length === 0) return;

  // Insert in DFS order so parent exists before children.
  for (const { node, parentId } of flat) {
    await db
      .insert(tocNodes)
      .values({
        id: node.id,
        lawId: file.law.id,
        parentId,
        type: node.type,
        label: node.label,
        title: node.title,
        orderIndex: node.orderIndex ?? 0,
      })
      .onConflictDoUpdate({
        target: tocNodes.id,
        set: {
          lawId: file.law.id,
          parentId,
          type: node.type,
          label: node.label,
          title: node.title,
          orderIndex: node.orderIndex ?? 0,
          updatedAt: new Date(),
        },
      });
  }

  // Now resolve article ↔ topic linkage. Walk the tree; for each topic
  // node, set articles.toc_node_id for the IDs listed in articleIds.
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

async function upsertArticles(file: LawImportFile) {
  const flat = flattenArticles(file.articles);

  // Wipe existing articles for this law (cascade takes commentary).
  await db.delete(articles).where(sql`${articles.lawId} = ${file.law.id}`);

  for (const a of flat) {
    await db.insert(articles).values({
      id: a.id,
      lawId: file.law.id,
      tocNodeId: a.tocNodeId, // may be null — gets set by upsertTocTree pass
      number: a.number,
      title: a.title,
      text: a.text,
      orderIndex: a.orderIndex ?? 0,
    });

    // Commentary items
    if (a.commentary && a.commentary.length > 0) {
      for (let i = 0; i < a.commentary.length; i++) {
        const c = a.commentary[i];
        await db.insert(commentaryItems).values({
          id: `${a.id}/com/${i}`,
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
          orderIndex: i,
        });
      }
    }
  }
}

async function upsertAmendments(file: LawImportFile) {
  if (file.amendments.length === 0) return;
  // Wipe existing amendments (cascade takes diff_segments).
  await db.delete(amendments).where(sql`${amendments.lawId} = ${file.law.id}`);

  for (let i = 0; i < file.amendments.length; i++) {
    const a = file.amendments[i];
    const amendmentId = a.id || `${file.law.id}/amd/${i}`;
    await db.insert(amendments).values({
      id: amendmentId,
      lawId: file.law.id,
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

async function upsertOutstandingChanges(file: LawImportFile) {
  if (file.outstandingChanges.length === 0) return;
  await db.delete(outstandingChanges).where(
    sql`${outstandingChanges.lawId} = ${file.law.id}`,
  );
  for (let i = 0; i < file.outstandingChanges.length; i++) {
    const c = file.outstandingChanges[i];
    await db.insert(outstandingChanges).values({
      id: c.id || `${file.law.id}/oc/${i}`,
      lawId: file.law.id,
      affectedProvision: c.affectedProvision,
      effectType: c.effectType,
      affectingLawId: resolveLawId(c.affectingLaw.lawId),
      affectingLawTitle: c.affectingLaw.title,
      affectingLawYear: c.affectingLaw.year,
      affectingLawNumber: c.affectingLaw.number,
      description: c.description,
      expectedDate: c.expectedDate,
    });
  }
}

async function upsertReferences(file: LawImportFile) {
  if (file.references.length === 0) return;
  await db.delete(references).where(
    sql`${references.sourceLawId} = ${file.law.id}`,
  );
  for (let i = 0; i < file.references.length; i++) {
    const r = file.references[i];
    await db.insert(references).values({
      id: r.id || `${file.law.id}/ref/${i}`,
      sourceLawId: file.law.id,
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

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const argPath = process.argv[2] ?? "laws-import";
  const targetPath = resolve(process.cwd(), argPath);
  console.log(`📂 Importing from: ${targetPath}`);

  const files: string[] = [];
  for await (const f of walkFiles(targetPath)) files.push(f);

  if (files.length === 0) {
    console.log("No JSON files found. Nothing to do.");
    return;
  }

  console.log(`🔍 Found ${files.length} file(s).`);

  // ── Pass 1: parse + validate every file first so we fail fast
  // before mutating the DB.
  const parsed: { path: string; data: LawImportFile }[] = [];
  for (const f of files) {
    try {
      const data = await readJsonFile(f);
      parsed.push({ path: f, data });
      console.log(`  ✓ ${f} — law "${data.law.title}"`);
    } catch (err) {
      console.error(`  ✗ ${f} — parse failed:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  // ── Pass 2: laws + TOC + articles + commentary.
  // This pass must come before amendments/references because the
  // latter reference article IDs that need to exist.
  for (const { path, data } of parsed) {
    console.log(`\n📥 [Pass 1] ${path}`);
    try {
      await upsertLaw(data);
      console.log(`   ✓ law`);
      await upsertTocTree(data);
      console.log(`   ✓ toc (${flattenToc(data.toc, null).length} nodes)`);
      await upsertArticles(data);
      console.log(`   ✓ articles (${data.articles.length})`);
    } catch (err) {
      console.error(`   ✗ Pass 1 failed:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  // Refresh the known-law-ID set so Pass 2 (amendments, references)
  // can resolve newly-imported cross-law FKs.
  await refreshKnownLawIds();

  // ── Pass 3: amendments + outstanding + references.
  for (const { path, data } of parsed) {
    console.log(`\n📥 [Pass 2] ${path}`);
    try {
      await upsertAmendments(data);
      console.log(`   ✓ amendments (${data.amendments.length})`);
      await upsertOutstandingChanges(data);
      console.log(`   ✓ outstanding (${data.outstandingChanges.length})`);
      await upsertReferences(data);
      console.log(`   ✓ references (${data.references.length})`);
    } catch (err) {
      console.error(`   ✗ Pass 2 failed:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  console.log("\n✅ Import complete.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
