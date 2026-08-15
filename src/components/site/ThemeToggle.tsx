"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/* ----------  mounted() — client-only boolean, no hydration mismatch  ----------
 * React 19's `react-hooks/set-state-in-effect` rule disallows calling
 * `setState` synchronously inside `useEffect`. The canonical replacement
 * for the old "const [mounted, setMounted] = useState(false);
 * useEffect(() => setMounted(true), [])" pattern is `useSyncExternalStore`
 * with a no-op subscribe and a server snapshot of `false` / client
 * snapshot of `true`. React renders the server snapshot during SSR and
 * hydration, then immediately re-renders with the client snapshot —
 * exactly the behavior we want, with no cascading render warning. */
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Light/dark mode toggle button.
 *
 * Renders a 32×32 outlined icon button — a moon in light mode (click to
 * go dark), a sun in dark mode (click to go light). Matches the
 * editorial charcoal-outlined aesthetic of the rest of the header.
 *
 * Hydration: the button only renders its icon after mount. Before that
 * we render a same-sized empty placeholder (`w-9 h-9`) so the layout
 * doesn't shift when the icon swaps in. This avoids a hydration
 * mismatch — `useTheme()` always reads `null`/`undefined` on the server
 * and the real value only on the client.
 *
 * Lives in the header's auth-links row, to the left of ورود / ثبت‌نام.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) return <div className="w-9 h-9" aria-hidden />; // placeholder to prevent layout shift

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      title={isDark ? "حالت روشن" : "حالت تاریک"}
      className="theme-toggle"
    >
      {isDark ? (
        // Sun icon — click to switch to light
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon — click to switch to dark
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
