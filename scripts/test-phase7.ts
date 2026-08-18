import "dotenv/config";
import { db } from "../src/db/client";
import { staticPages, vocabularies, lawPdfs, laws } from "../src/db/schema";

async function main() {
  try {
    const v = await db.select().from(vocabularies).limit(5);
    console.log("VOCAB ROWS:", v.length);
    for (const x of v) console.log(" vocab:", x.key, "—", x.label, "—", (x.entries as unknown[]).length, "entries");
  } catch (err) {
    console.error("VOCAB ERR:", err instanceof Error ? err.message : String(err));
    console.error("  cause:", (err as { cause?: unknown }).cause);
  }

  try {
    const r = await db.select().from(staticPages).limit(5);
    console.log("STATIC PAGES:", r.length);
    for (const x of r) console.log(" page:", x.slug, "—", x.title);
  } catch (err) {
    console.error("PAGES ERR:", err instanceof Error ? err.message : String(err));
    console.error("  cause:", (err as { cause?: unknown }).cause);
  }

  try {
    const p = await db.select().from(lawPdfs).limit(5);
    console.log("LAW PDFs:", p.length);
  } catch (err) {
    console.error("PDFS ERR:", err instanceof Error ? err.message : String(err));
    console.error("  cause:", (err as { cause?: unknown }).cause);
  }

  try {
    const l = await db.select().from(laws).limit(2);
    console.log("LAWS OK:", l.length);
  } catch (err) {
    console.error("LAWS ERR:", err instanceof Error ? err.message : String(err));
  }
}
main();
