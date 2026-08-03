"use client";

import { useState, useMemo, useEffect } from "react";
import { laws, decadeStats } from "@/data/laws";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass, formatJalaliDate } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";

const HOME_PAGE_SIZE = 8;

interface HomeViewProps {
  onOpenLaw: (law: Law) => void;
  onBrowse: () => void;
  onSearch: (query: string) => void;
}

export function HomeView({ onOpenLaw, onBrowse, onSearch }: HomeViewProps) {
  const [heroQuery, setHeroQuery] = useState("");
  const [heroYear, setHeroYear] = useState("");
  const [heroType, setHeroType] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(heroQuery || "");
  };

  // All recent amendments sorted by date (descending). Paginated
  // client-side — HOME_PAGE_SIZE per page (default 8).
  const allRecent = useMemo(
    () =>
      laws
        .flatMap((l) =>
          l.amendments.map((a) => ({
            law: l,
            amendment: a,
          }))
        )
        .sort((a, b) => b.amendment.date.localeCompare(a.amendment.date)),
    []
  );

  const [amendmentsPage, setAmendmentsPage] = useState(1);
  const amendmentsTotalPages = Math.max(1, Math.ceil(allRecent.length / HOME_PAGE_SIZE));

  // Reset to page 1 if the page ever overflows the new total (defensive —
  // shouldn't normally happen since `allRecent` is stable, but cheap).
  useEffect(() => {
    if (amendmentsPage > amendmentsTotalPages) setAmendmentsPage(1);
  }, [amendmentsPage, amendmentsTotalPages]);

  const recentAdditions = useMemo(
    () =>
      allRecent.slice(
        (amendmentsPage - 1) * HOME_PAGE_SIZE,
        amendmentsPage * HOME_PAGE_SIZE
      ),
    [allRecent, amendmentsPage]
  );

  // Featured laws
  const featured = laws.slice(0, 4);

  // Decade max count for scaling
  const maxCount = Math.max(
    ...decadeStats.flatMap((d) => d.counts.map((c) => c.count))
  );

  return (
    <div>
      {/* ============= Hero search ============= */}
      <section className="hairline-b bg-[#f8f7f4]">
        <div className="container-legal py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="text-[12.5px] tracking-[0.12em] text-[#6b6b6b] mb-3 uppercase">
              مرجع قوانین جمهوری اسلامی ایران
            </p>
            <h1 className="font-legal text-[28px] md:text-[34px] leading-[1.4] font-light text-[#1a1a1a] mb-3">
              جستجو، مطالعه و ردیابی اصلاحات قوانین ایران
              <br />
              <span className="font-normal">در یک پایگاه رسمی و قابل استناد</span>
            </h1>
            <p className="text-[14.5px] leading-7 text-[#3d3d3d] mb-7 max-w-2xl">
              مدونات به شما امکان می‌دهد متن کامل قوانین مصوب مجلس شورای اسلامی
              و نهادهای ذی‌ربط را به‌همراه خط زمانی اصلاحات هر قانون و شبکه
              ارجاعات متقابل میان مواد قانونی مطالعه کنید. هرچند متن قانون به‌روز
              است، اصلاحات در انتظار اجرا نیز به‌صورت جداگانه نمایش داده می‌شوند.
            </p>
          </div>

          {/* Search card */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-white border border-[#d8d6d2] p-5 md:p-6"
            style={{ borderRadius: "2px" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <label htmlFor="hero-title" className="block text-[12px] text-[#6b6b6b] mb-1.5">
                  عنوان قانون
                </label>
                <input
                  id="hero-title"
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="مثلاً: قانون مدنی، مجازات اسلامی، کار…"
                  className="input-legal"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="hero-year" className="block text-[12px] text-[#6b6b6b] mb-1.5">
                  سال
                </label>
                <input
                  id="hero-year"
                  type="text"
                  value={heroYear}
                  onChange={(e) => setHeroYear(e.target.value)}
                  placeholder="۱۳۹۲"
                  className="input-legal"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="hero-type" className="block text-[12px] text-[#6b6b6b] mb-1.5">
                  نوع
                </label>
                <select
                  id="hero-type"
                  value={heroType}
                  onChange={(e) => setHeroType(e.target.value)}
                  className="input-legal bg-white"
                >
                  <option value="">همه انواع</option>
                  <option value="قانون عادی">قانون عادی</option>
                  <option value="قانون اساسی">قانون اساسی</option>
                  <option value="آیین‌نامه">آیین‌نامه</option>
                  <option value="بخشنامه">بخشنامه</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <button type="submit" className="btn-legal w-full">
                  جستجو
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[12.5px] text-[#6b6b6b]">
              <a href="#" className="link-legal">جستجوی پیشرفته</a>
              <span className="opacity-50">|</span>
              <a href="#" className="link-legal">راهنمای جستجو</a>
              <span className="opacity-50">|</span>
              <span>میانبر: <code className="cite">/</code> برای تمرکز روی جستجو</span>
            </div>
          </form>
        </div>
      </section>

      {/* ============= Browse by type (with decade histogram) ============= */}
      <section className="hairline-b">
        <div className="container-legal py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-legal text-[20px] font-medium text-[#1a1a1a]">
                مرور بر اساس دهه تصویب
              </h2>
              <p className="text-[13px] text-[#6b6b6b] mt-1">
                تعداد قوانین عادی مصوب در هر دهه از ۱۳۰۰ تاکنون
              </p>
            </div>
            <button onClick={onBrowse} className="link-legal text-[13.5px]">
              مرور همه قوانین ←
            </button>
          </div>

          {/* Decade histogram */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {decadeStats.map((dec) => {
              const total = dec.counts.reduce((s, c) => s + c.count, 0);
              return (
                <div
                  key={dec.decade}
                  className="border border-[#e8e6e1] p-3.5 bg-[#fdfdfb] hover:bg-[#f6f5f1] transition-colors cursor-pointer"
                  style={{ borderRadius: "2px" }}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[12px] text-[#6b6b6b] cite">{dec.decade}</span>
                    <span className="text-[14px] font-semibold text-[#1a1a1a] cite">
                      {toFa(total)}
                    </span>
                  </div>
                  {/* Sparkline */}
                  <div className="flex items-end gap-[2px] h-9">
                    {dec.counts.map((c) => {
                      const h = Math.max(4, Math.round((c.count / maxCount) * 36));
                      return (
                        <div
                          key={c.year}
                          className="decade-bar"
                          style={{ height: `${h}px` }}
                          title={`${toFa(c.year)}: ${toFa(c.count)} قانون`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-5 text-[12px] text-[#6b6b6b]">
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-[#1f1f1f]" />
              قوانین موجود در پایگاه
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-[#8a8a8a]/55" />
              قوانین در حال فهرست‌بندی
            </span>
          </div>
        </div>
      </section>

      {/* ============= Featured laws ============= */}
      <section className="hairline-b bg-[#fafaf8]">
        <div className="container-legal py-10">
          <div className="mb-6">
            <h2 className="font-legal text-[20px] font-medium text-[#1a1a1a]">
              قوانین پایه
            </h2>
            <p className="text-[13px] text-[#6b6b6b] mt-1">
              مهم‌ترین قوانین نظام حقوقی ایران با خط زمانی کامل اصلاحات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#e0ddd6] bg-white">
            {featured.map((law, idx) => (
              <button
                key={law.id}
                onClick={() => onOpenLaw(law)}
                className={`text-right p-5 hover:bg-[#f6f5f1] transition-colors group ${
                  idx % 2 === 0 ? "md:border-l border-[#e0ddd6]" : ""
                } ${idx < 2 ? "border-b md:border-b-0 border-[#e0ddd6]" : ""}`}
                style={{
                  borderLeftWidth: idx % 2 === 0 ? undefined : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-legal text-[16.5px] font-medium text-[#1a1a1a] group-hover:text-black leading-snug">
                    {law.title}
                  </h3>
                  <span className={statusPillClass(law.status)}>
                    {statusLabel(law.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-[#6b6b6b] cite mb-3">
                  <span>سال: {toFa(law.year)}</span>
                  <span className="opacity-50">|</span>
                  <span>شماره: {law.number}</span>
                  <span className="opacity-50">|</span>
                  <span>موضوع: {law.subject}</span>
                </div>
                <p className="text-[13.5px] leading-7 text-[#3d3d3d] line-clamp-2">
                  {law.description}
                </p>
                <div className="mt-3 pt-3 border-t border-[#ececea] flex items-center justify-between text-[12px] text-[#6b6b6b]">
                  <span>
                    آخرین بازنگری: {formatJalaliDate(law.lastRevisionDate)}
                  </span>
                  <span className="link-legal">مشاهده ←</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============= Recent amendments ============= */}
      <section className="hairline-b">
        <div className="container-legal py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent changes */}
            <div className="lg:col-span-2">
              <h2 className="font-legal text-[20px] font-medium text-[#1a1a1a] mb-1">
                آخرین اصلاحات
              </h2>
              <p className="text-[13px] text-[#6b6b6b] mb-5">
                اصلاحات اخیر اعمال‌شده بر قوانین موجود در پایگاه
              </p>

              <div className="divide-y divide-[#ececea] border-t border-b border-[#ececea]">
                {recentAdditions.map((row, idx) => (
                  <div key={idx} className="py-3.5 flex items-start gap-4">
                    <div className="shrink-0 w-24 pt-0.5">
                      <span className="text-[12px] text-[#6b6b6b] block cite">
                        {row.amendment.dateLabel}
                      </span>
                      <span className="text-[11px] text-[#9c9c9c] block mt-0.5">
                        {toFa(row.amendment.effectType)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => onOpenLaw(row.law)}
                        className="font-legal text-[14px] font-medium text-[#1a1a1a] hover:underline text-right"
                      >
                        {row.law.title}
                      </button>
                      <p className="text-[12.5px] text-[#3d3d3d] leading-6 mt-1">
                        {row.amendment.description}
                      </p>
                      <p className="text-[11.5px] text-[#6b6b6b] mt-1">
                        به موجب {row.amendment.affectingLaw.title} (
                        {toFa(row.amendment.affectingLaw.year)})
                        {row.amendment.appliedToText ? " — اعمال‌شده در متن" : " — در انتظار اعمال"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pager — 8 per page */}
              <Pager
                currentPage={amendmentsPage}
                totalPages={amendmentsTotalPages}
                onPageChange={setAmendmentsPage}
                showSummary
                unitLabel="اصلاح"
                totalItems={allRecent.length}
              />
            </div>

            {/* Side rail */}
            <aside className="lg:border-r lg:border-[#ececea] lg:pr-6">
              <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mb-3">
                آمار پایگاه
              </h3>
              <dl className="space-y-2.5 text-[13px]">
                <div className="flex justify-between items-baseline">
                  <dt className="text-[#6b6b6b]">کل قوانین</dt>
                  <dd className="cite font-semibold">{toFa("۴۸۲۱")}</dd>
                </div>
                <div className="flex justify-between items-baseline">
                  <dt className="text-[#6b6b6b]">قوانین لازم‌الاجرا</dt>
                  <dd className="cite font-semibold">{toFa("۳۹۱۷")}</dd>
                </div>
                <div className="flex justify-between items-baseline">
                  <dt className="text-[#6b6b6b]">قوانین منسوخ</dt>
                  <dd className="cite font-semibold">{toFa("۹۰۴")}</dd>
                </div>
                <div className="flex justify-between items-baseline">
                  <dt className="text-[#6b6b6b]">اصلاحات ثبت‌شده</dt>
                  <dd className="cite font-semibold">{toFa("۱۸۲۳۹")}</dd>
                </div>
                <div className="flex justify-between items-baseline">
                  <dt className="text-[#6b6b6b]">ارجاعات متقابل</dt>
                  <dd className="cite font-semibold">{toFa("۴۷۱۲۰")}</dd>
                </div>
              </dl>

              <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mt-8 mb-3">
                ابزارها
              </h3>
              <ul className="space-y-2 text-[13px]">
                <li><a href="#" className="link-legal">اشتراک تغییرات یک قانون (RSS)</a></li>
                <li><a href="#" className="link-legal">دانلود PDF قوانین</a></li>
                <li><a href="#" className="link-legal">استخراج ارجاعات در قالب JSON</a></li>
                <li><a href="#" className="link-legal">اشتراک‌گذاری پیوند یک ماده</a></li>
              </ul>

              <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mt-8 mb-3">
                برای حقوقدانان
              </h3>
              <p className="text-[12.5px] leading-6 text-[#3d3d3d]">
                هر ماده دارای شناسه یکتا (DOI) است و می‌توانید با استفاده از
                ساختار URL پایگاه، پیوند پایدار به نسخه خاصی از متن قانون ایجاد
                کنید. برای مشاهده راهنمای فنی به{" "}
                <a href="#" className="link-legal">بخش توسعه‌دهندگان</a> مراجعه کنید.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
