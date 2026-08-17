/**
 * GET /api/laws
 *   Returns lightweight law metadata (cards) for browse/search/header.
 *   Accepts optional `?q=...` query param for ILIKE search.
 *
 * Response: 200 OK, body = Law[] (with empty toc/articles/amendments/
 * references — call /api/laws/[id] for full content).
 *
 * Public, no auth required. Cache: 60s in dev, 1h in prod (immutable
 * until a new law is published — admin UI invalidates via revalidate).
 */

import { NextRequest, NextResponse } from "next/server";
import { searchLaws, getLawCardList } from "@/lib/queries/laws";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const laws = q ? await searchLaws(q) : await getLawCardList();
    return NextResponse.json(
      { laws },
      {
        headers: {
          "Cache-Control":
            process.env.NODE_ENV === "production"
              ? "public, s-maxage=3600, stale-while-revalidate=86400"
              : "no-store",
        },
      }
    );
  } catch (err) {
    console.error("[/api/laws] error:", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to load laws" },
      { status: 500 }
    );
  }
}
