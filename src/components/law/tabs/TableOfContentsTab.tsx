"use client";

import { useState, useEffect, useMemo } from "react";
import type { Law, TOCItem } from "@/lib/types";
import { toFa } from "@/lib/utils";

interface TableOfContentsTabProps {
  law: Law;
  /**
   * Fired when the user clicks a leaf node (a مبحث) that contains one or
   * more articles. The renderer passes the FIRST articleId in that
   * مبحث's `articleIds` list — the parent is expected to switch to the
   * "content" tab and scroll to that article.
   */
  onOpenArticle: (articleId?: string) => void;
}

// ── Per-type metadata ────────────────────────────────────────────────────
// Each structural level gets its own visual treatment so the user can
// tell at a glance whether a row is a کتاب, فصل, باب, or مبحث. The
// `tagLabel` is the small uppercase prefix shown in the cite column;
// `depth` is the nesting depth this type sits at in the canonical
// 4-level model (کتاب → فصل → باب → مبحث).
const TYPE_META: Record<
  TOCItem["type"],
  { tagLabel: string; citeWidth: string; citeColor: string; titleClass: string }
> = {
  book: {
    tagLabel: "کتاب",
    citeWidth: "w-24",
    citeColor: "text-[#8b6b3e]",
    titleClass: "font-legal text-[15px] font-semibold text-[#1a1a1a]",
  },
  chapter: {
    tagLabel: "فصل",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "font-legal text-[14px] font-medium text-[#1a1a1a]",
  },
  section: {
    tagLabel: "باب",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "font-legal text-[13.5px] font-medium text-[#3d3d3d]",
  },
  topic: {
    tagLabel: "مبحث",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "text-[13px] text-[#1a1a1a]",
  },
  // Legacy types — kept for backward compatibility. The renderer should
  // never encounter these in the new dataset, but if it does, fall back
  // to a neutral style.
  part: {
    tagLabel: "بخش",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "font-legal text-[14px] font-medium text-[#3d3d3d]",
  },
  article: {
    tagLabel: "ماده",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "text-[13px] text-[#1a1a1a]",
  },
  schedule: {
    tagLabel: "پیوست",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "text-[13px] text-[#1a1a1a]",
  },
  note: {
    tagLabel: "یادداشت",
    citeWidth: "w-20",
    citeColor: "text-[#6b6b6b]",
    titleClass: "text-[13px] text-[#1a1a1a]",
  },
};

// Only these types are rendered in the new structural TOC. If the data
// accidentally contains an `article` leaf, it is silently filtered out.
const RENDERED_TYPES: ReadonlySet<TOCItem["type"]> = new Set([
  "book",
  "chapter",
  "section",
  "topic",
  "part",
  "schedule",
  "note",
]);

