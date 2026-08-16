"use client";

import { useRouter } from "next/navigation";
import { BrowseView } from "@/components/browse/BrowseView";
import type { Law } from "@/lib/types";

/**
 * Browse route (/browse). Wraps BrowseView with a router-based onOpenLaw
 * callback so clicking a law navigates to /law/[id] via client-side routing.
 */
export default function BrowsePage() {
  const router = useRouter();

  return <BrowseView onOpenLaw={(law: Law) => router.push(`/law/${law.id}`)} />;
}
