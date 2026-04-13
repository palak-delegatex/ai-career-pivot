import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — AICareerPivot",
  description:
    "See how AICareerPivot builds your personalized career transition roadmap in three steps: share your situation, get your AI-generated strategy, and execute with a concrete 6-month, 1-year, and 2-year plan.",
  alternates: {
    canonical: "https://ai-career-pivot.vercel.app/how-it-works",
  },
  openGraph: {
    title: "How It Works — AICareerPivot",
    description:
      "AICareerPivot builds personalized career pivot roadmaps in three steps. Share your skills, finances, and family constraints — get a concrete multi-year action plan.",
    url: "https://ai-career-pivot.vercel.app/how-it-works",
  },
};

const howItWorksSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How AICareerPivot Builds Your Career Transition Roadmap",
  description:
    "AICareerPivot uses AI to analyze your skills, financial situation, and family constraints to build a personalized career pivot roadmap with concrete milestones at 6 months, 1 year, and 2 years.",
  url: "https://ai-career-pivot.vercel.app/how-it-works",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Share Your Situation",
      text: "Tell us your current role, skills, financial runway, and what matters most to your family. The more context you provide, the more specific your roadmap will be.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "AI Builds Your Strategy",
      text: "Our AI analyzes your profile against labor market data, identifies transferable skills, maps gaps, and creates a custom transition roadmap — not generic advice.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Execute with Confidence",
      text: "Get concrete milestones for 6 months, 1 year, and 2 years with skill gaps, income continuity planning, and specific actions laid out clearly.",
    },
  ],
};

const steps = [
  {
    number: "01",
    title: "Share Your Situation",
    subtitle: "The full picture, not just your resume",
    description:
      "Most career tools only look at your professional history. AICareerPivot starts with your whole situation: what you do now, what you want next, and the real-world constraints that matter.",
    details: [
      "Your current role, industry, and years of experience",
      "The skills you've built — technical and non-technical",
      "Your target career direction or industry",
      "Financial context: income, savings, major expenses, and risk tolerance",
      "Family and personal constraints that affect your timeline",
      "What 'success' actually looks like for you",
    ],
    accent: "from-teal-500 to-emerald-500",
  },
  {
    number: "02",
    title: "AI Builds Your Strategy",
    subtitle: "Data-informed, not generic",
    description:
      "Once you've shared your context, the AI gets to work. It doesn't give you a generic plan — it builds one grounded in your specific profile and real labor market data.",
    details: [
      "Identifies which of your skills transfer directly to your target role",
      "Quantifies the actual skills gaps — and which ones actually matter",
      "Calculates financial viability: can you make this move with your current runway?",
      "Maps transition paths from your current role to target roles",
      "Sequences milestones to maintain income continuity",
      "Recommends the most efficient upskilling paths — not a wishlist",
    ],
    accent: "from-teal-400 to-cyan-500",
  },
  {
    number: "03",
    title: "Execute with Confidence",
    subtitle: "Concrete actions, not inspiration",
    description:
      "You get a multi-year roadmap with specific, sequenced actions at each stage. No vague advice — every milestone tells you exactly what to do and why.",
    details: [
      "6-month plan: immediate actions to start positioning for your target role",
      "1-year plan: skill development, networking milestones, and income strategy",
      "2-year plan: target role application timeline and transition completion",
      "Specific resources, certifications, and projects that matter for your path",
      "How to reframe your existing experience for the new role",
      "Decision points where you can reassess and adjust the plan",
    ],
    accent: "from-cyan-500 to-teal-500",
  },
];

const whyItWorks = [
  {
    title: "Constraints make better plans",
    description:
      "Professionals with financial obligations and family responsibilities can't take uncalculated risks. That constraint forces more deliberate, staged planning — which is actually what leads to successful transitions.",
  },
  {
    title: "Transferable skills are undervalued",
    description:
      "Most professionals dramatically undervalue their existing skills. The AI identifies how your current experience maps to target roles, often revealing that you're closer than you think.",
  },
  {
    title: "Timing matters more than qualifications",
    description:
      "The biggest mistake in career pivots is poor timing — either moving too early before building leverage, or waiting so long the window closes. AICareerPivot designs your plan around the optimal sequencing.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksSchema) }}
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
            <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">About</Link>
            <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">FAQ</Link>
            <Link
              href="/waitlist"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              Join Waitlist
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-20">
          <header className="mb-20">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">How It Works</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              From stuck to strategic in three steps
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
              AICareerPivot turns your full situation — skills, finances, family, goals — into a concrete multi-year career transition roadmap with specific actions at every stage.
            </p>
          </header>

          {/* The three steps */}
          <div className="space-y-12 mb-24">
            {steps.map((step) => (
              <article key={step.number} className="relative">
                <div className="flex items-start gap-6">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center`}>
                    <span className="text-white font-bold">{step.number}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-500 text-sm font-medium mb-1">{step.subtitle}</p>
                    <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
                    <p className="text-slate-400 leading-relaxed mb-5">{step.description}</p>
                    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
                      <ul className="space-y-2.5">
                        {step.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-3 text-sm text-slate-400">
                            <span className="text-teal-400 mt-0.5 flex-shrink-0">→</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Why it works */}
          <section className="mb-20" aria-labelledby="why-heading">
            <h2 id="why-heading" className="text-2xl font-bold text-white mb-8">Why this approach works</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {whyItWorks.map((item) => (
                <div key={item.title} className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
                  <h3 className="text-white font-semibold mb-2 text-sm">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What you get */}
          <section className="mb-20 bg-slate-900/60 rounded-2xl border border-slate-800 p-8" aria-labelledby="output-heading">
            <h2 id="output-heading" className="text-xl font-bold text-white mb-4">What your roadmap includes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "6-month, 1-year, and 2-year milestone plan",
                "Skills gap analysis with prioritized learning path",
                "Financial viability assessment for your timeline",
                "Income continuity strategy during the transition",
                "Specific resources, courses, and projects by milestone",
                "Resume reframing guide for your target role",
                "Networking strategy for your target industry",
                "Decision checkpoints to reassess and adapt",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-teal-950 border border-teal-800/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gradient-to-br from-teal-950/60 to-slate-900/60 rounded-3xl p-10 border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to see your roadmap?</h2>
            <p className="text-slate-400 mb-8">Join the waitlist and be among the first professionals to get their personalized career pivot plan.</p>
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              Join the Waitlist →
            </Link>
            <div className="mt-4">
              <Link href="/faq" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                Have questions? Read the FAQ →
              </Link>
            </div>
          </section>
        </main>

        <footer className="py-8 px-6 border-t border-slate-800/60 text-center text-slate-600 text-sm mt-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-teal-500 to-emerald-600" />
            <span className="text-slate-500 font-medium">AICareerPivot</span>
          </div>
          <nav className="flex items-center justify-center gap-4 mb-2" aria-label="Footer navigation">
            <Link href="/" className="hover:text-slate-400 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-slate-400 transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
          </nav>
          <p>© 2026 AICareerPivot. Your career, your timeline.</p>
        </footer>
      </div>
    </>
  );
}
