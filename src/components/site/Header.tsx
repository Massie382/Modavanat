"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { toFa } from "@/lib/utils";
import type { Law } from "@/lib/types";
import { useLaws } from "@/components/providers/LawsProvider";
import { SearchSuggestions } from "@/components/ui/SearchSuggestions";

/**
 * Site header — charcoal context strip + logo + inline search + auth links
 * + primary nav bar.
 *
 * Navigation uses Next.js <Link> + useRouter so it works from any route
 * (public pages, static pages, deep links). The active nav item is
 * derived from usePathname() so it stays correct regardless of how the
 * user arrived at the current page.
 *
 * The inline desktop search drops down a SearchSuggestions box; picking
 * a law navigates to /law/[id] via router.push().
 */
export function Header() {
  const [searchInput, setSearchInput] = useState("");
  const headerRef = useRef<HTMLElement | null>(null);
  const navSearchInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Latest revision date across all laws — drives the "آخرین به‌روزرسانی"
  // timestamp in the primary nav bar. Cheap lookup, runs on every render.
  // Dates are Persian-digit "YYYY/MM/DD" strings; lexicographic comparison
  // orders them correctly because Persian digits share the same relative
  // ordering as ASCII digits in Unicode.
  const laws = useLaws();
  const latestUpdate = laws.reduce(
    (latest, l) => (l.lastRevisionDate > latest ? l.lastRevisionDate : latest),
    ""
  );

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

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(publish);
      ro.observe(el);
    }

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
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput("");
    }
  };

  const navItems: { href: string; id: "home" | "browse" | "search" | "about"; label: string }[] = [
    { href: "/", id: "home", label: "صفحه نخست" },
    { href: "/browse", id: "browse", label: "مرور قوانین" },
    { href: "/search", id: "search", label: "جستجوی پیشرفته" },
    { href: "/about", id: "about", label: "درباره ما" },
  ];

  // Active state derived from the current pathname. /law/* counts as
  // "browse" so the browse nav item stays highlighted on law detail pages.
  const isActive = (id: string) => {
    if (id === "home") return pathname === "/";
    if (id === "browse") return pathname === "/browse" || pathname?.startsWith("/law/");
    if (id === "search") return pathname === "/search";
    if (id === "about") return pathname === "/about";
    return false;
  };

  return (
    <header ref={headerRef} className="bg-white site-header-sticky">
      {/* Top thin strip — context bar. */}
      <div className="bg-[#1f1f1f] text-[#bdbdbd] text-[10px] sm:text-[11.5px]">
        <div className="container-legal flex flex-row items-center justify-between gap-2 sm:gap-4 py-0.5">
          <span className="tracking-wide truncate flex-1 min-w-0">
            مرجع قوانین و مقررات جمهوری اسلامی ایران
          </span>
          <span className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/accessibility" className="hover:text-white transition-colors">دسترسی‌پذیری</Link>
            <span className="opacity-40 hidden sm:inline">|</span>
            <Link href="/guide" className="hover:text-white transition-colors">راهنما</Link>
            <span className="opacity-40 hidden sm:inline">|</span>
            <Link href="/contact" className="hover:text-white transition-colors">تماس با ما</Link>
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="hairline-b">
        <div className="container-legal py-0.5 sm:py-1 flex items-center justify-between gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 text-right group shrink-0"
            aria-label="مدونات — صفحه نخست"
          >
            <Image
              src="/brand/logo.webp"
              alt="مدونات"
              width={1536}
              height={1024}
              className="h-[96px] sm:h-[112px] w-auto object-contain"
              draggable={false}
              priority
            />
          </Link>

          {/* Inline search — desktop only. */}
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
              <div id="nav-search-suggestions">
                <SearchSuggestions
                  query={searchInput}
                  inputRef={navSearchInputRef}
                  onPick={(law: Law) => {
                    router.push(`/law/${law.id}`);
                    setSearchInput("");
                  }}
                  onSearch={(q: string) => {
                    router.push(`/search?q=${encodeURIComponent(q)}`);
                    setSearchInput("");
                  }}
                />
              </div>
            </div>
            <button type="submit" className="btn-legal">
              جستجو
            </button>
          </form>

          {/* Auth links */}
          <div className="flex items-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] shrink-0">
            <Link href="/signin" className="link-legal">ورود</Link>
            <span className="text-[#cfcfcf]">/</span>
            <Link href="/signup" className="link-legal">ثبت‌نام</Link>
          </div>
        </div>
      </div>

      {/* Primary navigation — charcoal bar. */}
      <nav className="nav-charcoal" aria-label="ناوبری اصلی">
        <div className="container-legal">
          <ul className="flex flex-wrap items-stretch">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`px-3 sm:px-5 py-3 sm:py-3.5 inline-block text-[13px] sm:text-[14px] ${
                    isActive(item.id) ? "nav-item-active" : "hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mr-auto hidden lg:flex items-center">
              <span className="text-[12.5px] text-[#9c9c9c] px-4">
                آخرین به‌روزرسانی:{" "}
                <span className="text-white">{toFa(latestUpdate)}</span>
              </span>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
