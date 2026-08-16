"use client";

import { useRouter } from "next/navigation";
import { SearchView } from "@/components/search/SearchView";
import type { Law } from "@/lib/types";

/**
 * Search route (/search). Reads initial query from ?q= on mount, then
 * delegates all filter state to SearchView (which keeps filters in the URL
 * via useSearchParams — see the component for details).
 */
export default function SearchPage() {
  const router = useRouter();

  return (
    <SearchView
      onOpenLaw={(law: Law) => router.push(`/law/${law.id}`)}
    />
  );
}
