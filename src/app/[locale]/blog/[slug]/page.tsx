import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getTranslations } from "next-intl/server";
import { getAllSlugs, getPost } from "@/lib/blog";
import SiteNav from "@/components/SiteNav";
import BlogCtaLink from "@/components/BlogCtaLink";
import BlogShareButtons from "@/components/BlogShareButtons";
import RelatedPosts from "@/components/RelatedPosts";
import BlogFaqAccordion from "@/components/BlogFaqAccordion";
import {
  organizationSchema,
  breadcrumbSchema,
  howToSchema,
  speakableSpecification,
} from "@/lib/schema";
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
  slug,
}: {
  heading?: string;
  subheading?: string;
  buttonText?: string;
  slug?: string;
} = {}) {
  return (
    <div className="my-10 p-6 rounded-2xl bg-teal-950 border border-teal-800 text-center not-prose">
      <p className="text-teal-300 font-semibold text-lg mb-2">
        {heading}
      </p>
      <p className="text-slate-400 text-sm mb-5">
        {subheading}
      </p>
      <BlogCtaLink
        href="/pricing"
        ctaText={buttonText}
        ctaLocation="blog_waitlist"
        blogSlug={slug}
        className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
      >
        {buttonText}
      </BlogCtaLink>
    </div>
  );
}

function PricingCTA({
  heading = "Get your career pivot roadmap for $29",
  subheading = "One-time payment. AI-powered analysis of your resume and LinkedIn. 30-day money-back guarantee.",
  buttonText = "See Pricing →",
  slug,
}: {
  heading?: string;
  subheading?: string;
  buttonText?: string;
  slug?: string;
} = {}) {
  return (
    <div className="my-10 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 border border-teal-700/40 text-center not-prose">
      <p className="text-white font-semibold text-lg mb-2">
        {heading}
      </p>
      <p className="text-slate-400 text-sm mb-5">
        {subheading}
      </p>
      <BlogCtaLink
        href="/pricing"
        ctaText={buttonText}
        ctaLocation="blog_pricing"
        blogSlug={slug}
        className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all"
      >
        {buttonText}
      </BlogCtaLink>
    </div>
  );
}

