import Link from "next/link";

/**
 * Content wrapper for static utility pages (/accessibility, /guide, /contact,
 * /privacy, /terms).
 *
 * NOTE: This component no longer renders <Header /> and <Footer /> — the
 * (public) route group layout does that for all public pages. This file
 * now just provides the page-title + body shell so the static pages share
 * consistent typography.
 */
interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  return (
    <div className="container-legal py-10 md:py-14">
      <div className="max-w-3xl">
        <p className="text-[12.5px] tracking-[0.12em] text-[#6b6b6b] mb-3 uppercase">
          {title}
        </p>
        {subtitle && (
          <h1 className="font-legal text-[28px] md:text-[32px] font-light text-[#1a1a1a] leading-tight mb-6">
            {subtitle}
          </h1>
        )}
        <div className="space-y-6 text-[14.5px] leading-8 text-[#1a1a1a]">
          {children}
        </div>
        <div className="mt-10 pt-6 border-t border-[#ececea] text-[12.5px] text-[#6b6b6b]">
          <Link href="/" className="link-legal">
            بازگشت به صفحه نخست ←
          </Link>
        </div>
      </div>
    </div>
  );
}
