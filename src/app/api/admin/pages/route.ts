/**
 * /api/admin/pages
 *
 *   GET  → list all static pages
 *   POST → create a new static page
 *
 * Phase 7. Admin-only. Mutations are audit-logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import {
  listStaticPages,
  createStaticPage,
  type StaticPageInput,
} from "@/lib/queries/static-pages";
import { logAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const pages = await listStaticPages();
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;

  let body: Partial<StaticPageInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.slug || typeof body.slug !== "string" || !body.slug.trim()) {
    return NextResponse.json(
      { error: "bad_request", message: "`slug` required" },
      { status: 400 }
    );
  }
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json(
      { error: "bad_request", message: "`title` required" },
      { status: 400 }
    );
  }
  if (!/^[a-z0-9-]+$/.test(body.slug.toLowerCase().trim())) {
    return NextResponse.json(
      { error: "bad_request", message: "`slug` must be kebab-case (latin, no spaces)" },
      { status: 400 }
    );
  }

  try {
    const page = await createStaticPage(body as StaticPageInput, guard.user.id);
    await logAudit({
      actorUserId: guard.user.id,
      action: "admin.static_page.create",
      targetType: "static_page",
      targetId: page.id,
      metadata: { slug: page.slug, title: page.title },
      ip: getClientIpFromReq(req),
    });
    return NextResponse.json({ page }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "conflict", message: `Slug "${body.slug}" already in use` },
        { status: 409 }
      );
    }
    console.error("[/api/admin/pages POST]", err);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create static page" },
      { status: 500 }
    );
  }
}
