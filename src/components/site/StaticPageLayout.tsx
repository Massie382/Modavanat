"use client";

import Link from "next/link";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Minimal layout for static utility pages (/accessibility, /guide, /contact).
 *
 * These pages live outside the SPA view-state in page.tsx, so they don't
 * have access to the Header/Footer's onNavigate callback. Instead they
 * render their own minimal chrome: a thin top bar with the logo + a
 * back-to-home link, the content, and a slim footer.
 *
 * Persian RTL, uses the same container-legal + font-legal classes as the
 * rest of the site so the visual style is consistent.
 */
export function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Slim top bar */}
      <header className="hairline-b">
        <div className="container-legal py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/brand/logo.webp"
              alt="مدونات"
              width={1536}
              height={1024}
              className="h-[56px] w-auto object-contain"
              draggable={false}
            />
          </Link>
          <Link href="/" className="link-legal text-[13px]">
            بازگشت به سایت ←
          </Link>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 bg-white">
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
          </div>
        </div>
      </main>

      {/* Slim footer */}
      <footer className="mt-auto bg-[#1f1f1f] text-[#bdbdbd]">
        <div className="container-legal py-4 flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-3 text-[12px] text-[#8d8d8d] text-center sm:text-right">
          <p>© ۱۴۰۴ مدونات (modavanat.ir). تمامی حقوق محفوظ است.</p>
          <Link href="/" className="hover:text-white underline underline-offset-2">
            بازگشت به صفحه نخست
          </Link>
        </div>
      </footer>
    </div>
  );
}
