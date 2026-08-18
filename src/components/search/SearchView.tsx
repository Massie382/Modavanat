"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useDeferredValue,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLaws } from "@/components/providers/LawsProvider";
import type {
  Law,
  LawSearchHit,
  ArticleSearchHit,
  SearchResponse,
} from "@/lib/types";
import { toFa, statusLabel, statusPillClass } from "@/lib/utils";
import { Pager } from "@/components/ui/Pager";
import { SearchSuggestions } from "@/components/ui/SearchSuggestions";

const SEARCH_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

interface SearchViewProps {
  onOpenLaw: (law: Law) => void;
  onOpenArticle?: (law: Law, articleId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Highlight every occurrence of `query` inside `text` using React nodes.
 *
 * Returns the original string when there is no match (so React can render
 * it as a plain text node), otherwise returns a fragment of <span> (the
 * gaps between matches) and <mark className="search-highlight"> (the
 * matched substrings).
 *
 * Persian has no letter case, so we use plain `String.prototype.includes`
 * rather than a case-insensitive comparison.
 *
 * NOTE: This is used for client-side highlighting of plain-text fields
 * (law title, description) where the API didn't already produce a
 * `<mark>`-wrapped excerpt. For excerpts returned by the API (which
 * already contain `<mark>...</mark>` tags), use <ExcerptHTML />.
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

/**
 * Render a ts_headline excerpt that already contains `<mark>...</mark>`
 * tags. We use dangerouslySetInnerHTML because the excerpt is produced
 * by our own SQL (ts_headline) — the only user-controlled content that
 * flows into it is the query string, which ts_headline treats as plain
 * text (no HTML parsing). Article text itself comes from our DB, not
 * from user input.
 *
 * The bare `<mark>` element is styled via the `mark` rule in globals.css
 * (yellow background) — `className="search-highlight"` is added as a
 * fallback for browsers that don't match the `mark` selector for some
 * reason.
 */
function ExcerptHTML({ html }: { html: string }) {
  return (
    <p
      className="text-[13px] leading-6 text-[#3d3d3d] line-clamp-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Pad a `LawSearchHit` into a `Law` shape so the existing `onOpenLaw`
 * callback type still works. Empty nested arrays for toc/articles/etc. —
 * the caller only uses `law.id` for navigation, and the law detail page
 * re-fetches the full nested Law from `/api/laws/[id]` server-side.
 */
function hitToLaw(hit: LawSearchHit): Law {
  return {
    id: hit.id,
    title: hit.title,
    shortTitle: undefined,
    type: hit.type,
    year: hit.year,
    number: hit.number,
    status: hit.status,
    extent: "", // not returned by search API — law detail page re-fetches
    subject: hit.subject,
    promulgatingAuthority: "",
    approvedDate: "",
    effectiveDate: "",
    lastRevisionDate: "",
    description: "",
    longDescription: undefined,
    toc: [],
    articles: [],
    amendments: [],
    outstandingChanges: [],
    references: [],
  };
}

/**
 * Build a minimal `Law` stub from an article hit's parent-law fields.
 * Used when the user clicks an article hit's deep-link — the
 * `onOpenArticle(law, articleId)` callback needs a Law (so its type
 * matches `SearchViewProps`), but only `law.id` is actually used by
 * the caller (`router.push(\`/law/${law.id}?article=${articleId}\`)`).
 */
function lawStub(id: string, title: string): Law {
  return {
    id,
    title,
    shortTitle: undefined,
    type: "قانون عادی",
    year: 0,
    number: undefined,
    status: "in-force",
    extent: "",
    subject: "",
    promulgatingAuthority: "",
    approvedDate: "",
    effectiveDate: "",
    lastRevisionDate: "",
    description: "",
    longDescription: undefined,
    toc: [],
    articles: [],
    amendments: [],
    outstandingChanges: [],
    references: [],
  };
}

// ── Component ────────────────────────────────────────────────────────────

export function SearchView({ onOpenLaw, onOpenArticle }: SearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laws = useLaws(); // facet metadata only (subjects, decades) — NOT results

  // ── URL is the single source of truth for filter state ────────────────
  const query = searchParams.get("q") ?? "";
  const yearStr = searchParams.get("year");
  const yearFilter =
    yearStr && Number.isFinite(Number(yearStr)) ? Number(yearStr) : null;
  const subjectFilter = searchParams.get("subject") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // Local mirror of the query for the <input>. Typing feels instant
  // because we update this on every keystroke; the URL (and thus the
  // fetch) lags behind by SEARCH_DEBOUNCE_MS.
  const [inputValue, setInputValue] = useState(query);
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // useDeferredValue lets React keep showing the old results while the
  // new fetch is in flight, so the input never feels janky.
  const deferredInput = useDeferredValue(inputValue);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Build a /search URL with the given overrides applied on top of the
  // CURRENT render's filter values (read from the URL above).
  const buildUrl = useCallback(
    (overrides: {
      q?: string;
      year?: number | null;
      subject?: string | null;
      page?: number;
    }): string => {
      const q = overrides.q !== undefined ? overrides.q : query;
      const year =
        overrides.year !== undefined ? overrides.year : yearFilter;
      const subject =
        overrides.subject !== undefined ? overrides.subject : subjectFilter;
      const p = overrides.page !== undefined ? overrides.page : page;

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (year != null) params.set("year", String(year));
      if (subject) params.set("subject", subject);
      if (p && p > 1) params.set("page", String(p));

      const qs = params.toString();
      return qs ? `/search?${qs}` : "/search";
    },
    [query, yearFilter, subjectFilter, page]
  );

  // Typing → router.replace() so we don't clutter history on every
  // keystroke. Debounced so we don't fire a fetch on every keystroke —
  // the URL (and thus the API call that follows it) updates only after
  // the user pauses typing for SEARCH_DEBOUNCE_MS.
  //
  // The deferredInput value is what we feed into the URL so the URL
  // never races ahead of React's deferred render.
  useEffect(() => {
    if (deferredInput === query) return; // URL already matches — no-op
    const t = window.setTimeout(() => {
      router.replace(buildUrl({ q: deferredInput, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [deferredInput, query, buildUrl, router]);

  const handleQueryChange = (value: string) => {
    setInputValue(value);
  };

  // Submit (Enter on input or button click) fires an immediate fetch —
  // we replace the URL right away instead of waiting for the debounce.
  const handleQuerySubmit = () => {
    router.replace(buildUrl({ q: inputValue, page: 1 }));
  };

  // Filter changes → push() so back button works as expected.
  // Page is reset to 1 because the result set has changed.
  const handleYearChange = (year: number | null) => {
    router.push(buildUrl({ year, page: 1 }));
  };
  const handleSubjectChange = (subject: string | null) => {
    router.push(buildUrl({ subject, page: 1 }));
  };
  const handlePageChange = (p: number) => {
    router.push(buildUrl({ page: p }));
  };

  const resetFilters = () => {
    setInputValue("");
    router.push("/search");
  };

  // ── API fetch — fires when URL `q` changes ────────────────────────────
  //
  // The URL is the debounce boundary: typing updates inputValue
  // instantly, the URL updates after a 300ms debounce, and the fetch
  // fires when the URL changes. Submit (Enter) bypasses the debounce.
  const [data, setData] = useState<SearchResponse>({
    laws: [],
    articles: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track the in-flight query so a slow response doesn't overwrite a
  // newer one (race condition guard).
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setData({ laws: [], articles: [], total: 0 });
      setLoading(false);
      setError(null);
      inFlightRef.current = null;
      return;
    }

    // We're about to fire a new request for this query.
    inFlightRef.current = q;
    setLoading(true);
    setError(null);

    const url = `/api/laws/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${SEARCH_PAGE_SIZE}`;
    let cancelled = false;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as SearchResponse;
      })
      .then((json) => {
        if (cancelled) return;
        // Only accept the response if it matches the latest in-flight
        // query — otherwise it's a stale response from an older query.
        if (inFlightRef.current !== q) return;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (inFlightRef.current !== q) return;
        console.error("[SearchView] fetch error:", err);
        setError("خطا در بارگذاری نتایج جستجو");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, page]);

  // Show "در حال جستجو…" when the input has diverged from the URL
  // (i.e., the debounce timer is still running) OR a fetch is in flight.
  const isDebouncing =
    inputValue.trim() !== query.trim() && !!inputValue.trim();
  const isSearching = loading || isDebouncing;

  // ── Client-side filtering of the fetched results ────────────────────
  //
  // The facets (subject + year) are applied client-side on the fetched
  // page of results. This matches the existing UX where the facets are
  // a refinement of the current result set, not a separate query.
  const filteredLaws = useMemo(() => {
    return data.laws.filter((l) => {
      const matchesYear = !yearFilter || l.year === yearFilter;
      const matchesSubject = !subjectFilter || l.subject === subjectFilter;
      return matchesYear && matchesSubject;
    });
  }, [data.laws, yearFilter, subjectFilter]);

  const filteredArticles = useMemo(() => {
    return data.articles.filter((a) => {
      // Year + subject filters only apply to article hits' parent law —
      // we don't have the parent law's year/subject in the article hit
      // shape, so we can't filter on them. Articles are always shown.
      return true;
    });
  }, [data.articles]);

  const totalPages = Math.max(
    1,
    Math.ceil(data.total / SEARCH_PAGE_SIZE)
  );

  // Defensive clamp — if a direct URL like /search?page=99 lands us
  // past the last page, snap back to page 1.
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      router.replace(buildUrl({ page: 1 }));
    }
  }, [page, totalPages, router, buildUrl]);

  // Year facets — over ALL laws (via useLaws()), independent of the
  // current search results. This way the user always sees the full
  // distribution. Sorted newest year first.
  const yearFacets = useMemo(() => {
    const map = new Map<number, number>();
    laws.forEach((l) => map.set(l.year, (map.get(l.year) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [laws]);

  // Subject facets — over ALL laws.
  const subjectFacets = useMemo(() => {
    const map = new Map<string, number>();
    laws.forEach((l) => map.set(l.subject, (map.get(l.subject) || 0) + 1));
    return Array.from(map.entries());
  }, [laws]);

  const hasActiveFilter = !!(
    query ||
    yearFilter ||
    subjectFilter ||
    page > 1
  );

  // Total displayed result count: laws count from API + article hits
  // (article hits aren't part of `total` because they're a separate
  // "you might also be looking for" surface).
  const displayedTotal = data.total + filteredArticles.length;

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
                  <span className="text-[#6b6b6b] cite">
                    ({toFa(laws.length)})
                  </span>
                </button>
              </li>
              {subjectFacets.map(([subject, count]) => (
                <li key={subject}>
                  <button
                    onClick={() => handleSubjectChange(subject)}
                    className={`block w-full text-right py-1 px-2 hover:bg-[#f0efeb] flex justify-between ${
                      subjectFilter === subject
                        ? "bg-[#f0efeb] font-medium"
                        : ""
                    }`}
                  >
                    <span>{subject}</span>
                    <span className="text-[#6b6b6b] cite">
                      ({toFa(count)})
                    </span>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuerySubmit();
              }}
            >
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
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
            </form>

            <div className="flex items-baseline justify-between gap-3 mt-2">
              <p className="text-[12.5px] text-[#6b6b6b]">
                {isSearching ? (
                  <span className="text-[#1a1a1a]">در حال جستجو…</span>
                ) : (
                  <>
                    {toFa(displayedTotal)} نتیجه یافت شد
                    {query && (
                      <>
                        {" "}
                        برای عبارت «
                        <span className="text-[#1a1a1a]">{query}</span>»
                      </>
                    )}
                    {error && (
                      <span className="text-red-700 mr-2">— {error}</span>
                    )}
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

          {/* Article hits (Stage 2) — shown above the laws list because
              they're more specific (the user is searching for a
              specific article). Each is a deep-link to
              /law/[lawId]?article=[id]. */}
          {filteredArticles.length > 0 && (
            <div className="mb-4 border border-[#c9b885] bg-[#faf6ec]">
              <div className="px-4 py-2 border-b border-[#e0d4a3] bg-[#f5edd3]">
                <h3 className="font-legal text-[13.5px] font-semibold text-[#7a5b1e]">
                  مواد منطبق ({toFa(filteredArticles.length)})
                </h3>
              </div>
              <div className="divide-y divide-[#e0d4a3]">
                {filteredArticles.map((a: ArticleSearchHit) => {
                  const law = lawStub(a.lawId, a.lawTitle);
                  const articleUrl = `/law/${a.lawId}?article=${encodeURIComponent(
                    a.id
                  )}`;
                  const handleArticleClick = (e: React.MouseEvent) => {
                    if (onOpenArticle) {
                      e.preventDefault();
                      onOpenArticle(law, a.id);
                    }
                  };
                  return (
                    <Link
                      key={a.id}
                      href={articleUrl}
                      onClick={handleArticleClick}
                      className="block px-4 py-3 hover:bg-[#f5edd3] transition-colors no-underline"
                    >
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="font-legal text-[13px] font-medium text-[#7a5b1e] cite">
                          {a.label}
                        </span>
                        <span className="text-[11.5px] text-[#6b6b6b] cite">
                          {a.lawTitle}
                        </span>
                      </div>
                      <ExcerptHTML html={a.excerpt} />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Law hits (Stage 1) */}
          <div className="space-y-0 border border-[#e0ddd6] divide-y divide-[#ececea]">
            {filteredLaws.length === 0 && !isSearching ? (
              <div className="p-8 text-center">
                <p className="text-[14px] text-[#3d3d3d] mb-2">
                  نتیجه‌ای یافت نشد.
                </p>
                <p className="text-[13px] text-[#6b6b6b]">
                  عبارت را اصلاح کنید یا فیلترها را بازنشانی نمایید.
                </p>
              </div>
            ) : filteredLaws.length === 0 && isSearching ? (
              <div className="p-8 text-center">
                <p className="text-[13.5px] text-[#6b6b6b]">در حال جستجو…</p>
              </div>
            ) : (
              filteredLaws.map((hit: LawSearchHit) => {
                const law = hitToLaw(hit);
                return (
                  <div
                    key={hit.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenLaw(law)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenLaw(law);
                      }
                    }}
                    className="block w-full text-right p-5 hover:bg-[#f8f7f4] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-legal text-[15.5px] font-medium text-[#1a1a1a] group-hover:underline">
                        {highlight(hit.title, query)}
                      </h3>
                      <span className={statusPillClass(hit.status)}>
                        {statusLabel(hit.status)}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-[#6b6b6b] cite mb-2">
                      {hit.type} — {toFa(hit.year)}
                      {hit.number &&
                        hit.number !== "—" &&
                        ` — شماره ${toFa(hit.number)}`}
                      {" — "}
                      {hit.subject}
                    </div>

                    {/* ts_headline excerpt with <mark> highlighting.
                        If the API didn't produce an excerpt (no
                        matching article in this law), we just don't
                        render anything here — the law's title + meta
                        already explain the match. */}
                    {hit.excerpt && <ExcerptHTML html={hit.excerpt} />}

                    {hit.excerpt && (
                      <p className="text-[12px] text-[#6b6b6b] mt-2">
                        امتیاز منطبق: {toFa(Number(hit.rank.toFixed(2)))}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pager — 10 per page, driven by API total (law hits only) */}
          <Pager
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showSummary
            unitLabel="نتیجه"
            totalItems={data.total}
          />
        </div>
      </div>
    </div>
  );
}
