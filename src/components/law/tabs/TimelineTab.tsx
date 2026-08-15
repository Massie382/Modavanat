"use client";

import { useState, useMemo, useEffect } from "react";
import type { Law, AmendmentEvent, EffectType } from "@/lib/types";
import { toFa, formatJalaliDate, shortJalaliDate, provisionRefLabel } from "@/lib/utils";
import { referencedLawTitles } from "@/data/laws";
import { Pager } from "@/components/ui/Pager";

const TIMELINE_PAGE_SIZE = 5;

interface TimelineTabProps {
  law: Law;
  onOpenLawById?: (id: string) => void;
  onOpenComparison?: (amendment: AmendmentEvent) => void;
}

type Direction = "affected" | "affecting";
type AppliedFilter = "all" | "applied" | "pending";

/** Parse a Jalali date string like "۱۳۹۲/۰۱/۱۵" into a comparable
 *  "YYYY/MM/DD" string with ASCII digits. Returns "" if input is empty. */
function normalizeJalaliDate(s: string): string {
  if (!s) return "";
  // The data uses Persian digits; convert to ASCII for safe string compare.
  // We accept either Persian or ASCII digits in the filter inputs.
  return s
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .trim();
}

export function TimelineTab({ law, onOpenLawById, onOpenComparison }: TimelineTabProps) {
  const [direction, setDirection] = useState<Direction>("affected");
  const [showOutstanding, setShowOutstanding] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "provision" | "effect">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ===== Extended search filters =====
  const [filterText, setFilterText] = useState("");
  const [filterEffectType, setFilterEffectType] = useState<EffectType | "">("");
  const [filterApplied, setFilterApplied] = useState<AppliedFilter>("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // All amendment events (chronological) — these are "changes affecting this law"
  const changes: AmendmentEvent[] = law.amendments;

  // Apply extended-search filters BEFORE sorting, so sort operates on the
  // narrowed set (and so the count shown to the user matches what's listed).
  const filtered = useMemo(() => {
    const q = filterText.trim();
    const from = normalizeJalaliDate(filterFromDate);
    const to = normalizeJalaliDate(filterToDate);
    return changes.filter((c) => {
      if (q) {
        const hay = `${c.description} ${c.affectedProvision} ${c.affectingLaw.title} ${c.affectingLaw.provisionLabel ?? ""}`;
        if (!hay.includes(q)) return false;
      }
      if (filterEffectType && c.effectType !== filterEffectType) return false;
      if (filterApplied === "applied" && !c.appliedToText) return false;
      if (filterApplied === "pending" && c.appliedToText) return false;
      const d = normalizeJalaliDate(c.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [changes, filterText, filterEffectType, filterApplied, filterFromDate, filterToDate]);

  // Reset filters handler — restores the full list.
  const resetFilters = () => {
    setFilterText("");
    setFilterEffectType("");
    setFilterApplied("all");
    setFilterFromDate("");
    setFilterToDate("");
  };

  const hasActiveFilters =
    !!filterText ||
    !!filterEffectType ||
    filterApplied !== "all" ||
    !!filterFromDate ||
    !!filterToDate;

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = a.date.localeCompare(b.date);
      else if (sortBy === "provision") cmp = a.affectedProvision.localeCompare(b.affectedProvision, "fa");
      else if (sortBy === "effect") cmp = a.effectType.localeCompare(b.effectType, "fa");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (col: "date" | "provision" | "effect") => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const sortInd = (col: "date" | "provision" | "effect") =>
    sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : null;

  // ===== Pagination state — TWO independent pagers (vertical list + table) =====
  const [listPage, setListPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);

  // Reset both pagers to page 1 whenever the filtered/sorted set changes
  // (otherwise we can end up on a stale page that no longer exists).
  useEffect(() => {
    setListPage(1);
    setTablePage(1);
  }, [filterText, filterEffectType, filterApplied, filterFromDate, filterToDate, sortBy, sortDir, law.id]);

  const listTotalPages = Math.max(1, Math.ceil(sorted.length / TIMELINE_PAGE_SIZE));
  const tableTotalPages = Math.max(1, Math.ceil(sorted.length / TIMELINE_PAGE_SIZE));

  // Defensive clamps.
  useEffect(() => { if (listPage > listTotalPages) setListPage(1); }, [listPage, listTotalPages]);
  useEffect(() => { if (tablePage > tableTotalPages) setTablePage(1); }, [tablePage, tableTotalPages]);

  const pagedList = useMemo(
    () => sorted.slice((listPage - 1) * TIMELINE_PAGE_SIZE, listPage * TIMELINE_PAGE_SIZE),
    [sorted, listPage]
  );
  const pagedTable = useMemo(
    () => sorted.slice((tablePage - 1) * TIMELINE_PAGE_SIZE, tablePage * TIMELINE_PAGE_SIZE),
    [sorted, tablePage]
  );

  // Distinct effect types present in this law's amendments — used to
  // populate the effect-type filter dropdown without hardcoding the union.
  const effectTypes = useMemo(() => {
    const set = new Set<EffectType>();
    changes.forEach((c) => set.add(c.effectType));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }, [changes]);

  // Group amendments by year for the timeline rail. ALWAYS uses the full
  // unfiltered set — the rail is a visual overview of the law's complete
  // history, not a reflection of the current text filter.
  const yearGroups = useMemo(() => {
    const map = new Map<number, AmendmentEvent[]>();
    [...changes]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((c) => {
        const y = parseInt(c.date.split("/")[0], 10);
        if (!map.has(y)) map.set(y, []);
        map.get(y)!.push(c);
      });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [changes]);

  return (
    <div className="container-legal py-8">
      {/* Intro */}
      <div className="mb-7 pb-5 border-b border-[#ececea]">
        <h2 className="font-legal text-[22px] font-light text-[#1a1a1a] mb-2">
          خط زمانی اصلاحات {law.title}
        </h2>
        <p className="text-[13.5px] leading-7 text-[#3d3d3d] max-w-3xl">
          این صفحه تاریخچه کامل اصلاحات اعمال‌شده بر {law.title} مصوب{" "}
          {formatJalaliDate(law.approvedDate)} را نمایش می‌دهد. هر ورودی نشان‌دهنده
          یک اصلاح واحد است: ماده مورد تأثیر، نوع اثر، قانون اصلاح‌کننده و تاریخ
          اجرا. می‌توانید اصلاحات را به ترتیب زمانی یا بر اساس ماده مرتب کنید و
          در صورت وجود، اصلاحات در انتظار اجرا را نیز مشاهده نمایید.
        </p>
      </div>

      {/* Top: visual timeline rail */}
      <section className="mb-8">
        <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mb-4">
          نمای کلی خط زمانی
        </h3>
        <div className="border border-[#ececea] bg-[#fdfdfb] p-5">
          {/* Year markers */}
          <div className="relative">
            {/* Horizontal axis */}
            <div className="relative h-24">
              {/* Base line */}
              <div className="absolute top-1/2 right-0 left-0 h-px bg-[#d8d6d2]" />

              {/* Enactment marker (start) */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center">
                <div className="w-3 h-3 bg-[#1f1f1f] rounded-full -mt-1.5" />
                <div className="absolute top-4 text-center">
                  <div className="text-[11px] text-[#6b6b6b] cite">تصویب</div>
                  <div className="text-[11.5px] text-[#1a1a1a] cite font-medium">
                    {toFa(law.year)}
                  </div>
                </div>
              </div>

              {/* Amendment markers distributed across axis */}
              {(() => {
                if (yearGroups.length === 0) return null;
                const minYear = law.year;
                const maxYear = Math.max(...yearGroups.map((g) => g[0]));
                const span = Math.max(1, maxYear - minYear);
                return yearGroups.map(([year, events]) => {
                  const pct = ((year - minYear) / span) * 100;
                  return (
                    <div
                      key={year}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group"
                      style={{ right: `${pct}%`, transform: `translateX(50%) translateY(-50%)` }}
                    >
                      <div className="relative">
                        <div
                          className="w-2.5 h-2.5 bg-white border-2 border-[#1f1f1f] rounded-full hover:scale-125 transition-transform"
                          title={`${toFa(year)} — ${toFa(events.length)} اصلاح`}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1f1f1f] text-white text-[11px] px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none cite">
                          {toFa(year)}: {toFa(events.length)} اصلاح
                        </div>
                      </div>
                      <div className="absolute top-4 text-center">
                        <div className="text-[11px] text-[#1a1a1a] cite font-medium">
                          {toFa(year)}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-6 text-[12px] text-[#6b6b6b]">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#1f1f1f] rounded-full" />
              تاریخ تصویب
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-white border-2 border-[#1f1f1f] rounded-full" />
              اصلاحات اعمال‌شده ({toFa(changes.length)})
            </span>
            {law.outstandingChanges.length > 0 && (
              <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#faf7ed] border-2 border-[#5a5a5a] rounded-full" />
                در انتظار اجرا ({toFa(law.outstandingChanges.length)})
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Outstanding changes (expandable) */}
      {law.outstandingChanges.length > 0 && (
        <section className="mb-8">
          <div className="border border-[#d8d3bb] bg-[#faf7ed]">
            <button
              onClick={() => setShowOutstanding(!showOutstanding)}
              className="w-full text-right p-4 flex items-center justify-between hover:bg-[#f5f1e0] transition-colors"
            >
              <div>
                <span className="font-legal font-semibold text-[15px] text-[#1a1a1a]">
                  تغییرات در انتظار اجرا
                </span>
                <span className="text-[12.5px] text-[#3d3d3d] mr-3">
                  {toFa(law.outstandingChanges.length)} تغییر آتی که هنوز بر متن اعمال نشده است
                </span>
              </div>
              <span className="text-[#1a1a1a]">
                {showOutstanding ? "− جمع کردن" : "+ باز کردن"}
              </span>
            </button>
            {showOutstanding && (
              <div className="border-t border-[#d8d3bb] p-4">
                <ul className="space-y-3">
                  {law.outstandingChanges.map((oc, idx) => (
                    <li key={idx} className="text-[13px] leading-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="pill pill-pending cite">
                          {oc.effectType}
                        </span>
                        <span className="font-legal font-medium text-[#1a1a1a] cite">
                          {oc.affectedProvision}
                        </span>
                        {oc.expectedDate && (
                          <span className="text-[12px] text-[#6b6b6b] cite">
                            اجرا از: {formatJalaliDate(oc.expectedDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-[#3d3d3d] mb-1">{oc.description}</p>
                      <p className="text-[12.5px] text-[#6b6b6b]">
                        به موجب{" "}
                        <button
                          onClick={() => oc.affectingLaw.lawId && onOpenLawById?.(oc.affectingLaw.lawId)}
                          className="link-legal cite"
                        >
                          {provisionRefLabel(oc.affectingLaw)}
                        </button>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Direction toggle */}
      <div className="mb-5 flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] text-[#6b6b6b] ml-2">جهت:</span>
        <button
          onClick={() => setDirection("affected")}
          className={`utility-pill ${
            direction === "affected"
              ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]"
              : ""
          }`}
        >
          اصلاحات اعمال‌شده بر این قانون ({toFa(changes.length)})
        </button>
        <button
          onClick={() => setDirection("affecting")}
          className={`utility-pill ${
            direction === "affecting"
              ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]"
              : ""
          }`}
        >
          اصلاحات اعمال‌شده توسط این قانون ({toFa(law.references.filter(r => r.direction === "amended-by" || r.direction === "cited-by").length)})
        </button>

        {/* Toggle button for the extended-search filter panel */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`utility-pill mr-auto ${showFilters ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]" : ""}`}
          aria-expanded={showFilters}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          جستجوی پیشرفته
          {hasActiveFilters && (
            <span className="cite text-[10.5px] bg-white/20 px-1.5 rounded-sm">
              فیلتر فعال
            </span>
          )}
        </button>
      </div>

      {/* Extended-search filter panel */}
      {showFilters && (
        <div className="mb-6 border border-[#e0ddd6] bg-[#fdfdfb] p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a]">
              فیلتر اصلاحات
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="link-legal text-[12.5px]"
              >
                بازنشانی فیلترها
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Free-text search */}
            <div className="md:col-span-5">
              <label className="block text-[12px] text-[#6b6b6b] mb-1.5">
                متن جستجو
              </label>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="عنوان قانون اصلاح‌کننده، ماده، یا شرح…"
                className="input-legal"
              />
            </div>

            {/* Effect type */}
            <div className="md:col-span-3">
              <label className="block text-[12px] text-[#6b6b6b] mb-1.5">
                نوع اثر
              </label>
              <select
                value={filterEffectType}
                onChange={(e) => setFilterEffectType(e.target.value as EffectType | "")}
                className="input-legal bg-white"
              >
                <option value="">همه انواع</option>
                {effectTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Applied status */}
            <div className="md:col-span-4">
              <label className="block text-[12px] text-[#6b6b6b] mb-1.5">
                وضعیت اعمال در متن
              </label>
              <div className="flex items-center gap-1.5">
                {([
                  { v: "all", label: "همه" },
                  { v: "applied", label: "اعمال‌شده" },
                  { v: "pending", label: "در انتظار" },
                ] as { v: AppliedFilter; label: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setFilterApplied(opt.v)}
                    className={`utility-pill ${filterApplied === opt.v ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range — from */}
            <div className="md:col-span-6">
              <label className="block text-[12px] text-[#6b6b6b] mb-1.5">
                تاریخ از (YYYY/MM/DD خورشیدی)
              </label>
              <input
                type="text"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                placeholder="مثلاً ۱۳۷۰/۰۱/۰۱"
                className="input-legal cite"
                dir="ltr"
              />
            </div>

            {/* Date range — to */}
            <div className="md:col-span-6">
              <label className="block text-[12px] text-[#6b6b6b] mb-1.5">
                تاریخ تا (YYYY/MM/DD خورشیدی)
              </label>
              <input
                type="text"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                placeholder="مثلاً ۱۴۰۰/۱۲/۲۹"
                className="input-legal cite"
                dir="ltr"
              />
            </div>
          </div>

          <p className="text-[12px] text-[#6b6b6b] mt-3">
            {toFa(filtered.length)} اصلاح از مجموع {toFa(changes.length)} مورد مطابق فیلتر فعلی.
          </p>
        </div>
      )}

      {/* Detailed chronological list (vertical timeline) */}
      <section className="mb-8">
        <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mb-4">
          فهرست تفصیلی اصلاحات به ترتیب زمانی
        </h3>
        <div className="timeline-rail pr-4">
          {pagedList.map((ev, idx) => {
            const hasComparison = !!(ev.beforeText || ev.afterText || ev.diffSegments);
            return (
              <div
                key={idx}
                className={`relative pb-6 pr-6 ${hasComparison ? "cursor-pointer group" : ""}`}
                onClick={() => hasComparison && onOpenComparison?.(ev)}
              >
                <div className="timeline-dot" />
                <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                  <span className="cite text-[13px] font-semibold text-[#1a1a1a]">
                    {formatJalaliDate(ev.date)}
                  </span>
                  <span className="text-[11.5px] text-[#6b6b6b]">({shortJalaliDate(ev.date)})</span>
                  <span className="pill cite">{ev.effectType}</span>
                  <span className="font-legal text-[13px] text-[#1a1a1a] cite">
                    {ev.affectedProvision}
                  </span>
                  {ev.appliedToText ? (
                    <span className="pill pill-in-force cite">اعمال‌شده در متن</span>
                  ) : (
                    <span className="pill pill-pending cite">در انتظار اعمال</span>
                  )}
                  {hasComparison && (
                    <span className="text-[11.5px] text-[#1f4f3a] mr-auto group-hover:underline">
                      مشاهده مقایسه ←
                    </span>
                  )}
                </div>
                <p className="text-[13.5px] leading-7 text-[#1a1a1a] mb-1.5">
                  {ev.description}
                </p>
                <p className="text-[12.5px] text-[#6b6b6b]">
                  به موجب{" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (ev.affectingLaw.lawId) onOpenLawById?.(ev.affectingLaw.lawId);
                    }}
                    className="link-legal cite"
                  >
                    {provisionRefLabel(ev.affectingLaw)}
                  </button>
                  {ev.note && (
                    <span className="block mt-1.5 text-[12px] text-[#3d3d3d] italic">
                      یادداشت: {ev.note}
                    </span>
                  )}
                </p>
              </div>
            );
          })}
          {pagedList.length === 0 && (
            <p className="text-[13.5px] text-[#6b6b6b] py-6">
              هیچ اصلاحی مطابق فیلترهای فعلی یافت نشد.
            </p>
          )}
        </div>

        {/* Pager for the vertical list — 5 per page */}
        <Pager
          currentPage={listPage}
          totalPages={listTotalPages}
          onPageChange={setListPage}
          showSummary
          unitLabel="اصلاح"
          totalItems={sorted.length}
        />
      </section>

      {/* Sortable changes table */}
      <section>
        <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mb-4">
          جدول کامل تغییرات
        </h3>
        <div className="overflow-x-auto scrollbar-subtle">
          <table className="zebra-table min-w-[840px]">
            <thead>
              <tr>
                <th style={{ width: "14%" }}>
                  <button onClick={() => toggleSort("date")} className="text-right hover:text-[#1a1a1a]">
                    تاریخ{sortInd("date")}
                  </button>
                </th>
                <th style={{ width: "16%" }}>
                  <button onClick={() => toggleSort("provision")} className="text-right hover:text-[#1a1a1a]">
                    ماده تغییر یافته{sortInd("provision")}
                  </button>
                </th>
                <th style={{ width: "12%" }}>
                  <button onClick={() => toggleSort("effect")} className="text-right hover:text-[#1a1a1a]">
                    نوع اثر{sortInd("effect")}
                  </button>
                </th>
                <th style={{ width: "32%" }}>قانون اصلاح‌کننده</th>
                <th style={{ width: "26%" }}>شرح</th>
              </tr>
            </thead>
            <tbody>
              {pagedTable.map((ev, idx) => {
                const hasComparison = !!(ev.beforeText || ev.afterText || ev.diffSegments);
                return (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 1 ? "odd-row" : ""} ${
                      hasComparison ? "cursor-pointer hover:!bg-[#edeae3]" : ""
                    }`}
                    onClick={() => hasComparison && onOpenComparison?.(ev)}
                  >
                    <td className="cite text-[12.5px]">{formatJalaliDate(ev.date)}</td>
                    <td className="cite">
                      {ev.affectedProvision}
                      {hasComparison && (
                        <span className="text-[10.5px] text-[#1f4f3a] block mt-0.5">مقایسه ←</span>
                      )}
                    </td>
                    <td>
                      <span className="pill cite">{ev.effectType}</span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.affectingLaw.lawId) onOpenLawById?.(ev.affectingLaw.lawId);
                        }}
                        className="link-legal cite text-[13px]"
                      >
                        {provisionRefLabel(ev.affectingLaw)}
                      </button>
                    </td>
                    <td className="text-[13px] text-[#3d3d3d]">{ev.description}</td>
                  </tr>
                );
              })}
              {pagedTable.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-[13.5px] text-[#6b6b6b] py-6">
                    هیچ اصلاحی مطابق فیلترهای فعلی یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pager for the table — 5 per page */}
        <Pager
          currentPage={tablePage}
          totalPages={tableTotalPages}
          onPageChange={setTablePage}
        />

        <div className="mt-4 flex items-center justify-between text-[12px] text-[#6b6b6b]">
          <p>
            مجموع {toFa(sorted.length)} تغییر ثبت‌شده.
          </p>
          <div className="flex items-center gap-3">
            <button className="utility-pill">خروجی CSV</button>
            <button className="utility-pill">خروجی JSON</button>
          </div>
        </div>
      </section>
    </div>
  );
}
