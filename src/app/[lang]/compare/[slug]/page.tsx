import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import {
  getComparison,
  getAllComparisonSlugs,
} from "@/content/comparisons";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";

export async function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getComparison(slug);
  if (!data) return {};

  const url = `https://ai-career-pivot.com/compare/${slug}`;
  return {
    title: data.title,
    description: data.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: data.title,
      description: data.description,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getComparison(slug);
  if (!data) notFound();

  const url = `https://ai-career-pivot.com/compare/${slug}`;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.title,
    description: data.description,
    url,
    about: [
      { "@type": "Thing", name: data.usName },
      { "@type": "Thing", name: data.themName },
    ],
    publisher: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: "https://ai-career-pivot.com",
    },
    dateModified: data.lastModified,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const crumbs = breadcrumbSchema([
    { name: "Compare", path: "/compare" },
    { name: data.title, path: `/compare/${slug}` },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webPageSchema, faqSchema, organizationSchema(), crumbs]),
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <header className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {data.usName}{" "}
            <span className="text-slate-400">vs</span>{" "}
            {data.themName}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {data.heroSubtitle}
          </p>
        </header>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Feature-by-Feature Comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80">
                  <th className="text-left px-4 py-3 font-semibold text-slate-300">Feature</th>
                  <th className="text-left px-4 py-3 font-semibold text-teal-400">{data.usName}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400">{data.themName}</th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((f, i) => (
                  <tr
                    key={f.feature}
                    className={i % 2 === 0 ? "bg-slate-800/40" : "bg-slate-800/20"}
                  >
                    <td className="px-4 py-3 font-medium text-white">{f.feature}</td>
                    <td className="px-4 py-3 text-teal-300">{f.us}</td>
                    <td className="px-4 py-3 text-slate-400">{f.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Pricing Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-teal-950/50 border border-teal-800">
              <h3 className="font-semibold text-teal-400 mb-2">{data.usName}</h3>
              <p className="text-2xl font-bold">{data.pricing.us}</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
              <h3 className="font-semibold text-slate-400 mb-2">{data.themName}</h3>
              <p className="text-2xl font-bold text-slate-300">{data.pricing.them}</p>
            </div>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4">Our Verdict</h2>
          <div className="p-6 rounded-xl bg-gradient-to-br from-teal-950/60 to-slate-800/60 border border-teal-700/40">
            <p className="text-slate-200 leading-relaxed">{data.verdict}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-16 text-center">
          <div className="p-8 rounded-2xl bg-teal-950 border border-teal-800">
            <p className="text-teal-300 font-semibold text-lg mb-2">
              Ready to build your career pivot roadmap?
            </p>
            <p className="text-slate-400 text-sm mb-5">
              Start with a free skill-gap snapshot or get a full personalized roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/free"
                className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
              >
                Free Snapshot →
              </Link>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        {data.faqs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {data.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                >
                  <summary className="cursor-pointer font-medium text-white group-open:text-teal-400 transition-colors">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
