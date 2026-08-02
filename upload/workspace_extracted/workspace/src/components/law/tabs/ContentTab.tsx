"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { Law, ArticleNode, CommentaryItem, AmendmentEvent } from "@/lib/types";
import { toFa, formatJalaliDate, provisionRefLabel } from "@/lib/utils";

interface ContentTabProps {
  law: Law;
  onOpenLawById?: (id: string) => void;
  onOpenComparison?: (amendment: AmendmentEvent) => void;
}

/**
 * Parses article text containing [تN]...[تN] markers and renders them as
 * clickable superscript markers, mirroring legislation.gov.uk's F-marker system.
 */
function renderAnnotatedText(
  text: string,
  markers: { marker: string; id: string }[]
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /\[ت([۰-۹]+)\]/g;
  let lastIdx = 0;
  const stack: string[] = [];
  let key = 0;

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(
        <span key={`t-${key++}`}>{text.slice(lastIdx, match.index)}</span>
      );
    }
    const markerNum = match[1];
    const markerKey = `ت${markerNum}`;
    const markerObj = markers.find((m) => m.marker === markerKey);
    const top = stack[stack.length - 1];

    if (top === markerKey) {
      stack.pop();
      parts.push(<span key={`c-${key++}`} className="LegSubstitution" />);
    } else if (markerObj) {
      stack.push(markerKey);
      parts.push(
        <sup key={`m-${key++}`} className="f-marker" title={`نشانگر ${markerKey}`}>
          {markerKey}
        </sup>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(<span key={`t-${key++}`}>{text.slice(lastIdx)}</span>);
  }
  return parts;
}

/**
 * iOS-picker-style article selector with:
 *   - Vertical scroll-snap with mask-image fade at top/bottom
 *   - Search input that filters + jumps
 *   - Tap to select
 *   - Debounced scroll detection (prevents "crazy" rapid selection changes
 *     when the user does a massive fling scroll)
 */
