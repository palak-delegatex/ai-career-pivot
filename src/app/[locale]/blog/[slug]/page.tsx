import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPost } from "@/lib/blog";
import SiteNav from "@/components/SiteNav";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const postPath = `/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: alternatesFor(postPath, locale as Locale),
    openGraph: {
      type: "article",
      locale: ogLocaleFor(locale),
      url: localizedPath(postPath, locale as Locale),
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

function WaitlistCTA({
  heading = "Ready to build your own roadmap?",
  subheading = "Get a personalized AI-powered career pivot plan based on your skills, finances, and family situation.",
  buttonText = "Get My Roadmap — $19 →",
}: {
  heading?: string;
  subheading?: string;
  buttonText?: string;
} = {}) {
  return (
    <div className="my-10 p-6 rounded-2xl bg-teal-950 border border-teal-800 text-center not-prose">
      <p className="text-teal-300 font-semibold text-lg mb-2">
        {heading}
      </p>
      <p className="text-slate-400 text-sm mb-5">
        {subheading}
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
      >
        {buttonText}
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.lastModified,
    author: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: "https://ai-career-pivot.com",
    },
    publisher: organizationSchema(),
    url: `https://ai-career-pivot.com/blog/${slug}`,
    keywords: post.keywords.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://ai-career-pivot.com/blog/${slug}`,
    },
  };

  const crumbs = breadcrumbSchema([
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ]);

  const faqSchema =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <div className="min-h-screen bg-gray-950 text-white">
        <SiteNav />
        <main className="py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/blog"
            className="text-slate-500 hover:text-teal-400 text-sm transition-colors mb-8 inline-block"
          >
            ← Back to blog
          </Link>

          <header className="mb-10">
            <time className="text-sm text-slate-500 block mb-3">
              {new Date(post.date).toLocaleDateString("en-US", {
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
              Last updated: {new Date(post.lastModified).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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

          {post.faq && post.faq.length > 0 && (
            <section className="mt-14 not-prose">
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                Frequently asked questions
              </h2>
              <div className="divide-y divide-slate-800 border-t border-slate-800">
                {post.faq.map((item, i) => (
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
        </div>
        </main>
      </div>
    </>
  );
}
