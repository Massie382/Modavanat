"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountLayout, SidebarItem } from "./AccountLayout";

export type AccountTab = "bookmarks" | "settings" | "tickets" | "purchases";

interface AccountShellProps {
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;

  /** Counts shown next to each nav item. Pass 0 to hide. */
  counts: Record<AccountTab, number>;

  /** User info */
  userName: string;
  userIdentifier: string;
  userInitials: string;

  /** Tab content */
  children: React.ReactNode;
}

const TAB_LABELS: Record<AccountTab, string> = {
  bookmarks: "نشانه‌گذاری‌ها",
  settings: "تنظیمات",
  tickets: "تیکت‌ها",
  purchases: "خریدها",
};

export function AccountShell({
  activeTab,
  onTabChange,
  counts,
  userName,
  userIdentifier,
  userInitials,
  children,
}: AccountShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items: AccountTab[] = ["bookmarks", "settings", "tickets", "purchases"];

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // Selecting a tab (from either the PC sidebar or the mobile drawer)
  // updates the active tab AND auto-closes the drawer.
  const handleTabSelect = (tab: AccountTab) => {
    onTabChange(tab);
    setDrawerOpen(false);
  };

  // The sidebar block — rendered twice: once inline (visible on md+)
  // and once inside the mobile drawer. Same markup, same handlers.
  const sidebarBlock = (
    <>
      {/* User mini-card */}
      <div className="panel-user-card">
        <div className="flex items-center gap-3">
          <span className="panel-user-avatar">{userInitials}</span>
          <div className="min-w-0">
            <div className="panel-user-name truncate">{userName}</div>
            <div
              className="panel-user-meta truncate"
              dir="ltr"
              style={{ textAlign: "right" }}
            >
              {userIdentifier}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="ناوبری پنل کاربری">
        {items.map((tab) => (
          <SidebarItem
            key={tab}
            id={tab}
            label={TAB_LABELS[tab]}
            icon={<TabIcon tab={tab} />}
            count={counts[tab]}
            isActive={activeTab === tab}
            onClick={() => handleTabSelect(tab)}
          />
        ))}

        {/* Sign out — always at the bottom */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "/signin";
          }}
          className="panel-nav-item"
          style={{ borderTop: "1px solid var(--rule-soft)", marginTop: 4 }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>خروج از حساب</span>
        </button>
      </nav>

      {/* Return-to-site — at the very bottom. Lives here so it's
          reachable from both the PC sidebar and the mobile drawer
          (the mobile top bar no longer has it). */}
      <div className="panel-side-footer">
        <Link href="/" className="auth-back-link">
          <span aria-hidden className="text-[#8d8d8d]">→</span>
          بازگشت به سایت
        </Link>
      </div>
    </>
  );

  return (
    <AccountLayout
      userName={userName}
      userInitials={userInitials}
      onMenuClick={() => setDrawerOpen(true)}
    >
      {/* Page heading */}
      <div className="mb-6">
        <p className="text-[11.5px] tracking-[0.14em] text-[#6b6b6b] mb-1.5 uppercase">
          حساب کاربری
        </p>
        <h1 className="font-legal text-[24px] sm:text-[28px] font-light text-[#1a1a1a] leading-tight">
          پنل کاربری {userName}
        </h1>
      </div>

      {/* Two-column grid.
          In RTL (dir="rtl") with grid-template-columns: 260px 1fr:
            • col 1 (sidebar, 260px) → visual RIGHT
            • col 2 (content, 1fr)   → visual LEFT
          So we put sidebar first in DOM, content second. */}
      <div className="panel-grid">
        {/* Sidebar — visible only on md+ (hidden on mobile, replaced by drawer) */}
        <aside className="panel-side">{sidebarBlock}</aside>

        {/* Content */}
        <section className="panel-content panel-tab-enter" key={activeTab}>
          {children}
        </section>
      </div>

      {/* Mobile drawer — slides in from the RIGHT */}
      <div
        className={`panel-drawer-backdrop ${drawerOpen ? "is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`panel-drawer ${drawerOpen ? "is-open" : ""}`}
        aria-hidden={!drawerOpen}
        role="dialog"
        aria-label="منوی پنل کاربری"
      >
        <div className="panel-drawer-header">
          <button
            type="button"
            className="panel-drawer-close"
            aria-label="بستن منو"
            onClick={() => setDrawerOpen(false)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        {sidebarBlock}
      </aside>
    </AccountLayout>
  );
}

/* Tab icons — kept inline to avoid an extra import cycle. */
function TabIcon({ tab }: { tab: AccountTab }) {
  switch (tab) {
    case "bookmarks":
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "settings":
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "tickets":
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 7v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
          <line x1="13" y1="5" x2="13" y2="7" />
          <line x1="13" y1="11" x2="13" y2="13" />
          <line x1="13" y1="17" x2="13" y2="19" />
        </svg>
      );
    case "purchases":
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
  }
}