function ArticlePicker({
  articles,
  selectedId,
  onSelect,
  totalCount,
}: {
  articles: ArticleNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  totalCount: number;
}) {
  const [filter, setFilter] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // Lock to prevent scroll-triggered selection updates while we're
  // programmatically scrolling OR while the user is still flinging.
  const scrollLockRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);
  const lastSelectedRef = useRef<string | null>(selectedId);

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
            onSelect(idToCompare);
          }
        }
      }, 180);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    };
  }, [onSelect]);

  // Smooth-scroll to the currently selected item when selection changes
  // externally (e.g., from Next/Previous buttons or initial mount).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const targetId = selectedId || "all";
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
    lastSelectedRef.current = selectedId;
  }, [selectedId]);

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

  const handleSelect = useCallback((id: string | null) => {
    lastSelectedRef.current = id;
    onSelect(id);
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
  }, [onSelect]);

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

          {/* All-articles option */}
          <button
            type="button"
            data-id="all"
            role="option"
            aria-selected={selectedId === null}
            onClick={() => handleSelect(null)}
            className={`article-picker-item ${selectedId === null ? "is-active" : ""}`}
          >
            <span className="font-legal text-[13px]">همه مواد</span>
            <span className="picker-sub cite">({toFa(totalCount)})</span>
          </button>
          {filtered.map((a) => (
            <button
              type="button"
              key={a.id}
              data-id={a.id}
              role="option"
              aria-selected={selectedId === a.id}
              onClick={() => handleSelect(a.id)}
              className={`article-picker-item ${selectedId === a.id ? "is-active" : ""}`}
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
        برای انتخاب، بکشید یا شماره ماده را تایپ کنید
      </p>
    </div>
  );
}

function CommentaryItemView({
  commentary,
  onOpenLawById,
  onOpenComparison,
  parentLaw,
}: {
  commentary: CommentaryItem;
  onOpenLawById?: (id: string) => void;
  onOpenComparison?: (amendment: AmendmentEvent) => void;
  parentLaw: Law;
}) {
  const matchingAmendment = useMemo(() => {
    return parentLaw.amendments.find(
      (a) =>
        a.affectingLaw.lawId === commentary.affectingLaw.lawId &&
        a.date === commentary.date
    );
  }, [commentary, parentLaw]);

  const hasComparison = !!(matchingAmendment && (matchingAmendment.beforeText || matchingAmendment.afterText || matchingAmendment.diffSegments));

  return (
    <div className="commentary-item">
      <span className="commentary-marker">{commentary.marker}</span>{" "}
      <span className="text-[#1a1a1a]">
        {commentary.effectType === "اصلاح" && "عبارت اصلاح شد"}
        {commentary.effectType === "افزوده" && "الحاق شد"}
        {commentary.effectType === "حذف" && "حذف شد"}
        {commentary.effectType === "جایگزینی" && "جایگزین شد"}
        {commentary.effectType === "توضیح" && "توضیح داده شد"}
        {commentary.effectType === "اجرا" && "اجرا شد"}
        {commentary.effectType === "الحقاق" && "الحاق شد"}
        {commentary.effectType === "تفویض اختیار" && "اختیار تفویض شد"}
      </span>{" "}
      <span className="cite">({formatJalaliDate(commentary.date)})</span>
      <span> به موجب </span>
      <button
        onClick={() => commentary.affectingLaw.lawId && onOpenLawById?.(commentary.affectingLaw.lawId)}
        className="link-legal cite"
      >
        {provisionRefLabel(commentary.affectingLaw)}
      </button>
      <p className="mt-1 text-[#3d3d3d]">{commentary.text}</p>
      {hasComparison && matchingAmendment && (
        <button
          onClick={() => onOpenComparison?.(matchingAmendment)}
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-[#1f4f3a] hover:underline"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="9" height="12" rx="1" />
            <rect x="13" y="6" width="9" height="12" rx="1" />
          </svg>
          مشاهده مقایسه پیش و پس از اصلاح
        </button>
      )}
    </div>
  );
}

function ArticleView({
  article,
  onOpenLawById,
  onOpenComparison,
  parentLaw,
}: {
  article: ArticleNode;
  onOpenLawById?: (id: string) => void;
  onOpenComparison?: (amendment: AmendmentEvent) => void;
  parentLaw: Law;
}) {
  return (
    <article id={article.id} className="mb-8 scroll-mt-32">
      <header className="mb-2.5">
        <h3 className="font-legal text-[16.5px] font-semibold text-[#1a1a1a] flex items-baseline gap-3">
          <span className="cite text-[#6b6b6b] text-[14px]">{article.number}</span>
          {article.title && <span>{article.title}</span>}
        </h3>
      </header>
      <div className="legal-text pr-4 border-r-2 border-[#ececea]">
        <p>
          {renderAnnotatedText(
            article.text,
            (article.commentary || []).map((c) => ({ marker: c.marker, id: c.marker }))
          )}
        </p>
      </div>

      {article.commentary && article.commentary.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed border-[#ececea]">
          <p className="text-[11.5px] text-[#6b6b6b] mb-2 uppercase tracking-wide">
            یادداشت‌های ویرایشی
          </p>
          {article.commentary.map((c, idx) => (
            <CommentaryItemView
              key={idx}
              commentary={c}
              onOpenLawById={onOpenLawById}
              onOpenComparison={onOpenComparison}
              parentLaw={parentLaw}
            />
          ))}
        </div>
      )}
    </article>
  );
}

/** Next/Previous article navigation bar — shown only when a specific article is selected. */
function ArticleNavBar({
  articles,
  selectedId,
  onSelect,
}: {
  articles: ArticleNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (!selectedId) return null;
  const currentIndex = articles.findIndex((a) => a.id === selectedId);
  if (currentIndex === -1) return null;
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  return (
    <div className="article-nav-bar">
      {/* Previous (in RTL: appears on the right) */}
      <button
        className="article-nav-btn article-nav-prev"
        onClick={() => prevArticle && onSelect(prevArticle.id)}
        disabled={!prevArticle}
        aria-label="ماده قبلی"
      >
        <span className="nav-dir">ماده قبلی</span>
        <span className="nav-article">
          <span className="nav-arrow" aria-hidden>›</span>{" "}
          {prevArticle ? prevArticle.number : "—"}
        </span>
      </button>

      <span className="article-nav-position">
        {toFa(currentIndex + 1)} / {toFa(articles.length)}
      </span>

      {/* Next (in RTL: appears on the left) */}
      <button
        className="article-nav-btn article-nav-next"
        onClick={() => nextArticle && onSelect(nextArticle.id)}
        disabled={!nextArticle}
        aria-label="ماده بعدی"
      >
        <span className="nav-dir">ماده بعدی</span>
        <span className="nav-article">
          {nextArticle ? nextArticle.number : "—"}{" "}
          <span className="nav-arrow" aria-hidden>‹</span>
        </span>
      </button>
    </div>
  );
}

export function ContentTab({ law, onOpenLawById, onOpenComparison }: ContentTabProps) {
  const [version, setVersion] = useState<"revised" | "original">("revised");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const articles = useMemo(() => {
    if (selectedArticleId) {
      return law.articles.filter((a) => a.id === selectedArticleId);
    }
    return law.articles;
  }, [law, selectedArticleId]);

  return (
    <div className="container-legal py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Desktop article picker sidebar — hidden on mobile */}
        <aside className="lg:col-span-1 order-1 hidden lg:block">
          <div className="lg:sticky lg:top-4">
            <h3 className="font-legal text-[13px] font-semibold text-[#1a1a1a] mb-2.5">
              مواد این قانون
            </h3>
            <ArticlePicker
              articles={law.articles}
              selectedId={selectedArticleId}
              onSelect={setSelectedArticleId}
              totalCount={law.articles.length}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3 order-2">
          <div className="mb-5 pb-4 border-b border-[#ececea]">
            <p className="text-[13px] leading-7 text-[#3d3d3d]">
              <span className="font-semibold text-[#1a1a1a]">{law.title}</span> (
              {toFa(law.year)}) تا تاریخ{" "}
              <span className="cite">{formatJalaliDate(law.lastRevisionDate)}</span> با
              تمامی اصلاحات شناخته‌شده به‌روز است. تغییراتی که در تاریخ آینده اجرا
              می‌شوند در تب «خط زمانی اصلاحات» قابل مشاهده است.
            </p>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-[#6b6b6b] ml-2">نمایش نسخه:</span>
              <button
                onClick={() => setVersion("revised")}
                className={`utility-pill ${
                  version === "revised"
                    ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]"
                    : ""
                }`}
              >
                نسخه فعلی (اصلاح‌شده)
              </button>
              {law.originalVersion && (
                <button
                  onClick={() => setVersion("original")}
                  className={`utility-pill ${
                    version === "original"
                      ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]"
                      : ""
                  }`}
                >
                  نسخه مصوب (اصل) — {toFa(law.originalVersion.approvedDate.split("/")[0])}
                </button>
              )}
            </div>

            {version === "original" && (
              <p className="text-[12.5px] text-[#6b6b6b] mt-2 italic">
                این نسخه اصلی قانون است؛ یعنی متن قانون به همان صورتی که در تاریخ{" "}
                {formatJalaliDate(law.originalVersion?.approvedDate || law.approvedDate)}{" "}
                به تصویب رسیده، بدون در نظر گرفتن اصلاحات بعدی.
              </p>
            )}
          </div>

          <div>
            {articles.map((article) => (
              <ArticleView
                key={article.id}
                article={article}
                onOpenLawById={onOpenLawById}
                onOpenComparison={onOpenComparison}
                parentLaw={law}
              />
            ))}
          </div>

          {/* Bottom navigation too, for convenience */}
          <ArticleNavBar
            articles={law.articles}
            selectedId={selectedArticleId}
            onSelect={setSelectedArticleId}
          />

          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[14px] text-[#3d3d3d]">ماده‌ای برای نمایش یافت نشد.</p>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-[#ececea]">
            <p className="text-[12px] text-[#6b6b6b] mb-2">نحوه استناد به این قانون:</p>
            <div className="cite-block cite">
              {law.title}. مصوب {formatJalaliDate(law.approvedDate)}. شماره {law.number}.
              مرجع تصویب: {law.promulgatingAuthority}. آخرین بازنگری:{" "}
              {formatJalaliDate(law.lastRevisionDate)}. قانون‌یاب (ghanunyab.ir).
              دسترسی: {formatJalaliDate("۱۴۰۴/۰۵/۰۶")}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
