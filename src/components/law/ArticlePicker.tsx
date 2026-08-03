"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { ArticleNode } from "@/lib/types";
import { toFa } from "@/lib/utils";

interface ArticlePickerProps {
  articles: ArticleNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  totalCount: number;
  /**
   * Optional preview mode. When `onPreviewChange` is provided, the picker
   * enters preview mode: scroll + tap update `previewId` via the callback
   * INSTEAD of committing `onSelect`. The caller is then responsible for
   * committing the preview via a separate confirm action (e.g. a "تأیید"
   * button in the mobile drawer). This prevents users from accidentally
   * landing on the wrong article while scrolling — they have to
   * explicitly press confirm to actually switch articles.
   *
   * When `onPreviewChange` is omitted (desktop use), the picker behaves
   * as before: scroll + tap both commit `onSelect` immediately.
   */
  previewId?: string | null;
  onPreviewChange?: (id: string | null) => void;
}

/**
 * iOS-picker-style article selector with:
 *   - Vertical scroll-snap with mask-image fade at top/bottom
 *   - Search input that filters + jumps
 *   - Tap to select
 *   - Debounced scroll detection (prevents "crazy" rapid selection changes
 *     when the user does a massive fling scroll)
 *
 * Used both:
 *   - On desktop, as the right-side sticky sidebar of the law detail view
 *     (inside ContentTab).
 *   - On mobile, inside MobileLawDrawer — same UI, same behavior, so the
 *     touch experience mirrors what desktop users see.
 */
