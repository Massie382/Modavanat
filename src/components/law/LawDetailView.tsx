"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Law, AmendmentEvent } from "@/lib/types";
import { laws } from "@/data/laws";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { TableOfContentsTab } from "./tabs/TableOfContentsTab";
import { ContentTab } from "./tabs/ContentTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { ReferencesTab } from "./tabs/ReferencesTab";
import { ResourcesTab } from "./tabs/ResourcesTab";
import { AmendmentComparisonView } from "./AmendmentComparisonView";
import { BackToTop } from "./BackToTop";
import { MobileLawDrawer } from "@/components/site/MobileLawDrawer";
import { toFa, statusLabel, statusPillClass, formatJalaliDate } from "@/lib/utils";

/**
 * Wrapper around the article-selection state so it can be driven from BOTH:
 *   - The desktop right-side ArticlePicker (inside ContentTab)
 *   - The mobile drawer ArticlePicker (inside MobileLawDrawer)
 * Whichever side the user picks an article from, the same state updates and
 * both sides stay in sync. Selecting an article also auto-switches to the
 * "content" tab so the user immediately sees the chosen article.
 *
 * `initialArticleId` (optional) seeds the selection on first mount — used
 * when deep-linking from a search result article snippet
 * (`/law/{id}?article={articleId}`). It is only honored on the initial
 * mount for the given law; if the user later navigates to a different
 * law (same component instance, different `lawId`), the effect below
 * resets the selection back to null.
 */
function useArticleSelection(lawId: string, initialArticleId?: string) {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    initialArticleId ?? null
  );

  // Reset selection when the law itself changes — otherwise stale article
  // IDs from the previous law would persist into the new law's view. We
  // intentionally do NOT re-seed from `initialArticleId` here because that
  // prop is meant for the initial mount only; if the user navigates to a
  // different law via the prev/next buttons, they expect to land on the
  // law's default view, not have an unrelated article pre-selected.
  useEffect(() => {
    setSelectedArticleId(null);
  }, [lawId]);

  return { selectedArticleId, setSelectedArticleId };
}

type TabId = "contents" | "content" | "timeline" | "references" | "resources";

interface LawDetailViewProps {
  law: Law;
  onBack: () => void;
  onOpenLawById?: (id: string) => void;
  /**
   * Optional article id to deep-link to on initial mount. When provided,
   * the view starts on the "content" tab with this article selected
   * (instead of the default "contents" tab with no selection). Used by the
   * search page to jump straight from a search-result article snippet to
   * that article inside the law detail view.
   */
  initialArticleId?: string;
}

const TABS: { id: TabId; label: string; help?: string }[] = [
  { id: "contents", label: "فهرست مطالب" },
  { id: "content", label: "متن قانون" },
  {
    id: "timeline",
    label: "خط زمانی اصلاحات",
    help: "تاریخچه کامل اصلاحات اعمال‌شده بر این قانون به همراه وضعیت اعمال در متن.",
  },
  {
    id: "references",
    label: "ارجاعات",
    help: "فهرست ارجاعات متقابل میان این قانون و سایر قوانین.",
  },
  {
    id: "resources",
    label: "منابع بیشتر",
    help: "منابع مرتبط شامل نسخه اصلی، فهرست تغییرات و سایر اطلاعات.",
  },
];

