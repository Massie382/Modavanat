"use client";

import { useState, useMemo } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, Field, statusBadgeVariant, faNum } from "@/components/admin/primitives";
import { defaultEndUsers } from "@/lib/admin-data";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => defaultEndUsers.filter((u) => {
    if (q && !`${u.username} ${u.displayName} ${u.email} ${u.phone || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  }), [q, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHead
        title="کاربران پایگاه"
        subtitle={`${faNum(defaultEndUsers.length)} کاربر ثبت‌نام‌شده`}
        actions={<button className="admin-btn admin-btn-primary">+ دعوت کاربر</button>}
      />

      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="نام، ایمیل یا شماره تلفن…" />
        <select className="admin-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="suspended">معلق</option>
          <option value="deleted">حذف‌شده</option>
        </select>
      </Toolbar>

      <Card tight>
        {paged.length === 0 ? (
          <EmptyState title="کاربری یافت نشد" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>کاربر</th><th>ایمیل</th><th>تلفن</th><th>وضعیت</th><th className="col-num">نشانه‌ها</th><th className="col-num">تیکت</th><th className="col-num">خرید</th><th>عضویت</th><th className="col-narrow">عمل</th></tr>
            </thead>
            <tbody>
              {paged.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-row">
                      <span style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: u.avatarColor, color: "#1a1a1a", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{u.displayName.charAt(0)}</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.displayName}</div>
                        <div className="admin-muted admin-mono">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><code className="admin-mono" dir="ltr">{u.email}</code></td>
                  <td><code className="admin-mono" dir="ltr">{u.phone || "—"}</code></td>
                  <td><Badge variant={statusBadgeVariant(u.status)}>{u.status === "active" ? "فعال" : u.status === "suspended" ? "معلق" : "حذف‌شده"}</Badge></td>
                  <td className="col-num">{faNum(u.bookmarksCount)}</td>
                  <td className="col-num">{faNum(u.ticketsCount)}</td>
                  <td className="col-num">{faNum(u.purchasesCount)}</td>
                  <td><span className="admin-muted">{u.joinedAt}</span></td>
                  <td className="col-narrow">
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">مشاهده</button>
                    <button className="admin-btn admin-btn-sm admin-btn-ghost">تعلیق</button>
                  </td>
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
