"use client";

import Link from "next/link";

interface AccountLayoutProps {
  /** The signed-in user's display name (or username) */
  userName: string;
  /** Initials for the avatar circle */
  userInitials: string;
  /** Hamburger click handler — opens the mobile drawer */
  onMenuClick?: () => void;
  children: React.ReactNode;
}

/**
 * AccountLayout — the dedicated chrome for the signed-in /account panel.
 *
 * Top bar (3-zone, LTR grid so left/center/right are unambiguous):
 *
 *   PC:
 *     • LEFT   — "بازگشت به سایت" link
 *     • CENTER — account-page logo
 *     • RIGHT  — user name + circle
 *
 *   Mobile:
 *     • LEFT   — "بازگشت به سایت" link (same as PC, no circle)
 *     • CENTER — account-page logo
 *     • RIGHT  — hamburger (opens drawer)
 *
 * No circle appears in the top bar on mobile — the circle is PC-only
 * (right cell). The return-to-site link is always on the left.
 *
 * The panel body itself (sidebar + content) is rendered by the page
 * via AccountShell — this layout only owns the outer chrome + the
 * bottom copyright strip.
 */
export function AccountLayout({
  userName,
  userInitials,
  onMenuClick,
  children,
}: AccountLayoutProps) {
  return (
    <div className="panel-backdrop flex flex-col min-h-screen">
      {/* Slim top bar — 3 zones: left | center logo | right */}
      <header className="panel-topbar">
        <div className="container-legal py-2.5">
          <div className="panel-topbar-grid">
            {/* LEFT — return-to-site link (always visible, PC + mobile) */}
            <div className="panel-topbar-left">
              <Link href="/" className="auth-back-link">
                <span aria-hidden className="text-[#8d8d8d]">→</span>
                بازگشت به سایت
              </Link>
            </div>

            {/* CENTER — account-page logo (always) */}
            <div className="panel-topbar-center">
              <Link href="/" aria-label="مدونات — صفحه نخست">
                <img
                  src="/brand/logoaccount.webp"
                  alt="مدونات"
                  width={1536}
                  height={1024}
                  className="h-[40px] sm:h-[48px] w-auto object-contain"
                  draggable={false}
                />
              </Link>
            </div>

            {/* RIGHT
                PC: user name + circle (circle hidden on mobile)
                Mobile: hamburger (hidden on PC) */}
            <div className="panel-topbar-right">
              <span className="hidden sm:inline text-[12.5px] text-[#3d3d3d] truncate max-w-[140px]">
                {userName}
              </span>
              <span
                className="panel-user-avatar panel-topbar-pc-only"
                style={{ width: 32, height: 32, fontSize: 13 }}
              >
                {userInitials}
              </span>
              <button
                type="button"
                className="panel-hamburger"
                aria-label="باز کردن منوی پنل"
                onClick={onMenuClick}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Panel body */}
      <main className="flex-1">
        <div className="container-legal py-6 sm:py-8">{children}</div>
      </main>

      {/* Minimal bottom strip */}
      <footer className="mt-auto">
        <div className="container-legal py-4 text-center text-[11.5px] text-[#8d8d8d]">
          © ۱۴۰۴ مدونات (modavanat.ir) — تمامی حقوق محفوظ است.
        </div>
      </footer>
    </div>
  );
}

/* ── Icons used by the sidebar nav ── */
export function BookmarkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
export function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
export function TicketIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <line x1="13" y1="5" x2="13" y2="7" />
      <line x1="13" y1="11" x2="13" y2="13" />
      <line x1="13" y1="17" x2="13" y2="19" />
    </svg>
  );
}
export function PurchaseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

interface SidebarItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

/** Single sidebar nav entry. Used both in the PC sidebar and the mobile drawer. */
export function SidebarItem({ id, label, icon, count, isActive, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`panel-nav-item ${isActive ? "is-active" : ""}`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="panel-nav-count">{count}</span>
      )}
    </button>
  );
}
