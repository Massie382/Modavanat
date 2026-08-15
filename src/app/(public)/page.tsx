"use client";

import { useRouter } from "next/navigation";
import { HomeView } from "@/components/home/HomeView";
import type { Law } from "@/lib/types";

/**
 * Home route (/). Wraps HomeView with router-based navigation callbacks
 * so internal links use Next.js client-side routing instead of full
 * page reloads.
 */
export default function HomePage() {
  const router = useRouter();

  return (
    <HomeView
      onOpenLaw={(law: Law) => router.push(`/law/${law.id}`)}
      onBrowse={() => router.push("/browse")}
      onSearch={(query: string) =>
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search")
      }
    />
  );
}