export function LawDetailView({ law, onBack, onOpenLawById, initialArticleId }: LawDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>(
    initialArticleId ? "content" : "contents"
  );
  const [comparisonAmendment, setComparisonAmendment] = useState<AmendmentEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const { selectedArticleId, setSelectedArticleId } = useArticleSelection(law.id, initialArticleId);

  // Reading-progress bar: a ref to the inner <div> whose `transform: scaleX()`
  // is updated on scroll. We keep a single passive scroll listener (combined
  // with a resize listener so the percentage stays correct if the viewport
  // height changes after fonts/images load).
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const update = () => {
      const el = progressBarRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const max = (doc.scrollHeight - doc.clientHeight) || 0;
      const percent = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      el.style.transform = `scaleX(${percent})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // "کپی پیوند" feedback — show "کپی شد!" for 2s, then revert to "کپی پیوند".
  // We keep the timeout in a ref so a rapid second click resets the timer
  // instead of letting the first timeout hide the confirmation early.
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCopyLink = async () => {
    const href = window.location.href;
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Fallback for older browsers / insecure contexts: select a hidden
      // input and run execCommand. This is deprecated but still works in
      // most browsers and costs us nothing if it fails.
      try {
        const ta = document.createElement("textarea");
        ta.value = href;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* no-op — the button will still flash "کپی شد!" even if the copy silently failed */
      }
    }
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Prev/next law navigation: look up the current law's index in the master
  // `laws` array. `useMemo` because the array is stable and we only need to
  // recompute when the law actually changes.
  const { prevLaw, nextLaw } = useMemo(() => {
    const idx = laws.findIndex((l) => l.id === law.id);
    if (idx === -1) return { prevLaw: null, nextLaw: null };
    return {
      prevLaw: idx > 0 ? laws[idx - 1] : null,
      nextLaw: idx < laws.length - 1 ? laws[idx + 1] : null,
    };
  }, [law.id]);

  // Wrap setSelectedArticleId so that picking an article from the mobile
  // drawer ALSO switches to the "content" tab — otherwise the drawer would
  // set selection state but the user wouldn't see anything change because
  // they're still on (e.g.) the timeline tab. On desktop this is a no-op
  // because the picker only lives inside ContentTab (already on the content
  // tab when it's visible).
  //
  // We also smooth-scroll the article into view on every selection. This
  // fires whether the user picked a DIFFERENT article (state change →
  // re-render → scroll) or RE-SELECTED the same article (state bails out,
  // but we still scroll imperatively). The scroll is deferred via double
  // rAF so the article element has been painted before we try to scroll —
  // important when we just switched tabs and the article wasn't in the
  // DOM a moment ago.
  const scrollToArticle = useCallback((id: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }, []);

  const handleSelectArticle = (id: string | null) => {
    setSelectedArticleId(id);
    if (id !== null && activeTab !== "content") {
      setActiveTab("content");
    }
    if (id) {
      scrollToArticle(id);
    }
  };

  // React to URL-driven article changes while staying on the same law. When
  // the user is already viewing /law/A and a search-result snippet links
  // them to /law/A?article=X, the [id] route segment doesn't change, so
  // this component instance stays mounted — the useState initializer in
  // useArticleSelection does NOT re-run, and neither does the [lawId]
  // reset effect. This effect explicitly re-seeds the selection (and
  // switches to the content tab + scrolls to the article) whenever
  // initialArticleId changes.
  // (The setState-in-effect pattern matches the existing [lawId] reset
  // effect above; the project's lint config flags it but the build does
  // not fail on it.)
  useEffect(() => {
    if (initialArticleId === undefined) return;
    setSelectedArticleId(initialArticleId);
    if (initialArticleId) {
      // Use the functional setter so we don't need to depend on `activeTab`
      // (avoids re-firing this effect on every tab change).
      setActiveTab((prev) => (prev === "content" ? prev : "content"));
      scrollToArticle(initialArticleId);
    }
  }, [initialArticleId, scrollToArticle]);

  // Sentinel + IntersectionObserver: toggle the .sub-tab-bar-sticky class
  // on the sub-tab bar when it's actively sticking. This lets us add a
  // shadow / lift effect only while pinned, not when the user is reading
  // the article header.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const subTabBarRef = useRef<HTMLDivElement | null>(null);
  const subTabListRef = useRef<HTMLUListElement | null>(null);
  const [tabEdgeStart, setTabEdgeStart] = useState(false); // « visible (toward start/right in RTL)
  const [tabEdgeEnd, setTabEdgeEnd] = useState(false);     // » visible (toward end/left in RTL)

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const subTabBar = subTabBarRef.current;
    if (!sentinel || !subTabBar || typeof IntersectionObserver === "undefined") return;

    // rootMargin: when the sentinel scrolls UP past the top of the viewport
    // (i.e. crosses the header line), the bar is sticking. We use a small
    // negative bottom margin so the toggle happens just as the bar reaches
    // the header, not after it has visually "jumped".
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            subTabBar.classList.remove("sub-tab-bar-sticky");
          } else {
            subTabBar.classList.add("sub-tab-bar-sticky");
          }
        }
      },
      { rootMargin: "0px 0px -100% 0px", threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // Track horizontal scroll on the sub-tab <ul> to show «» edge indicators
  // when there are hidden tabs beyond either edge. Only relevant on mobile
  // where the bar scrolls horizontally.
  useEffect(() => {
    const el = subTabListRef.current;
    if (!el) return;
    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) {
        setTabEdgeStart(false);
        setTabEdgeEnd(false);
        return;
      }
      // In RTL, scrollLeft is 0 at the start (right edge) and goes negative
      // toward the end (left edge). Normalize with abs so it works either way.
      const fromStart = Math.abs(el.scrollLeft);
      const fromEnd = Math.abs(maxScroll) - fromStart;
      setTabEdgeStart(fromStart > 4);
      setTabEdgeEnd(fromEnd > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div>
      {/* Reading progress bar — thin charcoal bar fixed to the very top of
          the viewport. The inner <div>'s transform: scaleX() is updated on
          scroll (see the useEffect above). transform-origin sits at the
          start edge (right in RTL) so the bar grows toward the end edge. */}
      <div className="reading-progress" aria-hidden="true">
        <div ref={progressBarRef} className="reading-progress-bar" />
      </div>

      {/* Comparison modal */}
      {comparisonAmendment && (
        <AmendmentComparisonView
          amendment={comparisonAmendment}
          parentLaw={law}
          onClose={() => setComparisonAmendment(null)}
          onNavigateToAmendingLaw={(lawId) => {
            setComparisonAmendment(null);
            onOpenLawById?.(lawId);
          }}
        />
      )}
      {/* Breadcrumb */}
      <div className="hairline-b bg-[#fafaf8]">
        <div className="container-legal">
          <Breadcrumb
            items={[
              { label: "خانه", onClick: onBack },
              { label: "قوانین", onClick: onBack },
              { label: `${toFa(law.year)}` },
              { label: law.title },
            ]}
          />
        </div>
      </div>

      {/* Law header */}
      <div className="hairline-b">
        <div className="container-legal py-7">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#6b6b6b] mb-1.5 cite">
                {law.type} · {toFa(law.year)}
                {law.number && law.number !== "—" && ` · شماره ${toFa(law.number)}`}
              </p>
              <h1 className="font-legal text-[28px] md:text-[32px] font-light text-[#1a1a1a] leading-tight mb-3">
                {law.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={statusPillClass(law.status)}>
                  {statusLabel(law.status)}
                </span>
                <span className="pill">قلمرو: {law.extent}</span>
                <span className="pill">موضوع: {law.subject}</span>
                <span className="pill">مرجع تصویب: {law.promulgatingAuthority}</span>
              </div>
            </div>

            {/* Utility buttons — چاپ & دانلود PDF both open the browser
                print dialog (the user can pick "Save as PDF" as the
                destination); کپی پیوند copies the current URL. */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="utility-pill"
                onClick={() => window.print()}
                title="این صفحه را چاپ کنید"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                چاپ
              </button>
              <button
                type="button"
                className="utility-pill"
                onClick={() => window.print()}
                title="در پنجرهٔ چاپ، مقصد را «ذخیره به‌صورت PDF» انتخاب کنید"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                دانلود PDF
              </button>
              <button
                type="button"
                className="utility-pill"
                onClick={handleCopyLink}
                title="پیوند این صفحه را در کلیپ‌بورد کپی کنید"
                aria-live="polite"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                {copied ? "کپی شد!" : "کپی پیوند"}
              </button>
            </div>
          </div>

          {/* Description block */}
          <p className="text-[14.5px] leading-8 text-[#1a1a1a] max-w-4xl">
            {law.description}
          </p>

          {/* Metadata grid */}
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-5 pt-5 border-t border-[#ececea] text-[13px]">
            <div>
              <dt className="text-[#6b6b6b] text-[12px] mb-0.5">تاریخ تصویب</dt>
              <dd className="cite text-[#1a1a1a]">{formatJalaliDate(law.approvedDate)}</dd>
            </div>
            <div>
              <dt className="text-[#6b6b6b] text-[12px] mb-0.5">تاریخ اجرا</dt>
              <dd className="cite text-[#1a1a1a]">{formatJalaliDate(law.effectiveDate)}</dd>
            </div>
            <div>
              <dt className="text-[#6b6b6b] text-[12px] mb-0.5">آخرین بازنگری</dt>
              <dd className="cite text-[#1a1a1a]">{formatJalaliDate(law.lastRevisionDate)}</dd>
            </div>
            <div>
              <dt className="text-[#6b6b6b] text-[12px] mb-0.5">تعداد مواد</dt>
              <dd className="cite text-[#1a1a1a]">{toFa(law.articles.length)} ماده</dd>
            </div>
          </dl>

          {/* Outstanding changes notice */}
          {law.outstandingChanges.length > 0 && (
            <div className="mt-5 p-3.5 border border-[#d8d3bb] bg-[#faf7ed] text-[13px] leading-6">
              <p className="text-[#1a1a1a]">
                <span className="font-semibold">توجه:</span> این قانون به‌روز است
                و تمامی اصلاحات شناخته‌شده تا تاریخ {formatJalaliDate(law.lastRevisionDate)} در
                متن اعمال شده است. با این حال،{" "}
                <span className="font-semibold">
                  {toFa(law.outstandingChanges.length)} تغییر در انتظار اجرا
                </span>{" "}
                وجود دارد که در تب «خط زمانی اصلاحات» قابل مشاهده است.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sentinel for IntersectionObserver — sits 1px above the sub-tab bar.
          When this scrolls out of view (past the header), the bar is sticking. */}
      <div ref={sentinelRef} aria-hidden style={{ height: 1, pointerEvents: "none" }} />

      {/* Sub-tab bar */}
      <div ref={subTabBarRef} className="sub-tab-bar">
        <div className="container-legal sub-tab-bar-inner">
          <span
            className={`sub-tab-edge sub-tab-edge-start ${tabEdgeStart ? "is-on" : ""}`}
            aria-hidden="true"
          >«</span>
          <ul ref={subTabListRef}>
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? "active" : ""}
                  title={tab.help}
                >
                  {tab.label}
                  {tab.id === "timeline" && law.amendments.length > 0 && (
                    <span className="tab-count">{toFa(law.amendments.length)}</span>
                  )}
                  {tab.id === "references" && law.references.length > 0 && (
                    <span className="tab-count">{toFa(law.references.length)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <span
            className={`sub-tab-edge sub-tab-edge-end ${tabEdgeEnd ? "is-on" : ""}`}
            aria-hidden="true"
          >»</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white">
        {activeTab === "contents" && (
          <TableOfContentsTab
            law={law}
            onOpenArticle={(articleId) => {
              // Switch to the content tab AND scroll to the first
              // article of the clicked مبحث. We defer the scroll via
              // `requestAnimationFrame` (single rAF is enough here
              // because the content tab's article list is rendered
              // synchronously on tab switch — unlike the initial
              // mount which needs double rAF for fonts/images).
              setActiveTab("content");
              if (articleId) {
                // Use the existing handleSelectArticle path so we get
                // the same scroll-into-view behavior the mobile drawer
                // and the desktop article picker use. The tab switch
                // above is also handled inside handleSelectArticle,
                // so the redundant setActiveTab above is harmless —
                // we keep it for clarity.
                requestAnimationFrame(() => handleSelectArticle(articleId));
              }
            }}
          />
        )}
        {activeTab === "content" && (
          <ContentTab
            law={law}
            selectedArticleId={selectedArticleId}
            onSelectArticle={handleSelectArticle}
            onOpenLawById={onOpenLawById}
            onOpenComparison={setComparisonAmendment}
          />
        )}
        {activeTab === "timeline" && (
          <TimelineTab
            law={law}
            onOpenLawById={onOpenLawById}
            onOpenComparison={setComparisonAmendment}
          />
        )}
        {activeTab === "references" && <ReferencesTab law={law} onOpenLawById={onOpenLawById} />}
        {activeTab === "resources" && <ResourcesTab law={law} onOpenLawById={onOpenLawById} />}
      </div>

      {/* Prev/next law navigation — hairline-bordered bar at the bottom of
          the law detail page. Shows the previous law (on the start / right
          side in RTL) and the next law (on the end / left side). Either side
          is hidden entirely if there is no adjacent law. */}
      {(prevLaw || nextLaw) && (
        <nav className="law-prev-next" aria-label="ناوبری قانون قبلی و بعدی">
          {prevLaw ? (
            <button
              type="button"
              className="pn-prev"
              onClick={() => onOpenLawById?.(prevLaw.id)}
              title={`قانون قبلی: ${prevLaw.title}`}
            >
              <span className="pn-arrow" aria-hidden="true">«</span>
              <span className="pn-body">
                <span className="pn-label">قانون قبلی</span>
                <span className="pn-title">{prevLaw.title}</span>
              </span>
            </button>
          ) : (
            <span className="pn-prev is-empty" aria-hidden="true" />
          )}
          {nextLaw ? (
            <button
              type="button"
              className="pn-next"
              onClick={() => onOpenLawById?.(nextLaw.id)}
              title={`قانون بعدی: ${nextLaw.title}`}
            >
              <span className="pn-body">
                <span className="pn-label">قانون بعدی</span>
                <span className="pn-title">{nextLaw.title}</span>
              </span>
              <span className="pn-arrow" aria-hidden="true">»</span>
            </button>
          ) : (
            <span className="pn-next is-empty" aria-hidden="true" />
          )}
        </nav>
      )}

      {/* Mobile article picker drawer — slides in from the LEFT, mirrors the
          desktop right-side ArticlePicker UI (iOS-style scroll-snap list +
          search). Tapping an article updates the article view underneath but
          keeps the drawer open so the user can browse multiple articles. */}
      <MobileLawDrawer
        law={law}
        selectedArticleId={selectedArticleId}
        onSelectArticle={handleSelectArticle}
      />

      {/* Back-to-top button — fixed to the bottom-end corner, fades in after
          the user has scrolled 400px. See ./BackToTop.tsx for the scroll
          listener and `globals.css` for the fade transition. */}
      <BackToTop />
    </div>
  );
}
