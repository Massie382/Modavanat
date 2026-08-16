"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LawDetailView } from "@/components/law/LawDetailView";
import type { Law } from "@/lib/types";

/**
 * Client wrapper around LawDetailView.
 *
 * The /law/[id] page is a server component (so it can do synchronous
 * getLawById + generateMetadata), but LawDetailView takes `onBack` and
 * `onOpenLawById` callbacks that need the Next.js router. This thin
 * wrapper bridges the two: it's a client component that receives the
 * already-resolved `law` object from the server page and wires the
 * callbacks to router.push().
 *
 * It also reads the optional `?article=` query param so a search-result
 * snippet can deep-link straight to a specific article inside the law
 * detail view (the article is selected and the "content" tab is shown
 * on initial mount).
 */
export function LawDetailViewWrapper({ law }: { law: Law }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialArticleId = searchParams.get("article") ?? undefined;

  return (
    <LawDetailView
      law={law}
      onBack={() => router.push("/browse")}
      onOpenLawById={(id: string) => router.push(`/law/${id}`)}
      initialArticleId={initialArticleId}
    />
  );
}
