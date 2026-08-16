"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { laws, decadeStats } from "@/data/laws";
import type { Law } from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";
import { SearchSuggestions } from "@/components/ui/SearchSuggestions";

const SEARCH_PAGE_SIZE = 10;

interface SearchViewProps {
  onOpenLaw: (law: Law) => void;
}

// ── Article-snippet extraction ──────────────────────────────────────────
// When a query matches an article's text (or its number), we surface the
// matching article directly inside the search result card — not just the
// parent law. This section computes a windowed snippet of the article text
// positioned around the first match so the user sees the highlighted term
// in context.

const MAX_ARTICLE_SNIPPETS_PER_LAW = 3;
const SNIPPET_PAD_BEFORE = 50;  // chars of context before the first match
const SNIPPET_PAD_AFTER = 180;  // chars of context after the first match

interface ArticleSnippet {
  articleId: string;
  number: string;          // «ماده ۱»
  snippet: string;         // windowed text around the match (with … if trimmed)
  matchedInText: boolean;  // whether the query was found in the article text (vs. only the number)
}

interface LawArticleMatches {
  snippets: ArticleSnippet[];  // capped at MAX_ARTICLE_SNIPPETS_PER_LAW
  totalMatches: number;        // total number of articles that matched (may exceed snippets.length)
}

function findArticleMatches(law: Law, q: string): LawArticleMatches {
  if (!q) return { snippets: [], totalMatches: 0 };
  const snippets: ArticleSnippet[] = [];
  let totalMatches = 0;
  for (const a of law.articles) {
    const matchIdx = a.text.indexOf(q);
    const numberMatches = a.number.includes(q);
    if (matchIdx === -1 && !numberMatches) continue;
    totalMatches++;

    // Only build snippet objects up to the display cap; keep counting
    // totalMatches beyond the cap so we can show a "+N more" hint.
    if (snippets.length >= MAX_ARTICLE_SNIPPETS_PER_LAW) continue;

    const anchor = matchIdx >= 0 ? matchIdx : 0;
    const start = Math.max(0, anchor - SNIPPET_PAD_BEFORE);
    const end = Math.min(a.text.length, anchor + SNIPPET_PAD_AFTER);
    const leading = start > 0 ? "…" : "";
    const trailing = end < a.text.length ? "…" : "";
    const snippet = leading + a.text.slice(start, end) + trailing;

    snippets.push({
      articleId: a.id,
      number: a.number,
      snippet,
      matchedInText: matchIdx >= 0,
    });
  }
  return { snippets, totalMatches };
}

/**
 * Highlight every occurrence of `query` inside `text`.
 *
 * Returns the original string when there is no match (so React can render
 * it as a plain text node), otherwise returns a fragment of <span> (the
 * gaps between matches) and <mark className="search-highlight"> (the
 * matched substrings).
 *
 * Persian has no letter case, so we use plain `String.prototype.includes`
 * rather than a case-insensitive comparison.
 */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q || !text.includes(q)) return text;
  const parts = text.split(q);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="search-highlight">{q}</mark>
          )}
        </span>
      ))}
    </>
  );
}

