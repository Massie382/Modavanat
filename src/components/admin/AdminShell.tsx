"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ─────────────────────────────────────────────────────────────────────
   Admin shell — sidebar + topbar + content area.
   Dark charcoal chrome distinct from the public cream site.
   ───────────────────────────────────────────────────────────────────── */

const navGroups: {
  label: string;
  items: { href: string; label: string; icon: ReactNode; badge?: string }[];
}[] = [
  {
    label: "نمای کلی",
    items: [
      { href: "/admin", label: "داشبورد", icon: <DashboardIcon /> },
      { href: "/admin/activity", label: "لاگ فعالیت", icon: <ActivityIcon /> },
    ],
  },
  {
    label: "قوانین",
    items: [
      { href: "/admin/laws", label: "همه قوانین", icon: <BookIcon />, badge: "۵" },
      { href: "/admin/laws/new", label: "افزودن قانون", icon: <PlusIcon /> },
      { href: "/admin/vocabularies", label: "واژگان", icon: <TagsIcon /> },
    ],
  },
  {
    label: "محتوا",
    items: [
      { href: "/admin/pages", label: "صفحات ایستا", icon: <FileIcon /> },
      { href: "/admin/contact-emails", label: "ایمیل‌های تماس", icon: <MailIcon /> },
    ],
  },
  {
    label: "کاربران",
    items: [
      { href: "/admin/users", label: "کاربران پایگاه", icon: <UsersIcon /> },
      { href: "/admin/admins", label: "مدیران", icon: <ShieldIcon /> },
      { href: "/admin/bookmarks", label: "نشانه‌گذاری‌ها", icon: <BookmarkIcon /> },
      { href: "/admin/tickets", label: "تیکت‌ها", icon: <TicketIcon />, badge: "۳" },
      { href: "/admin/purchases", label: "خریدها", icon: <CreditCardIcon /> },
    ],
  },
  {
    label: "تنظیمات",
    items: [
      { href: "/admin/settings/branding", label: "نام و نشان", icon: <SparkleIcon /> },
      { href: "/admin/settings/navigation", label: "فهرست‌ها", icon: <MenuIcon /> },
      { href: "/admin/settings/home", label: "صفحه نخست", icon: <HomeIcon /> },
      { href: "/admin/settings/browse-search", label: "مرور و جستجو", icon: <SearchIcon /> },
      { href: "/admin/settings/law-detail", label: "صفحه قانون", icon: <BookOpenIcon /> },
      { href: "/admin/settings/appearance", label: "ظاهر و رنگ", icon: <PaletteIcon /> },
      { href: "/admin/settings/seo", label: "سئو و متا", icon: <GlobeIcon /> },
      { href: "/admin/settings/auth", label: "احراز هویت", icon: <LockIcon /> },
      { href: "/admin/settings/account", label: "پنل کاربری", icon: <UserCogIcon /> },
    ],
  },
];

interface SidebarCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const SidebarContext = createContext<SidebarCtx>({ open: false, setOpen: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function AdminShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
      <div className="admin-shell" dir="rtl">
        <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          <Link href="/admin" className="admin-brand" onClick={() => setSidebarOpen(false)}>
            <span className="admin-brand-mark">م</span>
            <span className="admin-brand-text">
              <span className="admin-brand-title">مدونات</span>
              <span className="admin-brand-sub">پنل مدیریت</span>
            </span>
          </Link>

          <nav className="admin-nav">
            {navGroups.map((group) => (
              <div key={group.label} className="admin-nav-group">
                <div className="admin-nav-group-label">{group.label}</div>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <Link href="/admin/admins" className="admin-user-card" style={{ textDecoration: "none" }}>
              <span className="admin-user-avatar">م</span>
              <span className="admin-user-info">
                <span className="admin-user-name">مدیر ارشد</span>
                <span className="admin-user-role">super-admin</span>
              </span>
            </Link>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="admin-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <header className="admin-topbar">
          <button
            className="admin-topbar-hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="باز کردن منو"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <AdminBreadcrumb />

          <div className="admin-topbar-spacer" />

          <div className="admin-topbar-actions">
            <Link href="/" target="_blank" className="admin-icon-btn" aria-label="مشاهده سایت" title="مشاهده سایت">
              <ExternalLinkIcon />
            </Link>
            <Link href="/admin/activity" className="admin-icon-btn" aria-label="اعلان‌ها" title="اعلان‌ها">
              <BellIcon />
              <span className="admin-icon-btn-dot" />
            </Link>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-fade-in">{children}</div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

/* Breadcrumb derived from pathname */
function AdminBreadcrumb() {
  const pathname = usePathname();
  if (!pathname || pathname === "/admin") return null;

  const segments = pathname.split("/").filter(Boolean).slice(1); // drop "admin"
  const labels: Record<string, string> = {
    laws: "قوانین",
    new: "قانون جدید",
    vocabularies: "واژگان",
    pages: "صفحات ایستا",
    "contact-emails": "ایمیل‌های تماس",
    users: "کاربران",
    admins: "مدیران",
    bookmarks: "نشانه‌گذاری‌ها",
    tickets: "تیکت‌ها",
    purchases: "خریدها",
    activity: "لاگ فعالیت",
    settings: "تنظیمات",
    branding: "نام و نشان",
    navigation: "فهرست‌ها",
    home: "صفحه نخست",
    "browse-search": "مرور و جستجو",
    "law-detail": "صفحه قانون",
    appearance: "ظاهر و رنگ",
    seo: "سئو و متا",
    auth: "احراز هویت",
    account: "پنل کاربری",
  };

  let href = "/admin";
  return (
    <nav className="admin-breadcrumb">
      <Link href="/admin">پنل مدیریت</Link>
      {segments.map((seg, i) => {
        href += "/" + seg;
        const isLast = i === segments.length - 1;
        return (
          <span key={href} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: "var(--admin-ink-muted)" }}>/</span>
            {isLast ? (
              <span className="is-current">{labels[seg] || seg}</span>
            ) : (
              <Link href={href}>{labels[seg] || seg}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* ─── Icons (kept inline so the shell file is self-contained) ─── */
function DashboardIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>);
}
function ActivityIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
}
function BookIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
}
function PlusIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
}
function TagsIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
}
function FileIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
}
function MailIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
}
function UsersIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
}
function ShieldIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
}
function BookmarkIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>);
}
function TicketIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v2a3 3 0 0 1 0 6v2c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/></svg>);
}
function CreditCardIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
}
function SparkleIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/><path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"/></svg>);
}
function MenuIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
}
function HomeIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
}
function SearchIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
}
function BookOpenIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>);
}
function PaletteIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>);
}
function GlobeIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
}
function LockIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
}
function UserCogIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="18" cy="12" r="3"/><path d="M18 9v1.5M18 13.5V15M15.5 12H17M19 12h1.5"/></svg>);
}
function BellIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);
}
function ExternalLinkIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>);
}
