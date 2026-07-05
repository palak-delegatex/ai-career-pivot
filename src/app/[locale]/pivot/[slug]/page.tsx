import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import {
  getAllPivotSlugs,
  getPivot,
  getPivotsToRole,
} from "@/content/pivots";

const BASE_URL = "https://ai-career-pivot.com";

export async function generateStaticParams() {
  return getAllPivotSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pivot = getPivot(slug);
  if (!pivot) return {};

  const pivotPath = `/pivot/${slug}`;
  return {
    title: pivot.headline,
    description: pivot.description,
    keywords: pivot.keywords,
    alternates: alternatesFor(pivotPath, locale as Locale),
    openGraph: {
      type: "article",
      locale: ogLocaleFor(locale),
      url: localizedPath(pivotPath, locale as Locale),
      title: pivot.headline,
      description: pivot.description,
    },
    twitter: {
      card: "summary_large_image",
      title: pivot.headline,
      description: pivot.description,
    },
  };
}

export default async function PivotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pivot = getPivot(slug);
  if (!pivot) notFound();

  const url = `${BASE_URL}/pivot/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: pivot.headline,
    description: pivot.description,
    author: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: BASE_URL,
    },
    publisher: organizationSchema(),
    url,
    keywords: pivot.keywords.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  const crumbs = breadcrumbSchema([
    { name: `${pivot.fromRole} to ${pivot.toRole}`, path: `/pivot/${slug}` },
  ]);

  const faqSchema =
    pivot.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pivot.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  const jsonLd = faqSchema
    ? [articleSchema, crumbs, faqSchema]
    : [articleSchema, crumbs];

  // Internal-link cluster: other ways into the same target role.
  const related = getPivotsToRole(pivot.toSlug).filter((p) => p.slug !== slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <SiteNav />
        <main className="py-10 px-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/blog"
              className="text-slate-500 hover:text-teal-400 text-sm transition-colors mb-8 inline-block"
            >
              ← Explore more career pivots
            </Link>

            <header className="mb-8">
              <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">
                {pivot.fromRole} → {pivot.toRole}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
                {pivot.headline}
              </h1>
              <p className="text-base text-slate-400 mt-4 leading-relaxed">
                {pivot.description}
              </p>
              <p className="text-xs text-slate-600 mt-4">
                Typical transition window:{" "}
                <span className="text-slate-400">{pivot.timeline}</span>
              </p>
            </header>

            {pivot.tldr.length > 0 && (
              <section className="mb-10 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">
                  TL;DR
                </h2>
                <ul className="space-y-2">
                  {pivot.tldr.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="text-teal-400 mt-0.5 shrink-0">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {pivot.transferableSkills.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Skills that carry over
                </h2>
                <div className="flex flex-wrap gap-2">
                  {pivot.transferableSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-teal-950 border border-teal-800 text-teal-300 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <article className="space-y-8">
              {pivot.bodyBlocks.map((block, i) => (
                <section key={i}>
                  <h2 className="text-2xl font-bold tracking-tight mb-3">
                    {block.heading}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">{block.body}</p>
                </section>
              ))}
            </article>

            <div className="my-12 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 border border-teal-700/40 text-center">
              <p className="text-white font-semibold text-lg mb-2">
                Is this pivot realistic for you?
              </p>
              <p className="text-slate-400 text-sm mb-5">
                Run your actual background through it. AICareerPivot maps your
                transferable skills to {pivot.toRole}, flags the real gaps, and
                builds a week-by-week plan.
              </p>
              <Link
                href="/assessment"
                className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all"
              >
                Start your free assessment →
              </Link>
            </div>

            {pivot.faq.length > 0 && (
              <section className="mt-14">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  Frequently asked questions
                </h2>
                <div className="divide-y divide-slate-800 border-t border-slate-800">
                  {pivot.faq.map((item, i) => (
                    <div key={i} className="py-5">
                      <h3 className="text-base font-semibold text-white mb-2">
                        {item.question}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-14">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Other paths into {pivot.toRole}
                </h2>
                <ul className="space-y-2">
                  {related.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/pivot/${p.slug}`}
                        className="text-teal-400 hover:underline text-sm"
                      >
                        {p.fromRole} → {p.toRole}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