export function SearchView({ onOpenLaw }: SearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL is the single source of truth for filter state ────────────────
  const query = searchParams.get("q") ?? "";
  const yearStr = searchParams.get("year");
  const yearFilter = yearStr && Number.isFinite(Number(yearStr)) ? Number(yearStr) : null;
  const subjectFilter = searchParams.get("subject") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // Local mirror of the query for the <input> element. We keep this so
  // typing feels instant — the URL is updated on every keystroke via
  // router.replace(), but the input reads from this local state so there
  // is no perceptible lag. We sync it back from the URL whenever the URL
  // changes externally (initial mount, reset filters, back/forward
  // navigation, suggestion pick).
  const [inputValue, setInputValue] = useState(query);
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Build a /search URL with the given overrides applied on top of the
  // CURRENT render's filter values (read from the URL above). Falsy /
  // default values (empty q, null year, empty subject, page <= 1) are
  // omitted from the URL so we keep clean URLs like /search rather than
  // /search?page=1.
  const buildUrl = (overrides: {
    q?: string;
    year?: number | null;
    subject?: string | null;
    page?: number;
  }): string => {
    const q = overrides.q !== undefined ? overrides.q : query;
    const year = overrides.year !== undefined ? overrides.year : yearFilter;
    const subject = overrides.subject !== undefined ? overrides.subject : subjectFilter;
    const p = overrides.page !== undefined ? overrides.page : page;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (year != null) params.set("year", String(year));
    if (subject) params.set("subject", subject);
    if (p && p > 1) params.set("page", String(p));

    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  // Query typing → replace() so we don't clutter history on every keystroke.
  // Page is reset to 1 because the result set (and therefore page count)
  // has changed.
  const handleQueryChange = (value: string) => {
    setInputValue(value);
    router.replace(buildUrl({ q: value, page: 1 }));
  };

  // Filter changes → push() so the back button works as expected.
  // Page is reset to 1 for the same reason as above.
  const handleYearChange = (year: number | null) => {
    router.push(buildUrl({ year, page: 1 }));
  };
  const handleSubjectChange = (subject: string | null) => {
    router.push(buildUrl({ subject, page: 1 }));
  };
  // Pagination → push() so back/forward steps through pages.
  const handlePageChange = (p: number) => {
    router.push(buildUrl({ page: p }));
  };

  const resetFilters = () => {
    setInputValue("");
    router.push("/search");
  };

  // ── Filtering ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const q = query.trim();
    if (!q && !yearFilter && !subjectFilter) return laws;
    return laws.filter((l) => {
      const matchesQuery =
        !q ||
        l.title.includes(q) ||
        l.description.includes(q) ||
        l.subject.includes(q) ||
        String(l.year).includes(q) ||
        String(l.number).includes(q) ||
        l.articles.some((a) => a.text.includes(q) || a.number.includes(q));
      const matchesYear = !yearFilter || l.year === yearFilter;
      const matchesSubject = !subjectFilter || l.subject === subjectFilter;
      return matchesQuery && matchesYear && matchesSubject;
    });
  }, [query, yearFilter, subjectFilter]);

  // For each law in the dataset, pre-compute the matching article snippets
  // for the current query. We compute this for ALL laws (not just the
  // filtered result set) because the lookup is by law.id inside the render
  // loop, and the result set changes with year/subject filters independently
  // of the query. Only rebuilt when the query changes — cheap enough since
  // the dataset is small and the inner loop bails on the first non-match.
  const matchesByLawId = useMemo(() => {
    const q = query.trim();
    const m = new Map<string, LawArticleMatches>();
    if (!q) return m;
    for (const law of laws) {
      const matches = findArticleMatches(law, q);
      if (matches.totalMatches > 0) m.set(law.id, matches);
    }
    return m;
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(results.length / SEARCH_PAGE_SIZE));

  // Defensive clamp — if a direct URL like /search?page=99 lands us past
  // the last page, snap back to page 1. This mirrors the original
  // component's clamp behavior, now expressed as a URL update. We
  // intentionally depend only on [page, totalPages] so the clamp fires
  // when either changes, not on every keystroke that touches query/year.
  // (react-hooks/exhaustive-deps is disabled in this project's eslint
  // config, so no suppression comment is needed for the narrow dep list.)
  useEffect(() => {
    if (page > totalPages) {
      router.replace(buildUrl({ page: 1 }));
    }
  }, [page, totalPages]);

  const pagedResults = useMemo(
    () =>
      results.slice(
        (page - 1) * SEARCH_PAGE_SIZE,
        page * SEARCH_PAGE_SIZE
      ),
    [results, page]
  );

  // Year facets — count by year, over all laws (independent of active
  // filters), so the user always sees the full distribution. Sorted
  // newest year first, matching the original component.
  const yearFacets = useMemo(() => {
    const map = new Map<number, number>();
    laws.forEach((l) => map.set(l.year, (map.get(l.year) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, []);

  // Subject facets — distinct subjects with counts, in insertion order
  // (Map preserves first-seen order, same as the original Set-based code).
  const subjectFacets = useMemo(() => {
    const map = new Map<string, number>();
    laws.forEach((l) => map.set(l.subject, (map.get(l.subject) || 0) + 1));
    return Array.from(map.entries());
  }, []);

  const hasActiveFilter = !!(query || yearFilter || subjectFilter || page > 1);

  return (
    <div className="container-legal py-8">
      <div className="mb-6">
        <h1 className="font-legal text-[26px] font-light text-[#1a1a1a] mb-1">
          جستجوی پیشرفته
        </h1>
        <p className="text-[13.5px] text-[#6b6b6b]">
          جستجو در عنوان، متن مواد، سال و شماره قوانین موجود در پایگاه.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar facets */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="border border-[#e0ddd6] bg-[#fdfdfb] p-4">
            <h2 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mb-3">
              فیلتر بر اساس سال
            </h2>
            <ul className="space-y-0.5 text-[13px]">
              <li>
                <button
                  onClick={() => handleYearChange(null)}
                  className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] ${
                    !yearFilter ? "bg-[#f0efeb] font-medium" : ""
                  }`}
                >
                  همه سال‌ها ({toFa(laws.length)})
                </button>
              </li>
              {yearFacets.map(([year, count]) => (
                <li key={year}>
                  <button
                    onClick={() => handleYearChange(year)}
                    className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] flex justify-between ${
                      yearFilter === year ? "bg-[#f0efeb] font-medium" : ""
                    }`}
                  >
                    <span className="cite">{toFa(year)}</span>
                    <span className="text-[#6b6b6b] cite">({toFa(count)})</span>
                  </button>
                </li>
              ))}
            </ul>

            <h2 className="font-legal text-[14px] font-semibold text-[#1a1a1a] mt-6 mb-3">
              فیلتر بر اساس موضوع
            </h2>
            <ul className="space-y-0.5 text-[13px]">
              <li>
                <button
                  onClick={() => handleSubjectChange(null)}
                  className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] flex justify-between ${
                    !subjectFilter ? "bg-[#f0efeb] font-medium" : ""
                  }`}
                >
                  <span>همه موضوعات</span>
                  <span className="text-[#6b6b6b] cite">({toFa(laws.length)})</span>
                </button>
              </li>
              {subjectFacets.map(([subject, count]) => (
                <li key={subject}>
                  <button
                    onClick={() => handleSubjectChange(subject)}
                    className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] flex justify-between ${
                      subjectFilter === subject ? "bg-[#f0efeb] font-medium" : ""
                    }`}
                  >
                    <span>{subject}</span>
                    <span className="text-[#6b6b6b] cite">({toFa(count)})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="عنوان، شماره، یا متن ماده…"
                className="input-legal pl-10"
                style={{ paddingLeft: "2.5rem" }}
                autoFocus
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={!!inputValue.trim()}
                aria-controls="search-page-suggestions"
              />
              <span
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
                </svg>
              </span>
              <div id="search-page-suggestions">
                <SearchSuggestions
                  query={inputValue}
                  inputRef={inputRef}
                  onPick={(law: Law) => {
                    router.push(`/law/${law.id}`);
                  }}
                  onSearch={(q: string) => {
                    router.push(`/search?q=${encodeURIComponent(q)}`);
                  }}
                />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-3 mt-2">
              <p className="text-[12.5px] text-[#6b6b6b]">
                {toFa(results.length)} نتیجه یافت شد
                {query && (
                  <>
                    {" "}برای عبارت «<span className="text-[#1a1a1a]">{query}</span>»
                  </>
                )}
              </p>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[12px] text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-2 shrink-0"
                >
                  بازنشانی فیلترها
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-0 border border-[#e0ddd6] divide-y divide-[#ececea]">
            {pagedResults.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[14px] text-[#3d3d3d] mb-2">
                  نتیجه‌ای یافت نشد.
                </p>
                <p className="text-[13px] text-[#6b6b6b]">
                  عبارت را اصلاح کنید یا فیلترها را بازنشانی نمایید.
                </p>
              </div>
            ) : (
              pagedResults.map((law) => {
                const articleMatches = matchesByLawId.get(law.id);
                return (
                <button
                  key={law.id}
                  onClick={() => onOpenLaw(law)}
                  className="block w-full text-right p-5 hover:bg-[#f8f7f4] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-legal text-[15.5px] font-medium text-[#1a1a1a] group-hover:underline">
                      {highlight(law.title, query)}
                    </h3>
                    <span className={statusPillClass(law.status)}>
                      {statusLabel(law.status)}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-[#6b6b6b] cite mb-2">
                    {law.type} — {toFa(law.year)}
                    {law.number && law.number !== "—" && ` — شماره ${toFa(law.number)}`}
                    {" — "}{law.subject}
                  </div>
                  <p className="text-[13px] leading-6 text-[#3d3d3d] line-clamp-2">
                    {highlight(law.description, query)}
                  </p>

                  {/* Matching article snippets — shown when the query matched
                      one or more articles inside this law. Each snippet shows
                      the article number (highlighted if it matched) and a
                      windowed excerpt of the article text with the matched
                      term highlighted in context. */}
                  {articleMatches && articleMatches.snippets.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {articleMatches.snippets.map((s) => (
                        <div
                          key={s.articleId}
                          className="border-r-2 border-[#c9b885] pr-3 py-1.5 bg-[#faf6ec]"
                        >
                          <div className="text-[12px] font-medium text-[#7a5b1e] mb-0.5 cite">
                            {highlight(s.number, query)}
                          </div>
                          <p className="text-[12.5px] leading-6 text-[#3d3d3d]">
                            {highlight(s.snippet, query)}
                          </p>
                        </div>
                      ))}
                      {articleMatches.totalMatches > articleMatches.snippets.length && (
                        <p className="text-[11.5px] text-[#6b6b6b] pr-3">
                          +{toFa(articleMatches.totalMatches - articleMatches.snippets.length)}{" "}
                          ماده دیگر نیز مطابق است
                        </p>
                      )}
                    </div>
                  )}

                  {query && (
                    <p className="text-[12px] text-[#6b6b6b] mt-2">
                      {toFa(law.articles.length)} ماده · {toFa(law.amendments.length)} اصلاح ·{" "}
                      {toFa(law.references.length)} ارجاع
                    </p>
                  )}
                </button>
                );
              })
            )}
          </div>

          {/* Pager — 10 per page */}
          <Pager
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showSummary
            unitLabel="نتیجه"
            totalItems={results.length}
          />
        </div>
      </div>
    </div>
  );
}
