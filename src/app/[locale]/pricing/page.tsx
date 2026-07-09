import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import StickyCtaBar from "@/components/StickyCtaBar";
import PricingCheckout from "./PricingCheckout";
import PricingHeroCta from "./PricingHeroCta";
import PricingFreeCta from "./PricingFreeCta";
import PricingPageTracker from "./PricingPageTracker";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Building2, Rocket, Briefcase } from "lucide-react";
import { testimonials } from "@/lib/testimonials";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";
import OutcomeProofStrip from "@/components/OutcomeProofStrip";
import PricingComparisonTable from "@/components/PricingComparisonTable";
import PlanComparisonTable from "@/components/PlanComparisonTable";
import CheckoutTrustBlock from "@/components/CheckoutTrustBlock";
import GuaranteeCard from "@/components/GuaranteeCard";
import { PROOF_METRICS } from "@/lib/proof-metrics";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Pricing — AICareerPivot",
  description:
    "Get a personalized career pivot roadmap with AI certifications starting at just $19 intro pricing. AI-powered analysis of your resume and LinkedIn profile.",
  alternates: alternatesFor("/pricing", locale),
  openGraph: {
    locale: ogLocaleFor(locale),
    title: "Pricing — AICareerPivot",
    description:
      "Personalized career pivot roadmap with AI certifications starting at just $19 intro pricing. Lifetime access for $149.",
    url: localizedPath("/pricing", locale),
  },
};
}

