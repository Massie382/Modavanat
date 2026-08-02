"use client";

import { useState } from "react";
import { toFa } from "@/lib/utils";

interface HeaderProps {
  onNavigate: (view: "home" | "browse" | "search" | "about") => void;
  onSearch: (query: string) => void;
  currentView: string;
}

export function Header({ onNavigate, onSearch, currentView }: HeaderProps) {
  const [searchInput, setSearchInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  const isActive = (id: string) =>
    (id === "home" && currentView === "home") ||
    (id === "browse" && currentView === "browse") ||
    (id === "search" && currentView === "search") ||
    (id === "about" && currentView === "about");

  return (
    <header className="bg-white">
      {/* Top thin strip — context */}
      <div className="bg-[#1f1f1f] text-[#bdbdbd] text-[11.5px] hidden sm:block">
        <div className="container-legal flex items-center justify-between py-1.5">
          <span className="tracking-wide">
            مرجع رسمی قوانین و مقررات جمهوری اسلامی ایران
          </span>
          <span className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">دسترسی‌پذیری</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-white transition-colors">راهنما</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-white transition-colors">تماس با ما</a>
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="hairline-b">
        <div className="container-legal py-4 sm:py-5 flex items-center justify-between gap-4 sm:gap-6">
          <button
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 sm:gap-3 text-right group shrink-0"
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-[#1f1f1f] text-white shrink-0"
              style={{ borderRadius: "2px" }}
            >
              <span className="font-legal text-[18px] sm:text-[22px] font-bold leading-none">ق</span>
            </span>
            <span>
              <span className="block font-legal text-[16px] sm:text-[19px] font-bold text-[#1a1a1a] leading-tight group-hover:text-black">
                قانون‌یاب
              </span>
              <span className="hidden sm:block text-[11.5px] text-[#6b6b6b] tracking-wide leading-tight mt-0.5">
                ghanunyab.ir
              </span>
            </span>
          </button>

          {/* Inline search — desktop only */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جستجوی عنوان قانون، شماره، سال یا ماده…"
                className="input-legal pl-9"
                style={{ paddingRight: "0.75rem", paddingLeft: "2.25rem" }}
                aria-label="جستجو"
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
            </div>
            <button type="submit" className="btn-legal">
              جستجو
            </button>
          </form>

          {/* Desktop utility links */}
          <div className="hidden lg:flex items-center gap-3 text-[13px] shrink-0">
            <a href="#" className="link-legal">ورود</a>
            <span className="text-[#cfcfcf]">/</span>
            <a href="#" className="link-legal">ثبت‌نام</a>
          </div>

          {/* Mobile: search toggle / hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2 text-[#1a1a1a]"
            aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel (collapsible) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#ececea] bg-white">
            <div className="container-legal py-4 space-y-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="جستجوی قانون…"
                    className="input-legal pl-9"
                    style={{ paddingLeft: "2.25rem" }}
                    aria-label="جستجو"
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
                </div>
                <button type="submit" className="btn-legal">جستجو</button>
              </form>

              <nav className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`text-right px-3 py-2.5 text-[14px] border ${
                      isActive(item.id)
                        ? "bg-[#1f1f1f] text-white border-[#1f1f1f]"
                        : "bg-[#fafaf8] text-[#1a1a1a] border-[#ececea]"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center justify-between pt-2 border-t border-[#ececea] text-[12.5px]">
                <a href="#" className="link-legal">ورود</a>
                <a href="#" className="link-legal">ثبت‌نام</a>
                <a href="#" className="link-legal">راهنما</a>
                <a href="#" className="link-legal">تماس</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary navigation — charcoal bar (desktop only) */}
      <nav className="nav-charcoal hidden md:block" aria-label="ناوبری اصلی">
        <div className="container-legal">
          <ul className="flex flex-wrap items-stretch">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`px-5 py-3.5 inline-block text-[14px] ${
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
