"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { laws } from "@/data/laws";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";

interface MobileLawDrawerProps {
  onOpenLaw: (law: Law) => void;
  onSearch: (query: string) => void;
}

/**
 * Mobile-only law navigation drawer — shown on the article page only.
 *
 * Design:
 *  - A small dark FAB fixed on the LEFT edge of the screen (vertically centered).
 *  - Tap the FAB → drawer slides in from the LEFT, covering ~60% of the width.
 *  - Drawer contents:
 *      • Header (title + close X)
 *      • Search input — filters the list live as the user types
 *      • Scrollable list of all laws (filtered by the query)
 *      • "تأیید" (Confirm) button at the bottom — fires onSearch(query) and
 *        closes the drawer. Required: search does NOT take effect until
 *        the user taps confirm.
 *
 * Interaction model:
 *  - Tapping a law in the list fires onOpenLaw immediately (so the article
 *    updates underneath), but the drawer STAYS OPEN — the user can browse
 *    multiple laws without re-opening the drawer each time.
 *  - Typing in the search field filters the list live, but does NOT fire
 *    onSearch. Only the "تأیید" button commits the search.
 *  - Escape key, overlay tap, and the X button all close the drawer without
 *    firing onSearch (cancel path).
 *  - Body scroll is locked while the drawer is open.
 */
export function MobileLawDrawer({ onOpenLaw, onSearch }: MobileLawDrawerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedLawId, setHighlightedLawId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Live-filtered list. Note: this is just for display — the actual
  // onSearch callback is only fired when the user taps the confirm button.
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return laws;
    return laws.filter(
      (l) =>
        l.title.includes(q) ||
        l.description.includes(q) ||
        l.subject.includes(q) ||
        String(l.year).includes(q) ||
        String(l.number).includes(q)
    );
  }, [query]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // Focus the search input shortly after opening (delayed so the slide-in
  // animation doesn't fight with the soft keyboard on mobile).
  useEffect(() => {
    if (drawerOpen) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 280);
      return () => window.clearTimeout(t);
    }
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    window.setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 220);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen, closeDrawer]);

  // Tap a law in the list → fire onOpenLaw immediately, but DON'T close
  // the drawer. Highlight the tapped row briefly so the user has visual
  // feedback of which law they're now viewing.
  const handleSelectLaw = useCallback(
    (law: Law) => {
      onOpenLaw(law);
      setHighlightedLawId(law.id);
      // Clear the highlight after a moment so it doesn't look stuck.
      window.setTimeout(() => setHighlightedLawId(null), 1500);
    },
    [onOpenLaw]
  );

  // Confirm button → fires onSearch with the current query, then closes.
  // If the query is empty, this is a no-op (the button is also disabled
  // in that case, but we double-check here).
  const handleConfirmSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    onSearch(q);
    closeDrawer();
  }, [query, onSearch, closeDrawer]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if the click landed on the overlay itself, not a child.
      if (e.target === e.currentTarget) closeDrawer();
    },
    [closeDrawer]
  );

  const hasQuery = query.trim().length > 0;

  return (
    <>
      {/* FAB — fixed on the LEFT edge, mobile only. Dark charcoal rounded
          rectangle with a hamburger icon, vertically centered. */}
      {!drawerOpen && (
        <button
          className="mobile-law-fab-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="باز کردن فهرست قوانین"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      )}

      {/* Drawer overlay + panel */}
      {drawerOpen && (
        <>
          <div
            className="mobile-law-drawer-overlay"
            onClick={handleOverlayClick}
            aria-hidden
          />
          <aside
            className={`mobile-law-drawer-panel ${drawerClosing ? "closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="فهرست قوانین"
          >
            <div className="mobile-law-drawer-header">
              <h3>قوانین</h3>
              <button
                className="mobile-law-drawer-close"
                onClick={closeDrawer}
                aria-label="بستن"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mobile-law-drawer-body">
              {/* Search input — filters the list live, but does NOT fire
                  onSearch. The confirm button below commits the search. */}
              <div className="relative mb-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter on the search field also triggers confirm,
                    // since that's a strong user signal of intent.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmSearch();
                    }
                  }}
                  placeholder="جستجوی قانون…"
                  className="input-legal text-[13px]"
                  style={{ paddingLeft: "2.25rem" }}
                  aria-label="جستجوی قانون"
                />
                <span
                  aria-hidden
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                </span>
              </div>

              <p className="text-[11px] text-[#6b6b6b] mb-2">
                {toFa(filtered.length)} قانون
                {hasQuery && (
                  <span className="text-[#9a9a9a]">
                    {" "}
                    — برای اعمال جستجو، «تأیید» را بزنید
                  </span>
                )}
              </p>

              {/* Scrollable law list. Tap a row → fire onOpenLaw, drawer
                  stays open. The currently-viewing row is briefly
                  highlighted via highlightedLawId. */}
              <div className="mobile-law-drawer-list">
                {filtered.map((law) => {
                  const isHighlighted = highlightedLawId === law.id;
                  return (
                    <button
                      key={law.id}
                      onClick={() => handleSelectLaw(law)}
                      className={`mobile-law-drawer-item ${isHighlighted ? "highlighted" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-legal text-[13px] font-medium text-[#1a1a1a] leading-snug">
                          {law.title}
                        </span>
                        <span className={statusPillClass(law.status)}>
                          {statusLabel(law.status)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6b6b6b] cite">
                        {law.type} · {toFa(law.year)}
                        {law.number && law.number !== "—" && ` · ش. ${toFa(law.number)}`}
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-[12px] text-[#6b6b6b]">
                    قانونی یافت نشد
                  </div>
                )}
              </div>
            </div>

            {/* Confirm button — fixed at the bottom of the drawer.
                Disabled when the search field is empty (no point firing
                an empty search). */}
            <div className="mobile-law-drawer-footer">
              <button
                type="button"
                onClick={handleConfirmSearch}
                disabled={!hasQuery}
                className={`btn-legal w-full ${!hasQuery ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                تأیید جستجو
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
