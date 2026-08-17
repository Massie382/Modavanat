"use client";

import { useState } from "react";
import { useLaws } from "@/components/providers/LawsProvider";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";

interface BrowseViewProps {
  onOpenLaw: (law: Law) => void;
}

export function BrowseView({ onOpenLaw }: BrowseViewProps) {
  const [sortBy, setSortBy] = useState<"year" | "title" | "status">("year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  const laws = useLaws();

  const subjects = Array.from(new Set(laws.map((l) => l.subject)));
  const types = Array.from(new Set(laws.map((l) => l.type)));

  let displayed = laws.filter(
    (l) =>
      (!typeFilter || l.type === typeFilter) &&
      (!subjectFilter || l.subject === subjectFilter)
  );

  displayed = [...displayed].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "year") cmp = a.year - b.year;
    else if (sortBy === "title") cmp = a.title.localeCompare(b.title, "fa");
    else if (sortBy === "status") cmp = a.status.localeCompare(b.status);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (col: "year" | "title" | "status") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const sortIndicator = (col: "year" | "title" | "status") => {
    if (sortBy !== col) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="container-legal py-8">
      <div className="mb-6">
        <h1 className="font-legal text-[26px] font-light text-[#1a1a1a] mb-1">
          مرور قوانین
        </h1>
        <p className="text-[13.5px] text-[#6b6b6b]">
          فهرست کامل قوانین موجود در پایگاه. برای مرتب‌سازی بر اساس هر ستون،
          عنوان آن را انتخاب کنید.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-5 p-4 bg-[#fafaf8] border border-[#e0ddd6]">
        <div>
          <label className="block text-[12px] text-[#6b6b6b] mb-1">نوع قانون</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-legal bg-white min-w-[160px]"
          >
            <option value="">همه ({toFa(types.length)} نوع)</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-[#6b6b6b] mb-1">موضوع</label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="input-legal bg-white min-w-[160px]"
          >
            <option value="">همه موضوعات</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="text-[12px] text-[#6b6b6b] mr-auto">
          {toFa(displayed.length)} قانون یافت شد
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto scrollbar-subtle">
        <table className="zebra-table min-w-[760px]">
          <thead>
            <tr>
              <th style={{ width: "44%" }}>
                <button
                  onClick={() => toggleSort("title")}
                  className="hover:text-[#1a1a1a] text-right"
                >
                  عنوان قانون{sortIndicator("title")}
                </button>
              </th>
              <th style={{ width: "16%" }}>
                <button
                  onClick={() => toggleSort("year")}
                  className="hover:text-[#1a1a1a] text-right"
                >
                  سال و شماره{sortIndicator("year")}
                </button>
              </th>
              <th style={{ width: "16%" }}>نوع</th>
              <th style={{ width: "12%" }}>
                <button
                  onClick={() => toggleSort("status")}
                  className="hover:text-[#1a1a1a] text-right"
                >
                  وضعیت{sortIndicator("status")}
                </button>
              </th>
              <th style={{ width: "12%" }}>موضوع</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((law, idx) => (
              <tr key={law.id} className={idx % 2 === 1 ? "odd-row" : ""}>
                <td>
                  <button
                    onClick={() => onOpenLaw(law)}
                    className="font-legal text-[14px] font-medium text-right hover:underline"
                  >
                    {law.title}
                  </button>
                  <div className="text-[12px] text-[#6b6b6b] mt-1 line-clamp-1">
                    {law.description}
                  </div>
                </td>
                <td className="cite">
                  {toFa(law.year)}
                  {law.number && law.number !== "—" && (
                    <span className="text-[#6b6b6b]"> — ش. {toFa(law.number)}</span>
                  )}
                </td>
                <td className="text-[13px] text-[#3d3d3d]">{law.type}</td>
                <td>
                  <span className={statusPillClass(law.status)}>
                    {statusLabel(law.status)}
                  </span>
                </td>
                <td className="text-[13px] text-[#3d3d3d]">{law.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12px] text-[#6b6b6b]">
        برای مشاهده قوانین منسوخ‌شده نیز می‌توانید از فیلتر وضعیت استفاده کنید.
        قوانین قدیمی‌تر با شماره ثبت مجلس شورای ملی/اسلامی در ستون «سال و شماره»
        نمایش داده می‌شوند.
      </p>
    </div>
  );
}