// ── Top-level component ──────────────────────────────────────────────────
export function TableOfContentsTab({ law, onOpenArticle }: TableOfContentsTabProps) {
  // "باز کردن همه" / "جمع کردن همه" controls. We don't lift this state
  // into the children — instead we use a "generation" counter that, when
  // incremented, forces every TOCNode's useState to expand/collapse. The
  // mechanism: a useEffect in TOCNode resets its `expanded` state when the
  // `expandGeneration` prop changes. We pass that prop down via a small
  // wrapper. Simpler than lifting all state to the parent because the
  // initial expansion (depth<2) still needs to be respected on reset.
  const [expandAll, setExpandAll] = useState<boolean | null>(null);
  // null = untouched; true = force-expand-all; false = force-collapse-all

  const topItems = useMemo(
    () => law.toc.filter((c) => RENDERED_TYPES.has(c.type)),
    [law.toc],
  );

  return (
    <div className="container-legal py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TOC */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a]">
                فهرست مطالب
              </h2>
              <p className="text-[12.5px] text-[#6b6b6b] mt-1">
                ساختار سلسله‌مراتبی {law.title} ({toFa(law.year)}) — کتاب، فصل، باب، مبحث
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="utility-pill"
                onClick={() => setExpandAll(true)}
              >
                باز کردن همه
              </button>
              <button
                className="utility-pill"
                onClick={() => setExpandAll(false)}
              >
                جمع کردن همه
              </button>
            </div>
          </div>

          <ul className="border-t border-[#ececea]">
            {topItems.map((item) => (
              <TOCNode
                key={item.id}
                item={item}
                depth={0}
                onOpenArticle={onOpenArticle}
                expandGeneration={expandAll}
              />
            ))}
          </ul>

          <div className="mt-6 p-4 bg-[#fafaf8] border border-[#ececea] text-[13px] leading-6 text-[#3d3d3d]">
            <p className="font-legal font-semibold text-[#1a1a1a] mb-1.5">یادداشت ویرایشی</p>
            <p>
              این فهرست بر اساس ساختار رسمی قانون — کتاب، فصل، باب و مبحث —
              تنظیم شده است و مواد قانونی به‌صورت جداگانه در آن درج نمی‌شوند.
              برای مراجعه به متن مواد، روی هر مبحث کلیک کنید یا به تب
              «متن قانون» مراجعه نمایید.
            </p>
          </div>
        </div>

        {/* Side panel */}
        <aside className="lg:border-r lg:border-[#ececea] lg:pr-6 space-y-6">
          <div>
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-2">
              خلاصه قانون
            </h3>
            <p className="text-[13px] leading-7 text-[#3d3d3d]">
              {law.longDescription || law.description}
            </p>
          </div>

          <div>
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-2">
              اطلاعات کلی
            </h3>
            <dl className="text-[12.5px] space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-[#6b6b6b]">نوع</dt>
                <dd className="text-[#1a1a1a]">{law.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b6b6b]">سال تصویب</dt>
                <dd className="cite text-[#1a1a1a]">{toFa(law.year)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b6b6b]">شماره</dt>
                <dd className="cite text-[#1a1a1a]">{law.number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b6b6b]">قلمرو</dt>
                <dd className="text-[#1a1a1a]">{law.extent}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b6b6b]">موضوع</dt>
                <dd className="text-[#1a1a1a]">{law.subject}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b6b6b]">تعداد مواد</dt>
                <dd className="cite text-[#1a1a1a]">{toFa(law.articles.length)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-2">
              نسخه‌ها
            </h3>
            <ul className="text-[12.5px] space-y-1">
              <li className="flex justify-between items-baseline">
                <span>نسخه فعلی (اصلاح‌شده)</span>
                <span className="cite text-[#6b6b6b]">فعلی</span>
              </li>
              {law.originalVersion && (
                <li className="flex justify-between items-baseline">
                  <button className="link-legal">نسخه مصوب (اصل)</button>
                  <span className="cite text-[#6b6b6b]">
                    {toFa(law.originalVersion.approvedDate.split("/")[0])}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Single TOC node ─────────────────────────────────────────────────────
// A node either has children (کتاب/فصل/باب — expand/collapse only) or is
// a مبحث leaf carrying `articleIds`. Clicking a مبحث with articleIds
// switches to the content tab and jumps to the first article in that مبحث.
//
// The expand/collapse-all controls work via the `expandGeneration` prop:
// when the parent bumps it (true = force-expand-all, false = force-
// collapse-all), each instance's useEffect overrides its local `expanded`
// state. A `null` value means "no override" (initial state respected).
function TOCNode({
  item,
  depth,
  onOpenArticle,
  expandGeneration,
}: {
  item: TOCItem;
  depth: number;
  onOpenArticle: (articleId?: string) => void;
  expandGeneration: boolean | null;
}) {
  const [expanded, setExpanded] = useState(depth < 3);
  // Default-expand down to depth 2 (کتاب / فصل / باب) so users see the
  // full 4-level structure on first view. مبحث leaves have no children
  // so they're always rendered inside their (expanded) parent باب.

  useEffect(() => {
    if (expandGeneration === null) return;
    setExpanded(expandGeneration);
  }, [expandGeneration]);

  const hasChildren = !!(item.children && item.children.length > 0);
  const isLeaf = item.type === "topic";
  const meta = TYPE_META[item.type] ?? TYPE_META.topic;
  const hasArticleIds = !!(item.articleIds && item.articleIds.length > 0);

  // For a مبحث leaf with articleIds, clicking the row opens the first
  // article in the content tab. If the مبحث has no articles in the
  // sample (e.g. a structural chapter exists in the real law but the
  // sample dataset doesn't yet populate article text for it), it's
  // rendered as a non-clickable label so the user isn't misled into
  // clicking a dead link.
  const handleClick = () => {
    if (isLeaf && hasArticleIds) {
      onOpenArticle(item.articleIds![0]);
    }
  };

  return (
    <li className="toc-item-wrap" data-type={item.type}>
      <div
        className={`toc-item ${isLeaf && hasArticleIds ? "is-clickable" : ""}`}
        style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "جمع کردن" : "باز کردن"}
            aria-expanded={expanded}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-[#6b6b6b] hover:text-[#1a1a1a] text-[13px]"
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="shrink-0 w-5 h-5 inline-block" aria-hidden="true" />
        )}
        <span
          className={`cite ${meta.citeWidth} ${meta.citeColor} text-[12px] shrink-0`}
        >
          {item.label}
        </span>
        {isLeaf && hasArticleIds ? (
          <button onClick={handleClick} className={`toc-label text-right ${meta.titleClass}`}>
            {item.title || item.label}
          </button>
        ) : (
          <span className={meta.titleClass}>{item.title}</span>
        )}
      </div>
      {hasChildren && expanded && (
        <ul>
          {item.children!
            .filter((c) => RENDERED_TYPES.has(c.type))
            .map((child) => (
              <TOCNode
                key={child.id}
                item={child}
                depth={depth + 1}
                onOpenArticle={onOpenArticle}
                expandGeneration={expandGeneration}
              />
            ))}
        </ul>
      )}
    </li>
  );
}
