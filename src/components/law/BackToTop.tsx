"use client";

import { useEffect, useState } from "react";

/**
 * Back-to-top button — a small charcoal circle fixed to the bottom-end
 * corner of the viewport (bottom-right in RTL, since `inset-inline-end`
 * maps to the right edge when `dir="rtl"`). Fades in only after the user
 * has scrolled more than 400px down. Clicking scrolls smoothly to the top.
 *
 * Implementation notes:
 *  - Uses `window.scrollY` (page scroll, not an inner scroll container).
 *  - The scroll listener is passive so it never blocks the main thread.
 *  - Visibility is toggled via the `is-visible` class so the fade-in/out
 *    transition is handled entirely in CSS (see `globals.css`).
 *  - Respects `prefers-reduced-motion` via CSS.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      setVisible(window.scrollY > 400);
    };
    // Run once on mount so a refreshed-scrolled page doesn't start hidden.
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="بازگشت به بالا"
      className={`back-to-top${visible ? " is-visible" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      tabIndex={visible ? 0 : -1}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </button>
  );
}
