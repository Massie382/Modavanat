import "dotenv/config";
import { db } from "../src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log("Tables in dev DB:");
  const rows = (result as unknown as Array<{ tablename: string }>).rows ?? result as unknown as Array<{ tablename: string }>;
  for (const row of rows) {
    console.log("  -", row.tablename);
  }

  const cols = await db.execute(sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name IN ('failed_login_attempts','locked_until')
    ORDER BY ordinal_position;
  `);
  console.log("\nNew users columns:");
  const colRows = (cols as unknown as Array<{ column_name: string; data_type: string }>).rows ?? cols as unknown as Array<{ column_name: string; data_type: string }>;
  for (const c of colRows) {
    console.log("  -", c.column_name, ":", c.data_type);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
