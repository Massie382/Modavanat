/**
 * /p/[slug] — public route that renders a DB-backed static page.
 *
 * Phase 7. The /admin/pages UI writes to the `static_pages` table;
 * this route reads from it. Visible pages render with the standard
 * StaticPageLayout; hidden pages (visible=false) return 404.
 *
 * NOTE: the existing rich-content routes /privacy, /about, /terms,
 * /contact remain in place — those have handcrafted content with
 * custom sub-components. This /p/[slug] namespace is for new pages
 * the admin creates from scratch, plus a DB-backed preview of the
 * seeded privacy/about/terms/contact rows (so admins can edit them
 * and see the result at a stable URL).
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/site/StaticPageLayout";
import { getStaticPageBySlug } from "@/lib/queries/static-pages";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(ctx: Ctx): Promise<Metadata> {
  const { slug } = await ctx.params;
  const page = await getStaticPageBySlug(slug);
  if (!page || !page.visible) return {};
  return {
    title: `${page.title} | مدونات`,
    description: page.subtitle ?? "",
  };
}

export default async function DynamicStaticPage(ctx: Ctx) {
  const { slug } = await ctx.params;
  const page = await getStaticPageBySlug(slug);
  if (!page || !page.visible) notFound();

  const visibleSections = page.sections.filter((s) => s.visible);

  return (
    <StaticPageLayout
      title={page.eyebrow ?? page.title}
      subtitle={page.title}
    >
      {page.subtitle && (
        <p className="text-[15px] leading-8 text-[#3d3d3d] mb-6">
          {page.subtitle}
        </p>
      )}
      {visibleSections.map((s) => (
        <section key={s.id}>
          {s.heading && (
            <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
              {s.heading}
            </h2>
          )}
          <p className="whitespace-pre-line text-[14.5px] leading-8 text-[#1a1a1a]">
            {s.body}
          </p>
        </section>
      ))}
      <p className="text-[12px] text-[#6b6b6b] mt-8">
        نسخه {page.version} — آخرین به‌روزرسانی:{" "}
        {new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(page.updatedAt))}
      </p>
    </StaticPageLayout>
  );
}
