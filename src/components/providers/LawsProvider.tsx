"use client";

/**
 * LawsProvider — client-side React Context populated from server-side
 * data fetching at the root layout.
 *
 * WHY: many client components (Header, BrowseView, SearchView,
 * BookmarksTab, TimelineTab, ReferencesTab, AmendmentComparisonView)
 * need access to the full law list for cross-references / navigation
 * dropdowns. They used to `import { laws } from "@/data/laws"` directly,
 * which means the static in-memory file was the source of truth —
 * the DB was never consulted by the frontend.
 *
 * With this provider, the root layout (a server component) fetches the
 * law list once via `getLawCardList()` and hands it to <LawsProvider>
 * as the `initial` prop. Client components then read via `useLaws()`.
 *
 * The provided laws are LAW CARDS — metadata only (no articles, toc,
 * amendments, references). Components that need deep content for a
 * specific law should fetch `/api/laws/[id]` on demand.
 *
 * Also exposes `referencedLawTitles` (used by TimelineTab) and
 * `decadeStats` (used by BrowseView + SearchView) — both fetched
 * server-side at the root layout level.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Law, DecadeStat } from "@/lib/types";

interface LawsContextValue {
  laws: Law[];
  referencedLawTitles: Record<string, { title: string; year: number }>;
  decadeStats: DecadeStat[];
}

const LawsContext = createContext<LawsContextValue | null>(null);

export function LawsProvider({
  laws,
  referencedLawTitles,
  decadeStats,
  children,
}: LawsContextValue & { children: ReactNode }) {
  return (
    <LawsContext.Provider value={{ laws, referencedLawTitles, decadeStats }}>
      {children}
    </LawsContext.Provider>
  );
}

export function useLaws(): Law[] {
  const ctx = useContext(LawsContext);
  if (!ctx) {
    // No provider — return empty array as a safe fallback.
    // This happens during SSG / build when there's no React tree yet.
    return [];
  }
  return ctx.laws;
}

export function useReferencedLawTitles(): Record<
  string,
  { title: string; year: number }
> {
  const ctx = useContext(LawsContext);
  return ctx?.referencedLawTitles ?? {};
}

export function useDecadeStats(): DecadeStat[] {
  const ctx = useContext(LawsContext);
  return ctx?.decadeStats ?? [];
}