export function ArticlePicker({
  articles,
  selectedId,
  onSelect,
  totalCount,
  previewId,
  onPreviewChange,
}: ArticlePickerProps) {
  const [filter, setFilter] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // Lock to prevent scroll-triggered selection updates while we're
  // programmatically scrolling OR while the user is still flinging.
  const scrollLockRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);

  // Preview mode: when onPreviewChange is provided, scroll + tap update
  // the *preview* (visual highlight) instead of committing the selection.
  // The caller commits via a separate confirm action. This is used by the
  // mobile drawer so users can scroll freely without accidentally switching
  // articles — they have to press "تأیید" to actually switch.
  const inPreviewMode = onPreviewChange !== undefined;
  // The id that currently drives the "is-active" highlight + auto-scroll:
  //   - Preview mode: previewId (falls back to selectedId if previewId is
  //     undefined, e.g. before the user has interacted)
  //   - Normal mode: selectedId
  const effectiveId = inPreviewMode ? (previewId ?? selectedId) : selectedId;
  // The callback that scroll/tap should fire:
  //   - Preview mode: onPreviewChange
  //   - Normal mode: onSelect
  const handleChange = inPreviewMode ? onPreviewChange! : onSelect;
  const lastSelectedRef = useRef<string | null>(effectiveId);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return articles;
    const faToLatin = (s: string) =>
      s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    const qNorm = faToLatin(q);
    return articles.filter(
      (a) =>
        a.number.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).includes(qNorm) ||
        (a.title && a.title.includes(q))
    );
  }, [articles, filter]);

  // Scroll detection — debounced with a 180ms idle window. This prevents the
  // "goes crazy" behavior when the user does a massive fling scroll: we wait
  // until the scroll position has been stable for 180ms before updating the
  // selection. Also we use a lock to ignore scroll events that we ourselves
  // triggered via smooth-scroll-to-item.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (scrollLockRef.current) return;
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = window.setTimeout(() => {
        const containerCenter = el.clientHeight / 2;
        const children = Array.from(el.querySelectorAll<HTMLElement>("[data-id]"));
        let closest: HTMLElement | null = null;
        let closestDist = Infinity;
        for (const child of children) {
          const childCenter = child.offsetTop + child.offsetHeight / 2 - el.scrollTop;
          const dist = Math.abs(childCenter - containerCenter);
          if (dist < closestDist) {
            closestDist = dist;
            closest = child;
          }
        }
        if (closest) {
          const id = closest.getAttribute("data-id");
          const idToCompare = id === "all" ? null : id;
          if (idToCompare !== lastSelectedRef.current) {
            lastSelectedRef.current = idToCompare;
            handleChange(idToCompare);
          }
        }
      }, 180);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    };
  }, [handleChange]);

  // Smooth-scroll to the currently effective item when it changes
  // externally (e.g., from Next/Previous buttons, initial mount, or — in
  // preview mode — when the caller resets the preview to selectedId on
  // drawer open).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const targetId = effectiveId || "all";
    const target = el.querySelector<HTMLElement>(`[data-id="${targetId}"]`);
    if (target) {
      // Only auto-scroll if the target is not already centered (avoid loops)
      const targetCenter = target.offsetTop + target.offsetHeight / 2 - el.scrollTop;
      const containerCenter = el.clientHeight / 2;
      if (Math.abs(targetCenter - containerCenter) > 10) {
        scrollLockRef.current = true;
        el.scrollTo({
          top: target.offsetTop - el.clientHeight / 2 + target.offsetHeight / 2,
          behavior: "smooth",
        });
        window.setTimeout(() => {
          scrollLockRef.current = false;
        }, 500);
      }
    }
    lastSelectedRef.current = effectiveId;
  }, [effectiveId]);

  // When filter changes, re-scroll to the first matching item (or "all")
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-id]");
    if (first) {
      scrollLockRef.current = true;
      el.scrollTo({ top: first.offsetTop - 60, behavior: "smooth" });
      window.setTimeout(() => {
        scrollLockRef.current = false;
      }, 400);
    }
  }, [filter]);

  // Tap handler. In preview mode this updates the preview (and centers the
  // tapped item) but does NOT commit — the caller commits via confirm.
  // In normal mode this commits immediately.
  const handleSelect = useCallback((id: string | null) => {
    lastSelectedRef.current = id;
    handleChange(id);
    const el = listRef.current;
    if (!el) return;
    const targetId = id || "all";
    const target = el.querySelector<HTMLElement>(`[data-id="${targetId}"]`);
    if (target) {
      scrollLockRef.current = true;
      el.scrollTo({
        top: target.offsetTop - el.clientHeight / 2 + target.offsetHeight / 2,
        behavior: "smooth",
      });
      window.setTimeout(() => {
        scrollLockRef.current = false;
      }, 500);
    }
  }, [handleChange]);

  return (
    <div>
      {/* Search / jump-to input */}
      <div className="relative mb-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="جستجوی شماره ماده…"
          className="input-legal pl-8 text-[13px]"
          style={{ paddingLeft: "2rem" }}
          aria-label="جستجوی ماده"
        />
        <span
          aria-hidden
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        </span>
      </div>

      {/* Picker container with iOS-style mask-image fade */}
      <div className="relative">
        {/* Selection highlight band (the "cylinder" center) — subtle guide lines */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-9 border-y border-[#d8d6d2] pointer-events-none z-[1]"
        />
        <div
          ref={listRef}
          className="article-picker-list"
          role="listbox"
          aria-label="فهرست مواد"
        >
          {/* Top spacer so the first item can be centered in the selection band */}
          <div className="article-picker-spacer" aria-hidden />

          {/* All-articles option. The count uses `picker-count` (inline) so it
              stays on the same line as "همه مواد" — `picker-sub` would force
              it onto a second line because that class is `display: block`
              (intentionally, for the per-article title which IS supposed to
              wrap below the article number). */}
          <button
            type="button"
            data-id="all"
            role="option"
            aria-selected={effectiveId === null}
            onClick={() => handleSelect(null)}
            className={`article-picker-item ${effectiveId === null ? "is-active" : ""}`}
          >
            <span className="font-legal text-[13px]">همه مواد</span>
            <span className="picker-count cite">({toFa(totalCount)})</span>
          </button>
          {filtered.map((a) => (
            <button
              type="button"
              key={a.id}
              data-id={a.id}
              role="option"
              aria-selected={effectiveId === a.id}
              onClick={() => handleSelect(a.id)}
              className={`article-picker-item ${effectiveId === a.id ? "is-active" : ""}`}
            >
              <span className="cite text-[13px]">{a.number}</span>
              {a.title && (
                <span className="picker-sub">{a.title}</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-6 text-center text-[12px] text-[#6b6b6b]">
              ماده‌ای یافت نشد
            </div>
          )}
          {/* Bottom spacer so the last item can be centered in the selection band */}
          <div className="article-picker-spacer" aria-hidden />
        </div>
      </div>

      <p className="mt-2 text-[10.5px] text-[#6b6b6b] text-center leading-4">
        {inPreviewMode
          ? "برای انتخاب بکشید، سپس «تأیید» را بزنید"
          : "برای انتخاب، بکشید یا شماره ماده را تایپ کنید"}
      </p>
    </div>
  );
}
