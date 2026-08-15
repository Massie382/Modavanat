"use client";

import { type ReactNode, useRef, useState, useEffect } from "react";

/* Shared small building blocks used across all admin pages. */

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="admin-page-head">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="admin-wrap">{actions}</div>}
    </div>
  );
}

export function Card({ title, desc, actions, children, foot, tight, style }: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
  tight?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className="admin-card" style={style}>
      {(title || actions) && (
        <div className="admin-card-head">
          <div>
            {title && <h2 className="admin-card-title">{title}</h2>}
            {desc && <p className="admin-card-desc">{desc}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={tight ? "admin-card-body-tight" : "admin-card-body"}>{children}</div>
      {foot && <div className="admin-card-foot">{foot}</div>}
    </div>
  );
}

export function Badge({ variant = "neutral", children }: { variant?: "neutral" | "success" | "warning" | "danger" | "info" | "accent"; children: ReactNode }) {
  return <span className={`admin-badge admin-badge-${variant}`}>{children}</span>;
}

export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canStart, setCanStart] = useState(false); // more content toward start (right in RTL)
  const [canEnd, setCanEnd] = useState(false);     // more content toward end (left in RTL)

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      // In RTL, scrollLeft is 0 at the start (right edge) and goes negative
      // toward the end (left edge). Some browsers report positive values, so
      // normalize using scrollWidth vs clientWidth + scrollLeft.
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) {
        setCanStart(false);
        setCanEnd(false);
        return;
      }
      const sl = el.scrollLeft;
      // distance from start (right edge in RTL). Use abs so it works in both dirs.
      const fromStart = Math.abs(sl);
      const fromEnd = Math.abs(maxScroll) - fromStart;
      setCanStart(fromStart > 4);
      setCanEnd(fromEnd > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [tabs]);

  return (
    <div className="admin-tabs-wrap">
      <span className={`admin-tabs-edge admin-tabs-edge-start ${canStart ? "is-on" : ""}`} aria-hidden="true">«</span>
      <div className="admin-tabs" ref={scrollerRef}>
        {tabs.map((t) => (
          <button key={t.id} className={`admin-tab ${active === t.id ? "is-active" : ""}`} onClick={() => onChange(t.id)}>
            {t.label}
            {t.count !== undefined && <span className="admin-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>
      <span className={`admin-tabs-edge admin-tabs-edge-end ${canEnd ? "is-on" : ""}`} aria-hidden="true">»</span>
    </div>
  );
}

export function Segmented({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="admin-segmented">
      {options.map((o) => (
        <button key={o.value} className={`admin-segment ${value === o.value ? "is-active" : ""}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" className={`admin-switch ${on ? "is-on" : ""}`} onClick={() => onChange(!on)} aria-label={label} aria-pressed={on} />
  );
}

export function Field({ label, hint, error, children, help }: { label: string; hint?: string; error?: string; children: ReactNode; help?: string }) {
  return (
    <div className="admin-field">
      <label className="admin-label">
        {label}
        {hint && <span className="admin-label-hint">{hint}</span>}
      </label>
      {children}
      {error && <div className="admin-error-text">{error}</div>}
      {help && <div className="admin-help">{help}</div>}
    </div>
  );
}

export function StatTile({ label, value, delta, deltaDir, icon }: {
  label: string;
  value: string | number;
  delta?: string;
  deltaDir?: "up" | "down";
  icon?: ReactNode;
}) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {delta && (
        <div className={`admin-stat-delta ${deltaDir === "up" ? "is-up" : deltaDir === "down" ? "is-down" : ""}`}>
          {deltaDir === "up" ? "▲" : deltaDir === "down" ? "▼" : "•"} {delta}
        </div>
      )}
      {icon && <div className="admin-stat-icon">{icon}</div>}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="admin-toolbar">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="admin-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "جستجو…"} />
    </div>
  );
}

export function Notice({ variant = "info", children }: { variant?: "info" | "success" | "warning" | "danger"; children: ReactNode }) {
  return <div className={`admin-notice admin-notice-${variant}`}>{children}</div>;
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <div className="admin-empty-title">{title}</div>
      {desc && <div className="admin-empty-desc">{desc}</div>}
      {action && <div style={{ marginTop: "1rem" }}>{action}</div>}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pager">
      <span>
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} از {total}
      </span>
      <div className="admin-pager-buttons">
        <button className="admin-btn admin-btn-sm admin-btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>قبلی</button>
        <span style={{ padding: "0 0.5rem", alignSelf: "center" }}>{page} / {totalPages}</span>
        <button className="admin-btn admin-btn-sm admin-btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>بعدی</button>
      </div>
    </div>
  );
}

/* Status / type → badge color mapping helpers */
export function statusBadgeVariant(status: string): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  switch (status) {
    case "in-force": case "active": case "paid": case "closed": return "success";
    case "amended": case "pending": return "warning";
    case "revoked": case "deleted": case "failed": return "danger";
    case "invited": case "suspended": return "info";
    default: return "neutral";
  }
}

export const faNum = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
