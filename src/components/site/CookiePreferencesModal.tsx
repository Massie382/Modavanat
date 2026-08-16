"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cookie preferences modal — three categories (necessary always on,
 * analytics + marketing toggleable) plus "Save preferences" and
 * "Accept all" actions.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true" + aria-labelledby on the title
 *   - focus is moved to the title on open and restored to the
 *     previously-focused element on close
 *   - Tab / Shift+Tab are trapped inside the dialog while it is open
 *   - Escape closes the modal WITHOUT saving (treated as cancel)
 *   - clicking the overlay (not its children) closes the modal WITHOUT saving
 *   - body scroll is locked while the modal is open
 *
 * The component is intentionally presentational — it knows nothing
 * about localStorage. The parent (CookieNotice) owns the persistence
 * layer and passes `initialChoices` + the three callbacks.
 */

export interface CookieChoices {
  analytics: boolean;
  marketing: boolean;
}

interface CookiePreferencesModalProps {
  /** Initial toggle state when the modal opens. */
  initialChoices: CookieChoices;
  /** Save the user's current toggle choices and close the modal. */
  onSave: (choices: CookieChoices) => void;
  /** Enable all categories (analytics + marketing on) and close. */
  onAcceptAll: () => void;
  /** Cancel without saving (Escape / overlay click). The banner stays
   *  visible underneath so the user can pick a button later. */
  onCancel: () => void;
}

/** Elements that should receive keyboard focus when tabbing inside the
 *  modal. Excludes disabled buttons and elements with tabindex="-1"
 *  (e.g. the title, which is programmatically focusable but not a
 *  tab stop). */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function CookiePreferencesModal({
  initialChoices,
  onSave,
  onAcceptAll,
  onCancel,
}: CookiePreferencesModalProps) {
  // Local toggle state — seeded from `initialChoices` on each mount.
  // The parent unmounts the modal when it closes, so re-opening
  // re-seeds from the latest `initialChoices` prop.
  const [analytics, setAnalytics] = useState(initialChoices.analytics);
  const [marketing, setMarketing] = useState(initialChoices.marketing);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  // Remember the element that had focus before the modal opened so we
  // can restore it on close. This is a basic accessibility expectation
  // for non-modal dialogs and modals alike.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Lock body scroll while the modal is open. Restore the previous
  // overflow value on cleanup so we don't clobber unrelated styles.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Move focus to the dialog title on open, and restore focus to the
  // previously-focused element on close.
  useEffect(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    // Slight delay so the portal is fully painted before we steal focus.
    const id = window.requestAnimationFrame(() => {
      const target = titleRef.current ?? dialogRef.current;
      target?.focus();
    });
    return () => {
      window.cancelAnimationFrame(id);
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  // Keyboard handler: Escape cancels; Tab wraps inside the dialog.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (el) =>
          // Filter out elements that are visually hidden (display:none,
          // visibility:hidden, or zero-size). offsetParent is null for
          // fixed-position elements too, but our modal has no fixed
          // descendants so this is a safe-enough heuristic.
          el.offsetParent !== null ||
          el === document.activeElement
      );
      if (nodes.length === 0) {
        e.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel]
  );

  useEffect(() => {
    // Capture-phase listener so we intercept the Escape before any
    // descendant can swallow it (e.g. a nested form field).
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Track whether the mousedown started on the overlay itself. If the
    // user drags from inside the modal to the overlay and releases, we
    // don't want to close — only an actual overlay→overlay click should
    // cancel. So we check on mousedown and again on click.
    if (e.target === e.currentTarget) {
      (e.currentTarget as HTMLDivElement).dataset.overlayMouseDown = "1";
    } else {
      delete (e.currentTarget as HTMLDivElement).dataset.overlayMouseDown;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const overlay = e.currentTarget;
    if (e.target === overlay && overlay.dataset.overlayMouseDown === "1") {
      delete overlay.dataset.overlayMouseDown;
      onCancel();
    }
  };

  return (
    <div
      className="cookie-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
      dir="rtl"
    >
      <div
        ref={dialogRef}
        className="cookie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
        tabIndex={-1}
      >
        <header className="cookie-modal-header">
          <h2
            id="cookie-modal-title"
            ref={titleRef}
            className="cookie-modal-title"
            tabIndex={-1}
          >
            تنظیمات کوکی
          </h2>
          <button
            type="button"
            className="cookie-modal-close"
            aria-label="بستن"
            onClick={onCancel}
          >
            {/* Times symbol (×) — same glyph used by most Persian UIs
                for a close affordance. */}
            ×
          </button>
        </header>

        <div className="cookie-modal-body">
          {/* Necessary — always on, locked. Rendered as a non-interactive
              switch (no button, no tabindex) so it's not a tab stop and
              can't be clicked. aria-disabled tells AT users it's locked. */}
          <div className="cookie-category cookie-category-disabled">
            <div className="cookie-category-text">
              <span className="cookie-category-label">ضروری</span>
              <p className="cookie-category-desc">
                این کوکی‌ها برای عملکرد پایهٔ سایت ضروری هستند و قابل غیرفعال‌سازی نیستند.
              </p>
            </div>
            <span
              className="cookie-switch is-on"
              role="switch"
              aria-checked="true"
              aria-disabled="true"
              aria-label="ضروری (همیشه فعال)"
            />
          </div>

          {/* Analytics — toggleable, default on. */}
          <div className="cookie-category">
            <div className="cookie-category-text">
              <span className="cookie-category-label">تحلیلی</span>
              <p className="cookie-category-desc">
                کوکی‌های تحلیلی به ما کمک می‌کنند بفهمیم کاربران چگونه از سایت استفاده می‌کنند تا آن را بهبود بخشیم.
              </p>
            </div>
            <button
              type="button"
              className={`cookie-switch${analytics ? " is-on" : ""}`}
              role="switch"
              aria-checked={analytics ? "true" : "false"}
              aria-label="کوکی‌های تحلیلی"
              onClick={() => setAnalytics((v) => !v)}
            />
          </div>

          {/* Marketing — toggleable, default off. */}
          <div className="cookie-category">
            <div className="cookie-category-text">
              <span className="cookie-category-label">بازاریابی</span>
              <p className="cookie-category-desc">
                کوکی‌های بازاریابی برای نمایش تبلیغات مرتبط استفاده می‌شوند.
              </p>
            </div>
            <button
              type="button"
              className={`cookie-switch${marketing ? " is-on" : ""}`}
              role="switch"
              aria-checked={marketing ? "true" : "false"}
              aria-label="کوکی‌های بازاریابی"
              onClick={() => setMarketing((v) => !v)}
            />
          </div>
        </div>

        <footer className="cookie-modal-footer">
          <button
            type="button"
            className="cookie-btn cookie-btn-secondary"
            onClick={() => onSave({ analytics, marketing })}
          >
            ذخیره تنظیمات
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={onAcceptAll}
          >
            پذیرش همه
          </button>
        </footer>
      </div>
    </div>
  );
}
