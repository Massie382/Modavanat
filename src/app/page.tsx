"use client";

import { useState, useEffect } from "react";
import type { Law } from "@/lib/types";
import { getLawById, referencedLawTitles } from "@/data/laws";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AboutView } from "@/components/site/AboutView";
import { HomeView } from "@/components/home/HomeView";
import { BrowseView } from "@/components/browse/BrowseView";
import { SearchView } from "@/components/search/SearchView";
import { LawDetailView } from "@/components/law/LawDetailView";

type View =
  | { kind: "home" }
  | { kind: "browse" }
  | { kind: "search"; query: string }
  | { kind: "about" }
  | { kind: "law"; law: Law };

export default function Home() {
  const [view, setView] = useState<View>({ kind: "home" });

  // Deep-link from static pages (/accessibility, /guide, /contact) and
  // external links via ?view=browse|search|about[&q=query]. We read the
  // params once on mount; subsequent in-page navigations use the SPA
  // state directly.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    const q = params.get("q");
    if (v === "browse") setView({ kind: "browse" });
    else if (v === "search") setView({ kind: "search", query: q ?? "" });
    else if (v === "about") setView({ kind: "about" });
    // Clean the URL so a refresh doesn't re-trigger the deep-link.
    if (v) {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  const handleOpenLaw = (law: Law) => setView({ kind: "law", law });

  const handleOpenLawById = (id: string) => {
    const law = getLawById(id);
    if (law) {
      setView({ kind: "law", law });
    } else {
      // Auxiliary law not in main dataset — silent no-op for now
      const info = referencedLawTitles[id];
      if (info) {
        // Could show a toast in a future iteration
      }
    }
  };

  const handleNavigate = (target: "home" | "browse" | "search" | "about") => {
    if (target === "home") setView({ kind: "home" });
    else if (target === "browse") setView({ kind: "browse" });
    else if (target === "search") setView({ kind: "search", query: "" });
    else if (target === "about") setView({ kind: "about" });
  };

  const handleSearch = (query: string) => {
    setView({ kind: "search", query });
  };

  const currentView = view.kind;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        currentView={currentView}
      />

      <main className="flex-1 bg-white">
        {view.kind === "home" && (
          <HomeView
            onOpenLaw={handleOpenLaw}
            onBrowse={() => setView({ kind: "browse" })}
            onSearch={handleSearch}
          />
        )}

        {view.kind === "browse" && <BrowseView onOpenLaw={handleOpenLaw} />}

        {view.kind === "search" && (
          <SearchView
            initialQuery={view.query}
            onOpenLaw={handleOpenLaw}
          />
        )}

        {view.kind === "about" && <AboutView onHome={() => setView({ kind: "home" })} />}

        {view.kind === "law" && (
          <LawDetailView
            law={view.law}
            onBack={() => setView({ kind: "home" })}
            onOpenLawById={handleOpenLawById}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
