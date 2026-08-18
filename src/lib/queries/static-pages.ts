/**
 * Static-pages queries — server-side data-access layer for
 * /api/admin/pages and the public /[slug] route.
 *
 * Phase 7. Replaces the inlined `staticPagesMock` constant.
 */

import { db } from "@/db/client";
import { staticPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { StaticPageSection } from "@/db/schema/vocabularies";

export interface StaticPageRow {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  subtitle: string | null;
  sections: StaticPageSection[];
  visible: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

function row(r: typeof staticPages.$inferSelect): StaticPageRow {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    eyebrow: r.eyebrow,
    subtitle: r.subtitle,
    sections: (r.sections as StaticPageSection[]) ?? [],
    visible: r.visible,
    version: r.version,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  };
}

export async function listStaticPages(): Promise<StaticPageRow[]> {
  const rows = await db.select().from(staticPages);
  return rows.map(row);
}

export async function getStaticPage(
  id: string
): Promise<StaticPageRow | undefined> {
  const r = await db
    .select()
    .from(staticPages)
    .where(eq(staticPages.id, id))
    .limit(1);
  return r[0] ? row(r[0]) : undefined;
}

export async function getStaticPageBySlug(
  slug: string
): Promise<StaticPageRow | undefined> {
  const r = await db
    .select()
    .from(staticPages)
    .where(eq(staticPages.slug, slug))
    .limit(1);
  return r[0] ? row(r[0]) : undefined;
}

export interface StaticPageInput {
  slug: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  sections?: StaticPageSection[];
  visible?: boolean;
  version?: string;
}

export async function createStaticPage(
  input: StaticPageInput,
  updatedBy: string
): Promise<StaticPageRow> {
  const id = crypto.randomUUID();
  await db.insert(staticPages).values({
    id,
    slug: input.slug.toLowerCase().trim(),
    title: input.title,
    eyebrow: input.eyebrow ?? null,
    subtitle: input.subtitle ?? null,
    sections: input.sections ?? [],
    visible: input.visible ?? true,
    version: input.version ?? "1.0",
    updatedAt: new Date(),
    updatedBy,
  });
  const r = await getStaticPage(id);
  if (!r) throw new Error("Failed to fetch created static page");
  return r;
}

export async function updateStaticPage(
  id: string,
  patch: Partial<StaticPageInput>,
  updatedBy: string
): Promise<StaticPageRow | undefined> {
  const set: Partial<typeof staticPages.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy,
  };
  if (patch.slug !== undefined) set.slug = patch.slug.toLowerCase().trim();
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.eyebrow !== undefined) set.eyebrow = patch.eyebrow;
  if (patch.subtitle !== undefined) set.subtitle = patch.subtitle;
  if (patch.sections !== undefined) set.sections = patch.sections;
  if (patch.visible !== undefined) set.visible = patch.visible;
  if (patch.version !== undefined) set.version = patch.version;
  await db.update(staticPages).set(set).where(eq(staticPages.id, id));
  return getStaticPage(id);
}

export async function deleteStaticPage(id: string): Promise<boolean> {
  const r = await db
    .delete(staticPages)
    .where(eq(staticPages.id, id))
    .returning();
  return r.length > 0;
}
