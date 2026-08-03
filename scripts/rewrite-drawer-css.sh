#!/bin/bash
# Replace the mobile-law-* CSS block in globals.css with the updated version.
# We use awk to find and replace the block bounded by:
#   START: /^\/\* =+$/  followed by line containing "Mobile law navigation"
#   END:   /^@media \(prefers-reduced-motion: reduce\) \{/ ... matching close brace
# Then append the new block.

set -e
cd /home/z/my-project

SRC=src/app/globals.css
TMP=$(mktemp)

# Use perl to slurp the file and replace the entire mobile-law section.
perl -0777 -i -pe '
  s{
    /\* =+\n
    \s*Mobile\ law\ navigation[^\n]*\n
    (?:[^\n]*\n)*?
    \s*============================================================\s*\n
    (?:.*?\n)*?
    \@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\n
    (?:\s+\.mobile-law[^\n]*\n)+
    \s*\}\n
  }{}gsx;
' "$SRC"

# Now append the new CSS block at the end of the file.
cat >> "$SRC" << 'CSSEOF'

/* ============================================================
   Mobile law navigation FAB + drawer
   Visible only on the article page, below md breakpoint
   ============================================================ */
.mobile-law-fab-btn {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 40;
  /* Charcoal rounded rectangle, hugging the left edge — matches the
     user-supplied design screenshot. */
  width: 36px;
  height: 64px;
  border-radius: 0 8px 8px 0; /* round only the right edge */
  background-color: var(--charcoal);
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.18);
  transition: background-color 0.15s ease, width 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  /* Hidden on desktop by default */
  display: none;
}
@media (max-width: 767px) {
  .mobile-law-fab-btn {
    display: flex;
  }
}
.mobile-law-fab-btn:hover,
.mobile-law-fab-btn:active {
  background-color: var(--charcoal-deep);
  width: 40px;
  box-shadow: 4px 0 18px rgba(0, 0, 0, 0.25);
}
.mobile-law-fab-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Drawer overlay + panel — slides in from LEFT, covers ~60% of screen */
.mobile-law-drawer-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 49;
  animation: drawer-overlay-fade 200ms ease-out;
}
.mobile-law-drawer-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: min(360px, 60vw);
  background-color: var(--surface);
  z-index: 50;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  animation: drawer-slide-in 280ms cubic-bezier(0.16, 0.84, 0.44, 1);
}
.mobile-law-drawer-panel.closing {
  animation: drawer-slide-out 220ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
.mobile-law-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--rule);
  background-color: var(--charcoal);
  color: #ffffff;
  flex-shrink: 0;
}
.mobile-law-drawer-header h3 {
  font-family: var(--font-vazirmatn), sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
.mobile-law-drawer-close {
  background: transparent;
  border: none;
  color: #d8d8d8;
  cursor: pointer;
  padding: 0.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.mobile-law-drawer-close:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
}
.mobile-law-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  background-color: var(--surface);
  padding-bottom: 0.5rem;
}
.mobile-law-drawer-list {
  overflow-y: auto;
  max-height: calc(100vh - 220px);
  scrollbar-width: thin;
}
.mobile-law-drawer-item {
  display: block;
  width: 100%;
  text-align: right;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--rule-soft);
  background: transparent;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  transition: background-color 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.mobile-law-drawer-item:hover {
  background-color: var(--surface-sunken);
}
.mobile-law-drawer-item.highlighted {
  /* Brief highlight when the user has just tapped a law to view it.
     Indicates "you are now viewing this law" without closing the drawer. */
  background-color: #fff7e6;
  box-shadow: inset 3px 0 0 var(--charcoal);
}
.mobile-law-drawer-item:last-child {
  border-bottom: none;
}
.mobile-law-drawer-footer {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--rule);
  background-color: var(--surface-raised);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-law-drawer-overlay,
  .mobile-law-drawer-panel,
  .mobile-law-drawer-panel.closing,
  .mobile-law-fab-btn {
    animation: none;
    transition: none;
  }
}
CSSEOF

echo "Done. Verifying..."
grep -c "mobile-law" src/app/globals.css
echo "Old .mobile-law-fab wrapper still present?"
grep -c "^\.mobile-law-fab {" src/app/globals.css || echo "  (no — good)"
echo "New .mobile-law-fab-btn present?"
grep -c "^\.mobile-law-fab-btn {" src/app/globals.css
echo "Footer class present?"
grep -c "mobile-law-drawer-footer" src/app/globals.css
