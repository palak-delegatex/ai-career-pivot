import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import BlogFaqAccordion from "@/components/blog/BlogFaqAccordion";
import PivotMatcher from "@/components/PivotMatcher";
import { breadcrumbSchema, howToSchema, speakableSchema } from "@/lib/schema";
import { TARGET_ROLES } from "@/lib/pivotMatcher";
import type { FaqItem } from "@/lib/blog";

const BASE_URL = "https://ai-career-pivot.com";
const PATH = "/pivot-matcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const title = "AI Career Pivot Matcher — Find Your Best AI-Adjacent Role | AICareerPivot";
  const description =
    "Tell us your field and strengths and get a ranked list of the AI-adjacent roles that fit you best — with demand, transition speed, and why each one matches. Free, no signup.";
  const image = "/api/og/pivot-matcher";
  return {
    title,
    description,
    alternates: alternatesFor(PATH, locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: "Which AI-adjacent role fits you best?",
      description,
      url: localizedPath(PATH, locale),
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Which AI-adjacent role fits you best?",
      description,
      images: [image],
    },
  };
}

// GEO-optimized FAQ. Honest, concise answers — no fabricated claims.
const FAQ: FaqItem[] = [
  {
    question: "How does the AI Career Pivot Matcher work?",
    answer:
      "You pick your current field and up to three strengths. The tool scores each of nine AI-adjacent target roles by how well its typical skill and background requirements line up with what you chose, then ranks them highest-fit first. The scoring is a transparent heuristic that runs entirely in your browser — it's an alignment signal to guide where you look, not a prediction of whether you'll get hired.",
  },
  {
    question: "What counts as an \"AI-adjacent\" role?",
    answer:
      "An AI-adjacent role is one whose demand is driven by AI adoption. The matcher covers data scientist/analyst, machine learning engineer, AI product manager, AI program/project manager, data/analytics engineer, AI solutions/sales engineer, UX researcher for AI products, AI content & prompt specialist, and AI governance/policy analyst.",
  },
  {
    question: "Which AI roles are in the highest demand?",
    answer:
      "Data and analytics roles show the strongest published labor projections: U.S. Bureau of Labor Statistics figures project data-scientist employment growing about 36% from 2023 to 2033 — far above the 4% average for all occupations — with a median annual pay of $108,020 (May 2023). Engineering and product roles tied to AI are also in high demand.",
  },
  {
    question: "Do I need to know how to code to pivot into AI?",
    answer:
      "Not always. Coding is central to machine learning engineer and data/analytics engineer roles, but AI product management, program management, content and prompt work, UX research, and governance lean far more on communication, strategy, writing, and research. The matcher weights the strengths you pick, so non-coders still get relevant matches.",
  },
  {
    question: "Do I need to sign up to use the matcher?",
    answer:
      "No. It's completely free with no signup, no email, and no login required. Pick your field and strengths and see your ranked roles immediately.",
  },
  {
    question: "What should I do after I see my matches?",
    answer:
      "Your top matches show where your background transfers best. From there you can get a free AI career snapshot by uploading your resume, or take the readiness check to see how prepared you are to make the switch — both are free.",
  },
];

export default async function PivotMatcherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const canonicalUrl = `${BASE_URL}${localizedPath(PATH, locale)}`;

  const crumbs = breadcrumbSchema([
    { name: "Tools", path: "/tools" },
    { name: "AI Career Pivot Matcher", path: PATH },
  ]);

  const howTo = howToSchema({
    name: "How to find your best-fit AI-adjacent role",
    description:
      "Use the free AI Career Pivot Matcher to get a ranked list of AI-adjacent roles that fit your background.",
    url: canonicalUrl,
    steps: [
      { name: "Pick your current field", text: "Choose the field closest to your current or most recent role." },
      { name: "Choose your strengths", text: "Select up to three strengths that best describe you." },
      { name: "See your ranked roles", text: "Get AI-adjacent roles ranked by fit, with demand, transition speed, and why each one matches." },
    ],
  });

  // ItemList of the candidate roles — gives answer engines a citable node per role.
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI-adjacent career pivot target roles",
    description:
      "AI-adjacent roles people commonly pivot into, with demand and transition signals.",
    url: canonicalUrl,
    numberOfItems: TARGET_ROLES.length,
    itemListElement: TARGET_ROLES.map((role, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: role.name,
      description: role.blurb,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    url: canonicalUrl,
    name: "AI Career Pivot Matcher",
    speakable: speakableSchema([".matcher-intro", ".faq-accordion"]),
  };

  const jsonLd = [webPageSchema, itemListSchema, howTo, crumbs, faqSchema];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background text-white">
        <SiteNav />
        <main id="main-content">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-teal-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  <Link href="/tools" className="hover:text-teal-400 transition-colors">
                    Tools
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="text-slate-400">Pivot Matcher</li>
              </ol>
            </nav>

            {/* Answer-first hero */}
            <header className="mb-8">
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight">
                Which AI-adjacent role fits you best?
              </h1>
              <p className="matcher-intro mt-4 text-lg text-slate-400">
                Pick your field and your strengths, and get a ranked list of the AI-adjacent
                roles that match your background — with demand, transition speed, and a plain
                reason for each. Free, instant, no signup.
              </p>
            </header>

            {/* Interactive matcher */}
            <PivotMatcher />

            {/* Internal-link back to the tools hub */}
            <p className="mt-8 text-sm text-slate-500">
              Explore more{" "}
              <Link href="/tools" className="text-teal-400 hover:text-teal-300 underline underline-offset-2">
                free AI career tools
              </Link>
              , or read the{" "}
              <Link
                href="/research/ai-career-pivots-2026"
                className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
              >
                State of AI Career Pivots 2026
              </Link>{" "}
              data behind these roles.
            </p>

            {/* FAQ */}
            <BlogFaqAccordion items={FAQ} heading="Pivot Matcher FAQ" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
