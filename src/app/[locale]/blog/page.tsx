import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";
import SiteNav from "@/components/SiteNav";
import {
  canonicalFor,
  hreflangAlternates,
  ogLocale,
} from "@/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.blogIndex" });
  const url = canonicalFor(locale, "/blog");
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: hreflangAlternates("/blog"),
    },
    openGraph: {
      type: "website",
      url,
      siteName: "AICareerPivot",
      locale: ogLocale(locale),
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default function BlogIndex() {
  const posts = getAllPosts();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AICareerPivot Career Pivot Blog",
    description:
      "Actionable guides for professionals ready to change careers. Real frameworks for career pivots, industry switches, and navigating change with a family.",
    url: "https://ai-career-pivot.com/blog",
    dateModified: posts[0]?.date ?? "2026-06-12",
    isPartOf: {
      "@type": "WebSite",
      name: "AICareerPivot",
      url: "https://ai-career-pivot.com",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://ai-career-pivot.com/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  const breadcrumbSchema = {
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
        name: "Blog",
        item: "https://ai-career-pivot.com/blog",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([collectionSchema, breadcrumbSchema]),
        }}
      />
    <div className="min-h-screen bg-gray-950 text-white">
      <SiteNav />
      <main className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          Career Pivot Blog
        </h1>
        <p className="text-slate-400 text-lg mb-12">
          Practical guides for professionals navigating career transitions.
        </p>

        <div className="flex flex-col gap-10">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-slate-800 pb-10">
              <time className="text-sm text-slate-500">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" · "}
                {post.readingTime}
              </time>
              <h2 className="text-2xl font-bold mt-2 mb-3">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-teal-400 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-teal-400 font-medium hover:text-teal-300 transition-colors"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </div>
      </main>
    </div>
    </>
  );
}
