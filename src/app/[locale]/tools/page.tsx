import type { Metadata } from "next";
import Link from "next/link";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import StickyCtaBar from "@/components/StickyCtaBar";
import { Card, CardContent } from "@/components/ui/card";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "Free Career Tools — Resume, ATS, LinkedIn & More | AICareerPivot",
    description:
      "A hub of free AI-powered career tools: ATS resume scoring, resume & cover letter generators, LinkedIn optimizer, job-specific gap analysis, mock interviews, and more. No signup to try.",
    alternates: alternatesFor("/tools", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: "Free Career Tools | AICareerPivot",
      description:
        "AI-powered career tools — ATS scoring, resume & cover letter generators, LinkedIn optimizer, gap analysis, mock interviews. Free to try, no signup.",
      url: localizedPath("/tools", locale),
    },
  };
}

type Tool = {
  name: string;
  href: string;
  description: string;
};

type ToolCategory = {
  heading: string;
  blurb: string;
  tools: Tool[];
};

// The nine indexable tool routes already live in the sitemap (see src/app/sitemap.ts).
// This hub is the internal-link surface that ties them together (AIC-1214 / AIC-1211).
const CATEGORIES: ToolCategory[] = [
  {
    heading: "Resume & applications",
    blurb: "Beat the bots and tailor every application to the role.",
    tools: [
      {
        name: "ATS Resume Score",
        href: "/ats-score",
        description:
          "Upload your resume and get an instant ATS compatibility score with specific fixes to beat applicant tracking systems.",
      },
      {
        name: "Resume Generator",
        href: "/resume-generator",
        description:
          "Generate an ATS-optimized resume tailored to your target role in seconds.",
      },
      {
        name: "Cover Letter Generator",
        href: "/cover-letter",
        description:
          "Write a tailored, compelling cover letter with AI-powered keyword matching and tone control.",
      },
      {
        name: "Job-Specific Gap Analysis",
        href: "/gap-analysis",
        description:
          "Paste any job posting and instantly see how your skills match up — with steps to close every gap.",
      },
    ],
  },
  {
    heading: "Profile & networking",
    blurb: "Get found by recruiters and stay on top of every lead.",
    tools: [
      {
        name: "LinkedIn Profile Optimizer",
        href: "/linkedin-optimizer",
        description:
          "Section-by-section rewrites, missing keywords, and the recruiter search terms your profile is missing.",
      },
      {
        name: "Networking Assistant",
        href: "/networking",
        description:
          "Build a warm outreach plan and get message drafts that actually get replies.",
      },
      {
        name: "Job Tracker",
        href: "/job-tracker",
        description:
          "Track every application, interview, and follow-up in one place so nothing slips.",
      },
    ],
  },
  {
    heading: "Discover & practice",
    blurb: "Find your direction, then rehearse until you're ready.",
    tools: [
      {
        name: "30-Second Career Quiz",
        href: "/quiz",
        description:
          "Answer 4 quick questions and see which AI-adjacent role fits your background — no resume, no signup.",
      },
      {
        name: "Career Values Assessment",
        href: "/assessment",
        description:
          "Discover your work style, priorities, and ideal career direction.",
      },
      {
        name: "Mock Interview",
        href: "/mock-interview",
        description:
          "Practice AI-powered mock interviews for your target role with real-time feedback and a scorecard.",
      },
    ],
  },
];

const ALL_TOOLS: Tool[] = CATEGORIES.flatMap((c) => c.tools);

const BASE_URL = "https://ai-career-pivot.com";

// ItemList tells search & answer engines this is a curated collection page,
// improving eligibility for rich results and giving each tool a citable node.
const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Career Tools by AICareerPivot",
  description:
    "A collection of free AI-powered career tools for resumes, ATS scoring, LinkedIn, gap analysis, and interview prep.",
  url: `${BASE_URL}/tools`,
  numberOfItems: ALL_TOOLS.length,
  itemListElement: ALL_TOOLS.map((tool, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: tool.name,
    description: tool.description,
    url: `${BASE_URL}${tool.href}`,
  })),
};

export default function ToolsPage() {
  const crumbs = breadcrumbSchema([{ name: "Tools", path: "/tools" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListSchema, crumbs]) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <SiteNav />

        <main id="main-content" className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <header className="mb-14 max-w-3xl">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">
              Free Tools
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
              Free AI career tools
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Everything you need to move your career forward — score your resume against ATS,
              rewrite your LinkedIn, analyze any job posting, and practice interviews. Free to
              try, no signup to start.
            </p>
          </header>

          <div className="space-y-14">
            {CATEGORIES.map((category) => (
              <section key={category.heading} aria-labelledby={`cat-${category.heading}`}>
                <div className="mb-5">
                  <h2
                    id={`cat-${category.heading}`}
                    className="text-2xl font-bold text-white"
                  >
                    {category.heading}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">{category.blurb}</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool) => (
                    <Card
                      key={tool.href}
                      className="relative bg-slate-900/60 border-slate-800 text-white rounded-xl py-0 transition-colors hover:border-teal-500/40"
                    >
                      <CardContent className="p-5 h-full flex flex-col">
                        <Link
                          href={tool.href}
                          className="text-white font-semibold text-base hover:text-teal-400 transition-colors"
                        >
                          <span className="absolute inset-0" aria-hidden="true" />
                          {tool.name}
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mt-2 flex-1">
                          {tool.description}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-teal-400 text-sm font-medium">
                          Try it free
                          <span aria-hidden="true">→</span>
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <section className="mt-20 text-center bg-gradient-to-br from-teal-950/60 to-slate-900/60 rounded-3xl p-10 border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">
              Want the whole roadmap, not just a tool?
            </h2>
            <p className="text-slate-400 mb-8">
              AICareerPivot turns your skills, finances, and goals into a concrete multi-year
              career transition plan — just $19 intro pricing.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              Get My Roadmap — $19 →
            </Link>
            <div className="mt-4">
              <Link
                href="/how-it-works"
                className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                See how it works →
              </Link>
            </div>
          </section>
        </main>

        <StickyCtaBar />
      </div>
    </>
  );
}
