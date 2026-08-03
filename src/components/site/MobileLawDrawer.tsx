"use client";

import { useState, useCallback, useEffect } from "react";
import type { Law } from "@/lib/types";
import { toFa } from "@/lib/utils";
import { ArticlePicker } from "@/components/law/ArticlePicker";

interface MobileLawDrawerProps {
  law: Law;
  selectedArticleId: string | null;
  onSelectArticle: (id: string | null) => void;
}

/**
 * Mobile-only article picker drawer — shown on the article page only.
 *
 * This is the mobile mirror of the desktop right-side ArticlePicker (the
 * iOS-style scroll-snap "iPhone-like" cylinder list). It uses the exact
 * same <ArticlePicker> component so the look + feel matches the desktop
 * experience 1:1 — only the wrapper (FAB + slide-in panel + confirm
 * button) is mobile-specific.
 *
 * Interaction model (TWO-STEP — preview then confirm):
 *  - A small dark FAB is fixed on the LEFT edge of the screen (vertically
 *    centered). Tap it → drawer slides in from the LEFT, ~88% of viewport
 *    width (enough to comfortably read article numbers + titles).
 *  - Drawer contents:
 *      • Header (law title + close X)
 *      • <ArticlePicker> in PREVIEW MODE — same iOS scroll-snap list +
 *        search field as the desktop right sidebar. Scrolling/tapping
 *        updates the preview highlight ONLY; the article view underneath
 *        does NOT change yet.
 *      • "تأیید" (Confirm) button at the bottom — commits the currently
 *        previewed article as the actual selection and closes the drawer.
 *  - The two-step model prevents users from accidentally landing on the
 *    wrong article while scrolling past it. They have to explicitly tap
 *    "تأیید" to actually switch articles.
 *  - Escape key, overlay tap, and the X button all close the drawer
 *    WITHOUT committing (cancel path — the selection is unchanged).
 *  - Body scroll is locked while the drawer is open so only the picker
 *    list scrolls.
 */
export function MobileLawDrawer({
  law,
  selectedArticleId,
  onSelectArticle,
}: MobileLawDrawerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  // Preview state — what the user is currently looking at in the picker but
  // has NOT yet committed. Scrolling/tapping inside the picker updates this
  // preview only; the article view underneath does NOT change until the
  // user taps the "تأیید" button. This prevents users from accidentally
  // landing on the wrong article while scrolling past it.
  // Initialized from the current selection so the picker starts centered on
  // the article the user is already viewing.
  const [previewId, setPreviewId] = useState<string | null>(selectedArticleId);

  // Lock body scroll when drawer is open so the page behind doesn't scroll
  // — only the ArticlePicker list inside the drawer should scroll.
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // Reset the preview to the current selection whenever the drawer opens.
  // This way the picker always starts centered on the article the user is
  // currently viewing — they don't have to scroll back to find it.
  useEffect(() => {
    if (drawerOpen) {
      setPreviewId(selectedArticleId);
    }
  }, [drawerOpen, selectedArticleId]);

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    window.setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 220);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen, closeDrawer]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if the click landed on the overlay itself, not a child.
      if (e.target === e.currentTarget) closeDrawer();
    },
    [closeDrawer]
  );

  // Confirm button — commits the currently-previewed article as the actual
  // selection, then closes the drawer. The picker's scroll/tap only updates
  // the preview; THIS is the only path that actually switches the article
  // view underneath. This prevents users from accidentally landing on the
  // wrong article while scrolling past it.
  const handleConfirm = useCallback(() => {
    onSelectArticle(previewId);
    closeDrawer();
  }, [previewId, onSelectArticle, closeDrawer]);

  return (
    <>
      {/* FAB — fixed on the LEFT edge, mobile only. Dark charcoal rounded
          rectangle with a list icon, vertically centered. */}
      {!drawerOpen && (
        <button
          className="mobile-law-fab-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="باز کردن فهرست مواد این قانون"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      )}

      {/* Drawer overlay + panel */}
      {drawerOpen && (
        <>
          <div
            className="mobile-law-drawer-overlay"
            onClick={handleOverlayClick}
            aria-hidden
          />
          <aside
            className={`mobile-law-drawer-panel ${drawerClosing ? "closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="فهرست مواد این قانون"
          >
            <div className="mobile-law-drawer-header">
              <div className="min-w-0">
                <h3>مواد این قانون</h3>
                <p className="mobile-law-drawer-header-sub">
                  {law.title} · {toFa(law.year)}
                </p>
              </div>
              <button
                className="mobile-law-drawer-close"
                onClick={closeDrawer}
                aria-label="بستن"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mobile-law-drawer-body">
              {/* The exact same ArticlePicker component used on desktop —
                  iOS-style scroll-snap list + search field.

                  Preview mode: scroll/tap update `previewId` only, NOT
                  `selectedArticleId`. The user must tap the "تأیید" button
                  below to actually commit the selection. This prevents
                  accidental wrong-article selection while scrolling. */}
              <ArticlePicker
                articles={law.articles}
                selectedId={selectedArticleId}
                onSelect={onSelectArticle}
                totalCount={law.articles.length}
                previewId={previewId}
                onPreviewChange={setPreviewId}
              />
            </div>

            {/* Confirm button — fixed at the bottom of the drawer. Commits
                the currently-previewed article as the actual selection and
                closes the drawer. The picker above only previews; THIS is
                the commit action. */}
            <div className="mobile-law-drawer-footer">
              <button
                type="button"
                onClick={handleConfirm}
                className="btn-legal w-full"
              >
                تأیید
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
