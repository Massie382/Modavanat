"use client";

import { useState, useMemo } from "react";
import { toFa } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";

export interface Purchase {
  id: string;
  date: string;
  description: string;
  amount: number; // toman
  status: "paid" | "pending" | "refunded" | "failed";
  method: string;
  invoiceNumber: string;
}

interface PurchasesTabProps {
  purchases: Purchase[];
  loading?: boolean;
}

const PAGE_SIZE = 8;

export function PurchasesTab({ purchases, loading }: PurchasesTabProps) {
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "refunded">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (filter === "all") return purchases;
    return purchases.filter((p) => p.status === filter);
  }, [purchases, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Aggregate stats
  const totalSpent = purchases
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const paidCount = purchases.filter((p) => p.status === "paid").length;
  const pendingCount = purchases.filter((p) => p.status === "pending").length;

  return (
    <>
      <div className="panel-content-header">
        <div>
          <h2 className="panel-content-title">خریدها</h2>
          <p className="panel-content-subtitle">تاریخچهٔ پرداخت‌ها، اشتراک‌ها و فاکتورها.</p>
        </div>
      </div>

      <div className="panel-content-body">
        {purchases.length === 0 ? (
          <EmptyState
            title="خریدی ثبت نشده"
            text="وقتی اشتراک پریمیوم یا سرویس پولی مدونات را تهیه کنید، فاکتورها و تاریخچهٔ پرداخت‌های شما اینجا نمایش داده می‌شوند."
          />
        ) : (
          <>
            {/* Stat row */}
            <div className="panel-stat-row">
              <div className="panel-stat">
                <div className="panel-stat-num">{toFa(purchases.length)}</div>
                <div className="panel-stat-label">کل تراکنش‌ها</div>
              </div>
              <div className="panel-stat">
                <div className="panel-stat-num">{toFa(paidCount)}</div>
                <div className="panel-stat-label">پرداخت موفق</div>
              </div>
              <div className="panel-stat">
                <div className="panel-stat-num">{toFa(pendingCount)}</div>
                <div className="panel-stat-label">در انتظار</div>
              </div>
              <div className="panel-stat">
                <div className="panel-stat-num">{toFa(totalSpent.toLocaleString("fa-IR"))}</div>
                <div className="panel-stat-label">مجموع پرداختی (تومان)</div>
              </div>
            </div>

            {/* Filters */}
            <div className="panel-filters">
              <FilterPill label="همه" active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }} />
              <FilterPill label="پرداخت‌شده" active={filter === "paid"} onClick={() => { setFilter("paid"); setPage(1); }} />
              <FilterPill label="در انتظار" active={filter === "pending"} onClick={() => { setFilter("pending"); setPage(1); }} />
              <FilterPill label="بازگشت‌داده‌شده" active={filter === "refunded"} onClick={() => { setFilter("refunded"); setPage(1); }} />
            </div>

            {/* Table — responsive: on mobile, each row becomes a stacked
                card with inline labels (via data-label attributes). */}
            <div className="panel-purchase-wrap">
              <table className="panel-purchase-table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>شرح</th>
                    <th>روش پرداخت</th>
                    <th className="num">مبلغ (تومان)</th>
                    <th>وضعیت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => (
                    <tr key={p.id}>
                      <td className="num" data-label="تاریخ">{p.date}</td>
                      <td data-label="شرح">
                        <div style={{ fontWeight: 500, color: "var(--ink)" }}>{p.description}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--ink-muted)", marginTop: 2 }}>
                          فاکتور #{p.invoiceNumber}
                        </div>
                      </td>
                      <td data-label="روش پرداخت">{p.method}</td>
                      <td className="num" data-label="مبلغ (تومان)">{toFa(p.amount.toLocaleString("fa-IR"))}</td>
                      <td data-label="وضعیت">
                        <span className={`panel-ticket-status panel-ticket-status-${statusToPill(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td data-label="">
                        {p.status === "paid" && (
                          <button
                            type="button"
                            className="panel-icon-btn"
                            title="دانلود فاکتور"
                            aria-label="دانلود فاکتور"
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                window.open(`/api/purchases/${p.id}/invoice`, "_blank", "noopener,noreferrer");
                              }
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-5">
                <Pager
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  showSummary
                  unitLabel="تراکنش"
                  totalItems={filtered.length}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ── helpers ── */
function statusLabel(s: string) {
  return s === "paid" ? "پرداخت‌شده"
    : s === "pending" ? "در انتظار"
    : s === "refunded" ? "بازگشت‌داده‌شده"
    : "ناموفق";
}
function statusToPill(s: string) {
  return s === "paid" ? "open"       // green-ish
    : s === "pending" ? "pending"    // amber
    : s === "refunded" ? "closed"    // muted
    : "closed";
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

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel-empty">
      <div className="panel-empty-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
      <p className="panel-empty-title">{title}</p>
      <p className="panel-empty-text">{text}</p>
    </div>
  );
}
