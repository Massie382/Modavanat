"use client";

import { useState } from "react";
import type { Law, TOCItem } from "@/lib/types";
import { toFa } from "@/lib/utils";

interface TableOfContentsTabProps {
  law: Law;
  onOpenArticle: (articleId?: string) => void;
}

function TOCNode({
  item,
  depth,
  onOpenArticle,
}: {
  item: TOCItem;
  depth: number;
  onOpenArticle: (articleId?: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className="toc-item-wrap">
      <div
        className="toc-item"
        style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "جمع کردن" : "باز کردن"}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-[#6b6b6b] hover:text-[#1a1a1a] text-[13px]"
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="shrink-0 w-5 h-5 inline-block" />
        )}
        <span className="cite text-[#6b6b6b] text-[12.5px] shrink-0 w-24">
          {item.label}
        </span>
        {item.articleId ? (
          <button
            onClick={() => onOpenArticle(item.articleId)}
            className="toc-label text-right"
          >
            {item.title || item.label}
          </button>
        ) : (
          <span className={hasChildren ? "font-legal font-medium text-[#1a1a1a]" : "text-[#1a1a1a]"}>
            {item.title}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <ul>
          {item.children!.map((child) => (
            <TOCNode
              key={child.id}
              item={child}
              depth={depth + 1}
              onOpenArticle={onOpenArticle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TableOfContentsTab({ law, onOpenArticle }: TableOfContentsTabProps) {
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
                ساختار سلسله‌مراتبی {law.title} ({toFa(law.year)})
              </p>
            </div>
            <div className="flex gap-2">
              <button className="utility-pill">باز کردن همه</button>
              <button className="utility-pill">جمع کردن همه</button>
            </div>
          </div>

          <ul className="border-t border-[#ececea]">
            {law.toc.map((item) => (
              <TOCNode
                key={item.id}
                item={item}
                depth={0}
                onOpenArticle={onOpenArticle}
              />
            ))}
          </ul>

          <div className="mt-6 p-4 bg-[#fafaf8] border border-[#ececea] text-[13px] leading-6 text-[#3d3d3d]">
            <p className="font-legal font-semibold text-[#1a1a1a] mb-1.5">یادداشت ویرایشی</p>
            <p>
              این فهرست بر اساس ساختار رسمی قانون تنظیم شده است. هر ماده دارای
              شناسه پایدار (DOI) است و پیوند به متن کامل ماده از طریق این شناسه
              امکان‌پذیر است. در صورتی که ماده مورد نظر در فهرست نیامده، می‌توانید
              از تب «متن قانون» استفاده کنید.
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
