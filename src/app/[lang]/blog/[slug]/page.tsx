import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPost, getAvailableLocales } from "@/lib/blog";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/schema";
import SiteNav from "@/components/SiteNav";
import { BlogLanguageSelector } from "@/components/BlogLanguageSelector";
import {
  locales,
  localeUrl,
  localePath,
  localeToOgLocale,
  hasLocale,
  type Locale,
} from "@/i18n/config";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return locales.flatMap((lang) =>
    slugs.map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const locale = lang as Locale;
  const post = getPost(slug, locale);
  if (!post) return {};

  const url = localeUrl(`/blog/${slug}`, locale);
  const ogLocale = localeToOgLocale[locale];
  const alternateOgLocales = locales
    .filter((l) => l !== locale)
    .map((l) => localeToOgLocale[l]);

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = localeUrl(`/blog/${slug}`, l);
  }
  languages["x-default"] = localeUrl(`/blog/${slug}`);

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: "article",
      url,
      locale: ogLocale,
      alternateLocale: alternateOgLocales,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.lastModified,
      authors: ["AICareerPivot Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function WaitlistCTA() {
  return (
    <div className="my-10 p-6 rounded-2xl bg-teal-950 border border-teal-800 text-center not-prose">
      <p className="text-teal-300 font-semibold text-lg mb-2">
        Ready to build your own roadmap?
      </p>
      <p className="text-slate-400 text-sm mb-5">
        Get a personalized AI-powered career pivot plan based on your skills,
        finances, and family situation.
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
      >
        Get My Roadmap — $19 →
      </Link>
    </div>
  );
}

function PricingCTA() {
  return (
    <div className="my-10 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 border border-teal-700/40 text-center not-prose">
      <p className="text-white font-semibold text-lg mb-2">
        Get your career pivot roadmap for $29
      </p>
      <p className="text-slate-400 text-sm mb-5">
        One-time payment. AI-powered analysis of your resume and LinkedIn. 30-day money-back guarantee.
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all"
      >
        See Pricing →
      </Link>
    </div>
  );
}

const components = { WaitlistCTA, PricingCTA };

export default async function BlogPost({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const locale = lang as Locale;

  const post = getPost(slug, locale);
  if (!post) notFound();

  const availableLocales = getAvailableLocales(slug);
  const articleSchema = blogPostingSchema(post, locale);
  const crumbs = breadcrumbSchema(
    [
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${slug}` },
    ],
    locale,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleSchema, crumbs]),
        }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <SiteNav />
        <main className="py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link
              href={localePath("/blog", locale)}
              className="text-slate-500 hover:text-teal-400 text-sm transition-colors"
            >
              ← Back to blog
            </Link>
            {availableLocales.length > 1 && (
              <BlogLanguageSelector
                slug={slug}
                availableLocales={availableLocales}
                currentLocale={locale}
              />
            )}
          </div>

          <header className="mb-10">
            <time className="text-sm text-slate-500 block mb-3">
              {new Date(post.date).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" · "}
              {post.readingTime}
              {" · AICareerPivot Team"}
            </time>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              {post.title}
            </h1>
            <p className="text-xs text-slate-600 mt-2">
              Last updated: {new Date(post.lastModified).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </header>

          {post.tldr && post.tldr.length > 0 && (
            <section className="mb-10 bg-slate-900/60 border border-slate-800 rounded-xl p-6 not-prose">
              <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">TL;DR</h2>
              <ul className="space-y-2">
                {post.tldr.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-teal-400 mt-0.5 shrink-0">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <article className="prose prose-invert prose-teal max-w-none prose-headings:font-bold prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={post.content} components={components} />
          </article>
        </div>
        </main>
      </div>
    </>
  );
}
