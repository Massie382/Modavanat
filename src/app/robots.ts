import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt (served at /robots.txt).
 *
 * Generated via Next.js 16's `robots()` function — replaces the old static
 * `public/robots.txt`. Allows all crawlers to access public pages while
 * hiding admin, account, API and auth routes (which are either private
 * or non-indexable by design). Points crawlers at the dynamically generated
 * sitemap.
 */
const SITE_ORIGIN = "https://modavanat.ir";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/account", "/api/", "/signin", "/signup", "/forgot-password"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
