import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getAllPivotSlugs, getPivot } from "@/lib/pivots";
import SiteNav from "@/components/SiteNav";
import { organizationSchema, breadcrumbSchema, faqSchema } from "@/lib/schema";
import { routing } from "@/i18n/routing";
import { canonicalFor, ogLocale } from "@/i18n/metadata";

// The pivot dataset is English-only (copy owned by the CMO, AIC-697), so these
// programmatic pages are served for the default locale only. Non-default-locale
// URLs 404 rather than surfacing untranslated English under a foreign prefix.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPivotSlugs().map((slug) => ({
    locale: routing.defaultLocale,
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pivot = getPivot(slug);
  if (!pivot) return {};

  const url = canonicalFor(locale, `/pivot/${slug}`);
  const title = `${pivot.headline} — Career Pivot Guide`;
  return {
    title,
    description: pivot.subhead,
    keywords: [
      `${pivot.fromRole} to ${pivot.toRole}`,
      `${pivot.fromRole} career change`,
      `become ${pivot.toRole}`,
      "AI career pivot",
      "career transition",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "AICareerPivot",
      locale: ogLocale(locale),
      title,
      description: pivot.subhead,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pivot.subhead,
    },
  };
}

export default async function PivotPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const pivot = getPivot(slug);
  if (!pivot) notFound();

  const url = `https://ai-career-pivot.com/pivot/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: pivot.headline,
    description: pivot.subhead,
    author: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: "https://ai-career-pivot.com",
    },
    publisher: organizationSchema(),
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    about: [
      { "@type": "Thing", name: pivot.fromRole },
      { "@type": "Thing", name: pivot.toRole },
    ],
  };

  const crumbs = breadcrumbSchema([
    { name: "Career Pivots", path: "/pivot" },
    { name: pivot.headline, path: `/pivot/${slug}` },
  ]);

  const jsonLd = [articleSchema, faqSchema(pivot.faq), crumbs];

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
              href="/pivot"
              className="text-slate-500 hover:text-teal-400 text-sm transition-colors mb-8 inline-block"
            >
              ← All career pivots
            </Link>

            <header className="mb-10">
              <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">
                {pivot.fromRole} → {pivot.toRole}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
                {pivot.headline}
              </h1>
              <p className="text-lg text-slate-400 mt-4 leading-relaxed">
                {pivot.subhead}
              </p>
            </header>

            <section className="mb-10 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">
                Skills that transfer
              </h2>
              <ul className="space-y-2">
                {pivot.transferableSkills.map((skill, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            <article className="prose prose-invert prose-teal max-w-none prose-headings:font-bold prose-a:text-teal-400">
              {pivot.bodyBlocks.map((block, i) => (
                <section key={i} className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight mb-3">
                    {block.heading}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    {block.body}
                  </p>
                </section>
              ))}
            </article>

            <div className="my-10 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 border border-teal-700/40 text-center">
              <p className="text-white font-semibold text-lg mb-2">
                Ready to make the move to {pivot.toRole}?
              </p>
              <p className="text-slate-400 text-sm mb-5">{pivot.cta}</p>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all"
              >
                Get My Roadmap — $19 →
              </Link>
            </div>

            {pivot.faq.length > 0 && (
              <section className="mt-14">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  Frequently asked questions
                </h2>
                <div className="space-y-4">
                  {pivot.faq.map((item, i) => (
                    <details
                      key={i}
                      className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-slate-100 flex items-start justify-between gap-4">
                        <span>{item.question}</span>
                        <span className="text-teal-400 transition-transform group-open:rotate-45 shrink-0">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
