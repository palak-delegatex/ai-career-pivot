import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import StickyCtaBar from "@/components/StickyCtaBar";
import PricingCheckout from "./PricingCheckout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing — AICareerPivot",
  description:
    "Get a personalized career pivot roadmap with AI certifications starting at just $19 intro pricing. AI-powered analysis of your resume and LinkedIn profile.",
  alternates: { canonical: "https://ai-career-pivot.com/pricing" },
  openGraph: {
    title: "Pricing — AICareerPivot",
    description:
      "Personalized career pivot roadmap with AI certifications starting at just $19 intro pricing. Lifetime access for $149.",
    url: "https://ai-career-pivot.com/pricing",
  },
};

const FAQ_ITEMS = [
  {
    q: "What do I get with the $19 report?",
    a: "A complete personalized career pivot report: 2-3 realistic pivot paths ranked by fit, with 6-month, 1-year, and 2-year milestones for each. Plus skill gap analysis, AI certifications roadmap tailored to your pivot, key actions, and financial considerations — all based on your actual resume and LinkedIn profile, not generic advice. The $19 intro price is a limited-time offer.",
  },
  {
    q: "What does Lifetime ($149) include?",
    a: "Everything in the one-time report, plus unlimited report updates as your situation changes, ongoing career coaching insights, and all future features — forever, with a single payment. No recurring charges. This is a limited Product Hunt exclusive offer for early supporters.",
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
  "AI certifications roadmap tailored to your pivot",
  "Financial considerations for each path",
  "Constraint-aware planning (salary, family, location)",
  "Permanent access to your report",
];

const LIFETIME_FEATURES = [
  "Everything in the one-time report",
  "Unlimited report updates",
  "Ongoing career coaching insights",
  "All future features included",
  "No recurring charges",
  "Priority support",
  "Early-adopter recognition",
];

export default function PricingPage() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "AICareerPivot Career Roadmap",
    description:
      "Personalized career pivot roadmap with AI-powered analysis of your resume and LinkedIn profile.",
    brand: { "@type": "Organization", name: "AICareerPivot" },
    offers: [
      {
        "@type": "Offer",
        name: "Report (Intro Pricing)",
        price: "19.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://ai-career-pivot.com/pricing",
      },
      {
        "@type": "Offer",
        name: "Lifetime",
        price: "149.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://ai-career-pivot.com/pricing",
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://ai-career-pivot.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: "https://ai-career-pivot.com/pricing",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productSchema, breadcrumbSchema, faqSchema]),
        }}
      />
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
            <span className="text-teal-400"> Two simple plans. No surprises.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            The average career coach charges $250/hour. You&apos;ll need 3-5 sessions
            before they give you actionable advice. That&apos;s $750–$1,250 before you
            get a single roadmap. AICareerPivot builds your complete roadmap in minutes.
          </p>
        </div>

        {/* Trust text badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {["Fortune 500 companies", "Y Combinator startups", "Big 4 consulting"].map((label) => (
            <span key={label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              {label}
            </span>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mb-10 -mt-4">
          Trusted by professionals from leading organizations
        </p>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 items-start max-w-4xl mx-auto">
          {/* Report — $19 intro pricing */}
          <Card className="bg-slate-800 border-slate-700 text-white rounded-2xl shadow-xl gap-0 py-0">
            <CardHeader className="px-8 pt-8 pb-0">
              <span className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                Intro Pricing
              </span>
              <h2 className="text-2xl font-bold text-white mb-1">Report</h2>
              <p className="text-slate-400 text-sm">One-time career pivot roadmap</p>
              <div className="flex items-end gap-2 mt-4 mb-1">
                <span className="text-4xl font-extrabold text-white font-serif">$19</span>
                <span className="text-slate-500 line-through text-lg mb-1">$29</span>
                <span className="text-slate-400 mb-1">one-time</span>
              </div>
              <p className="text-teal-400 text-sm font-semibold pb-2">
                30-day money-back guarantee
              </p>
              <p className="text-slate-500 text-xs pb-6">
                847 reports generated
              </p>
            </CardHeader>
            <CardContent className="px-8">
              <ul className="space-y-3 mb-8">
                {REPORT_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-8 pb-8 flex-col gap-2">
              <PricingCheckout plan="report" />
              <p className="text-slate-500 text-xs text-center">Secure payment via Stripe</p>
            </CardFooter>
          </Card>

          {/* Lifetime — $149 */}
          <div className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Product Hunt Exclusive
              </span>
            </div>
            <Card className="bg-slate-800 border-2 border-teal-500 text-white rounded-2xl shadow-xl shadow-teal-900/30 gap-0 py-0">
              <CardHeader className="px-8 pt-10 pb-0">
                <h2 className="text-2xl font-bold text-white mb-1">Lifetime</h2>
                <p className="text-slate-400 text-sm">All features, forever</p>
                <div className="flex items-end gap-1 mt-4 mb-1">
                  <span className="text-4xl font-extrabold text-white font-serif">$149</span>
                  <span className="text-slate-400 mb-1">one-time</span>
                </div>
                <p className="text-teal-400 text-sm font-semibold pb-6">
                  Limited to first 100 supporters
                </p>
              </CardHeader>
              <CardContent className="px-8">
                <ul className="space-y-3 mb-8">
                  {LIFETIME_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-8 pb-8 flex-col gap-2">
                <PricingCheckout plan="lifetime" />
                <p className="text-slate-500 text-xs text-center">
                  Secure payment via Stripe. Have a discount code? Enter it above.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Trust badge row */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            30-day money-back guarantee
          </div>
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            256-bit encrypted
          </div>
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            No recurring charges
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-extrabold text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <AccordionItem key={q} value={`faq-${i}`}>
                  <AccordionTrigger>{q}</AccordionTrigger>
                  <AccordionContent>{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <StickyCtaBar />
    </div>
    </>
  );
}
