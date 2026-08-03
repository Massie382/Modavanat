"use client";

import { useState, useMemo } from "react";
import type { Law, ArticleNode, CommentaryItem, AmendmentEvent } from "@/lib/types";
import { toFa, formatJalaliDate, provisionRefLabel } from "@/lib/utils";
import { ArticlePicker } from "../ArticlePicker";

interface ContentTabProps {
  law: Law;
  selectedArticleId: string | null;
  onSelectArticle: (id: string | null) => void;
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

export function ContentTab({
  law,
  selectedArticleId,
  onSelectArticle,
  onOpenLawById,
  onOpenComparison,
}: ContentTabProps) {
  const [version, setVersion] = useState<"revised" | "original">("revised");

  const articles = useMemo(() => {
    if (selectedArticleId) {
      return law.articles.filter((a) => a.id === selectedArticleId);
    }
    return law.articles;
  }, [law, selectedArticleId]);

  return (
    <div className="container-legal py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Desktop article picker sidebar — hidden on mobile.
            The mobile equivalent lives inside MobileLawDrawer (see LawDetailView).
            Sticky positioning: the sidebar follows the user as they scroll
            through the article text. The top offset accounts for BOTH the
            site header (variable, published as --site-header-h by <Header />)
            AND the law-detail sub-tab bar (sticky at top: var(--site-header-h),
            ~50px tall) so the picker sits just below the sub-tab bar with a
            small gap, instead of being hidden behind it. */}
        <aside className="lg:col-span-1 order-1 hidden lg:block">
          <div
            className="lg:sticky"
            style={
              {
                top: "calc(var(--site-header-h, 180px) + 4rem)",
              } as React.CSSProperties
            }
          >
            <h3 className="font-legal text-[13px] font-semibold text-[#1a1a1a] mb-2.5">
              مواد این قانون
            </h3>
            <ArticlePicker
              articles={law.articles}
              selectedId={selectedArticleId}
              onSelect={onSelectArticle}
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
            onSelect={onSelectArticle}
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
              {formatJalaliDate(law.lastRevisionDate)}. مدونات (modavanat.ir).
              دسترسی: {formatJalaliDate("۱۴۰۴/۰۵/۰۶")}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
