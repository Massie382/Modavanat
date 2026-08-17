import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLawById, getLawCardList } from "@/lib/queries/laws";
import { LawDetailViewWrapper } from "./LawDetailViewWrapper";

/**
 * Law detail route (/law/[id]).
 *
 * This is a SERVER component — it queries the law by id from the DB
 * (via the queries layer at src/lib/queries/laws.ts) and either renders
 * the LawDetailView (via the client wrapper) or calls notFound() if the
 * id doesn't resolve. With DB-backed queries, SSR still returns the
 * full law HTML on the first response (Drizzle is fast + PGlite is
 * in-process for dev; postgres-js has connection pooling for prod).
 *
 * Generates static metadata (title + description + OG cards) for each law
 * so search engines and social shares see the real law title, not just
 * the site default.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  // Pre-render a page for every law in the DB at build time.
  // In dev with a seeded PGlite, this returns the same 6 IDs the
  // static data file used to provide.
  const laws = await getLawCardList();
  return laws.map((law) => ({ id: law.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const law = await getLawById(id);
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
  const law = await getLawById(id);
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
