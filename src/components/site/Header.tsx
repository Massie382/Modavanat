"use client";

import { useState, useEffect, useRef } from "react";
import { toFa } from "@/lib/utils";
import type { Law } from "@/lib/types";
import { SearchSuggestions } from "@/components/ui/SearchSuggestions";

interface HeaderProps {
  onNavigate: (view: "home" | "browse" | "search" | "about") => void;
  onSearch: (query: string) => void;
  /** Fired when the user picks a law from the desktop search suggestions
   *  dropdown. Optional so static pages (which route via full page loads)
   *  can omit it — in that case picking a suggestion still triggers
   *  onSearch via the "search for" row. */
  onOpenLaw?: (law: Law) => void;
  currentView: string;
}

export function Header({ onNavigate, onSearch, onOpenLaw, currentView }: HeaderProps) {
  const [searchInput, setSearchInput] = useState("");
  const headerRef = useRef<HTMLElement | null>(null);
  // Ref for the desktop inline search input — used by SearchSuggestions
  // to anchor its dropdown and to attach keyboard/focus listeners.
  const navSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Self-healing sticky offset: measure the actual header height and
  // publish it as a CSS custom property on <html> so any sticky element
  // (e.g. the sub-tab bar in LawDetailView) can use `top: var(--site-header-h)`
  // and stay correctly positioned even if the header height changes
  // (logo swap, padding tweak, etc.).
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof window === "undefined") return;

    const publish = () => {
      const h = el.offsetHeight;
      // Clamp to a sane range so a measurement glitch never produces 0
      // or a huge value.
      const safe = Number.isFinite(h) && h > 0 ? `${h}px` : "175px";
      document.documentElement.style.setProperty("--site-header-h", safe);
    };

    publish();

    // ResizeObserver fires when the header's own height changes (e.g. a
    // row collapses, the logo loads, padding kicks in via a breakpoint
    // change).
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(publish);
      ro.observe(el);
    }

    // Fallbacks: window resize + a delayed re-measure after fonts/images
    // settle. Cheap and belt-and-braces.
    window.addEventListener("resize", publish);
    const t = window.setTimeout(publish, 300);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", publish);
      window.clearTimeout(t);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) onSearch(searchInput.trim());
  };

  const navItems: { id: "home" | "browse" | "search" | "about"; label: string }[] = [
    { id: "home", label: "صفحه نخست" },
    { id: "browse", label: "مرور قوانین" },
    { id: "search", label: "جستجوی پیشرفته" },
    { id: "about", label: "درباره ما" },
  ];

  const handleNavClick = (id: "home" | "browse" | "search" | "about") => {
    onNavigate(id);
  };

  const isActive = (id: string) =>
    (id === "home" && currentView === "home") ||
    (id === "browse" && currentView === "browse") ||
    (id === "search" && currentView === "search") ||
    (id === "about" && currentView === "about");

  return (
    <header ref={headerRef} className="bg-white site-header-sticky">
      {/* Top thin strip — context bar. Visible on ALL breakpoints.
          Layout is ALWAYS a single row. In RTL the visual order is
          right→left, so to put the tagline on the visual RIGHT and
          the links on the visual LEFT we rely on the default DOM
          order (tagline first → appears right in RTL) and let the
          links come second → appear left. The tagline flexes+truncates
          so the links (shrink-0) never wrap. The `|` dividers are
          hidden on mobile to save horizontal space. */}
      <div className="bg-[#1f1f1f] text-[#bdbdbd] text-[10px] sm:text-[11.5px]">
        <div className="container-legal flex flex-row items-center justify-between gap-2 sm:gap-4 py-0.5">
          <span className="tracking-wide truncate flex-1 min-w-0">
            مرجع قوانین و مقررات جمهوری اسلامی ایران
          </span>
          <span className="flex items-center gap-2 sm:gap-4 shrink-0">
            <a href="/accessibility" className="hover:text-white transition-colors">دسترسی‌پذیری</a>
            <span className="opacity-40 hidden sm:inline">|</span>
            <a href="/guide" className="hover:text-white transition-colors">راهنما</a>
            <span className="opacity-40 hidden sm:inline">|</span>
            <a href="/contact" className="hover:text-white transition-colors">تماس با ما</a>
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="hairline-b">
        <div className="container-legal py-0.5 sm:py-1 flex items-center justify-between gap-3 sm:gap-6">
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 sm:gap-3 text-right group shrink-0"
            aria-label="مدونات — صفحه نخست"
          >
            {/* Real brand logo — 3:2 landscape, scales with breakpoint.
                No wordmark text beside it (per design decision). */}
            <img
              src="/brand/logo.webp"
              alt="مدونات"
              width={1536}
              height={1024}
              className="h-[96px] sm:h-[112px] w-auto object-contain"
              draggable={false}
            />
          </button>

          {/* Inline search — desktop only. On mobile, users tap
              "جستجوی پیشرفته" in the charcoal nav bar below to reach
              the full search page. Includes Google-style suggestions
              dropdown that drops down below the input as the user types. */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={navSearchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجوی عنوان قانون، شماره، سال یا ماده…"
                className="input-legal pl-9"
                style={{ paddingRight: "0.75rem", paddingLeft: "2.25rem" }}
                aria-label="جستجو"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={!!searchInput.trim()}
                aria-controls="nav-search-suggestions"
              />
              <span
                aria-hidden
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                </svg>
              </span>
              {/* Google-style suggestions dropdown — same component as the
                  homepage hero search. Anchored to this input via
                  navSearchInputRef. onPick is optional so static pages
                  (which navigate via full page loads) can omit it; when
                  omitted, picking a law is a no-op and the user is
                  expected to use the "search for" row at the top of the
                  dropdown to reach the full search page. */}
              <div id="nav-search-suggestions">
                <SearchSuggestions
                  query={searchInput}
                  inputRef={navSearchInputRef}
                  onPick={(law: Law) => {
                    if (onOpenLaw) onOpenLaw(law);
                    // Clear the input after picking so the dropdown
                    // closes and the header returns to its idle state.
                    setSearchInput("");
                  }}
                  onSearch={(q: string) => {
                    onSearch(q);
                    setSearchInput("");
                  }}
                />
              </div>
            </div>
            <button type="submit" className="btn-legal">
              جستجو
            </button>
          </form>

          {/* Auth links — visible on ALL breakpoints so mobile users can
              still reach ورود / ثبت‌نام without a hamburger menu. Sits in
              the same position the hamburger used to occupy. */}
          <div className="flex items-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] shrink-0">
            <a href="/signin" className="link-legal">ورود</a>
            <span className="text-[#cfcfcf]">/</span>
            <a href="/signup" className="link-legal">ثبت‌نام</a>
          </div>
        </div>
      </div>

      {/* Primary navigation — charcoal bar. Same on ALL breakpoints: no
          hamburger menu, the nav items are always visible. Padding is
          tighter on mobile (px-3 py-3) so all 4 items fit on a 375px
          screen; flex-wrap lets them wrap gracefully on very narrow widths. */}
      <nav className="nav-charcoal" aria-label="ناوبری اصلی">
        <div className="container-legal">
          <ul className="flex flex-wrap items-stretch">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 sm:px-5 py-3 sm:py-3.5 inline-block text-[13px] sm:text-[14px] ${
                    isActive(item.id) ? "nav-item-active" : "hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
            <li className="mr-auto hidden lg:flex items-center">
              <span className="text-[12.5px] text-[#9c9c9c] px-4">
                آخرین به‌روزرسانی:{" "}
                <span className="text-white">{toFa("۱۴۰۴/۰۵/۰۶")}</span>
              </span>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
