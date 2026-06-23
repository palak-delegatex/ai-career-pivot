import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import SiteNav from "@/components/SiteNav";
import {
  locales,
  localeUrl,
  localePath,
  localeToOgLocale,
  hasLocale,
  type Locale,
} from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const locale = lang as Locale;
  const url = localeUrl("/blog", locale);

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = localeUrl("/blog", l);
  }
  languages["x-default"] = localeUrl("/blog");

  return {
    title: "Blog — Career Pivot Guides & Resources",
    description:
      "Actionable guides for professionals ready to change careers. Real frameworks for career pivots, industry switches, and navigating change with a family.",
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      url,
      locale: localeToOgLocale[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => localeToOgLocale[l]),
      title: "Blog — Career Pivot Guides & Resources",
      description:
        "Actionable guides for professionals ready to change careers.",
    },
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) return null;
  const locale = lang as Locale;
  const posts = getAllPosts(locale);

  const blogUrl = localeUrl("/blog", locale);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AICareerPivot Career Pivot Blog",
    description:
      "Actionable guides for professionals ready to change careers. Real frameworks for career pivots, industry switches, and navigating change with a family.",
    url: blogUrl,
    inLanguage: locale,
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
        url: localeUrl(`/blog/${post.slug}`, locale),
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
        item: localeUrl("/", locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blogUrl,
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
                {new Date(post.date).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" · "}
                {post.readingTime}
              </time>
              <h2 className="text-2xl font-bold mt-2 mb-3">
                <Link
                  href={localePath(`/blog/${post.slug}`, locale)}
                  className="hover:text-teal-400 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <Link
                href={localePath(`/blog/${post.slug}`, locale)}
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
