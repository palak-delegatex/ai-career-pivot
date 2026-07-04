import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "About AICareerPivot — Our Methodology & Mission",
  description:
    "AICareerPivot builds personalized career transition roadmaps powered by AI. Learn about our methodology: how we factor in your skills, finances, and family constraints to create real, actionable plans.",
  alternates: {
    canonical: "https://ai-career-pivot.com/about",
  },
  openGraph: {
    title: "About AICareerPivot — Our Methodology & Mission",
    description:
      "Learn how AICareerPivot builds personalized career transition roadmaps by analyzing your skills, financial runway, and family constraints.",
    url: "https://ai-career-pivot.com/about",
  },
};

import { organizationSchema, breadcrumbSchema } from "@/lib/schema";

const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About AICareerPivot",
  url: "https://ai-career-pivot.com/about",
  dateModified: "2026-06-12",
  description:
    "AICareerPivot is an AI-powered career strategist that builds personalized transition roadmaps by analyzing skills, financial constraints, and family circumstances.",
  mainEntity: {
    ...organizationSchema(),
    foundingDate: "2026",
    mission:
      "To help professionals make confident, well-planned career transitions that account for skills, income continuity, and family responsibilities.",
  },
};

const principles = [
  {
    title: "Whole-Life Context",
    description:
      "Generic career advice ignores that most professionals have mortgages, dependents, and partners with their own careers. AICareerPivot starts by understanding your full situation — not just your resume.",
  },
  {
    title: "Financial Realism",
    description:
      "We calculate your financial runway, factor in income continuity requirements, and design transition paths that don't require you to 'just quit and figure it out.' Transitions are sequenced around your real financial constraints.",
  },
  {
    title: "Skills-First Mapping",
    description:
      "Our AI identifies which of your existing skills are transferable to target roles, quantifies the gaps, and recommends the most efficient learning paths — not a generic skills wishlist.",
  },
  {
    title: "Time-Horizoned Planning",
    description:
      "Every roadmap includes concrete milestones at 6 months, 1 year, and 2 years. You always know what the next step is and how it connects to the bigger transition goal.",
  },
  {
    title: "Evidence-Based Recommendations",
    description:
      "Recommendations are grounded in labor market data, industry transition patterns, and real salary benchmarks — not generic optimism about what 'could' happen.",
  },
];

export default function AboutPage() {
  const crumbs = breadcrumbSchema([{ name: "About", path: "/about" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([aboutPageSchema, crumbs]) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full border-b border-slate-800/50">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">AICareerPivot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">How It Works</Link>
            <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">FAQ</Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src="/images/about-trust.png"
            alt="Professional discussing career strategy in a modern workspace"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/70 to-[#030712]" />
          <div className="relative z-10 flex items-end h-full max-w-5xl mx-auto px-6 pb-12">
            <header>
              <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">About</p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
                Career advice that accounts for your whole life
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
                AICareerPivot is an AI-powered career strategist built for the reality most professionals face: you can&apos;t just quit and figure it out. You have financial obligations, family considerations, and real constraints that generic career coaches ignore.
              </p>
            </header>
          </div>
        </section>

        <main className="max-w-4xl mx-auto px-6 py-20">

          {/* TL;DR */}
          <section className="mb-12 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">TL;DR</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>AICareerPivot is an AI-powered career strategist that builds personalized transition roadmaps factoring in your skills, finances, and family constraints.</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>Unlike generic career coaches, every roadmap includes concrete milestones at 6 months, 1 year, and 2 years with financial viability analysis.</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>Built for the 95% of professionals who have mortgages, kids, and partners — not for people who can just quit and figure it out.</li>
            </ul>
          </section>

          {/* Mission */}
          <section className="mb-20" aria-labelledby="mission-heading">
            <h2 id="mission-heading" className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-800">
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                <strong className="text-white">We believe every professional deserves a realistic path to a career they love</strong> — not just inspiration, but an actual plan with concrete steps, financial viability analysis, and honest timelines.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Most career advice is written for people with no responsibilities, unlimited savings, and a partner who can pick up the slack. That&apos;s not most people. AICareerPivot was built for the other 95%: professionals with mortgages, kids, aging parents, and partners who also have careers.
              </p>
            </div>
          </section>

          {/* Methodology */}
          <section className="mb-20" aria-labelledby="methodology-heading">
            <h2 id="methodology-heading" className="text-2xl font-bold text-white mb-2">Our Methodology</h2>
            <p className="text-slate-400 mb-8">
              Every AICareerPivot roadmap is built on five core principles that make our plans realistic, not just aspirational.
            </p>
            <div className="space-y-4">
              {principles.map((principle, i) => (
                <Card key={principle.title} className="bg-slate-900/60 border-slate-800 text-white rounded-xl py-0">
                  <CardContent className="px-6 py-6">
                    <div className="flex items-start gap-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-950 border border-teal-800/50 flex items-center justify-center cursor-default">
                            <span className="text-teal-400 font-bold text-sm">{i + 1}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Principle {i + 1} of {principles.length}</TooltipContent>
                      </Tooltip>
                      <div>
                        <h3 className="text-white font-semibold mb-2">{principle.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{principle.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Technology */}
          <section className="mb-20" aria-labelledby="technology-heading">
            <h2 id="technology-heading" className="text-2xl font-bold text-white mb-4">How the AI Works</h2>
            <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-800">
              <p className="text-slate-300 leading-relaxed mb-4">
                AICareerPivot uses large language models augmented with career transition data, labor market information, and salary benchmarks. When you share your profile, the AI:
              </p>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>Identifies transferable skills from your current role to target roles, with gap analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>Calculates financial viability based on your income, savings, and target salary range</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>Sequences milestones to minimize financial risk and family disruption</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>Generates a personalized 6-month, 1-year, and 2-year roadmap with specific actions</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gradient-to-br from-teal-950/60 to-slate-900/60 rounded-3xl p-10 border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to build your real escape plan?</h2>
            <p className="text-slate-400 mb-8">Get your personalized career pivot roadmap today — just $19 intro pricing.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              Get My Roadmap — $19 →
            </Link>
          </section>
        </main>

      </div>
    </>
  );
}
