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
 * This is INTENTIONALLY separate from the main site's Header + Footer
 * and from StaticPageLayout. Auth pages should feel like a distinct,
 * focused "mode" of the app: a slim top bar with just the logo and a
 * back-to-home link (no nav strip, no search box, no charcoal nav bar),
 * a centered auth card on a warm cream backdrop, and a minimal
 * copyright strip at the bottom.
 *
 * Visual language stays consistent with the rest of the site:
 *  - Vazirmatn font, RTL
 *  - charcoal buttons, hairline borders
 *  - container-legal max width
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
      {/* Slim top bar — logo only + back-to-home link. No nav. */}
      <header className="hairline-b bg-white/70 backdrop-blur-sm">
        <div className="container-legal py-2.5 flex items-center justify-between">
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
          <Link
            href="/"
            className="link-legal text-[12.5px] sm:text-[13px] flex items-center gap-1.5"
          >
            <span aria-hidden className="text-[#6b6b6b]">→</span>
            بازگشت به سایت
          </Link>
        </div>
      </header>

      {/* Body — centered card */}
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
