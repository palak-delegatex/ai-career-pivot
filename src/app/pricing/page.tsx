import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Pricing — AICareerPivot",
  description:
    "Invest less than one hour of career coaching. Get a complete personalized roadmap. Founding cohort: $49/month, locked forever. Standard: $99/month.",
  alternates: { canonical: "https://ai-career-pivot.com/pricing" },
  openGraph: {
    title: "Pricing — AICareerPivot",
    description:
      "Founding cohort pricing: $49/month, locked forever. Limited to first 100 users.",
    url: "https://ai-career-pivot.com/pricing",
  },
};

const WAITLIST_URL =
  "/waitlist?utm_source=pricing_page&utm_medium=internal&utm_campaign=founding_cohort";

const FAQ_ITEMS = [
  {
    q: "What's included in the founding cohort price?",
    a: "Everything. Full career pivot plan generation, LinkedIn + resume analysis, constraint-aware planning (we ask about your salary floor, family, location, and timeline), AI certifications roadmap with salary ROI data, and unlimited plan updates. Plus direct access to the founding team — if something doesn't work right, you can reach us directly.",
  },
  {
    q: 'What does "locked forever" mean?',
    a: "Your $49/month rate is yours as long as you maintain your subscription. If you cancel and re-subscribe after standard pricing launches, you'd pay $99/month. If you stay subscribed, you pay $49/month forever, regardless of what we charge new users.",
  },
  {
    q: "When do I get access?",
    a: "We're running a waitlist to launch the founding cohort in groups — this lets us make sure every user gets a high-quality experience rather than overwhelming the system on day one. Most waitlist users get access within 2-4 weeks of joining.",
  },
  {
    q: "What if I don't have a LinkedIn profile or resume?",
    a: "The product works best with both, but you can use just one. Resume-only works well for people who keep their LinkedIn minimal. LinkedIn-only works if you have a detailed profile with work history and skills.",
  },
  {
    q: "What's your refund policy?",
    a: "30 days, no questions asked. If the plan we generate isn't useful to you, email us and we'll refund your first month.",
  },
  {
    q: "What if my situation changes after I get my roadmap?",
    a: "Plans are free to update. If you get a new job, move cities, have a kid, or change your salary floor — go back, update your context, and get a new roadmap. All included.",
  },
  {
    q: "How is this different from just asking ChatGPT?",
    a: "ChatGPT gives you generic advice unless you spend 30-45 minutes carefully prompting it and pasting in your full background. AICareerPivot is specifically designed for career pivots — it knows what context matters (work history, skills, constraints), knows what questions to ask, and outputs a structured roadmap rather than a conversation. Most users get better output in 5 minutes than they get from an hour of ChatGPT prompting.",
  },
];

const FOUNDING_FEATURES = [
  "Full career pivot plan (6-month, 1-year, 2-year)",
  "LinkedIn + resume analysis (20-40 transferable skills extracted)",
  "Constraint-aware planning (salary, family, location)",
  "AI certifications roadmap with ROI data",
  "Unlimited plan updates as your situation changes",
  "Direct feedback line to founding team",
];

const STANDARD_FEATURES = [
  "Full career pivot plan",
  "LinkedIn + resume analysis",
  "Constraint-aware planning",
  "AI certifications roadmap",
  "Unlimited plan updates",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">
            Simple Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Invest less than one hour of career coaching.
            <br className="hidden sm:block" />
            <span className="text-teal-400"> Get a complete personalized roadmap.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            The average career coach charges $250/hour. You&apos;ll need 3-5 sessions
            before they give you actionable advice. That&apos;s $750–$1,250 before you
            get a single roadmap. AICareerPivot reads your resume and LinkedIn profile,
            extracts your transferable skills, and builds your 6-month, 1-year, and
            2-year roadmap in minutes.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {/* Founding cohort — featured */}
          <div className="relative rounded-2xl border-2 border-teal-500 bg-slate-800 p-8 shadow-xl shadow-teal-900/30">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Founding Cohort
              </span>
            </div>
            <div className="mt-4 mb-6">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">$49</span>
                <span className="text-slate-400 mb-2">/month</span>
              </div>
              <p className="text-teal-400 text-sm font-semibold">
                Locked in forever · Limited to first 100 users
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {FOUNDING_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={WAITLIST_URL}
              className="block w-full text-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/50"
            >
              Join the Waitlist →
            </Link>
            <p className="text-slate-500 text-xs text-center mt-3">
              Founding price locked at signup.
            </p>
          </div>

          {/* Standard — greyed out */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 opacity-60">
            <div className="mb-6">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-3">
                Standard
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-slate-400">$99</span>
                <span className="text-slate-500 mb-2">/month</span>
              </div>
              <p className="text-slate-500 text-sm">
                Available after founding cohort fills
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {STANDARD_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-500">
                  <span className="mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={WAITLIST_URL}
              className="block w-full text-center px-6 py-3 rounded-xl border border-slate-600 text-slate-400 font-semibold text-sm transition-colors hover:border-slate-500"
            >
              Join Waitlist for Founding Rate →
            </Link>
          </div>
        </div>

        {/* Not ready CTA */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center mb-16">
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="font-semibold text-white">Not ready to commit?</span>{" "}
            Join the free waitlist. You&apos;ll get early access, founding cohort pricing
            when we launch, and a series of career pivot guides while you wait.
          </p>
          <Link
            href={WAITLIST_URL}
            className="inline-block mt-4 text-teal-400 hover:text-teal-300 text-sm font-semibold transition-colors"
          >
            Join the free waitlist →
          </Link>
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

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <Link
            href={WAITLIST_URL}
            className="inline-block px-10 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Claim My Founding Cohort Spot →
          </Link>
          <p className="text-slate-500 text-sm mt-4">
            No payment until we launch. Founding price locked at signup.
          </p>
        </div>
      </main>
    </div>
  );
}
