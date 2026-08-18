"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, StatTile, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

const statusLabel: Record<string, string> = {
  paid: "پرداخت‌شده",
  pending: "در انتظار",
  refunded: "بازگشت‌خورده",
  failed: "ناموفق",
};

interface PurchaseRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  invoiceNumber: string | null;
  paidAt: string | null;
  createdAt: string;
}

function faDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

export default function PurchasesPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Summary stats — fetched independently of the page filter so the
  // top tiles always show the global revenue totals.
  const [summary, setSummary] = useState<{
    total: number; paid: number; pending: number; refunded: number; failed: number; revenue: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/purchases?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch summary once on mount.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.purchasesSummary) setSummary(data.purchasesSummary);
      } catch {
        // ignore — dashboard endpoint may fail silently.
      }
    })();
  }, []);

  return (
    <>
      <PageHead title="خریدها و تراکنش‌ها" subtitle={loading ? "در حال بارگذاری…" : `${faNum(total)} تراکنش در فهرست`} />
      <div className="admin-stat-grid">
        <StatTile label="درآمد کل (پرداخت‌شده)" value={summary ? `${faNum(summary.revenue.toLocaleString("fa-IR"))} تومان` : "…"} />
        <StatTile label="پرداخت‌شده" value={summary ? faNum(summary.paid) : "…"} />
        <StatTile label="در انتظار" value={summary ? faNum(summary.pending) : "…"} />
        <StatTile label="کل تراکنش‌ها" value={summary ? faNum(summary.total) : "…"} />
      </div>
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="شناسه، کاربر یا شماره فاکتور…" />
        <select className="admin-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">همه وضعیت‌ها</option>
          <option value="paid">پرداخت‌شده</option>
          <option value="pending">در انتظار</option>
          <option value="refunded">بازگشت‌خورده</option>
          <option value="failed">ناموفق</option>
        </select>
      </Toolbar>
      <Card tight>
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : rows.length === 0 ? (
          <EmptyState title="تراکنشی یافت نشد" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>تاریخ</th><th>شرح</th><th>کاربر</th><th>روش</th>
                <th className="col-num">مبلغ</th><th>وضعیت</th><th>فاکتور</th><th className="col-narrow">عمل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><span className="admin-muted">{faDate(p.paidAt ?? p.createdAt)}</span></td>
                  <td><strong>{p.description}</strong></td>
                  <td><code className="admin-mono" dir="ltr">{p.userEmail}</code></td>
                  <td><span className="admin-muted">{p.method ?? "—"}</span></td>
                  <td className="col-num">{faNum(p.amount.toLocaleString("fa-IR"))} تومان</td>
                  <td>
                    <Badge
                      variant={
                        p.status === "paid" ? "success" :
                        p.status === "pending" ? "warning" :
                        p.status === "refunded" ? "info" :
                        p.status === "failed" ? "danger" : "neutral"
                      }
                    >{statusLabel[p.status] ?? p.status}</Badge>
                  </td>
                  <td><code className="admin-mono" dir="ltr" style={{ fontSize: 10 }}>{p.invoiceNumber ?? "—"}</code></td>
                  <td className="col-narrow">
                    <button
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      onClick={() => toast({ title: "اطلاع", description: "ایجاد خرید دستی در فاز ۷ پیاده‌سازی خواهد شد." })}
                    >+ جدید</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </Card>
    </>
  );
}
