import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { getClustersWithPosts } from "@/lib/blog-topics";
import { breadcrumbSchema } from "@/lib/schema";
import SiteNav from "@/components/SiteNav";

const BASE_URL = "https://ai-career-pivot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "Browse the Blog by Topic — AI Career Pivot Guides",
    description:
      "Every AICareerPivot guide grouped by theme — career pivots by profession, AI skills, interviews, salary, job search, and the future of work.",
    alternates: alternatesFor("/blog/topics", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      url: localizedPath("/blog/topics", locale),
      title: "Browse the Blog by Topic — AI Career Pivot Guides",
      description:
        "Every AICareerPivot guide grouped by theme — pivots by profession, AI skills, interviews, salary, and more.",
    },
  };
}

// Topic-cluster hub (AIC-1164). Turns the 113 chronological posts into a
// hub-and-spoke IA: one crawlable section per cluster, each post linked with its
// descriptive title as anchor text. This is the organic-traffic / crawl-depth
// lever — it gives every post an inbound internal link from a topical hub and
// gives search engines a topical-authority signal the flat /blog list never
// could. Clusters are auto-derived from slug/title patterns (no per-post
// frontmatter chore) — see src/lib/blog-topics.ts. Static, server-rendered.
export default async function BlogTopicsHub({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const clusters = getClustersWithPosts();
  const totalPosts = clusters.reduce((sum, c) => sum + c.posts.length, 0);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AICareerPivot Blog — Topics",
    description:
      "Every AICareerPivot guide grouped by theme: career pivots by profession, AI skills, interviews, salary, job search, and the future of work.",
    url: `${BASE_URL}/blog/topics`,
    isPartOf: {
      "@type": "WebSite",
      name: "AICareerPivot",
      url: BASE_URL,
    },
    hasPart: clusters.map((c) => ({
      "@type": "ItemList",
      name: c.label,
      description: c.description,
      numberOfItems: c.posts.length,
      itemListElement: c.posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    })),
  };

  const crumbs = breadcrumbSchema([
    { name: "Blog", path: "/blog" },
    { name: "Topics", path: "/blog/topics" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([collectionSchema, crumbs]),
        }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <SiteNav />
        <main id="main-content" className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/blog"
              className="text-slate-500 hover:text-teal-400 text-sm transition-colors mb-8 inline-block"
            >
              {t("topics.allPosts")}
            </Link>

            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              {t("topics.heading")}
            </h1>
            <p className="text-slate-400 text-lg mb-8">
              {t("topics.subheading")}
            </p>

            {/* Crawlable in-page jump nav — one anchor per cluster. Native
                anchors keep this zero-JS and fully server-rendered. */}
            <nav
              aria-label={t("topics.heading")}
              className="flex flex-wrap gap-2 mb-14"
            >
              {clusters.map((c) => (
                <a
                  key={c.id}
                  href={`#topic-${c.id}`}
                  className="rounded-full bg-slate-800 hover:bg-teal-600 text-sm text-slate-200 hover:text-white px-3 py-1.5 transition-colors"
                >
                  {c.label}{" "}
                  <span className="text-slate-400">({c.posts.length})</span>
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-16">
              {clusters.map((cluster) => (
                <section
                  key={cluster.id}
                  id={`topic-${cluster.id}`}
                  className="scroll-mt-20 border-b border-slate-800 pb-12 last:border-b-0"
                >
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    {cluster.label}
                  </h2>
                  <p className="text-slate-400 mb-6">{cluster.description}</p>
                  <ul className="flex flex-col gap-5">
                    {cluster.posts.map((post) => (
                      <li key={post.slug}>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="group block"
                        >
                          <span className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
                            {post.title}
                          </span>
                          <span className="block text-sm text-slate-500 mt-1">
                            {post.readingTime}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <p className="text-slate-500 text-sm mt-14">
              {t("topics.postsInCluster", { count: totalPosts })}
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
