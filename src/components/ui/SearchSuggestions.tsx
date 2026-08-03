"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { laws } from "@/data/laws";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";

interface SearchSuggestionsProps {
  /** Current value of the search input. */
  query: string;
  /** Fired when the user picks a suggestion (mouse click or Enter on a
   *  highlighted row). Receives the law that was picked. */
  onPick: (law: Law) => void;
  /** Fired when the user picks the "use this query as full-text search"
   *  row at the top of the dropdown. */
  onSearch: (query: string) => void;
  /** The <input> element we should anchor to. The dropdown is positioned
   *  absolutely relative to this wrapper. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Max number of law suggestions to show (excluding the "search for X"
   *  row at the top). Default: 6. */
  maxSuggestions?: number;
}

/**
 * Google-style search suggestions dropdown for the homepage hero search.
 *
 * Behavior:
 *   - Appears below the input when the user types at least 1 non-space
 *     character AND the input is focused.
 *   - Smoothly drops down (CSS transition on max-height + opacity).
 *   - Top row: "جستجوی کامل برای «query»" → fires onSearch (goes to the
 *     full search page).
 *   - Following rows: matching laws, each with title, type/year/number
 *     meta, and a status pill. Clicking fires onPick (opens law detail).
 *   - Keyboard navigation: ArrowDown/ArrowUp to move the highlight,
 *     Enter to activate, Escape to close.
 *   - Mouse hover also moves the highlight.
 *   - Click-outside closes the dropdown.
 *   - Matches Persian OR ASCII digits in the query against the law's
 *     title, subject, year, number, and article text.
 *   - Matches are ranked: title startsWith > title includes > subject
 *     includes > article text includes. Ties broken by year descending
 *     (newer first).
 *
 * Styling is self-contained (styled-jsx) so no globals.css edit is
 * required. The dropdown visually attaches to the bottom of the input
 * via absolute positioning relative to a wrapper the caller provides.
 */
