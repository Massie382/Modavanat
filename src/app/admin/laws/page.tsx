"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHead, Card, Badge, Toolbar, SearchInput, Pagination, EmptyState, statusBadgeVariant, faNum } from "@/components/admin/primitives";
import { useToast } from "@/hooks/use-toast";
import type { Law, LawStatus, LawType } from "@/lib/types";

const statusLabel: Record<LawStatus, string> = {
  "in-force": "لازم‌الاجرا",
  amended: "اصلاح‌شده",
  revoked: "منسوخ",
  pending: "در انتظار",
};

const typeOptions: { value: LawType | "all"; label: string }[] = [
  { value: "all", label: "همه انواع" },
  { value: "قانون عادی", label: "قانون عادی" },
  { value: "قانون اساسی", label: "قانون اساسی" },
  { value: "آیین‌نامه", label: "آیین‌نامه" },
  { value: "بخشنامه", label: "بخشنامه" },
  { value: "مقررات", label: "مقررات" },
];

const statusOptions: { value: LawStatus | "all"; label: string }[] = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "in-force", label: "لازم‌الاجرا" },
  { value: "amended", label: "اصلاح‌شده" },
  { value: "revoked", label: "منسوخ" },
  { value: "pending", label: "در انتظار" },
];

export default function AdminLawsList() {
  const { toast } = useToast();
  const [all, setAll] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"year" | "title" | "status">("year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/laws", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setAll(data.laws ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در بارگذاری قوانین");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(all.map((l) => l.subject))),
    [all]
  );

  const filtered = useMemo(() => {
    let r = all.filter((l) => {
      if (q && !`${l.title} ${l.shortTitle || ""} ${l.id} ${l.number || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (subjectFilter !== "all" && l.subject !== subjectFilter) return false;
      return true;
    });
    r = r.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "year") cmp = a.year - b.year;
      else if (sortBy === "title") cmp = a.title.localeCompare(b.title, "fa");
      else if (sortBy === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [all, q, typeFilter, statusFilter, subjectFilter, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const toggleSelect = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };
  const toggleSelectAll = () => {
    setSelected(selected.size === paged.length ? new Set() : new Set(paged.map((l) => l.id)));
  };

  return (
    <>
      <PageHead
        title="همه قوانین"
        subtitle={loading ? "در حال بارگذاری…" : `${faNum(all.length)} قانون در پایگاه ثبت شده است`}
        actions={
          <>
            <Link href="/admin/laws/new" className="admin-btn admin-btn-primary">+ قانون جدید</Link>
            <Link href="/admin/vocabularies" className="admin-btn admin-btn-ghost">مدیریت واژگان</Link>
          </>
        }
      />

      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="عنوان، شناسه یا شماره قانون…" />
        <select className="admin-select" style={{ width: "auto" }} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="admin-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="admin-select" style={{ width: "auto" }} value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}>
          <option value="all">همه موضوعات</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="admin-toolbar-spacer" />
        {selected.size > 0 && (
          <>
            <span className="admin-muted">{faNum(selected.size)} انتخاب شده</span>
            <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => {
              toast({ title: "اطلاع", description: "حذف گروهی قوانین در فاز ۷ پیاده‌سازی خواهد شد.", variant: "destructive" });
            }}>حذف انتخاب‌شده‌ها</button>
          </>
        )}
      </Toolbar>

      <Card tight>
        {error && (
          <div className="admin-notice admin-notice-warning">بارگذاری ناموفق بود: {error}</div>
        )}
        {loading ? (
          <EmptyState title="در حال بارگذاری…" />
        ) : paged.length === 0 ? (
          <EmptyState title="قانونی یافت نشد" desc="فیلترها را تغییر دهید یا قانون جدید اضافه کنید." />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-narrow">
                  <input
                    type="checkbox"
                    className="admin-check"
                    checked={selected.size === paged.length && paged.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th><SortButton label="عنوان" col="title" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} /></th>
                <th>نوع</th>
                <th><SortButton label="سال" col="year" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} /></th>
                <th>شماره</th>
                <th><SortButton label="وضعیت" col="status" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} /></th>
                <th>موضوع</th>
                <th className="col-narrow">عمل</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((l) => (
                <tr key={l.id} className={selected.has(l.id) ? "is-selected" : ""}>
                  <td><input type="checkbox" className="admin-check" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} /></td>
                  <td>
                    <Link href={`/admin/laws/${l.id}`} style={{ color: "var(--admin-ink)", textDecoration: "none", fontWeight: 500 }}>{l.title}</Link>
                    <div className="admin-muted admin-mono" style={{ marginTop: 2 }}>{l.id}</div>
                  </td>
                  <td><span className="admin-muted">{l.type}</span></td>
                  <td className="col-num">{faNum(l.year)}</td>
                  <td>{l.number ? <span className="admin-mono">{l.number}</span> : <span className="admin-muted">—</span>}</td>
                  <td><Badge variant={statusBadgeVariant(l.status)}>{statusLabel[l.status]}</Badge></td>
                  <td><span className="admin-muted">{l.subject}</span></td>
                  <td className="col-narrow">
                    <Link href={`/admin/laws/${l.id}`} className="admin-btn admin-btn-sm admin-btn-ghost">ویرایش</Link>
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

function SortButton({ label, col, sortBy, sortDir, onClick }: { label: string; col: string; sortBy: string; sortDir: "asc" | "desc"; onClick: (c: any) => void }) {
  const active = sortBy === col;
  return (
    <button onClick={() => onClick(col)} style={{ background: "none", border: "none", color: active ? "var(--admin-accent)" : "inherit", cursor: "pointer", font: "inherit", padding: 0, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
      {label}
      {active && <span style={{ fontSize: 9 }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}
