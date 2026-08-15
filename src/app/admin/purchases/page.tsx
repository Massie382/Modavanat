"use client";

import { useState, useMemo } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, StatTile, statusBadgeVariant, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import { defaultAdminPurchases } from "@/lib/admin-data";

const statusLabel: Record<string, string> = { paid: "پرداخت‌شده", pending: "در انتظار", refunded: "بازگشت‌خورده", failed: "ناموفق" };

export default function PurchasesPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => defaultAdminPurchases.filter((p) => {
    if (q && !`${p.id} ${p.user} ${p.invoiceNumber} ${p.description}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  }), [q, statusFilter]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalRevenue = defaultAdminPurchases.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPaid = defaultAdminPurchases.filter((p) => p.status === "paid").length;
  const totalPending = defaultAdminPurchases.filter((p) => p.status === "pending").length;

  return (
    <>
      <PageHead title="خریدها و تراکنش‌ها" subtitle={`${faNum(defaultAdminPurchases.length)} تراکنش ثبت‌شده`} />
      <div className="admin-stat-grid">
        <StatTile label="درآمد کل" value={`${faNum(totalRevenue.toLocaleString("fa-IR"))} تومان`} />
        <StatTile label="پرداخت‌شده" value={faNum(totalPaid)} />
        <StatTile label="در انتظار" value={faNum(totalPending)} />
        <StatTile label="کل تراکنش‌ها" value={faNum(defaultAdminPurchases.length)} />
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
        {paged.length === 0 ? <EmptyState title="تراکنشی یافت نشد" /> : (
          <table className="admin-table">
            <thead><tr><th>تاریخ</th><th>شرح</th><th>کاربر</th><th>روش</th><th className="col-num">مبلغ</th><th>وضعیت</th><th>فاکتور</th><th className="col-narrow">عمل</th></tr></thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id}>
                  <td><span className="admin-muted">{p.date}</span></td>
                  <td><strong>{p.description}</strong></td>
                  <td><code className="admin-mono">@{p.user}</code></td>
                  <td><span className="admin-muted">{p.method}</span></td>
                  <td className="col-num">{faNum(p.amount.toLocaleString("fa-IR"))} تومان</td>
                  <td><Badge variant={statusBadgeVariant(p.status)}>{statusLabel[p.status]}</Badge></td>
                  <td><code className="admin-mono">{p.invoiceNumber}</code></td>
                  <td className="col-narrow"><button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => toast({ title: "مشاهده", description: "باز کردن صفحه جزئیات..." })}>فاکتور</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
      </Card>
    </>
  );
}
