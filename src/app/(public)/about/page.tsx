"use client";

import { useRouter } from "next/navigation";
import { AboutView } from "@/components/site/AboutView";

/**
 * About route (/about).
 */
export default function AboutPage() {
  const router = useRouter();
  return <AboutView onHome={() => router.push("/")} />;
}
