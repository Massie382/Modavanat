import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLawById, laws } from "@/data/laws";
import { LawDetailViewWrapper } from "./LawDetailViewWrapper";

/**
 * Law detail route (/law/[id]).
 *
 * This is a SERVER component — it looks up the law by id and either renders
 * the LawDetailView (via the client wrapper) or calls notFound() if the id
 * doesn't resolve. The lookup is synchronous (data is in-memory) so SSR
 * returns the full law HTML on the first response.
 *
 * Generates static metadata (title + description + OG cards) for each law
 * so search engines and social shares see the real law title, not just the
 * site default.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return laws.map((law) => ({ id: law.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const law = getLawById(id);
  if (!law) return { title: "قانون یافت نشد — مدونات" };

  const title = `${law.title} — مدونات`;
  const description = `${law.type} مصوب ${law.year} — ${law.description.slice(0, 160)}`;
  const url = `/law/${law.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "مدونات",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function LawPage({ params }: PageProps) {
  const { id } = await params;
  const law = getLawById(id);
  if (!law) notFound();

  // JSON-LD structured data — Legislation schema so search engines can
  // understand this page as a statutory instrument (rich results / KG).
  // See https://schema.org/Legislation
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: law.title,
    description: law.description,
    datePublished: law.approvedDate,
    legislationDate: law.effectiveDate,
    legislationType: law.type,
    url: `https://modavanat.ir/law/${law.id}`,
  };

  return (
    <>
      <LawDetailViewWrapper law={law} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
