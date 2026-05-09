import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import PricingCheckout from "./PricingCheckout";

export const metadata: Metadata = {
  title: "Pricing — AICareerPivot",
  description:
    "Get a complete personalized career pivot roadmap for $29. AI-powered analysis of your resume and LinkedIn profile. 6-month, 1-year, and 2-year milestones.",
  alternates: { canonical: "https://ai-career-pivot.com/pricing" },
  openGraph: {
    title: "Pricing — AICareerPivot",
    description:
      "Personalized career pivot roadmap for $29. Powered by AI, built on your real background.",
    url: "https://ai-career-pivot.com/pricing",
  },
};

const FAQ_ITEMS = [
  {
    q: "What do I get for $29?",
    a: "A complete personalized career pivot report: 2-3 realistic pivot paths ranked by fit, with 6-month, 1-year, and 2-year milestones for each. Plus skill gap analysis, key actions, and financial considerations — all based on your actual resume and LinkedIn profile, not generic advice.",
  },
  {
    q: "How is this different from just asking ChatGPT?",
    a: "ChatGPT gives you generic advice unless you spend 30-45 minutes carefully prompting it and pasting in your full background. AICareerPivot extracts your transferable skills automatically, knows what context matters, and outputs a structured roadmap. Most users get better output in 5 minutes than from an hour of ChatGPT prompting.",
  },
  {
    q: "What if I don't have a LinkedIn profile or resume?",
    a: "The product works best with both, but you can use just one. Resume-only works well for people who keep their LinkedIn minimal. LinkedIn-only works if you have a detailed profile with work history and skills.",
  },
  {
    q: "What's your refund policy?",
    a: "30 days, no questions asked. If the report isn't useful to you, email us and we'll refund you immediately.",
  },
  {
    q: "Can I update my report later?",
    a: "The $29 report is a one-time generation based on your current background. We're building a subscription tier with unlimited updates — join the waitlist to lock in founding pricing when it launches.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Your resume and profile data are processed securely, never shared with third parties, and you can request deletion anytime. Payment is handled by Stripe — we never see your card details.",
  },
];

const REPORT_FEATURES = [
  "2-3 personalized career pivot paths ranked by fit",
  "6-month, 1-year, and 2-year milestone roadmaps",
  "Transferable skills analysis (20-40 skills extracted)",
  "Skill gap identification with action steps",
  "Financial considerations for each path",
  "Constraint-aware planning (salary, family, location)",
  "Permanent access to your report",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">
            Simple, One-Time Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Your personalized career pivot roadmap.
            <br className="hidden sm:block" />
            <span className="text-teal-400"> Less than a cup of coffee per career path.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            The average career coach charges $250/hour. You&apos;ll need 3-5 sessions
            before they give you actionable advice. That&apos;s $750–$1,250 before you
            get a single roadmap. AICareerPivot reads your resume, extracts your
            transferable skills, and builds your complete roadmap in minutes.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto mb-16">
          <div className="relative rounded-2xl border-2 border-teal-500 bg-slate-800 p-8 shadow-xl shadow-teal-900/30">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Career Pivot Report
              </span>
            </div>
            <div className="mt-4 mb-6 text-center">
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">$29</span>
                <span className="text-slate-400 mb-2">one-time</span>
              </div>
              <p className="text-teal-400 text-sm font-semibold">
                30-day money-back guarantee
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {REPORT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <PricingCheckout />

            <p className="text-slate-500 text-xs text-center mt-3">
              Secure payment via Stripe. Have a waitlist discount code? Enter it above.
            </p>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center mb-16">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="font-semibold text-white">Not ready yet?</span>{" "}
            Join the free waitlist for founding cohort pricing when we launch our
            subscription tier — unlimited plan updates, AI certifications roadmap, and more.
          </p>
          <a
            href="/waitlist?utm_source=pricing_page&utm_medium=internal&utm_campaign=founding_cohort"
            className="inline-block mt-4 text-teal-400 hover:text-teal-300 text-sm font-semibold transition-colors"
          >
            Join the free waitlist →
          </a>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-extrabold text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div
                key={q}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6"
              >
                <h3 className="font-semibold text-white mb-2">{q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
