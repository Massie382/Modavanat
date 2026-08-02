"use client";

import { toFa } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="مسیر ناوبری" className="breadcrumb py-3">
      <span className="text-[#9c9c9c]">شما اینجا هستید:</span>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center">
            <span className="sep">›</span>
            {last || !item.onClick ? (
              <span className={last ? "text-[#1a1a1a]" : "text-[#6b6b6b]"}>{item.label}</span>
            ) : (
              <button onClick={item.onClick} className="hover:text-[#1a1a1a] hover:underline">
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
