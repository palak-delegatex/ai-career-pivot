import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import BlogFaqAccordion from "@/components/blog/BlogFaqAccordion";
import ReadinessAssessment from "@/components/ReadinessAssessment";
import { breadcrumbSchema, speakableSchema } from "@/lib/schema";
import { decodeResult, overallScore, tierFor } from "@/lib/readiness";
import type { FaqItem } from "@/lib/blog";

const BASE_URL = "https://ai-career-pivot.com";

// A shared ?r= link → point the social card at the scored OG variant so the
// preview shows the actual score/tier (fuels the share loop, spec §1.7).
function ogImageFor(searchParams: Record<string, string | string[] | undefined>): string {
  const raw = searchParams.r;
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (token) {
    const dims = decodeResult(token);
    if (dims) {
      const score = overallScore(dims);
      return `/api/og/readiness?score=${score}&tier=${tierFor(score).slug}`;
    }
  }
  return "/api/og/readiness";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const image = ogImageFor(await searchParams);
  const title = "AI Career Pivot Readiness Assessment — Free Quiz | AICareerPivot";
  const description =
    "Find out if you're ready to pivot into an AI career. 5 quick questions, instant results, no signup required.";
  return {
    title,
    description,
    alternates: alternatesFor("/readiness", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: "How Ready Are You for an AI Career Pivot?",
      description,
      url: localizedPath("/readiness", locale),
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "How Ready Are You for an AI Career Pivot?",
      description,
      images: [image],
    },
  };
}

// GEO-optimized FAQ (spec §1.10). Honest, concise answers — no fabricated claims.
const FAQ: FaqItem[] = [
  {
    question: "What does the AI Career Pivot Readiness score measure?",
    answer:
      "It measures how prepared you are to transition into an AI-adjacent career across four dimensions: your experience foundation (career stage plus AI exposure), motivation alignment (why you're pivoting), time commitment (hours you can invest weekly), and timeline readiness (how soon you want to switch). The four combine into one 0–100 readiness score.",
  },
  {
    question: "How is my readiness score calculated?",
    answer:
      "Each of your five answers maps to points across the four dimensions. The dimensions are weighted — experience 30%, motivation 25%, commitment 25%, and timeline 20% — and averaged into your overall score. The calculation runs entirely in your browser, so results are instant and nothing is sent to a server.",
  },
  {
    question: "Do I need to sign up to take the assessment?",
    answer:
      "No. The assessment is completely free with no signup, no email, and no login required. You answer five questions and see your results immediately.",
  },
  {
    question: "Can I retake the assessment?",
    answer:
      "Yes. Use the \"Retake the assessment\" link on your results to start over with fresh answers anytime.",
  },
  {
    question: "What should I do after getting my results?",
    answer:
      "Your results highlight your strengths and the areas to build next. From there you can get a free AI career snapshot by uploading your resume, or take the 30-second role-match quiz to see which AI-adjacent roles fit your background — both are free.",
  },
  {
    question: "Is my data stored or shared?",
    answer:
      "No personal data is collected. Scoring happens in your browser, and a shared result link only contains your four numeric dimension scores — never your answers or any identifying information.",
  },
];

export default async function ReadinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const canonicalUrl = `${BASE_URL}${localizedPath("/readiness", locale)}`;

  const crumbs = breadcrumbSchema([
    { name: "AI Career Pivot Readiness Assessment", path: "/readiness" },
  ]);

  const quizSchema = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "AI Career Pivot Readiness Assessment",
    description:
      "A free 5-question assessment that measures your readiness to pivot into an AI career across experience, motivation, time commitment, and timeline.",
    url: canonicalUrl,
    educationalLevel: "Beginner to advanced",
    about: {
      "@type": "Thing",
      name: "AI career transition readiness",
    },
    assesses: [
      "Experience foundation",
      "Motivation alignment",
      "Time commitment",
      "Timeline readiness",
    ],
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: "AICareerPivot",
      url: BASE_URL,
    },
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
    name: "AI Career Pivot Readiness Assessment",
    speakable: speakableSchema([".readiness-quote", ".faq-accordion"]),
  };

  const jsonLd = [webPageSchema, quizSchema, crumbs, faqSchema];

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
                <li className="text-slate-400">Readiness Assessment</li>
              </ol>
            </nav>

            {/* Answer-first hero */}
            <header className="mb-8">
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight">
                How Ready Are You for an AI Career Pivot?
              </h1>
              <p className="mt-4 text-lg text-slate-400">
                5 questions. 60 seconds. Instant results. No signup required.
              </p>
              <div className="mt-6 bg-slate-900/80 border-l-4 border-l-teal-500 rounded-xl p-4">
                <p className="text-slate-200 leading-relaxed">
                  The World Economic Forum projects{" "}
                  <strong className="text-white">170 million new jobs by 2030</strong>, with AI and
                  data roles among the fastest-growing. Knowing where you stand is the first step to
                  claiming one.
                </p>
              </div>
            </header>

            {/* Interactive assessment */}
            <ReadinessAssessment />

            {/* FAQ */}
            <BlogFaqAccordion items={FAQ} heading="Readiness Assessment FAQ" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
