import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — AICareerPivot",
  description:
    "Answers to common questions about career pivots: how long it takes, whether you need savings, how to change careers with a family, and how AICareerPivot builds your personalized roadmap.",
  alternates: {
    canonical: "https://ai-career-pivot.com/faq",
  },
  openGraph: {
    title: "FAQ — AICareerPivot",
    description:
      "Common questions about career pivots answered: timelines, finances, skills gaps, and how AICareerPivot creates personalized transition roadmaps.",
    url: "https://ai-career-pivot.com/faq",
  },
};

const faqs = [
  {
    question: "How long does a career pivot typically take?",
    answer:
      "Most successful career pivots take 12 to 24 months when planned properly. The timeline depends on how different your target role is from your current role, your financial runway, and whether you need additional credentials. AICareerPivot creates a realistic timeline based on your specific situation — not a generic average — with milestones at 6 months, 1 year, and 2 years.",
  },
  {
    question: "Do I need a lot of savings to change careers?",
    answer:
      "Not necessarily, but you do need a plan. Most professionals make the mistake of either waiting indefinitely for the 'perfect' financial moment or quitting impulsively. AICareerPivot analyzes your current income, fixed expenses, and target salary range to design a transition path that maintains income continuity. Many pivots can be staged — upskilling and networking while employed — so you never have a gap in earnings.",
  },
  {
    question: "Can I change careers if I have a family and financial obligations?",
    answer:
      "Yes, and this is exactly what AICareerPivot is designed for. We factor in family constraints, partner's income, dependent care costs, and mortgage or rent obligations directly into your roadmap. Transitions are sequenced to minimize disruption to your household. We've found that professionals with more constraints often make more deliberate, successful transitions because they plan more carefully.",
  },
  {
    question: "What types of career pivots does AICareerPivot support?",
    answer:
      "AICareerPivot supports a wide range of transitions: from technical roles to management, from one industry to another (e.g., finance to tech), from corporate to entrepreneurship, from in-person to remote roles, and from individual contributor to leadership. The AI adapts the roadmap based on the specific skills transferability and market demand for your target path.",
  },
  {
    question: "How is AICareerPivot different from a career coach?",
    answer:
      "A human career coach is expensive (typically $150–500/hour), often gives generic advice, and rarely has the data to back up recommendations with market evidence. AICareerPivot provides data-informed, personalized roadmaps that factor in labor market realities, salary benchmarks, and skills gap analysis — available whenever you need it, at a fraction of the cost. That said, AICareerPivot is a planning tool, not a replacement for human mentors who know your specific field.",
  },
  {
    question: "What information do I need to provide?",
    answer:
      "To build your roadmap, AICareerPivot asks about: your current role and industry, your key skills and years of experience, your target career direction, your financial situation (income, savings, major expenses), your timeline and risk tolerance, and any family or personal constraints. The more context you provide, the more specific and useful your roadmap will be.",
  },
  {
    question: "Will the roadmap include specific actions, or just general advice?",
    answer:
      "Specific actions. Each milestone in your roadmap includes concrete next steps: which skills to build, which certifications matter vs. which are optional, networking strategies for your target field, how to reframe your resume for the new role, and how to time your job search around your financial constraints. Generic advice ('network more', 'update your LinkedIn') is not the AICareerPivot approach.",
  },
  {
    question: "How does AICareerPivot handle skills gaps?",
    answer:
      "The AI identifies which of your existing skills transfer directly to your target role, which are partially transferable, and what the actual gaps are. It then prioritizes the gaps by impact — not every missing skill matters equally — and recommends the most efficient ways to close the important ones (specific courses, projects, certifications, or on-the-job learning). You won't be told to 'learn Python' if Python isn't actually required for the roles you're targeting.",
  },
  {
    question: "Is AICareerPivot available now?",
    answer:
      "AICareerPivot is currently in early access. We're onboarding a limited number of users to refine the roadmap quality and ensure every plan meets our standard for genuine usefulness. Join the waitlist to be notified when your spot opens.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
            <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">About</Link>
            <Link
              href="/waitlist"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              Join Waitlist
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-20">
          <header className="mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">FAQ</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              Career pivot questions, answered honestly
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Real answers to the questions professionals ask before making a career change — including the ones most career advice skips.
            </p>
          </header>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <article key={i} className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
                <h2 className="text-white font-semibold px-6 py-5 text-lg leading-snug border-b border-slate-800/50">
                  {faq.question}
                </h2>
                <p className="text-slate-400 leading-relaxed px-6 py-5 text-sm sm:text-base">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-16 text-center bg-gradient-to-br from-teal-950/60 to-slate-900/60 rounded-3xl p-10 border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">Still have questions?</h2>
            <p className="text-slate-400 mb-8">Join the waitlist and we&apos;ll personally answer any questions about your specific situation.</p>
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              Join the Waitlist →
            </Link>
          </div>
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
