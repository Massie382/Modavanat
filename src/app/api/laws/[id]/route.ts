/**
 * GET /api/laws/[id]
 *   Returns the full nested Law object for a single law by ID.
 *   Response: 200 OK, body = Law (with toc, articles, amendments,
 *   outstandingChanges, references all populated).
 *
 *   404 if id doesn't match any law.
 *
 * Public, no auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getLawById } from "@/lib/queries/laws";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "bad_request", message: "Missing law id" },
      { status: 400 }
    );
  }
  try {
    const law = await getLawById(id);
    if (!law) {
      return NextResponse.json(
        { error: "not_found", message: `No law with id="${id}"` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { law },
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
    console.error(`[/api/laws/${id}] error:`, err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to load law" },
      { status: 500 }
    );
  }
}
