import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import PricingCheckout from "./PricingCheckout";

export const metadata: Metadata = {
  title: "Pricing — AICareerPivot",
  description:
    "Get a personalized career pivot roadmap starting at $29. Lifetime access for $149. AI-powered analysis of your resume and LinkedIn profile.",
  alternates: { canonical: "https://ai-career-pivot.com/pricing" },
  openGraph: {
    title: "Pricing — AICareerPivot",
    description:
      "Personalized career pivot roadmap starting at $29. Lifetime access for $149.",
    url: "https://ai-career-pivot.com/pricing",
  },
};

const FAQ_ITEMS = [
  {
    q: "What do I get with the $29 report?",
    a: "A complete personalized career pivot report: 2-3 realistic pivot paths ranked by fit, with 6-month, 1-year, and 2-year milestones for each. Plus skill gap analysis, key actions, and financial considerations — all based on your actual resume and LinkedIn profile, not generic advice.",
  },
  {
    q: "What's included in Pro ($29/mo)?",
    a: "Everything in the one-time report, plus unlimited report updates as your situation changes, an AI certifications roadmap, and ongoing career coaching insights. Cancel anytime.",
  },
  {
    q: "What does Lifetime ($149) include?",
    a: "All current and future Pro features — forever, with a single payment. No recurring charges. This is a limited Product Hunt exclusive offer for early supporters.",
  },
  {
    q: "How is this different from just asking ChatGPT?",
    a: "ChatGPT gives you generic advice unless you spend 30-45 minutes carefully prompting it and pasting in your full background. AICareerPivot extracts your transferable skills automatically, knows what context matters, and outputs a structured roadmap. Most users get better output in 5 minutes than from an hour of ChatGPT prompting.",
  },
  {
    q: "What's your refund policy?",
    a: "30 days, no questions asked. If the report isn't useful to you, email us and we'll refund you immediately.",
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

const PRO_FEATURES = [
  "Everything in the one-time report",
  "Unlimited report updates",
  "AI certifications roadmap",
  "Ongoing career coaching insights",
  "Priority support",
  "Cancel anytime",
];

const LIFETIME_FEATURES = [
  "All current Pro features — forever",
  "All future features included",
  "No recurring charges",
  "Priority support",
  "Early-adopter recognition",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">
            Choose Your Plan
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Your personalized career pivot roadmap.
            <br className="hidden sm:block" />
            <span className="text-teal-400"> Plans for every stage of your journey.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            The average career coach charges $250/hour. You&apos;ll need 3-5 sessions
            before they give you actionable advice. That&apos;s $750–$1,250 before you
            get a single roadmap. AICareerPivot builds your complete roadmap in minutes.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 items-start">
          {/* Report — $29 one-time */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Report</h2>
              <p className="text-slate-400 text-sm">One-time career pivot roadmap</p>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold text-white">$29</span>
              <span className="text-slate-400 mb-1">one-time</span>
            </div>
            <p className="text-teal-400 text-sm font-semibold mb-6">
              30-day money-back guarantee
            </p>
            <ul className="space-y-3 mb-8">
              {REPORT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <PricingCheckout plan="report" />
            <p className="text-slate-500 text-xs text-center mt-3">
              Secure payment via Stripe
            </p>
          </div>

          {/* Pro — $29/month */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Pro</h2>
              <p className="text-slate-400 text-sm">Ongoing career coaching</p>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold text-white">$29</span>
              <span className="text-slate-400 mb-1">/month</span>
            </div>
            <p className="text-teal-400 text-sm font-semibold mb-6">
              Cancel anytime
            </p>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <PricingCheckout plan="monthly" />
            <p className="text-slate-500 text-xs text-center mt-3">
              Secure payment via Stripe
            </p>
          </div>

          {/* Lifetime — $149 */}
          <div className="relative rounded-2xl border-2 border-teal-500 bg-slate-800 p-8 shadow-xl shadow-teal-900/30">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Product Hunt Exclusive
              </span>
            </div>
            <div className="mb-6 mt-2">
              <h2 className="text-lg font-bold text-white mb-1">Lifetime</h2>
              <p className="text-slate-400 text-sm">All features, forever</p>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold text-white">$149</span>
              <span className="text-slate-400 mb-1">one-time</span>
            </div>
            <p className="text-teal-400 text-sm font-semibold mb-6">
              Limited to first 100 supporters
            </p>
            <ul className="space-y-3 mb-8">
              {LIFETIME_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <PricingCheckout plan="lifetime" />
            <p className="text-slate-500 text-xs text-center mt-3">
              Secure payment via Stripe. Have a discount code? Enter it above.
            </p>
          </div>
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
