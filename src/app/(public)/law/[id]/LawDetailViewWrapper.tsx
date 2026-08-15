"use client";

import { useRouter } from "next/navigation";
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
 */
export function LawDetailViewWrapper({ law }: { law: Law }) {
  const router = useRouter();

  return (
    <LawDetailView
      law={law}
      onBack={() => router.push("/browse")}
      onOpenLawById={(id: string) => router.push(`/law/${id}`)}
    />
  );
}
