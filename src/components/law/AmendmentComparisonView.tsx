"use client";

import { useEffect, useMemo } from "react";
import type { AmendmentEvent, Law } from "@/lib/types";
import {
  toFa,
  formatJalaliDate,
  provisionRefLabel,
} from "@/lib/utils";
import {
  getDiffSegments,
  filterBefore,
  filterAfter,
  diffStats,
} from "@/lib/diff";
import { laws as allLaws } from "@/data/laws";

interface AmendmentComparisonViewProps {
  amendment: AmendmentEvent;
  parentLaw: Law;
  onClose: () => void;
  onNavigateToAmendingLaw?: (lawId: string) => void;
}

function isViewable(lawId?: string): boolean {
  if (!lawId) return false;
  return allLaws.some((l) => l.id === lawId);
}

/** Render diff segments with appropriate styling per segment type. */
function DiffRenderer({
  segments,
  side,
}: {
  segments: ReturnType<typeof getDiffSegments>;
  side: "before" | "after";
}) {
  const filtered = side === "before" ? filterBefore(segments) : filterAfter(segments);
  return (
    <>
      {filtered.map((seg, i) => {
        if (seg.type === "same") return <span key={i}>{seg.text}</span>;
        if (seg.type === "removed") {
          return (
            <span key={i} className="diff-removed">
              {seg.text}
            </span>
          );
        }
        if (seg.type === "added") {
          return (
            <span key={i} className="diff-added">
              {seg.text}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}

export function AmendmentComparisonView({
  amendment,
  parentLaw,
  onClose,
  onNavigateToAmendingLaw,
}: AmendmentComparisonViewProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Lock body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const segments = useMemo(
    () =>
      getDiffSegments({
        beforeText: amendment.beforeText,
        afterText: amendment.afterText,
        diffSegments: amendment.diffSegments,
      }),
    [amendment]
  );

  const stats = useMemo(() => diffStats(segments), [segments]);
  const hasDiff = segments.length > 0;
  const viewable = isViewable(amendment.affectingLaw.lawId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="مقایسه نسخه‌های ماده"
    >
      {/* Backdrop */}
      <button
        aria-label="بستن"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 modal-backdrop"
      />

      {/* Modal */}
      <div className="relative bg-white w-full md:max-w-5xl md:max-h-[88vh] overflow-y-auto scrollbar-subtle modal-content shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white hairline-b z-10 px-5 md:px-7 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] text-[#6b6b6b] mb-1 tracking-wide">
              مقایسه نسخه‌های ماده
            </p>
            <h2 className="font-legal text-[18px] md:text-[20px] font-medium text-[#1a1a1a] leading-tight">
              {parentLaw.title}
              <span className="text-[#6b6b6b] mx-1.5">·</span>
              <span className="cite">{amendment.affectedProvision}</span>
            </h2>
            <p className="text-[12.5px] text-[#3d3d3d] mt-1.5">
              اصلاح به موجب{" "}
              <span className="font-medium text-[#1a1a1a]">
                {amendment.affectingLaw.title}
              </span>{" "}
              <span className="cite text-[#6b6b6b]">
                ({toFa(amendment.affectingLaw.year)})
                {amendment.affectingLaw.number && ` — ش. ${toFa(amendment.affectingLaw.number)}`}
              </span>
              {" — "}
              <span className="cite">{formatJalaliDate(amendment.date)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 w-8 h-8 flex items-center justify-center text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#f0efeb] rounded-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 md:px-7 py-5">
          {/* Effect type + description */}
          <div className="mb-5 p-4 bg-[#fafaf8] border border-[#ececea]">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="pill cite">{amendment.effectType}</span>
              {amendment.appliedToText ? (
                <span className="pill pill-in-force cite">اعمال‌شده در متن</span>
              ) : (
                <span className="pill pill-pending cite">در انتظار اعمال</span>
              )}
              {hasDiff && (
                <span className="text-[12px] text-[#6b6b6b] mr-auto cite">
                  {toFa(stats.removed)} بخش حذف‌شده · {toFa(stats.added)} بخش افزوده‌شده
                </span>
              )}
            </div>
            <p className="text-[13.5px] leading-7 text-[#1a1a1a]">
              {amendment.description}
            </p>
            {amendment.note && (
              <p className="text-[12.5px] text-[#6b6b6b] mt-2 italic leading-6">
                یادداشت: {amendment.note}
              </p>
            )}
          </div>

          {hasDiff ? (
            <>
              {/* Before/After side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* Before */}
                <div className="border border-[#e0ddd6] bg-[#fdfdfb]">
                  <div className="px-4 py-2.5 hairline-b bg-[#f5f3ef] flex items-center justify-between">
                    <div>
                      <span className="font-legal text-[13.5px] font-semibold text-[#1a1a1a]">
                        نسخه پیش از اصلاح
                      </span>
                      <span className="text-[11.5px] text-[#6b6b6b] mr-2 cite">
                        تا {formatJalaliDate(amendment.date)}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#8b3a3a] tracking-wide">حذف‌شده</span>
                  </div>
                  <div className="p-4 legal-text" style={{ fontSize: "14px", lineHeight: 2.1 }}>
                    <DiffRenderer segments={segments} side="before" />
                  </div>
                </div>

                {/* After */}
                <div className="border border-[#e0ddd6] bg-[#fdfdfb]">
                  <div className="px-4 py-2.5 hairline-b bg-[#f5f3ef] flex items-center justify-between">
                    <div>
                      <span className="font-legal text-[13.5px] font-semibold text-[#1a1a1a]">
                        نسخه پس از اصلاح
                      </span>
                      <span className="text-[11.5px] text-[#6b6b6b] mr-2 cite">
                        از {formatJalaliDate(amendment.date)}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#1f4f3a] tracking-wide">افزوده‌شده</span>
                  </div>
                  <div className="p-4 legal-text" style={{ fontSize: "14px", lineHeight: 2.1 }}>
                    <DiffRenderer segments={segments} side="after" />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-5 text-[12px] text-[#6b6b6b] flex-wrap">
                <span className="flex items-center gap-2">
                  <span className="diff-removed inline">متن نمونه</span>
                  <span>متن حذف‌شده در اصلاح</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="diff-added inline">متن نمونه</span>
                  <span>متن افزوده‌شده در اصلاح</span>
                </span>
              </div>
            </>
          ) : (
            <div className="p-6 border border-[#ececea] bg-[#fafaf8] text-center">
              <p className="text-[13.5px] text-[#3d3d3d] mb-1">
                متن تفصیلی پیش و پس از اصلاح برای این مورد ثبت نشده است.
              </p>
              <p className="text-[12.5px] text-[#6b6b6b]">
                برای مشاهده متن کامل قانون اصلاح‌کننده، روی دکمه زیر کلیک کنید.
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-6 pt-4 border-t border-[#ececea] flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[12px] text-[#6b6b6b]">
              {amendment.affectingLaw.provisionLabel && (
                <span>
                  ارجاع:{" "}
                  <span className="cite text-[#1a1a1a]">
                    {provisionRefLabel(amendment.affectingLaw)}
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {viewable ? (
                <button
                  onClick={() =>
                    amendment.affectingLaw.lawId &&
                    onNavigateToAmendingLaw?.(amendment.affectingLaw.lawId)
                  }
                  className="btn-legal btn-legal-sm"
                >
                  مشاهده قانون اصلاح‌کننده ←
                </button>
              ) : (
                <span className="text-[11.5px] text-[#6b6b6b] px-3 py-1.5 bg-[#f5f3ef] border border-[#ececea] rounded-sm">
                  قانون اصلاح‌کننده در پایگاه موجود نیست
                </span>
              )}
              <button onClick={onClose} className="btn-legal btn-legal-ghost btn-legal-sm">
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
