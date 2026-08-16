import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

/**
 * Layout for all public-facing pages (home, browse, search, law detail,
 * about, contact, guide, accessibility, privacy, terms).
 *
 * Renders the shared Header + main + Footer shell. Admin and account
 * routes live OUTSIDE this group so they keep their own chrome.
 *
 * The skip-to-content link is keyboard-only (visually hidden until focused)
 * and lets keyboard users jump straight to <main> without tabbing through
 * the entire header on every page.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="skip-to-content"
      >
        پرش به محتوای اصلی
      </a>
      <Header />
      <main id="main-content" className="flex-1 bg-background" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
