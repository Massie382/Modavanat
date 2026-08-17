/**
 * Quick smoke test — verifies the queries layer returns the same data
 * shape as the static src/data/laws.ts file.
 */

import "dotenv/config";
import { getLaws, getLawById, getLawCardList, getDecadeStats, searchLaws, getReferencedLawTitles } from "../src/lib/queries/laws";
import { laws as staticLaws, getLawById as staticGetLawById } from "../src/data/laws";

async function main() {
  console.log("=== getLawCardList() ===");
  const cards = await getLawCardList();
  console.log(`  returned ${cards.length} laws (static has ${staticLaws.length})`);
  console.log(`  match: ${cards.length === staticLaws.length ? "✓" : "✗"}`);
  console.log();

  console.log("=== getLaws() (full nested) ===");
  const allLaws = await getLaws();
  console.log(`  returned ${allLaws.length} laws`);
  for (const law of allLaws) {
    const staticLaw = staticGetLawById(law.id);
    const match = staticLaw && law.title === staticLaw.title && law.articles.length === staticLaw.articles.length;
    console.log(
      `  • ${law.id} (${law.title}) — ${law.articles.length} articles, ${law.toc.length} toc roots, ${law.amendments.length} amd, ${law.references.length} refs — ${match ? "✓" : "✗"}`
    );
  }
  console.log();

  console.log("=== getLawById('q-madani-1307') ===");
  const law = await getLawById("q-madani-1307");
  if (law) {
    console.log(`  ✓ title=${law.title}`);
    console.log(`    articles=${law.articles.length}, toc=${law.toc.length}, amendments=${law.amendments.length}`);
  } else {
    console.log("  ✗ NOT FOUND");
  }
  console.log();

  console.log("=== getLawById('does-not-exist') ===");
  const missing = await getLawById("does-not-exist");
  console.log(`  ${missing ? "✗ unexpectedly found" : "✓ correctly undefined"}`);
  console.log();

  console.log("=== getDecadeStats() ===");
  const stats = await getDecadeStats();
  console.log(`  returned ${stats.length} decades`);
  for (const d of stats) {
    console.log(`  • ${d.decade}: ${d.counts.reduce((s, c) => s + c.count, 0)} laws across ${d.counts.length} years`);
  }
  console.log();

  console.log("=== searchLaws('مدنی') ===");
  const results = await searchLaws("مدنی");
  console.log(`  returned ${results.length} matches`);
  for (const r of results) console.log(`  • ${r.id} — ${r.title}`);
  console.log();

  console.log("=== getReferencedLawTitles() ===");
  const titles = await getReferencedLawTitles();
  console.log(`  returned ${Object.keys(titles).length} referenced law titles`);
  for (const [id, info] of Object.entries(titles).slice(0, 5)) {
    console.log(`  • ${id} → ${info.title} (${info.year})`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
