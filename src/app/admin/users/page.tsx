"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";

interface AdminUserFromApi {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: Date | string | null;
  image: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  passwordHash: string | null;
}

function faDate(d: Date | string | null): string {
  if (!d) return "—";
  try {
    return new Date(typeof d === "string" ? d : d.toISOString()).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

const AVATAR_COLORS = ["#d4a574", "#4a7c4a", "#4a6c8a", "#7a5c8a", "#c08a3e", "#b85c5c"];

export default function UsersPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [users, setUsers] = useState<AdminUserFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setUsers(data.users ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری کاربران");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // The /api/admin/users endpoint lists ALL users (admins + end users).
  // For the /admin/users (end-users) page, filter to role='user' only
  // — the admin surface for admins lives at /admin/admins.
  const endUsers = useMemo(() => users.filter((u) => u.role === "user"), [users]);

  const filtered = useMemo(() => {
    return endUsers.filter((u) => {
      const hay = `${u.email} ${u.name ?? ""} ${u.id}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      // status filter — we don't have an explicit status field on the
      // users table; for now treat all non-deleted users as 'active'.
      // (deleted users would have been cascade-removed by DELETE.)
      if (statusFilter !== "all" && statusFilter !== "active") return false;
      return true;
    });
  }, [endUsers, q, statusFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHead
        title="کاربران پایگاه"
        subtitle={loading ? "در حال بارگذاری…" : `${faNum(endUsers.length)} کاربر ثبت‌نام‌شده`}
        actions={
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => toast({ title: "اطلاع", description: "دعوت کاربر جدید در فاز ۷ پیاده‌سازی خواهد شد." })}
          >+ دعوت کاربر</button>
        }
      />

      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="نام، ایمیل یا شناسه…" />
        <select className="admin-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">همه</option>
          <option value="active">فعال</option>
        </select>
      </Toolbar>

      <Card tight>
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : paged.length === 0 ? (
          <EmptyState title="کاربری یافت نشد" />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th><th>ایمیل</th><th>وضعیت</th>
                <th>عضویت</th><th className="col-narrow">عمل</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((u, i) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-row">
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          color: "#1a1a1a",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >{(u.name ?? u.email).charAt(0)}</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.name ?? "—"}</div>
                        <div className="admin-muted admin-mono" dir="ltr" style={{ fontSize: 10 }}>{u.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td><code className="admin-mono" dir="ltr">{u.email}</code></td>
                  <td><Badge variant="success">فعال</Badge></td>
                  <td><span className="admin-muted">{faDate(u.createdAt)}</span></td>
                  <td className="col-narrow">
                    <button
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      onClick={() => toast({ title: "اطلاع", description: "مدیریت جزئی کاربر (تعلیق، حذف) در فاز ۷ پیاده‌سازی خواهد شد." })}
                    >مدیریت</button>
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
