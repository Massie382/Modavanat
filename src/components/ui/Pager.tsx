"use client";

import { toFa } from "@/lib/utils";

interface PagerProps {
  /** 1-indexed current page */
  currentPage: number;
  /** total number of pages */
  totalPages: number;
  /** called with the new page number (1-indexed) when the user clicks a control */
  onPageChange: (page: number) => void;
  /**
   * How many page number buttons to show on each side of the current page
   * before collapsing into an ellipsis. Default: 1.
   */
  siblingCount?: number;
  /** Optional label shown to the side, e.g. "صفحه ۱ از ۸". Default: none. */
  showSummary?: boolean;
  /** Optional Persian unit label for the summary, e.g. "نتیجه" or "اصلاح". */
  unitLabel?: string;
  /** Total item count (only used for the summary text). */
  totalItems?: number;
}

/**
 * Windowed, RTL-friendly pager.
 *
 * Renders:
 *   ‹ قبلی  [۱] [۲] [۳] … [۷] [۸]  بعدی ›
 *
 * - All labels are Persian.
 * - All numbers are converted to Persian digits via `toFa`.
 * - Uses `.btn-legal-ghost` / `.btn-legal-sm` so the pager visually matches
 *   the rest of the site (no extra CSS needed).
 * - The arrows are flipped for RTL: "قبلی" (previous) appears on the right
 *   with a chevron pointing right; "بعدی" (next) appears on the left with
 *   a chevron pointing left.
 */
export function Pager({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showSummary = false,
  unitLabel,
  totalItems,
}: PagerProps) {
  if (totalPages <= 1) {
    // Even with a single page we still render a summary if requested, so the
    // user can see "۸ اصلاح" / "۸ نتیجه" on a one-pager.
    if (showSummary && typeof totalItems === "number") {
      return (
        <div className="pager-wrap">
          <p className="pager-summary">
            {toFa(totalItems)} {unitLabel ?? "مورد"}
          </p>
        </div>
      );
    }
    return null;
  }

  // Build the list of page slots. Each slot is either a number or "…" (ellipsis).
  const slots: (number | "ellipsis")[] = [];
  const first = 1;
  const last = totalPages;

  // Always show the first page.
  slots.push(first);

  // Left window
  const leftStart = Math.max(first + 1, currentPage - siblingCount);
  // Right window
  const rightEnd = Math.min(last - 1, currentPage + siblingCount);

  if (leftStart > first + 1) slots.push("ellipsis");
  for (let p = leftStart; p <= rightEnd; p++) slots.push(p);
  if (rightEnd < last - 1) slots.push("ellipsis");

  // Always show the last page (unless it's already there).
  if (last !== first) slots.push(last);

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange(p);
  };

  return (
    <div className="pager-wrap">
      {showSummary && typeof totalItems === "number" && (
        <p className="pager-summary">
          {toFa(totalItems)} {unitLabel ?? "مورد"} · صفحه {toFa(currentPage)} از{" "}
          {toFa(totalPages)}
        </p>
      )}
      <nav className="pager" aria-label="صفحه‌بندی">
        {/* Previous (قبلی) — RTL: chevron pointing right (→ visual right) */}
        <button
          type="button"
          className="btn-legal btn-legal-ghost btn-legal-sm pager-arrow"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="صفحه قبلی"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>قبلی</span>
        </button>

        <ul className="pager-list">
          {slots.map((slot, i) => {
            if (slot === "ellipsis") {
              return (
                <li key={`e-${i}`} className="pager-ellipsis" aria-hidden>
                  …
                </li>
              );
            }
            const isActive = slot === currentPage;
            return (
              <li key={slot}>
                <button
                  type="button"
                  className={`btn-legal btn-legal-sm pager-num ${
                    isActive ? "pager-num-active" : "btn-legal-ghost"
                  }`}
                  onClick={() => goTo(slot)}
                  aria-label={`صفحه ${toFa(slot)}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {toFa(slot)}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Next (بعدی) — RTL: chevron pointing left (→ visual left) */}
        <button
          type="button"
          className="btn-legal btn-legal-ghost btn-legal-sm pager-arrow"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="صفحه بعدی"
        >
          <span>بعدی</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </nav>

      {/* Inline styles so the pager is self-contained — no globals.css edit needed. */}
      <style jsx>{`
        .pager-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.25rem;
        }
        .pager-summary {
          font-size: 12.5px;
          color: #6b6b6b;
          margin: 0;
        }
        .pager {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .pager-list {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .pager-ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.5rem;
          color: #6b6b6b;
          font-size: 14px;
        }
        .pager-arrow {
          gap: 0.3rem;
        }
        .pager-arrow:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pager-num {
          min-width: 2rem;
          padding-inline: 0.5rem;
        }
        .pager-num-active {
          background-color: var(--charcoal, #1f1f1f);
          color: #ffffff;
          border-color: var(--charcoal, #1f1f1f);
        }
        .pager-num-active:hover {
          background-color: var(--charcoal-deep, #0f0f0f);
          border-color: var(--charcoal-deep, #0f0f0f);
        }
        @media (max-width: 480px) {
          .pager-arrow span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
