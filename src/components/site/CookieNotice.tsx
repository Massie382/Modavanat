"use client";

import { useEffect, useState } from "react";

/**
 * CookieNotice
 *
 * Slides up from the bottom on a visitor's first page-view. Persists the
 * dismissal in localStorage so the banner doesn't re-appear on subsequent
 * visits. Clicking «متوجه شدم» reverses the slide and unmounts the banner
 * after the transition ends.
 *
 * Design notes:
 * - Dark, frosted-glass card to match the site's dark chrome (header/footer).
 * - Self-contained CSS lives in globals.css under "Cookie notice".
 * - Respects prefers-reduced-motion (handled in CSS).
 * - The banner is rendered globally (including /admin) — the localStorage
 *   check means it shows at most once per browser.
 */

const STORAGE_KEY = "modavanat.cookie-consent.v1";
const EXIT_MS = 450; // keep in sync with the CSS transition duration

type Phase = "idle" | "shown" | "leaving";

export function CookieNotice() {
  // Single state machine: idle (not yet decided) → shown (slid up) →
  // leaving (sliding back down) → idle (unmounted). Keeping it as one
  // variable avoids cascading setState calls and makes the lifecycle
  // easy to reason about.
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    // Bail out silently if the user already dismissed the banner.
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage may be unavailable (private mode / disabled) —
      // proceed without persistence; the banner will still work for
      // the current session.
    }

    // Defer the slide-up to the next frame so the browser commits the
    // initial translateY(100%) state before we transition to 0. The
    // rAF callback runs asynchronously, so this isn't a synchronous
    // setState inside the effect body.
    const raf = requestAnimationFrame(() => setPhase("shown"));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setPhase("leaving");
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore — see comment in useEffect */
    }
    // Unmount after the slide-down finishes so it doesn't linger
    // in the DOM (and so it stops capturing pointer events).
    const t = window.setTimeout(() => setPhase("idle"), EXIT_MS);
    // No cleanup needed — if the component unmounts earlier (e.g. on
    // fast route changes), the worst case is one extra no-op state
    // update queued against an unmounted component, which React 18
    // handles silently.
    void t;
  };

  if (phase === "idle") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="اعلان کوکی‌ها"
      className={`cookie-notice ${phase === "shown" ? "is-shown" : ""}`}
    >
      <div className="cookie-notice-inner">
        <div className="cookie-notice-text">
          <p>
            این وب‌سایت برای بهبود تجربهٔ کاربری، تحلیل ترافیک و حفظ تنظیمات
            شما از کوکی‌ها استفاده می‌کند. با ادامهٔ استفاده از این سایت،
            با{" "}
            <a href="/privacy" className="cookie-notice-link">
              سیاست حریم خصوصی
            </a>{" "}
            موافقت می‌کنید.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="cookie-notice-btn"
          autoFocus
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
