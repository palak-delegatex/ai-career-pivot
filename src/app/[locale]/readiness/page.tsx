import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import { breadcrumbSchema, speakableSchema } from "@/lib/schema";
import ReadinessClient from "./ReadinessClient";

const BASE_URL = "https://ai-career-pivot.com";
const PAGE_URL = `${BASE_URL}/readiness`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "AI Career Pivot Readiness Check — Free Score in 60 Seconds | AICareerPivot",
    description:
      "Answer 5 quick questions and get an honest 0–100 score for how ready you are to pivot into an AI-adjacent career — plus your next three moves. No resume, no signup.",
    alternates: alternatesFor("/readiness", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: "How ready are you to pivot into AI? — Free readiness check",
      description:
        "A free 5-question readiness score for career changers moving into AI-adjacent roles. Instant result, no signup.",
      url: localizedPath("/readiness", locale),
    },
  };
}

// FAQ answers double as the citable, answer-engine-ready copy (GEO). Keep them
// concise and factual — they back the FAQPage JSON-LD below and render visibly
// so the schema never describes text a user can't see.
const FAQ: { q: string; a: string }[] = [
  {
    q: "What is the AI career readiness score?",
    a: "It's a free 0–100 self-assessment that estimates how prepared you are to pivot into an AI-adjacent role. It weighs five factors equally: your comfort with AI tools, how much of your work already involves data or systems, whether you have shareable proof of work, your weekly time to invest, and your financial runway and network.",
  },
  {
    q: "How is the readiness score calculated?",
    a: "Five questions, each worth 0 to 20 points, add up to a score out of 100. There's no hidden model — the weights are transparent. 70–100 means you're pivot-ready, 40–69 means you're building momentum, and 0–39 means you're an early explorer just getting started.",
  },
  {
    q: "Is the AI career readiness check free?",
    a: "Yes. It's completely free, runs entirely in your browser, and requires no resume, email, login, or payment. You get your score and three concrete next steps instantly.",
  },
  {
    q: "Do I need any AI or coding experience to pivot into an AI-adjacent career?",
    a: "No. Many AI-adjacent roles — from AI-assisted marketing and operations to data analysis and prompt design — build on skills you already have. The readiness check is designed for career changers with no formal AI background and points you to the fastest path from where you are today.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// Quiz JSON-LD (schema.org/Quiz) — declares the interactive assessment as a
// structured, educational quiz so search & answer engines can surface it.
const quizSchema = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "AI Career Pivot Readiness Check",
  url: PAGE_URL,
  educationalUse: "self-assessment",
  about: {
    "@type": "Thing",
    name: "Readiness to pivot into an AI-adjacent career",
  },
  description:
    "A free five-question assessment that scores how ready a career changer is to pivot into an AI-adjacent role and returns three concrete next steps.",
  provider: {
    "@type": "Organization",
    name: "AICareerPivot",
    url: BASE_URL,
  },
};

// Speakable targets the result card's tier + one-line summary — the concise,
// spoken-answer-ready payload for voice/answer engines. (The ids render inside
// ReadinessClient's result view.)
const speakable = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: PAGE_URL,
  name: "AI Career Pivot Readiness Check",
  speakable: speakableSchema(["#readiness-tier", "#readiness-summary"]),
};

export default function ReadinessPage() {
  const crumbs = breadcrumbSchema([
    { name: "Tools", path: "/tools" },
    { name: "Readiness Check", path: "/readiness" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([quizSchema, faqSchema, speakable, crumbs]),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <main id="main-content">
          <ReadinessClient />

          {/* Visible FAQ — mirrors the FAQPage JSON-LD above. */}
          <section
            aria-labelledby="readiness-faq-heading"
            className="max-w-xl mx-auto px-6 pb-20"
          >
            <h2
              id="readiness-faq-heading"
              className="text-2xl font-bold text-white mb-6 text-center"
            >
              Common questions
            </h2>
            <div className="space-y-4">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl bg-slate-800/40 border border-slate-700 px-5 py-4"
                >
                  <summary className="cursor-pointer list-none font-semibold text-white flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-teal-400 transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
