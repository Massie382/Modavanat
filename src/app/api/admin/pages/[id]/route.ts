/**
 * /api/admin/pages/[id]
 *
 *   GET    → fetch a single static page
 *   PATCH  → update any subset of fields
 *   DELETE → remove the page
 *
 * Phase 7. Admin-only. Mutations are audit-logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin-guard";
import { getClientIpFromReq } from "@/lib/auth/session";
import {
  getStaticPage,
  updateStaticPage,
  deleteStaticPage,
  type StaticPageInput,
} from "@/lib/queries/static-pages";
import { logAudit } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  const page = await getStaticPage(id);
  if (!page) {
    return NextResponse.json(
      { error: "not_found", message: "Static page not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ page });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  let body: Partial<StaticPageInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (body.slug !== undefined && !/^[a-z0-9-]+$/.test(body.slug.toLowerCase().trim())) {
    return NextResponse.json(
      { error: "bad_request", message: "`slug` must be kebab-case (latin, no spaces)" },
      { status: 400 }
    );
  }

  const page = await updateStaticPage(id, body, guard.user.id);
  if (!page) {
    return NextResponse.json(
      { error: "not_found", message: "Static page not found" },
      { status: 404 }
    );
  }
  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.static_page.update",
    targetType: "static_page",
    targetId: id,
    metadata: { keys: Object.keys(body) },
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ page });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await getAdminUser();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;
  const ok = await deleteStaticPage(id);
  if (!ok) {
    return NextResponse.json(
      { error: "not_found", message: "Static page not found" },
      { status: 404 }
    );
  }
  await logAudit({
    actorUserId: guard.user.id,
    action: "admin.static_page.delete",
    targetType: "static_page",
    targetId: id,
    ip: getClientIpFromReq(req),
  });
  return NextResponse.json({ ok: true });
}
