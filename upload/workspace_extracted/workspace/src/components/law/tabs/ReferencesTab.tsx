"use client";

import { useState } from "react";
import type { Law, ReferenceRelation } from "@/lib/types";
import { toFa, provisionRefLabel } from "@/lib/utils";
import { laws as allLaws } from "@/data/laws";

interface ReferencesTabProps {
  law: Law;
  onOpenLawById?: (id: string) => void;
}

type RefDirection = "all" | "cites" | "cited-by" | "amended-by" | "related";

const DIRECTION_LABELS: Record<RefDirection, string> = {
  all: "همه ارجاعات",
  cites: "ارجاعات از این قانون به سایر قوانین",
  "cited-by": "ارجاعات از سایر قوانین به این قانون",
  "amended-by": "اصلاح‌شده توسط",
  related: "قوانین مرتبط",
};

/** Check if a law id is one of our main laws (i.e., has a full record in the database). */
function isViewable(lawId?: string): boolean {
  if (!lawId) return false;
  return allLaws.some((l) => l.id === lawId);
}

export function ReferencesTab({ law, onOpenLawById }: ReferencesTabProps) {
  const [filter, setFilter] = useState<RefDirection>("all");

  const filtered = law.references.filter((r) => filter === "all" || r.direction === filter);

  // Group by direction
  const byDirection = law.references.reduce((acc, r) => {
    if (!acc[r.direction]) acc[r.direction] = [];
    acc[r.direction].push(r);
    return acc;
  }, {} as Record<string, ReferenceRelation[]>);

  return (
    <div className="container-legal py-8">
      {/* Intro */}
      <div className="mb-7 pb-5 border-b border-[#ececea]">
        <h2 className="font-legal text-[22px] font-light text-[#1a1a1a] mb-2">
          ارجاعات {law.title}
        </h2>
        <p className="text-[13.5px] leading-7 text-[#3d3d3d] max-w-3xl">
          این صفحه شبکه ارجاعات متقابل میان {law.title} و سایر قوانین را نمایش
          می‌دهد. ارجاعات به چهار دسته تقسیم می‌شوند: ارجاعات از این قانون به
          سایر قوانین (cites)، ارجاعات از سایر قوانین به این قانون (cited-by)،
          اصلاحات اعمال‌شده توسط قوانین دیگر (amended-by) و قوانین مرتبط. هر
          ارجاع شامل ماده مبدأ، ماده مقصد و توضیحی درباره نوع ارتباط است.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        {(["cites", "cited-by", "amended-by", "related"] as const).map((dir) => {
          const count = (byDirection[dir] || []).length;
          return (
            <button
              key={dir}
              onClick={() => setFilter(filter === dir ? "all" : dir)}
              className={`text-right p-4 border transition-colors ${
                filter === dir
                  ? "border-[#1f1f1f] bg-[#1f1f1f] text-white"
                  : "border-[#e0ddd6] bg-[#fdfdfb] hover:bg-[#f6f5f1]"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <div className={`text-[11.5px] mb-1 ${filter === dir ? "text-[#bdbdbd]" : "text-[#6b6b6b]"}`}>
                {DIRECTION_LABELS[dir]}
              </div>
              <div className={`font-legal text-[22px] font-light cite ${filter === dir ? "text-white" : "text-[#1a1a1a]"}`}>
                {toFa(count)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter buttons */}
      <div className="mb-5 flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] text-[#6b6b6b] ml-2">فیلتر:</span>
        {(["all", "cites", "cited-by", "amended-by", "related"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`utility-pill ${filter === d ? "!bg-[#1f1f1f] !text-white !border-[#1f1f1f]" : ""}`}
          >
            {DIRECTION_LABELS[d]}
          </button>
        ))}
      </div>

      {/* References list */}
      <div className="border border-[#e0ddd6] divide-y divide-[#ececea] bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[14px] text-[#3d3d3d] mb-1">ارجاع‌ای در این دسته یافت نشد.</p>
            <p className="text-[12.5px] text-[#6b6b6b]">فیلتر دیگری را انتخاب کنید.</p>
          </div>
        ) : (
          filtered.map((ref, idx) => (
            <div key={idx} className="p-5 hover:bg-[#fafaf8] transition-colors">
              <div className="flex items-start gap-4">
                {/* Direction badge */}
                <div className="shrink-0 w-32">
                  <span className="pill cite block text-center">
                    {ref.direction === "cites" && "ارجاع به"}
                    {ref.direction === "cited-by" && "ارجاع از"}
                    {ref.direction === "amended-by" && "اصلاح توسط"}
                    {ref.direction === "amends" && "اصلاح‌کننده"}
                    {ref.direction === "related" && "مرتبط"}
                  </span>
                </div>

                {/* Reference content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                    <button
                      onClick={() => ref.target.lawId && onOpenLawById?.(ref.target.lawId)}
                      className="font-legal text-[15px] font-medium text-[#1a1a1a] hover:underline cite"
                    >
                      {provisionRefLabel(ref.target)}
                    </button>
                    {isViewable(ref.target.lawId) ? (
                      <span className="text-[11px] text-[#2b2b2b] pill pill-in-force cite">
                        در پایگاه موجود
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#6b6b6b] pill cite">
                        ثبت شده در ارجاعات
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] leading-7 text-[#3d3d3d] mb-2">
                    {ref.context}
                  </p>
                  {(ref.sourceProvision || ref.targetProvision) && (
                    <div className="flex items-center gap-3 text-[12px] text-[#6b6b6b] cite">
                      {ref.sourceProvision && (
                        <span>
                          ماده مبدأ: <span className="text-[#1a1a1a]">{ref.sourceProvision}</span>
                        </span>
                      )}
                      {ref.sourceProvision && ref.targetProvision && (
                        <span className="opacity-40">→</span>
                      )}
                      {ref.targetProvision && (
                        <span>
                          ماده مقصد: <span className="text-[#1a1a1a]">{ref.targetProvision}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {ref.target.lawId && (
                    <button
                      onClick={() => ref.target.lawId && onOpenLawById?.(ref.target.lawId)}
                      className="utility-pill"
                    >
                      مشاهده ←
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Network visualization (simple) */}
      <section className="mt-10">
        <h3 className="font-legal text-[15px] font-semibold text-[#1a1a1a] mb-4">
          شبکه ارجاعات
        </h3>
        <div className="border border-[#ececea] bg-[#fdfdfb] p-6">
          <p className="text-[12.5px] text-[#6b6b6b] mb-4">
            نمای ساده شبکه ارجاعات میان {law.title} و سایر قوانین.
          </p>

          {/* Center node + satellite nodes */}
          <div className="relative h-80 flex items-center justify-center">
            {/* Center: this law */}
            <div className="z-10 bg-[#1f1f1f] text-white px-5 py-3 text-center" style={{ borderRadius: "2px" }}>
              <div className="font-legal text-[14px] font-medium">{law.shortTitle || law.title}</div>
              <div className="text-[11px] text-[#bdbdbd] cite mt-0.5">{toFa(law.year)}</div>
            </div>

            {/* Satellites */}
            {law.references.slice(0, 8).map((ref, idx) => {
              const angle = (idx / Math.min(8, law.references.length)) * 2 * Math.PI;
              const radius = 130;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={idx}
                  className="absolute"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  {/* Connection line (SVG) */}
                  <svg
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    width="1"
                    height="1"
                    style={{ overflow: "visible" }}
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2={-x}
                      y2={-y}
                      stroke={ref.direction === "amended-by" ? "#5a5a5a" : "#c9c6bf"}
                      strokeWidth="1"
                      strokeDasharray={ref.direction === "related" ? "3,3" : ""}
                    />
                  </svg>
                  <button
                    onClick={() => ref.target.lawId && onOpenLawById?.(ref.target.lawId)}
                    className="relative bg-white border border-[#d8d6d2] px-3 py-1.5 text-center hover:bg-[#f6f5f1] hover:border-[#1f1f1f] transition-colors"
                    style={{ borderRadius: "2px" }}
                    title={ref.context}
                  >
                    <div className="font-legal text-[12px] text-[#1a1a1a] cite whitespace-nowrap max-w-[140px] truncate">
                      {ref.target.title}
                    </div>
                    <div className="text-[10px] text-[#6b6b6b] cite">
                      {toFa(ref.target.year)}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-5 text-[11.5px] text-[#6b6b6b]">
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-[#c9c6bf]" />
              ارجاع
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-[#5a5a5a]" />
              اصلاح
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-[#c9c6bf]" style={{ borderTop: "1px dashed #c9c6bf", background: "none" }} />
              مرتبط
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
