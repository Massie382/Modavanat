"use client";

import { useState, useMemo, useEffect } from "react";
import { laws, decadeStats } from "@/data/laws";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";

const SEARCH_PAGE_SIZE = 10;

interface SearchViewProps {
  onOpenLaw: (law: Law) => void;
  initialQuery?: string;
}

export function SearchView({ onOpenLaw, initialQuery = "" }: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q && !yearFilter) return laws;
    return laws.filter((l) => {
      const matchesQuery = !q ||
        l.title.includes(q) ||
        l.description.includes(q) ||
        l.subject.includes(q) ||
        String(l.year).includes(q) ||
        String(l.number).includes(q) ||
        l.articles.some((a) => a.text.includes(q) || a.number.includes(q));
      const matchesYear = !yearFilter || l.year === yearFilter;
      return matchesQuery && matchesYear;
    });
  }, [query, yearFilter]);

  // Reset to page 1 whenever the result set changes (new query, new filter).
  // This prevents being stuck on e.g. page 5 of an old result set that now
  // only has 2 pages.
  useEffect(() => {
    setPage(1);
  }, [query, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(results.length / SEARCH_PAGE_SIZE));
  // Defensive clamp — if a state restoration lands us past the last page.
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pagedResults = useMemo(
    () =>
      results.slice(
        (page - 1) * SEARCH_PAGE_SIZE,
        page * SEARCH_PAGE_SIZE
      ),
    [results, page]
  );

  // Year facets — count by year
  const yearFacets = useMemo(() => {
    const map = new Map<number, number>();
    laws.forEach((l) => map.set(l.year, (map.get(l.year) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, []);

  return (
    <div className="container-legal py-8">
      <div className="mb-6">
        <h1 className="font-legal text-[26px] font-light text-[#1a1a1a] mb-1">
          جستجوی پیشرفته
        </h1>
        <p className="text-[13.5px] text-[#6b6b6b]">
          جستجو در عنوان، متن مواد، سال و شماره قوانین موجود در پایگاه.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar facets */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="border border-[#e0ddd6] bg-[#fdfdfb] p-4">
            <h2 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-3">
              فیلتر بر اساس سال
            </h2>
            <ul className="space-y-0.5 text-[13px]">
              <li>
                <button
                  onClick={() => setYearFilter(null)}
                  className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] ${
                    !yearFilter ? "bg-[#f0efeb] font-medium" : ""
                  }`}
                >
                  همه سال‌ها ({toFa(laws.length)})
                </button>
              </li>
              {yearFacets.map(([year, count]) => (
                <li key={year}>
                  <button
                    onClick={() => setYearFilter(year)}
                    className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] flex justify-between ${
                      yearFilter === year ? "bg-[#f0efeb] font-medium" : ""
                    }`}
                  >
                    <span className="cite">{toFa(year)}</span>
                    <span className="text-[#6b6b6b] cite">({toFa(count)})</span>
                  </button>
                </li>
              ))}
            </ul>

            <h2 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mt-6 mb-3">
              فیلتر بر اساس موضوع
            </h2>
            <ul className="space-y-0.5 text-[13px]">
              {Array.from(new Set(laws.map((l) => l.subject))).map((s) => {
                const count = laws.filter((l) => l.subject === s).length;
                return (
                  <li key={s}>
                    <button className="block w-full text-right py-1 px-2 hover:bg-[#f0efeb] flex justify-between">
                      <span>{s}</span>
                      <span className="text-[#6b6b6b] cite">({toFa(count)})</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="عنوان، شماره، یا متن ماده…"
                className="input-legal pl-10"
                style={{ paddingLeft: "2.5rem" }}
                autoFocus
              />
              <span
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                </svg>
              </span>
            </div>
            <p className="text-[12.5px] text-[#6b6b6b] mt-2">
              {toFa(results.length)} نتیجه یافت شد
              {query && (
                <>
                  {" "}برای عبارت «<span className="text-[#1a1a1a]">{query}</span>»
                </>
              )}
            </p>
          </div>

          {/* Results list */}
          <div className="space-y-0 border border-[#e0ddd6] divide-y divide-[#ececea]">
            {pagedResults.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[14px] text-[#3d3d3d] mb-2">
                  نتیجه‌ای یافت نشد.
                </p>
                <p className="text-[13px] text-[#6b6b6b]">
                  عبارت را اصلاح کنید یا فیلترها را بازنشانی نمایید.
                </p>
              </div>
            ) : (
              pagedResults.map((law) => (
                <button
                  key={law.id}
                  onClick={() => onOpenLaw(law)}
                  className="block w-full text-right p-5 hover:bg-[#f8f7f4] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-legal text-[15.5px] font-medium text-[#1a1a1a] group-hover:underline">
                      {law.title}
                    </h3>
                    <span className={statusPillClass(law.status)}>
                      {statusLabel(law.status)}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-[#6b6b6b] cite mb-2">
                    {law.type} — {toFa(law.year)}
                    {law.number && law.number !== "—" && ` — شماره ${toFa(law.number)}`}
                    {" — "}{law.subject}
                  </div>
                  <p className="text-[13px] leading-6 text-[#3d3d3d] line-clamp-2">
                    {law.description}
                  </p>
                  {query && (
                    <p className="text-[12px] text-[#6b6b6b] mt-2">
                      {toFa(law.articles.length)} ماده · {toFa(law.amendments.length)} اصلاح ·{" "}
                      {toFa(law.references.length)} ارجاع
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Pager — 10 per page */}
          <Pager
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showSummary
            unitLabel="نتیجه"
            totalItems={results.length}
          />
        </div>
      </div>
    </div>
  );
}
