import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import BlogFaqAccordion from "@/components/blog/BlogFaqAccordion";
import StatBlock from "@/components/StatBlock";
import StatSection from "@/components/StatSection";
import StatActions from "@/components/StatActions";
import { DataPageEffects, CitationBlock } from "@/components/DataPageClient";
import { breadcrumbSchema, speakableSchema } from "@/lib/schema";
import type { FaqItem } from "@/lib/blog";

const BASE_URL = "https://ai-career-pivot.com";
const PATH = "/research/ai-career-pivots-2026";

// ── Sources (all publicly published; figures quoted as-reported, AIC-860) ─────
const SRC = {
  wef: {
    label: "WEF Future of Jobs 2025",
    url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/",
  },
  blsDS: {
    label: "U.S. BLS, 2023–33",
    url: "https://www.bls.gov/ooh/math/data-scientists.htm",
  },
  blsCS: {
    label: "U.S. BLS, 2023–33",
    url: "https://www.bls.gov/ooh/computer-and-information-technology/computer-and-information-research-scientists.htm",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const title = "State of AI Career Pivots 2026 — Original Data & Statistics | AICareerPivot";
  const description =
    "Key statistics on AI career transitions in 2026: labor-market shifts, salary and demand data for AI roles, and reskilling trends. Sourced, quotable, and citation-ready.";
  const image =
    "/api/og/research?title=" +
    encodeURIComponent("State of AI Career Pivots 2026") +
    "&stat=170M&label=" +
    encodeURIComponent("new jobs projected by 2030");
  return {
    title,
    description,
    alternates: alternatesFor(PATH, locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: "State of AI Career Pivots 2026",
      description,
      url: localizedPath(PATH, locale),
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "State of AI Career Pivots 2026",
      description,
      images: [image],
    },
  };
}

const FAQ: FaqItem[] = [
  {
    question: "Where does the data on this page come from?",
    answer:
      "Every figure is compiled from publicly available government and industry reports — primarily the World Economic Forum's Future of Jobs Report 2025 and the U.S. Bureau of Labor Statistics Occupational Outlook Handbook. We quote each statistic as published and link to its original source. We do not fabricate, model, or extrapolate data.",
  },
  {
    question: "How often is this data updated?",
    answer:
      "This edition reflects the most recent published figures as of September 2026. We revisit the page as new editions of the source reports are released and publish a new annual edition (e.g. State of AI Career Pivots 2027) when the underlying data cycle updates.",
  },
  {
    question: "Can I cite these statistics?",
    answer:
      "Yes. Each stat has a copy button that produces a fully attributed quote and a deep link back to that specific number, and the methodology section includes a ready-to-paste citation for the page. Please cite the original source alongside AICareerPivot where possible.",
  },
  {
    question: "What is an \"AI-adjacent\" role?",
    answer:
      "An AI-adjacent role is one whose demand is driven by AI adoption — including data scientists, machine-learning specialists, AI product and program managers, and data/analytics roles — as well as existing roles that increasingly require working with AI tools. The BLS occupational categories cited here (data scientists; computer and information research scientists) are representative examples.",
  },
  {
    question: "How is a \"career pivot\" defined in this data?",
    answer:
      "We use \"career pivot\" to mean transitioning into an AI-adjacent role from a different field or function. The labor-market figures describe the broader shift in jobs and skills that makes these pivots possible; the demand figures describe the roles people are pivoting into.",
  },
];

export default async function ResearchDataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const canonicalUrl = `${BASE_URL}${localizedPath(PATH, locale)}`;

  const crumbs = breadcrumbSchema([
    { name: "State of AI Career Pivots 2026", path: PATH },
  ]);

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "State of AI Career Pivots 2026",
    description:
      "Original compilation of statistics on AI career transitions: labor-market shifts, demand and salary data for AI-adjacent roles, and reskilling trends. Sourced from public government and industry reports.",
    url: canonicalUrl,
    creator: { "@type": "Organization", name: "AICareerPivot", url: BASE_URL },
    temporalCoverage: "2025/2026",
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: canonicalUrl,
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
    name: "State of AI Career Pivots 2026",
    speakable: speakableSchema([".stat-block", ".faq-accordion"]),
  };

  const jsonLd = [webPageSchema, datasetSchema, crumbs, faqSchema];

  const SECTION_COUNT = 3;
  const STAT_COUNT = 11; // hero + 10 section stats

  const citation = `AICareerPivot. "State of AI Career Pivots 2026." ${canonicalUrl}. Accessed 2026.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DataPageEffects sectionCount={SECTION_COUNT} statCount={STAT_COUNT} />
      <div className="min-h-screen bg-background text-white">
        <SiteNav />
        <main id="main-content">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-teal-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="text-slate-400">Research</li>
                <li aria-hidden="true">›</li>
                <li className="text-slate-400">State of AI Career Pivots 2026</li>
              </ol>
            </nav>

            {/* Hero */}
            <header className="mb-6">
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-3">
                State of AI Career Pivots 2026
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight">
                The data behind the pivot.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl">
                Original statistics on AI career transitions — sourced, quotable, and
                citation-ready.
              </p>
            </header>

            {/* Hero stat */}
            <div className="bg-card border border-slate-700 rounded-2xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
              <div className="dot-grid absolute inset-0 opacity-30" aria-hidden="true" />
              <div
                id="stat-hero"
                className="stat-block scroll-mt-24 relative flex flex-col items-center"
                data-stat-value="170M"
                data-stat-label="new jobs projected to be created globally by 2030"
                data-stat-source="World Economic Forum, Future of Jobs Report 2025"
                itemScope
                itemType="https://schema.org/Observation"
              >
                <p
                  className="stat-value font-heading text-6xl sm:text-7xl lg:text-8xl font-bold text-white tabular-nums tracking-tight leading-none"
                  itemProp="value"
                >
                  170M
                </p>
                <p
                  className="stat-label text-lg sm:text-xl text-slate-300 leading-relaxed max-w-md mx-auto mt-4"
                  itemProp="name"
                >
                  new jobs projected to be created globally by 2030 — with AI, data, and
                  technology roles among the fastest-growing.
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Source:{" "}
                  <a
                    href={SRC.wef.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stat-source underline decoration-slate-600 underline-offset-2 hover:text-slate-400"
                    itemProp="observedBy"
                  >
                    {SRC.wef.label}
                  </a>
                </p>
                <StatActions
                  value="170M"
                  label="new jobs projected to be created globally by 2030"
                  source="WEF Future of Jobs 2025"
                  anchor="stat-hero"
                  section="hero"
                  align="center"
                />
              </div>
            </div>

            {/* Section 1 — The AI labor shift (WEF) */}
            <StatSection
              eyebrow="The AI Labor Shift"
              heading="How AI is reshaping the global job market"
              columns={3}
            >
              <StatBlock
                value="92M"
                label="jobs projected to be displaced globally by 2030"
                source={SRC.wef.label}
                sourceUrl={SRC.wef.url}
                accent="amber"
                trend="neutral"
                shareable
                section="labor-shift"
              />
              <StatBlock
                value="+78M"
                label="net new jobs by 2030 after displacement is accounted for"
                source={SRC.wef.label}
                sourceUrl={SRC.wef.url}
                accent="emerald"
                trend="up"
                shareable
                section="labor-shift"
              />
              <StatBlock
                value="39%"
                label="of workers' core skills expected to be transformed or outdated by 2030"
                source={SRC.wef.label}
                sourceUrl={SRC.wef.url}
                accent="teal"
                shareable
                section="labor-shift"
              />
            </StatSection>

            {/* Section 2 — Demand for AI roles (BLS) */}
            <StatSection
              eyebrow="Demand for AI Roles"
              heading="What the U.S. labor projections show"
              columns={4}
            >
              <StatBlock
                value="+36%"
                label="projected growth for data scientists, 2023–2033 (far above the 4% average for all jobs)"
                source={SRC.blsDS.label}
                sourceUrl={SRC.blsDS.url}
                accent="emerald"
                trend="up"
                shareable
                section="demand"
              />
              <StatBlock
                value="$108,020"
                label="median annual pay for data scientists (May 2023)"
                source={SRC.blsDS.label}
                sourceUrl={SRC.blsDS.url}
                accent="teal"
                shareable
                section="demand"
              />
              <StatBlock
                value="73,100"
                label="new data-scientist jobs projected in the U.S., 2023–2033"
                source={SRC.blsDS.label}
                sourceUrl={SRC.blsDS.url}
                accent="teal"
                shareable
                section="demand"
              />
              <StatBlock
                value="+26%"
                label="projected growth for computer & information research scientists, 2023–2033"
                source={SRC.blsCS.label}
                sourceUrl={SRC.blsCS.url}
                accent="emerald"
                trend="up"
                shareable
                section="demand"
              />
            </StatSection>

            {/* Section 3 — Skills & reskilling (WEF) */}
            <StatSection
              eyebrow="Skills & Reskilling"
              heading="How employers are responding"
              columns={3}
            >
              <StatBlock
                value="85%"
                label="of employers plan to prioritize upskilling their workforce by 2030"
                source={SRC.wef.label}
                sourceUrl={SRC.wef.url}
                accent="teal"
                shareable
                section="reskilling"
              />
              <StatBlock
                value="70%"
                label="of employers expect to hire staff with new, AI-relevant skills by 2030"
                source={SRC.wef.label}
                sourceUrl={SRC.wef.url}
                accent="teal"
                shareable
                section="reskilling"
              />
              <StatBlock
                value="63%"
                label="of employers cite skills gaps as the biggest barrier to transformation"
                source={SRC.wef.label}
                sourceUrl={SRC.wef.url}
                accent="amber"
                shareable
                section="reskilling"
              />
            </StatSection>

            {/* Methodology & sources */}
            <section className="py-12 sm:py-16 border-t border-slate-800" aria-labelledby="methodology-heading">
              <p className="text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mb-2">
                Methodology &amp; Sources
              </p>
              <h2 id="methodology-heading" className="font-heading text-xl sm:text-2xl font-bold text-white mb-6">
                Where this data comes from
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-prose">
                All statistics on this page are compiled from publicly available government and
                industry reports and are quoted as published. We do not fabricate, model, or
                extrapolate data — each stat links to its original source. Figures were last
                verified in September 2026.
              </p>

              <h3 className="text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mt-8 mb-3">
                Sources
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
                <li>
                  <a href={SRC.wef.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-600 underline-offset-2 hover:text-slate-200">
                    World Economic Forum, Future of Jobs Report 2025 (January 2025)
                  </a>
                </li>
                <li>
                  <a href={SRC.blsDS.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-600 underline-offset-2 hover:text-slate-200">
                    U.S. Bureau of Labor Statistics, Occupational Outlook Handbook — Data Scientists
                  </a>
                </li>
                <li>
                  <a href={SRC.blsCS.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-600 underline-offset-2 hover:text-slate-200">
                    U.S. Bureau of Labor Statistics, Occupational Outlook Handbook — Computer &amp;
                    Information Research Scientists
                  </a>
                </li>
              </ul>

              <h3 className="text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mt-8 mb-3">
                How to cite this page
              </h3>
              <CitationBlock citation={citation} />
              <p className="text-xs text-slate-500 mt-4">Last updated: September 2026</p>
            </section>

            {/* FAQ */}
            <BlogFaqAccordion items={FAQ} heading="Data &amp; Methodology FAQ" />

            {/* Discovery on-ramp (free, no gate) */}
            <section className="mt-14 border-t border-slate-800 pt-10 text-center">
              <p className="text-slate-300 mb-4">
                Curious where you stand in this shift?
              </p>
              <Link
                href="/readiness"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors min-h-[44px]"
              >
                Take the free AI Career Pivot Readiness Assessment →
              </Link>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
