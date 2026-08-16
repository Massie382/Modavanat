import type { MetadataRoute } from "next";
import { laws } from "@/data/laws";

/**
 * Dynamic sitemap (served at /sitemap.xml).
 *
 * Generated via Next.js 16's `sitemap()` function. The static top-level
 * pages are listed with explicit priorities/changefreq, and every law in
 * `laws` becomes its own `/law/[id]` entry with `lastmod` set to the law's
 * `lastRevisionDate` so search engines see when each statute was last
 * revised.
 *
 * Note: `metadataBase` is configured on the root `metadata` export in
 * `src/app/layout.tsx`, which Next.js uses to resolve relative URLs in
 * metadata. For `sitemap()` we emit absolute URLs directly against
 * `https://modavanat.ir` so the sitemap is self-contained even if a
 * request reaches it via a proxy host.
 */
const SITE_ORIGIN = "https://modavanat.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_ORIGIN}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_ORIGIN}/browse`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_ORIGIN}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_ORIGIN}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_ORIGIN}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_ORIGIN}/guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_ORIGIN}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_ORIGIN}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_ORIGIN}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Persian dates in `lastRevisionDate` are in the form "۱۳۸۷/۰۹/۲۳"
  // (Jalali). We can't reliably parse those into a JS Date without a
  // Jalali→Gregorian converter, so we leave `lastModified` undefined for
  // law entries when the string isn't a parseable ISO/Gregorian date.
  // The `lastmod` tag is optional in the sitemap protocol — omitting it
  // for Jalali dates is safer than emitting a wrong date.
  const lawEntries: MetadataRoute.Sitemap = laws.map((law) => {
    let lastModified: Date | undefined;
    const parsed = new Date(law.lastRevisionDate);
    if (!Number.isNaN(parsed.getTime())) {
      lastModified = parsed;
    }

    return {
      url: `${SITE_ORIGIN}/law/${law.id}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    };
  });

  return [...staticEntries, ...lawEntries];
}
