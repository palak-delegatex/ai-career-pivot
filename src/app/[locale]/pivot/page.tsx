import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { pivots } from "@/content/pivots";

const BASE_URL = "https://ai-career-pivot.com";

const TITLE = "Career Pivot Guides — Map Your Move Into a New Role";
const DESCRIPTION =
  "Step-by-step pivot guides for professionals changing careers. Each guide maps the transferable skills, real gaps, and a realistic timeline for moving from your current role into a new one.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: alternatesFor("/pivot", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      url: localizedPath("/pivot", locale),
      title: TITLE,
      description: DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  };
}

export default function PivotIndex() {
  // Group guides by target role so the hub reads as a set of destinations,
  // which also tightens the internal-link cluster around each `toRole`.
  const byTarget = new Map<string, typeof pivots>();
  for (const pivot of pivots) {
    const group = byTarget.get(pivot.toRole) ?? [];
    group.push(pivot);
    byTarget.set(pivot.toRole, group);
  }
  const targets = [...byTarget.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/pivot`,
    isPartOf: {
      "@type": "WebSite",
      name: "AICareerPivot",
      url: BASE_URL,
    },
    publisher: organizationSchema(),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: pivots.length,
      itemListElement: pivots.map((pivot, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/pivot/${pivot.slug}`,
        name: `${pivot.fromRole} to ${pivot.toRole}`,
      })),
    },
  };

  const crumbs = breadcrumbSchema([{ name: "Career Pivot Guides", path: "/pivot" }]);
  const jsonLd = [collectionSchema, crumbs];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <SiteNav />
        <main className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <header className="mb-10">
              <p className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">
                Career Pivot Guides
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
                Map your move into a new role
              </h1>
              <p className="text-base text-slate-400 mt-4 leading-relaxed">
                {DESCRIPTION}
              </p>
            </header>

            <div className="my-10 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 border border-teal-700/40 text-center">
              <p className="text-white font-semibold text-lg mb-2">
                Not sure which pivot fits you?
              </p>
              <p className="text-slate-400 text-sm mb-5">
                Run your actual background through the assessment — it maps your
                transferable skills, flags the real gaps, and builds a
                week-by-week plan.
              </p>
              <Link
                href="/assessment"
                className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all"
              >
                Start your free assessment →
              </Link>
            </div>

            <div className="space-y-10">
              {targets.map(([toRole, group]) => (
                <section key={toRole}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    Pivot into {toRole}
                  </h2>
                  <ul className="divide-y divide-slate-800 border-t border-slate-800">
                    {group.map((pivot) => (
                      <li key={pivot.slug}>
                        <Link
                          href={`/pivot/${pivot.slug}`}
                          className="group flex items-baseline justify-between gap-4 py-4"
                        >
                          <span className="text-base font-semibold text-white group-hover:text-teal-400 transition-colors">
                            {pivot.fromRole} → {pivot.toRole}
                          </span>
                          <span className="text-xs text-slate-600 shrink-0">
                            {pivot.timeline}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
