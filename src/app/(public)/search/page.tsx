"use client";

import { useRouter } from "next/navigation";
import { SearchView } from "@/components/search/SearchView";
import type { Law } from "@/lib/types";

/**
 * Search route (/search). Reads initial query from ?q= on mount, then
 * delegates all filter state to SearchView (which keeps filters in the URL
 * via useSearchParams — see the component for details).
 *
 * `onOpenArticle` deep-links to a specific article inside the law detail
 * page by appending `?article={articleId}` to the /law/[id] URL.
 */
export default function SearchPage() {
  const router = useRouter();

  return (
    <SearchView
      onOpenLaw={(law: Law) => router.push(`/law/${law.id}`)}
      onOpenArticle={(law: Law, articleId: string) =>
        router.push(`/law/${law.id}?article=${encodeURIComponent(articleId)}`)
      }
    />
  );
}
