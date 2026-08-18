"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLaws } from "@/components/providers/LawsProvider";
import { toFa } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";

interface BookmarkItem {
  lawId: string;
  addedAt: string; // ISO-ish Persian date
  note?: string;
}

const PAGE_SIZE = 5;

export function BookmarksTab({
  bookmarks,
  onRemove,
  loading,
}: {
  bookmarks: BookmarkItem[];
  onRemove: (lawId: string) => void | Promise<void>;
  loading?: boolean;
}) {
  const laws = useLaws();
  const [filter, setFilter] = useState<"all" | "in-force" | "amended" | "revoked">("all");
  const [page, setPage] = useState(1);

  // Join with real law data (from the LawsProvider context)
  const enriched = useMemo(() => {
    return bookmarks
      .map((b) => {
        const law = laws.find((l) => l.id === b.lawId);
        return law ? { ...b, law } : null;
      })
      .filter((x): x is BookmarkItem & { law: NonNullable<ReturnType<typeof laws.find>> } => x !== null);
  }, [bookmarks, laws]);

  const filtered = useMemo(() => {
    if (filter === "all") return enriched;
    return enriched.filter((b) => b.law.status === filter);
  }, [enriched, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (bookmarks.length === 0) {
    return (
      <PanelContent
        title="نشانه‌گذاری‌ها"
        subtitle="قوانین ذخیره‌شده برای دسترسی سریع بعدی."
      >
        <EmptyState
          title="هنوز نشانه‌ای ندارید"
          text="برای نشانه‌گذاری یک قانون، روی دکمه «افزودن به نشانه‌ها» در صفحهٔ آن قانون بزنید. نشانه‌گذاری‌های شما اینجا نمایش داده می‌شوند."
          actionLabel="مرور قوانین"
          actionHref="/"
        />
      </PanelContent>
    );
  }

  return (
    <PanelContent
      title="نشانه‌گذاری‌ها"
      subtitle={`${toFa(enriched.length)} قانون ذخیره شده`}
    >
      {/* Filter pills */}
      <div className="panel-filters">
        <FilterPill label="همه" active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }} />
        <FilterPill label="لازم‌الاجرا" active={filter === "in-force"} onClick={() => { setFilter("in-force"); setPage(1); }} />
        <FilterPill label="اصلاح‌شده" active={filter === "amended"} onClick={() => { setFilter("amended"); setPage(1); }} />
        <FilterPill label="منسوخ" active={filter === "revoked"} onClick={() => { setFilter("revoked"); setPage(1); }} />
      </div>

      {/* List */}
      <div>
        {pageItems.map((b) => (
          <div key={b.lawId} className="panel-row">
            <div className="panel-row-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="panel-row-main">
              <div className="panel-row-title">
                <Link href={`/law/${b.lawId}`}>{b.law.title}</Link>
              </div>
              <div className="panel-row-meta">
                <span>سال {toFa(b.law.year)}</span>
                <span className="panel-row-meta-dot" />
                <span>{b.law.subject}</span>
                <span className="panel-row-meta-dot" />
                <span>ذخیره در {b.addedAt}</span>
                {b.note && (
                  <>
                    <span className="panel-row-meta-dot" />
                    <span className="truncate" style={{ maxWidth: 240 }}>یادداشت: {b.note}</span>
                  </>
                )}
              </div>
            </div>
            <div className="panel-row-actions">
              <span className={`pill ${pillClassFor(b.law.status)}`}>
                {labelFor(b.law.status)}
              </span>
              <button
                type="button"
                className="panel-icon-btn is-danger"
                onClick={() => onRemove(b.lawId)}
                aria-label={`حذف نشانه ${b.law.title}`}
                title="حذف"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-5">
          <Pager
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            showSummary
            unitLabel="نشانه"
            totalItems={filtered.length}
          />
        </div>
      )}
    </PanelContent>
  );
}

/* ── helpers ── */
function labelFor(status: string) {
  return status === "in-force" ? "لازم‌الاجرا"
    : status === "amended" ? "اصلاح‌شده"
    : status === "revoked" ? "منسوخ"
    : "در انتظار";
}
function pillClassFor(status: string) {
  return status === "in-force" ? "pill pill-in-force"
    : status === "amended" ? "pill pill-amended"
    : status === "revoked" ? "pill pill-revoked"
    : "pill";
}

/* ── shared layout pieces ── */
function PanelContent({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <>
      <div className="panel-content-header">
        <div>
          <h2 className="panel-content-title">{title}</h2>
          {subtitle && <p className="panel-content-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="panel-content-body">{children}</div>
    </>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel-filter-pill ${active ? "is-active" : ""}`}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, text, actionLabel, actionHref }: { title: string; text: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="panel-empty">
      <div className="panel-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="panel-empty-title">{title}</p>
      <p className="panel-empty-text">{text}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-legal btn-legal-ghost btn-legal-sm">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
