import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getAllPivots } from "@/lib/pivots";
import SiteNav from "@/components/SiteNav";
import { routing } from "@/i18n/routing";
import { canonicalFor, ogLocale } from "@/i18n/metadata";

// English-only dataset (AIC-697); index is served for the default locale only,
// matching the individual `/pivot/<slug>` pages.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: routing.defaultLocale }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = canonicalFor(locale, "/pivot");
  const title = "Career Pivot Guides — From Your Role to an AI Career";
  const description =
    "Step-by-step guides for pivoting from your current role into an AI-driven career. See which of your skills transfer and the realistic path to get there.";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "AICareerPivot",
      locale: ogLocale(locale),
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PivotIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pivots = getAllPivots();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AICareerPivot Career Pivot Guides",
    description:
      "Guides for pivoting from your current role into an AI-driven career, with the transferable skills and realistic path for each transition.",
    url: "https://ai-career-pivot.com/pivot",
    isPartOf: {
      "@type": "WebSite",
      name: "AICareerPivot",
      url: "https://ai-career-pivot.com",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: pivots.length,
      itemListElement: pivots.map((pivot, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://ai-career-pivot.com/pivot/${pivot.slug}`,
        name: pivot.headline,
      })),
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ai-career-pivot.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Career Pivots",
        item: "https://ai-career-pivot.com/pivot",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([collectionSchema, breadcrumb]),
        }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <SiteNav />
        <main className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              Career pivot guides
            </h1>
            <p className="text-slate-400 text-lg mb-12">
              Find your current role and see the realistic path into an
              AI-driven career — plus the skills you already have that transfer.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {pivots.map((pivot) => (
                <Link
                  key={pivot.slug}
                  href={`/pivot/${pivot.slug}`}
                  className="group block rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-teal-700/60 hover:bg-slate-900/70 transition-colors"
                >
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                    {pivot.fromRole} → {pivot.toRole}
                  </span>
                  <h2 className="text-lg font-bold mt-2 group-hover:text-teal-300 transition-colors">
                    {pivot.headline}
                  </h2>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
