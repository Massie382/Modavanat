"use client";

import { useState, useEffect, useRef } from "react";
import type { Law, AmendmentEvent } from "@/lib/types";
import { Breadcrumb } from "@/components/site/Breadcrumb";
import { TableOfContentsTab } from "./tabs/TableOfContentsTab";
import { ContentTab } from "./tabs/ContentTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { ReferencesTab } from "./tabs/ReferencesTab";
import { ResourcesTab } from "./tabs/ResourcesTab";
import { AmendmentComparisonView } from "./AmendmentComparisonView";
import { MobileLawDrawer } from "@/components/site/MobileLawDrawer";
import { toFa, statusLabel, statusPillClass, formatJalaliDate } from "@/lib/utils";

type TabId = "contents" | "content" | "timeline" | "references" | "resources";

interface LawDetailViewProps {
  law: Law;
  onBack: () => void;
  onOpenLawById?: (id: string) => void;
  onOpenLaw?: (law: Law) => void;
  onSearch?: (query: string) => void;
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

export function LawDetailView({ law, onBack, onOpenLawById, onOpenLaw, onSearch }: LawDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("contents");
  const [comparisonAmendment, setComparisonAmendment] = useState<AmendmentEvent | null>(null);

  // Sentinel + IntersectionObserver: toggle the .sub-tab-bar-sticky class
  // on the sub-tab bar when it's actively sticking. This lets us add a
  // shadow / lift effect only while pinned, not when the user is reading
  // the article header.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const subTabBarRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div>
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

            {/* Utility buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button className="utility-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                چاپ
              </button>
              <button className="utility-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                دانلود PDF
              </button>
              <button className="utility-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11a9 9 0 0 1 9 9"></path>
                  <path d="M4 4a16 16 0 0 1 16 16"></path>
                  <circle cx="5" cy="19" r="1"></circle>
                </svg>
                اشتراک RSS
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
        <div className="container-legal">
          <ul>
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
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white">
        {activeTab === "contents" && (
          <TableOfContentsTab law={law} onOpenArticle={() => setActiveTab("content")} />
        )}
        {activeTab === "content" && (
          <ContentTab
            law={law}
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

      {/* Mobile law drawer — only shown on the article page, slides in
          from the LEFT. Has its own confirm button so the user can scroll
          and pick freely without the drawer auto-closing. */}
      <MobileLawDrawer onOpenLaw={onOpenLaw} onSearch={onSearch} />
    </div>
  );
}
