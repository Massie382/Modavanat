"use client";

import Link from "next/link";

interface AuthLayoutProps {
  /** Small eyebrow label above the title — e.g. "ورود به حساب" */
  eyebrow: string;
  /** Main page title — e.g. "خوش آمدید" */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** The form body */
  children: React.ReactNode;
  /** Footer switch row — usually the "حساب ندارید؟ ثبت‌نام کنید" link */
  footer?: React.ReactNode;
}

/**
 * AuthLayout — the dedicated minimal chrome for /signin and /signup.
 *
 * No site nav at all: no top header strip, no logo bar, no charcoal
 * nav, no footer columns. Just a centered auth card on a warm cream
 * backdrop. The only "escape hatch" is a small "بازگشت به سایت" link
 * at the top of the card itself, so users are never trapped but the
 * page stays focused on the single task of authenticating.
 *
 * Visual language stays consistent with the rest of the site:
 *  - Vazirmatn font, RTL
 *  - charcoal buttons, hairline borders
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col auth-backdrop">
      {/* Body — centered card. No site header above it. */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          {/* Eyebrow + title */}
          <div className="mb-6 sm:mb-7 text-center">
            <p className="text-[11.5px] tracking-[0.14em] text-[#6b6b6b] mb-2 uppercase">
              {eyebrow}
            </p>
            <h1 className="font-legal text-[24px] sm:text-[27px] font-light text-[#1a1a1a] leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[13px] text-[#6b6b6b] leading-6">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card */}
          <div className="auth-card auth-card-enter p-6 sm:p-8">
            {/* Back-to-site escape hatch — lives at the top of the card,
                not in a site header. Inline-end aligned (visual left in
                RTL) so the eyebrow/title above stays visually centered. */}
            <div className="flex justify-end mb-5">
              <Link
                href="/"
                className="auth-back-link"
              >
                <span aria-hidden className="text-[#8d8d8d]">→</span>
                بازگشت به سایت
              </Link>
            </div>

            {children}
          </div>

          {/* Footer switch */}
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </main>

      {/* Minimal bottom strip — copyright only, no nav */}
      <footer className="mt-auto">
        <div className="container-legal py-4 text-center text-[11.5px] text-[#8d8d8d]">
          © ۱۴۰۴ مدونات (modavanat.ir) — تمامی حقوق محفوظ است.
        </div>
      </footer>
    </div>
  );
}