export function SearchSuggestions({
  query,
  onPick,
  onSearch,
  inputRef,
  maxSuggestions = 6,
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1); // -1 = none, 0 = "search for" row, 1..N = law rows
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Persian→ASCII digit normalization so a query like "۱۳۰۷" matches
  // data stored with either Persian or ASCII digits.
  const normalize = (s: string): string =>
    s
      .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .trim()
      .toLowerCase();

  // Compute matching laws. Memoized on query.
  const matches = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    const scored: { law: Law; score: number }[] = [];
    for (const law of laws) {
      const titleNorm = normalize(law.title);
      const subjectNorm = normalize(law.subject);
      const yearStr = String(law.year);
      const numberNorm = normalize(law.number ?? "");

      let score = 0;
      if (titleNorm.startsWith(q)) score = 100;
      else if (titleNorm.includes(q)) score = 80;
      else if (subjectNorm.includes(q)) score = 60;
      else if (yearStr.includes(q)) score = 40;
      else if (numberNorm.includes(q)) score = 30;
      else if (
        law.articles.some((a) => normalize(a.text).includes(q) || normalize(a.number).includes(q))
      ) {
        score = 20;
      } else if (normalize(law.description).includes(q)) {
        score = 10;
      }

      if (score > 0) {
        scored.push({ law, score });
      }
    }

    // Sort: higher score first; tie-break by newer year first.
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.law.year - a.law.year;
    });

    return scored.slice(0, maxSuggestions).map((s) => s.law);
  }, [query, maxSuggestions]);

  // Total rows = 1 ("search for") + matches.length.
  const totalRows = matches.length + 1;

  // Open the dropdown when the input gains focus AND there's a non-empty
  // query. Close when it loses focus (with a small delay so a click on a
  // suggestion row registers before the blur closes us).
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onFocus = () => {
      if (query.trim()) setIsOpen(true);
    };
    const onBlur = () => {
      // Delay so click on suggestion fires first.
      window.setTimeout(() => setIsOpen(false), 150);
    };

    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);
    return () => {
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
    };
  }, [inputRef, query]);

  // Open/close in response to typing.
  useEffect(() => {
    if (query.trim()) {
      // Don't force-open on every keystroke if the input isn't focused
      // (e.g. programmatically set). Only open if focused.
      if (document.activeElement === inputRef.current) setIsOpen(true);
    } else {
      setIsOpen(false);
      setHighlighted(-1);
    }
    // Reset highlight when the result set changes.
    setHighlighted(-1);
  }, [query, inputRef]);

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen]);

  // Keyboard navigation. We attach the listener to the input so it works
  // regardless of where the dropdown's focus is.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        // If the user presses ArrowDown while the dropdown is closed but
        // there IS a query, open it.
        if (e.key === "ArrowDown" && query.trim()) {
          setIsOpen(true);
          setHighlighted(0);
          e.preventDefault();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, totalRows - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        // If a row is highlighted, activate it instead of submitting the
        // form. The form's own onSubmit handler still fires for the
        // non-highlighted case (highlighted === -1).
        if (highlighted === 0) {
          e.preventDefault();
          onSearch(query.trim());
          setIsOpen(false);
        } else if (highlighted >= 1 && highlighted <= matches.length) {
          e.preventDefault();
          onPick(matches[highlighted - 1]);
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setHighlighted(-1);
      }
    };

    input.addEventListener("keydown", onKeyDown);
    return () => input.removeEventListener("keydown", onKeyDown);
  }, [isOpen, highlighted, matches, query, onSearch, onPick, inputRef, totalRows]);

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={wrapperRef} className="ss-wrapper">
      <div
        className={`ss-dropdown ${showDropdown ? "ss-open" : ""}`}
        role="listbox"
        aria-label="پیشنهادهای جستجو"
      >
        {/* Top row: full-text search for the exact query */}
        <button
          type="button"
          className={`ss-row ss-row-search ${highlighted === 0 ? "ss-highlighted" : ""}`}
          onMouseEnter={() => setHighlighted(0)}
          onClick={() => {
            onSearch(query.trim());
            setIsOpen(false);
          }}
        >
          <span className="ss-search-icon" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <span className="ss-search-text">
            جستجوی کامل برای{" "}
            <span className="ss-query cite">«{query.trim()}»</span>
          </span>
          <span className="ss-arrow" aria-hidden>↵</span>
        </button>

        {/* Divider + label between the "search for" row and the law suggestions */}
        {matches.length > 0 && (
          <div className="ss-divider">
            <span>قوانین مرتبط</span>
          </div>
        )}

        {/* Law suggestions */}
        {matches.map((law, idx) => {
          const rowIdx = idx + 1; // offset by 1 because row 0 is the "search for" row
          return (
            <button
              key={law.id}
              type="button"
              className={`ss-row ss-row-law ${highlighted === rowIdx ? "ss-highlighted" : ""}`}
              onMouseEnter={() => setHighlighted(rowIdx)}
              onClick={() => {
                onPick(law);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={highlighted === rowIdx}
            >
              <div className="ss-law-main">
                <span className="ss-law-title">{law.title}</span>
                <span className={statusPillClass(law.status)}>
                  {statusLabel(law.status)}
                </span>
              </div>
              <div className="ss-law-meta cite">
                {law.type} · {toFa(law.year)}
                {law.number && law.number !== "—" && ` · شماره ${toFa(law.number)}`}
                {" · "}{law.subject}
              </div>
            </button>
          );
        })}

        {/* Empty state — no law matches, only the "search for" row */}
        {matches.length === 0 && (
          <div className="ss-empty">
            قانونی دقیقاً مطابق عبارت وارد شده یافت نشد. جستجوی کامل را امتحان کنید.
          </div>
        )}

        {/* Footer hint */}
        <div className="ss-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> برای پیمایش
          </span>
          <span>
            <kbd>↵</kbd> برای انتخاب
          </span>
          <span>
            <kbd>Esc</kbd> برای بستن
          </span>
        </div>
      </div>

      <style jsx>{`
        .ss-wrapper {
          position: relative;
        }
        .ss-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          left: 0;
          z-index: 60;
          margin-top: 4px;
          background-color: #ffffff;
          border: 1px solid #d8d6d2;
          border-radius: 2px;
          box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.18),
            0 4px 10px -4px rgba(0, 0, 0, 0.08);

          /* Smooth open/close: animate max-height + opacity. The
             max-height is generous (480px) so even with 6 suggestions
             the dropdown never clips during the animation. */
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          pointer-events: none;
          transition: max-height 0.22s cubic-bezier(0.22, 0.61, 0.36, 1),
            opacity 0.18s ease, transform 0.22s ease;
          transform: translateY(-4px);
        }
        .ss-dropdown.ss-open {
          max-height: 480px;
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .ss-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.6rem 0.85rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid #f0eee9;
          cursor: pointer;
          text-align: right;
          font-family: inherit;
          color: #1a1a1a;
          transition: background-color 0.1s ease;
        }
        .ss-row:last-of-type {
          border-bottom: none;
        }
        .ss-row.ss-highlighted {
          background-color: #f6f5f1;
        }

        .ss-row-search {
          font-size: 13.5px;
          color: #3d3d3d;
        }
        .ss-search-icon {
          display: inline-flex;
          color: #6b6b6b;
          flex-shrink: 0;
        }
        .ss-search-text {
          flex: 1;
          min-width: 0;
        }
        .ss-query {
          color: #1a1a1a;
          font-weight: 600;
        }
        .ss-arrow {
          font-size: 12px;
          color: #9c9c9c;
          flex-shrink: 0;
        }

        .ss-divider {
          padding: 0.4rem 0.85rem 0.3rem;
          font-size: 11px;
          color: #9c9c9c;
          background-color: #fafaf8;
          border-bottom: 1px solid #f0eee9;
          letter-spacing: 0.04em;
        }

        .ss-row-law {
          flex-direction: column;
          align-items: stretch;
          gap: 0.2rem;
          padding: 0.55rem 0.85rem;
        }
        .ss-law-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
        }
        .ss-law-title {
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1.4;
          flex: 1;
          min-width: 0;
          /* Truncate very long titles with an ellipsis so the row
             stays on a single line. */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ss-law-meta {
          font-size: 11.5px;
          color: #6b6b6b;
          line-height: 1.5;
        }

        .ss-empty {
          padding: 0.85rem;
          font-size: 12.5px;
          color: #6b6b6b;
          text-align: center;
          line-height: 1.6;
        }

        .ss-footer {
          display: flex;
          justify-content: flex-start;
          gap: 1rem;
          padding: 0.45rem 0.85rem;
          font-size: 10.5px;
          color: #9c9c9c;
          background-color: #fafaf8;
          border-top: 1px solid #f0eee9;
        }
        .ss-footer kbd {
          display: inline-block;
          min-width: 1.2em;
          padding: 1px 4px;
          font-family: inherit;
          font-size: 10px;
          color: #6b6b6b;
          background-color: #ffffff;
          border: 1px solid #d8d6d2;
          border-radius: 2px;
          line-height: 1.4;
          text-align: center;
        }

        /* Mobile: tighten the dropdown padding so it fits a 375px screen. */
        @media (max-width: 640px) {
          .ss-row {
            padding: 0.5rem 0.7rem;
          }
          .ss-law-title {
            font-size: 13.5px;
          }
          .ss-footer {
            flex-wrap: wrap;
            gap: 0.5rem;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