const FAQ_ITEMS = [
  {
    q: "What do I get for free?",
    a: "A complete career pivot snapshot: your #1 best-fit career path with a match score, your top 3 skill gaps to close, and the transferable strengths you already have. No credit card, no account, results in about 30 seconds. It's the honest preview of where AI could take your career before you decide to go deeper.",
  },
  {
    q: "What does the $19 report add on top of the free snapshot?",
    a: "The full report expands your snapshot into a complete career pivot plan: all 3 career paths ranked by fit with detailed analysis, your complete skill-gap map (15+ gaps) with how to close each, 6/12/24-month milestone roadmaps, financial bridge planning with salary trajectories and ROI, AI coaching with a weekly action plan, an AI resume builder, and a job board with personalized match scores. The $19 intro price is a limited-time offer.",
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

// Free tier (the anchor). `have` = revealed in the free snapshot; `missing` =
// gated behind an upgrade — shown muted so the value gap reads at a glance.
const FREE_FEATURES = {
  have: [
    "#1 career-path match with fit score",
    "Top 3 skill gaps identified",
    "Transferable strengths revealed",
    "No credit card, no account needed",
  ],
  missing: [
    "Full milestone roadmap",
    "Financial bridge & salary plan",
  ],
};

const REPORT_FEATURES = [
  "3 career paths ranked by fit",
  "Complete skill-gap analysis (15+ gaps)",
  "6/12/24-month milestone roadmap",
  "Financial bridge & salary trajectory",
  "AI coaching & weekly action plan",
  "AI resume builder + job board with match scores",
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
    brand: organizationSchema(),
    dateModified: "2026-06-12",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
      bestRating: "5",
    },
    review: [
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Sarah K." },
        reviewRating: { "@type": "Rating", ratingValue: "5" },
        reviewBody: "The roadmap was incredibly specific to my situation. Worth every penny.",
      },
      {
        "@type": "Review",
        author: { "@type": "Person", name: "James L." },
        reviewRating: { "@type": "Rating", ratingValue: "5" },
        reviewBody: "Finally, career advice that accounts for my mortgage and kids. Game changer.",
      },
    ],
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "19.00",
      highPrice: "149.00",
      priceCurrency: "USD",
      offerCount: 2,
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
    },
  };

  const crumbs = breadcrumbSchema([{ name: "Pricing", path: "/pricing" }]);

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
          __html: JSON.stringify([productSchema, crumbs, faqSchema]),
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PricingPageTracker />
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* TL;DR */}
        <div className="max-w-3xl mx-auto mb-12 bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">TL;DR</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>Get a personalized career pivot roadmap for $19 (intro) or $149 (lifetime with unlimited updates).</li>
            <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>AICareerPivot analyzes your resume and LinkedIn to deliver 2-3 pivot paths with 6-month, 1-year, and 2-year milestones.</li>
            <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>30-day money-back guarantee. One-time payment, no subscription. Secure checkout via Stripe.</li>
          </ul>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">
            Choose Your Plan
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            See where AI could take your career — free.
            <br className="hidden sm:block" />
            <span className="text-teal-400"> Upgrade when you&apos;re ready to commit.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            The average career coach charges $250/hour. You&apos;ll need 3-5 sessions
            before they give you actionable advice. That&apos;s $750–$1,250 before you
            get a single roadmap. AICareerPivot builds your complete roadmap in minutes.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-slate-300 text-sm font-medium">847 reports generated</span>
          </div>
          <PricingHeroCta />
        </div>

        {/* Trust text badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {[
            { label: "Used by Fortune 500 professionals", icon: Building2 },
            { label: "Trusted by YC startup founders", icon: Rocket },
            { label: "Adopted by Big 4 consultants", icon: Briefcase },
          ].map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Icon className="w-4 h-4 text-teal-400" />
              {label}
            </span>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mb-10 -mt-4">
          Trusted by professionals from leading organizations
        </p>

        {/* Feature-comparison table — us vs. status quo (coach) vs. free (ChatGPT),
            AICareerPivot column visually anchored (AIC-738) */}
        <PricingComparisonTable />

        {/* Value prop callout */}
        <p className="text-slate-400 text-sm italic max-w-md mx-auto text-center mb-12">
          The only career pivot tool that plans around your mortgage, your kids, and your income — not just your skills.
        </p>

        {/* Outcome proof strip — anchor the value frame before the price (AIC-753) */}
        <div className="max-w-4xl mx-auto mb-10">
          <OutcomeProofStrip
            metrics={[
              { value: PROOF_METRICS.pivotsDelivered, label: "Pivots delivered" },
              { value: PROOF_METRICS.avgRating, label: "Avg rating", accent: "text-teal-400", star: true },
              { value: PROOF_METRICS.recommendRate, label: "Would recommend" },
              { value: PROOF_METRICS.salaryUplift, label: "Avg salary uplift", accent: "text-emerald-400" },
            ]}
          />
        </div>

        {/* Pricing cards — three tiers, Free anchoring the ladder on the left
            so the paid tiers read as upgrades of what you already saw (AIC-778).
            Report ($19) is the visually-anchored conversion target. */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 items-start max-w-5xl mx-auto">
          {/* Free Snapshot — the $0 anchor. Routes to /free, no checkout. */}
          <Card className="bg-slate-800 border-slate-700 text-white rounded-2xl shadow-xl gap-0 py-0">
            <CardHeader className="px-8 pt-8 pb-0">
              <span className="inline-block bg-slate-600 text-slate-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                Start Here
              </span>
              <h2 className="text-2xl font-bold text-white mb-1">Free Snapshot</h2>
              <p className="text-slate-400 text-sm">See where you could go</p>
              <div className="flex items-end gap-2 mt-4 mb-1">
                <span className="text-4xl font-extrabold text-white font-serif">$0</span>
                <span className="text-slate-400 mb-1">forever free</span>
              </div>
              <p className="text-slate-400 text-sm font-semibold pb-6">
                No credit card required
              </p>
            </CardHeader>
            <CardContent className="px-8">
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.have.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
                {FREE_FEATURES.missing.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-500">
                    <span className="text-slate-600 mt-0.5 shrink-0">✕</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-8 pb-8 flex-col gap-2">
              <PricingFreeCta />
              <p className="text-slate-500 text-xs text-center">Results in ~30 seconds. Upgrade anytime.</p>
            </CardFooter>
          </Card>

          {/* Career Report — $19 intro pricing, the recommended conversion target.
              `id=get-report` + scroll-margin is the deep-link target for high-intent
              arrivals from the UpgradeComparisonSheet CTA (AIC-785): a visitor who
              already chose "Get Full Report — $19" in the sheet lands directly on
              this checkout instead of re-deciding at the top of the three-tier page. */}
          <div id="get-report" className="relative scroll-mt-24">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Recommended
              </span>
            </div>
            <Card className="bg-slate-800 border-2 border-teal-500 text-white rounded-2xl shadow-xl shadow-teal-900/30 gap-0 py-0">
              <CardHeader className="px-8 pt-10 pb-0">
                <h2 className="text-2xl font-bold text-white mb-1">Career Report</h2>
                <p className="text-slate-400 text-sm">Your complete pivot roadmap</p>
                <div className="flex items-end gap-2 mt-4 mb-1">
                  <span className="text-4xl font-extrabold text-white font-serif">$19</span>
                  <span className="text-slate-500 line-through text-lg mb-1">$29</span>
                  <span className="text-slate-400 mb-1">one-time</span>
                </div>
                <p className="text-teal-400 text-sm font-semibold pb-6">
                  30-day money-back guarantee
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
                <CheckoutTrustBlock
                  items={[
                    { icon: "shield", text: "30-day refund, no questions" },
                    { icon: "lock", text: "Secure checkout via Stripe" },
                    {
                      icon: "users",
                      text: (
                        <>
                          Join <strong className="text-slate-200 font-semibold">{PROOF_METRICS.pivotsDelivered} professionals</strong> who&rsquo;ve pivoted
                        </>
                      ),
                    },
                  ]}
                />
              </CardFooter>
            </Card>
          </div>

          {/* Lifetime — $149 */}
          <Card className="bg-slate-800 border-slate-700 text-white rounded-2xl shadow-xl gap-0 py-0">
            <CardHeader className="px-8 pt-8 pb-0">
              <span className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                Early Adopter
              </span>
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
              <CheckoutTrustBlock
                items={[
                  { icon: "shield", text: "30-day refund, no questions" },
                  { icon: "lock", text: "Secure checkout via Stripe" },
                  {
                    icon: "check",
                    text: (
                      <>
                        One payment. <strong className="text-slate-200 font-semibold">No subscription, ever.</strong>
                      </>
                    ),
                  },
                ]}
              />
              <p className="text-slate-500 text-xs text-center">Have a discount code? Enter it above.</p>
            </CardFooter>
          </Card>
        </div>

        {/* Tier-by-tier comparison — Free column anchors the ladder (AIC-778) */}
        <PlanComparisonTable />

        {/* Pricing testimonials — 3 outcome-specific cards with star ratings (AIC-753) */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
          {testimonials
            .filter((t) => ["James L.", "Priya R.", "David C."].includes(t.name))
            .map((t) => (
              <div
                key={t.name}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"
              >
                <div className="flex gap-0.5 mb-2.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed mb-3">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Visual guarantee card — replaces the flat text-badge row (AIC-753) */}
        <div className="mb-16">
          <GuaranteeCard
            title="30-Day Money-Back Guarantee"
            body="If the report isn't useful to you, email us and we'll refund you immediately. No questions asked, no hoops to jump through. Your career pivot shouldn't start with a risk."
          />
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
