"use client";

import type { Law } from "@/lib/types";
import { toFa, formatJalaliDate, provisionRefLabel } from "@/lib/utils";

interface ResourcesTabProps {
  law: Law;
  onOpenLawById?: (id: string) => void;
}

export function ResourcesTab({ law, onOpenLawById }: ResourcesTabProps) {
  return (
    <div className="container-legal py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Original print */}
          <section>
            <h2 className="font-legal text-[17px] font-medium text-[#1a1a1a] mb-3">
              نسخه اصلی (PDF)
            </h2>
            <div className="border border-[#ececea] bg-[#fdfdfb] p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-legal text-[14px] text-[#1a1a1a]">
                    نسخه چاپی اصلی {law.title}
                  </p>
                  <p className="text-[12.5px] text-[#6b6b6b] mt-1 cite">
                    مصوب {formatJalaliDate(law.approvedDate)} · شماره {law.number}
                  </p>
                </div>
                <button className="btn-legal btn-legal-sm">
                  دانلود PDF
                </button>
              </div>
              <p className="text-[12.5px] text-[#3d3d3d] leading-6 mt-2">
                این نسخه، متن قانون را به همان صورتی که در زمان تصویب منتشر شده
                نشان می‌دهد و شامل اصلاحات بعدی نیست. برای مشاهده متن به‌روز به
                تب «متن قانون» مراجعه کنید.
              </p>
            </div>
          </section>

          {/* Lists of changes */}
          <section>
            <h2 className="font-legal text-[17px] font-medium text-[#1a1a1a] mb-3">
              فهرست کامل تغییرات
            </h2>
            <div className="border border-[#ececea] divide-y divide-[#ececea] bg-white">
              <div className="p-5 hover:bg-[#fafaf8]">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-legal text-[14px] font-medium text-[#1a1a1a]">
                    تغییرات اعمال‌شده بر این قانون
                  </p>
                  <span className="pill cite">{toFa(law.amendments.length)} تغییر</span>
                </div>
                <p className="text-[12.5px] text-[#6b6b6b] leading-6">
                  فهرست کامل اصلاحاتی که از زمان تصویب تاکنون بر این قانون اعمال
                  شده است. شامل تاریخ، نوع اثر، ماده تأثیرپذیرفته و قانون اصلاح‌کننده.
                </p>
                <a href="#" className="link-legal text-[12.5px] mt-2 inline-block">
                  مشاهده فهرست اعمال‌شده ←
                </a>
              </div>
              <div className="p-5 hover:bg-[#fafaf8]">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-legal text-[14px] font-medium text-[#1a1a1a]">
                    تغییرات اعمال‌شده توسط این قانون بر سایر قوانین
                  </p>
                  <span className="pill cite">
                    {toFa(law.references.filter(r => r.direction === "amended-by").length)} تغییر
                  </span>
                </div>
                <p className="text-[12.5px] text-[#6b6b6b] leading-6">
                  فهرست کامل اصلاحاتی که این قانون بر سایر قوانین اعمال کرده است.
                  این فهرست جهت معکوس رابطه اصلاح را نشان می‌دهد.
                </p>
                <a href="#" className="link-legal text-[12.5px] mt-2 inline-block">
                  مشاهده فهرست اعمال‌کننده ←
                </a>
              </div>
            </div>
          </section>

          {/* Sections conferring power */}
          <section>
            <h2 className="font-legal text-[17px] font-medium text-[#1a1a1a] mb-3">
              مواد دارای اهمیت خاص
            </h2>
            <div className="border border-[#ececea] bg-white p-5">
              <p className="text-[12.5px] text-[#6b6b6b] mb-3">
                موادی از این قانون که اختیار قانون‌گذاری تفویضی داده‌اند یا
                اصلاحات کلی اعمال کرده‌اند.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                {law.articles.slice(0, 8).map((a) => (
                  <a
                    key={a.id}
                    href={`#${a.id}`}
                    className="cite text-[#1a1a1a] hover:underline py-0.5"
                  >
                    {a.number}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Further info */}
          <section>
            <h2 className="font-legal text-[17px] font-medium text-[#1a1a1a] mb-3">
              اطلاعات تکمیلی
            </h2>
            <ul className="border border-[#ececea] bg-white divide-y divide-[#ececea]">
              <li className="p-4 hover:bg-[#fafaf8] flex items-center justify-between">
                <span className="text-[13.5px] text-[#1a1a1a]">متن کامل قانون در پرتال مجلس شورای اسلامی</span>
                <a href="#" className="link-legal text-[12.5px]">مشاهده در سایت مجلس ←</a>
              </li>
              <li className="p-4 hover:bg-[#fafaf8] flex items-center justify-between">
                <span className="text-[13.5px] text-[#1a1a1a]">متن قانون در روزنامه رسمی</span>
                <a href="#" className="link-legal text-[12.5px]">مشاهده ←</a>
              </li>
              <li className="p-4 hover:bg-[#fafaf8] flex items-center justify-between">
                <span className="text-[13.5px] text-[#1a1a1a]">آرا و مذاکرات مجلس در خصوص تصویب</span>
                <a href="#" className="link-legal text-[12.5px]">مشاهده ←</a>
              </li>
              <li className="p-4 hover:bg-[#fafaf8] flex items-center justify-between">
                <span className="text-[13.5px] text-[#1a1a1a]">نظرات شورای نگهبان درباره قانون</span>
                <a href="#" className="link-legal text-[12.5px]">مشاهده ←</a>
              </li>
            </ul>
          </section>
        </div>

        {/* Side rail */}
        <aside className="lg:border-r lg:border-[#ececea] lg:pr-6 space-y-6">
          <div>
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-3">
              قوانین اصلاح‌کننده
            </h3>
            <ul className="space-y-2 text-[12.5px]">
              {law.amendments
                .reduce((acc, a) => {
                  const existing = acc.find(
                    (x) => x.affectingLaw.lawId === a.affectingLaw.lawId
                  );
                  if (!existing) acc.push(a);
                  return acc;
                }, [] as typeof law.amendments)
                .map((a, idx) => (
                  <li key={idx} className="flex items-baseline justify-between gap-2">
                    <button
                      onClick={() => a.affectingLaw.lawId && onOpenLawById?.(a.affectingLaw.lawId)}
                      className="link-legal cite text-[12.5px] text-right"
                    >
                      {a.affectingLaw.title}
                    </button>
                    <span className="cite text-[#6b6b6b] shrink-0">{toFa(a.affectingLaw.year)}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-3">
              مراحل بعدی
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#" className="link-legal">قوانین موضوع مشابه</a></li>
              <li><a href="#" className="link-legal">قوانین مصوب {toFa(law.year)}</a></li>
              <li><a href="#" className="link-legal">جستجوی پیشرفته</a></li>
              <li><a href="#" className="link-legal">اشتراک تغییرات (RSS)</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-3">
              شناسه پایدار
            </h3>
            <p className="text-[11.5px] text-[#6b6b6b] leading-5 mb-2">
              شناسه پایدار این قانون برای ارجاع پایدار در منابع علمی:
            </p>
            <code className="cite text-[11.5px] block p-2 bg-[#f5f3ef] border border-[#ececea] break-all">
              https://modavanat.ir/id/{law.id}
            </code>
          </div>
        </aside>
      </div>
    </div>
  );
}
