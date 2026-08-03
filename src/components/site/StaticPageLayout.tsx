"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Layout for static utility pages (/accessibility, /guide, /contact).
 *
 * IMPORTANT: these pages must look identical to the home page — same
 * charcoal context strip, same logo + search + auth links, same
 * charcoal nav bar, same 4-column footer. Earlier this component
 * rendered its own minimal chrome (logo + back-to-home + slim footer)
 * which made the static pages feel like a different site.
 *
 * Now we render the real <Header /> and <Footer /> components. The
 * SPA-style onNavigate/onSearch callbacks the home page uses aren't
 * available here (these are separate Next.js routes), so we route
 * every navigation to "/" via a full page load — the home page then
 * renders the appropriate view based on its own state.
 */
export function StaticPageLayout({ title, subtitle, children }: StaticPageLayoutProps) {
  // All navigations from the static pages go to the home route.
  // The home page's Header/Footer then take over SPA-style routing.
  const goHome = () => {
    if (typeof window !== "undefined") window.location.href = "/";
  };

  const handleNavigate = (view: "home" | "browse" | "search" | "about") => {
    // For non-home views, we still go to "/" — the home page renders
    // its default (home) view. If we later want to deep-link to a
    // specific view, we can use a query param like "/?view=browse".
    if (typeof window !== "undefined") {
      window.location.href = view === "home" ? "/" : `/?view=${view}`;
    }
  };

  const handleSearch = (query: string) => {
    if (typeof window !== "undefined") {
      window.location.href = `/?view=search&q=${encodeURIComponent(query)}`;
    }
  };

  // currentView is "home" by default for the static pages' header
  // highlight state — none of the nav items should appear active
  // because we're on a separate route.
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        currentView=""
      />

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

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
