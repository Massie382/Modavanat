"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme provider wrapper around `next-themes`.
 *
 * Design decisions:
 *  - `attribute="class"` — toggles the `.dark` class on <html> so the
 *    existing `.dark { ... }` token block in globals.css is what actually
 *    restyles the site. No JS color logic anywhere.
 *  - `defaultTheme="light"` — the site has a strong light editorial
 *    identity (charcoal nav, hairline rules, warm paper-white surface).
 *    Dark mode is opt-in via the toggle in the header.
 *  - `enableSystem={false}` — we don't auto-switch on OS preference,
 *    again to preserve the light-first identity.
 *  - `disableTransitionOnChange` — prevents the awkward color fade when
 *    toggling; the change is instant.
 *
 * Used in src/app/layout.tsx, wrapping {children} + <Toaster />.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