// Free-tool CTA — routes cold blog readers to the free AI snapshot (/free)
// instead of straight to the paywall. Added in AIC-814: high-traffic blog
// posts were bouncing at 90–100% with every CTA pointing at /pricing.
function FreeSnapshotCTA({
  heading = "Get your free AI career snapshot",
  subheading = "See your best-fit AI-adjacent roles and biggest skill gaps in 2 minutes — free, no signup. Just upload your resume or LinkedIn.",
  buttonText = "Get My Free Snapshot →",
  slug,
}: {
  heading?: string;
  subheading?: string;
  buttonText?: string;
  slug?: string;
} = {}) {
  return (
    <div className="my-10 p-6 rounded-2xl bg-gradient-to-br from-teal-900 to-emerald-950 border border-teal-600/50 text-center not-prose">
      <p className="text-white font-semibold text-lg mb-2">
        {heading}
      </p>
      <p className="text-slate-300 text-sm mb-5">
        {subheading}
      </p>
      <BlogCtaLink
        href="/free"
        ctaText={buttonText}
        ctaLocation="blog_free_snapshot"
        blogSlug={slug}
        className="inline-block px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl transition-all"
      >
        {buttonText}
      </BlogCtaLink>
    </div>
  );
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");

  // MDX CTA components with localized default copy; MDX-supplied props (if any)
  // still override these defaults.
  const components = {
    FreeSnapshotCTA: (props: Record<string, unknown>) => (
      <FreeSnapshotCTA
        heading={t("cta.free.heading")}
        subheading={t("cta.free.subheading")}
        buttonText={t("cta.free.button")}
        slug={slug}
        {...props}
      />
    ),
    WaitlistCTA: (props: Record<string, unknown>) => (
      <WaitlistCTA
        heading={t("cta.waitlist.heading")}
        subheading={t("cta.waitlist.subheading")}
        buttonText={t("cta.waitlist.button")}
        slug={slug}
        {...props}
      />
    ),
    PricingCTA: (props: Record<string, unknown>) => (
      <PricingCTA
        heading={t("cta.pricing.heading")}
        subheading={t("cta.pricing.subheading")}
        buttonText={t("cta.pricing.button")}
        slug={slug}
        {...props}
      />
    ),
  };

  // Speakable regions (AIC-1190): flag the TL;DR summary and FAQ answers as the
  // concise, quotable parts of the page for voice/AI answer engines. Only point
  // at blocks that actually render on this post.
  const speakableSelectors: string[] = [];
  if (post.tldr && post.tldr.length > 0) speakableSelectors.push(".blog-tldr");
  if (post.faq && post.faq.length > 0) speakableSelectors.push(".blog-faq");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    // Article rich-result eligibility requires an image; point at the
    // per-post dynamic OG image (1200x630). Uses the en canonical path so it
    // matches `url`/`mainEntityOfPage` below (AIC-1053).
    image: {
      "@type": "ImageObject",
      url: `https://ai-career-pivot.com/blog/${slug}/opengraph-image`,
      width: 1200,
      height: 630,
    },
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
    ...(speakableSelectors.length > 0
      ? { speakable: speakableSpecification(speakableSelectors) }
      : {}),
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

  // HowTo (AIC-1190): emitted only for procedural posts that declare `howto:`
  // steps in frontmatter, mirroring the conditional FAQPage assembly above.
  const howtoLd =
    post.howto && post.howto.length > 0
      ? howToSchema({
          name: post.howtoName ?? post.title,
          description: post.description,
          url: `https://ai-career-pivot.com/blog/${slug}`,
          dateModified: post.lastModified,
          steps: post.howto,
        })
      : null;

  const jsonLd = [articleSchema, crumbs, faqSchema, howtoLd].filter(Boolean);

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
        <main id="main-content" className="py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/blog"
            className="text-slate-500 hover:text-teal-400 text-sm transition-colors mb-8 inline-block"
          >
            {t("post.backToBlog")}
          </Link>

          <header className="mb-10">
            <time className="text-sm text-slate-500 block mb-3">
              {new Date(post.date).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" · "}
              {post.readingTime}
              {" · "}
              {t("post.team")}
            </time>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              {post.title}
            </h1>
            <p className="text-xs text-slate-600 mt-2">
              {t("post.lastUpdatedLabel")} {new Date(post.lastModified).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </header>

          {/* Answer-first Key Takeaways box (AIC-1196, spec AIC-1195): the single
              most-quotable block, placed in the F-pattern's first fixation zone.
              Numbered (serial-position + more citable by AI answer engines) and
              given a teal left accent for Von Restorff distinction. Keeps the
              `.blog-tldr` class so the speakable JSON-LD (AIC-1192) still resolves. */}
          {post.tldr && post.tldr.length > 0 && (
            <section className="blog-tldr mb-10 bg-slate-900/80 border border-slate-800 border-l-4 border-l-teal-500 rounded-xl p-6 not-prose">
              <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">{t("post.keyTakeaways")}</h2>
              <ol className="space-y-3">
                {post.tldr.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-teal-400 font-semibold tabular-nums shrink-0">{i + 1}.</span>
                    {point}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <article className="prose prose-invert prose-teal max-w-none prose-headings:font-bold prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={post.content} components={components} />
          </article>

          {/* Content→share leg of the AIC-439 viral loop (AIC-909). Renders the
              client share CTA so blog readers can push UTM-tagged links back
              into the loop and fire content_share_clicked for attribution. */}
          <BlogShareButtons slug={slug} title={post.title} />

          {/* Internal-linking / reader-depth lever (AIC-1164): topically-related
              posts so every article links out to its neighbours for readers and
              crawlers. Placed after share, before FAQ (FAQ is the SEO/lookup
              end-of-page). Traffic lever — does NOT touch the frozen funnel. */}
          <RelatedPosts slug={slug} />

          {/* FAQ accordion (AIC-1196, spec AIC-1195): human-visible mirror of the
              FAQPage JSON-LD. `.blog-faq` is the hook the speakable spec (AIC-1192)
              points at. Radix accordion handles keyboard nav + ARIA; reduced-motion
              is gated in globals.css. Kept at page bottom so height transitions
              cause no CLS. */}
          {post.faq && post.faq.length > 0 && (
            <section className="blog-faq mt-14 not-prose">
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                {t("post.faqHeading")}
              </h2>
              <BlogFaqAccordion items={post.faq} />
            </section>
          )}
        </div>
        </main>
      </div>
    </>
  );
}
