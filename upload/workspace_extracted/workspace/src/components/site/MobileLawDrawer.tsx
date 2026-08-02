"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { laws } from "@/data/laws";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";

interface MobileLawDrawerProps {
  onOpenLaw: (law: Law) => void;
  onSearch: (query: string) => void;
}

/**
 * Mobile-only law navigation FAB + drawer.
 * - A small circular tag button fixed on the LEFT side of the screen (mobile only).
 * - When tapped, a drawer slides in from the LEFT covering ~50% of the screen.
 * - The drawer contains a search input and a scrollable list of all laws.
 * - Tapping a law or submitting a search auto-closes the drawer.
 */
export function MobileLawDrawer({ onOpenLaw, onSearch }: MobileLawDrawerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [query, setQuery] = useState("");

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

  const handleSelectLaw = useCallback(
    (law: Law) => {
      onOpenLaw(law);
      closeDrawer();
    },
    [onOpenLaw, closeDrawer]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
        closeDrawer();
      }
    },
    [query, onSearch, closeDrawer]
  );

  return (
    <>
      {/* FAB tag button — fixed on the LEFT side, mobile only */}
      {!drawerOpen && (
        <div className="mobile-law-fab">
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
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Drawer overlay + panel */}
      {drawerOpen && (
        <>
          <div
            className="mobile-law-drawer-overlay"
            onClick={closeDrawer}
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
              {/* Search input */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جستجوی قانون…"
                    className="input-legal text-[13px]"
                    style={{ paddingLeft: "2.25rem" }}
                    autoFocus
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
              </form>

              <p className="text-[11px] text-[#6b6b6b] mb-2">
                {toFa(filtered.length)} قانون
              </p>

              {/* Scrollable law list */}
              <div className="mobile-law-drawer-list">
                {filtered.map((law) => (
                  <button
                    key={law.id}
                    onClick={() => handleSelectLaw(law)}
                    className="mobile-law-drawer-item"
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
                ))}
                {filtered.length === 0 && (
                  <div className="py-8 text-center text-[12px] text-[#6b6b6b]">
                    قانونی یافت نشد
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
