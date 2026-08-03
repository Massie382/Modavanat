"use client";

import Link from "next/link";

interface AccountLayoutProps {
  /** The signed-in user's display name (or username) */
  userName: string;
  /** The user's email or phone (shown as muted meta under the name) */
  userIdentifier: string;
  /** Initials for the avatar circle */
  userInitials: string;
  children: React.ReactNode;
}

/**
 * AccountLayout — the dedicated chrome for the signed-in /account panel.
 *
 * Same philosophy as the auth pages: NO main site Header, NO charcoal
 * nav bar, NO footer columns. Just a slim top bar with the logo + a
 * "back to site" escape hatch, then the panel body fills the rest.
 *
 * The panel body itself (sidebar + content) is rendered by the page
 * via AccountShell — this layout only owns the outer chrome + the
 * bottom copyright strip.
 */
export function AccountLayout({
  userName,
  userIdentifier,
  userInitials,
  children,
}: AccountLayoutProps) {
  return (
    <div className="panel-backdrop flex flex-col min-h-screen">
      {/* Slim top bar — logo + back-to-site. NO nav. */}
      <header className="panel-topbar">
        <div className="container-legal py-2.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label="مدونات — صفحه نخست">
            <img
              src="/brand/logo.webp"
              alt="مدونات"
              width={1536}
              height={1024}
              className="h-[44px] sm:h-[52px] w-auto object-contain"
              draggable={false}
            />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mini user chip — name + initials avatar */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[12.5px] text-[#3d3d3d] truncate max-w-[140px]">
                {userName}
              </span>
              <span className="panel-user-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                {userInitials}
              </span>
            </div>
            <Link
              href="/"
              className="auth-back-link"
            >
              <span aria-hidden className="text-[#8d8d8d]">→</span>
              بازگشت به سایت
            </Link>
          </div>
        </div>
      </header>

      {/* Panel body */}
      <main className="flex-1">
        <div className="container-legal py-6 sm:py-8">
          {children}
        </div>
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

/** Single sidebar nav entry. Doubles as a mobile horizontal tab. */
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
