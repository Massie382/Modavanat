/**
 * Smoke test — confirm PGlite has all 12 tables. Run with:
 *   bun run scripts/db-test.ts
 */
import "dotenv/config";
import { db } from "../src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  const rows = result.rows ?? [];
  console.log(`✓ ${rows.length} tables in PGlite dev DB:`);
  for (const r of rows) console.log(`  - ${r.table_name}`);
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
