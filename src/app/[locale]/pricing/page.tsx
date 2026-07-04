import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import StickyCtaBar from "@/components/StickyCtaBar";
import PricingCheckout from "./PricingCheckout";
import PricingHeroCta from "./PricingHeroCta";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Building2, Rocket, Briefcase } from "lucide-react";
import { testimonials } from "@/lib/testimonials";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "https://ai-career-pivot.com/pricing" },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://ai-career-pivot.com/pricing",
    },
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  const reportFeatures = [
    t("reportFeature1"),
    t("reportFeature2"),
    t("reportFeature3"),
    t("reportFeature4"),
    t("reportFeature5"),
    t("reportFeature6"),
    t("reportFeature7"),
    t("reportFeature8"),
  ];

  const lifetimeFeatures = [
    t("lifetimeFeature1"),
    t("lifetimeFeature2"),
    t("lifetimeFeature3"),
    t("lifetimeFeature4"),
    t("lifetimeFeature5"),
    t("lifetimeFeature6"),
    t("lifetimeFeature7"),
  ];

  const faqItems = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
    { q: t("faqQ5"), a: t("faqA5") },
  ];

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
    mainEntity: faqItems.map(({ q, a }) => ({
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
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* TL;DR */}
        <div className="max-w-3xl mx-auto mb-12 bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">{t("tldrHeading")}</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldrPoint1")}</li>
            <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldrPoint2")}</li>
            <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldrPoint3")}</li>
          </ul>
        </div>

        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-4">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            {t("heading")}
            <br className="hidden sm:block" />
            <span className="text-teal-400"> {t("headingHighlight")}</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            {t("subheading")}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-slate-300 text-sm font-medium">{t("reportsGenerated")}</span>
          </div>
          <PricingHeroCta />
        </div>

        {/* Trust text badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {[
            { label: t("trustBadge1"), icon: Building2 },
            { label: t("trustBadge2"), icon: Rocket },
            { label: t("trustBadge3"), icon: Briefcase },
          ].map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Icon className="w-4 h-4 text-teal-400" />
              {label}
            </span>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mb-10 -mt-4">
          {t("trustedBy")}
        </p>

        {/* Value comparison strip */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">{t("compCareerCoachTitle")}</h3>
            <p className="text-2xl font-bold text-white">{t("compCareerCoachPrice")}</p>
            <p className="text-xs text-slate-500 mt-2">{t("compCareerCoachDesc")}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">{t("compChatGPTTitle")}</h3>
            <p className="text-2xl font-bold text-white">{t("compChatGPTPrice")}</p>
            <p className="text-xs text-slate-500 mt-2">{t("compChatGPTDesc")}</p>
          </div>
          <div className="bg-teal-950/20 border-2 border-teal-500 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-teal-400 mb-1">AICareerPivot</h3>
            <p className="text-2xl font-bold text-white">{t("compAICareerPivotPrice")}</p>
            <p className="text-xs text-slate-400 mt-2">{t("compAICareerPivotDesc")}</p>
          </div>
        </div>

        {/* Value prop callout */}
        <p className="text-slate-400 text-sm italic max-w-md mx-auto text-center mb-12">
          {t("valuePropCallout")}
        </p>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 items-start max-w-4xl mx-auto">
          {/* Report — $19 intro pricing */}
          <Card className="bg-slate-800 border-slate-700 text-white rounded-2xl shadow-xl gap-0 py-0">
            <CardHeader className="px-8 pt-8 pb-0">
              <span className="inline-block bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                {t("planReportBadge")}
              </span>
              <h2 className="text-2xl font-bold text-white mb-1">{t("planReportTitle")}</h2>
              <p className="text-slate-400 text-sm">{t("planReportSubtitle")}</p>
              <div className="flex items-end gap-2 mt-4 mb-1">
                <span className="text-4xl font-extrabold text-white font-serif">$19</span>
                <span className="text-slate-500 line-through text-lg mb-1">$29</span>
                <span className="text-slate-400 mb-1">one-time</span>
              </div>
              <p className="text-teal-400 text-sm font-semibold pb-6">
                {t("planReportGuarantee")}
              </p>
            </CardHeader>
            <CardContent className="px-8">
              <ul className="space-y-3 mb-8">
                {reportFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="text-teal-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-8 pb-8 flex-col gap-2">
              <PricingCheckout plan="report" />
              <p className="text-slate-500 text-xs text-center">{t("planReportSecure")}</p>
            </CardFooter>
          </Card>

          {/* Lifetime — $149 */}
          <div className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                {t("planLifetimeBadge")}
              </span>
            </div>
            <Card className="bg-slate-800 border-2 border-teal-500 text-white rounded-2xl shadow-xl shadow-teal-900/30 gap-0 py-0">
              <CardHeader className="px-8 pt-10 pb-0">
                <h2 className="text-2xl font-bold text-white mb-1">{t("planLifetimeTitle")}</h2>
                <p className="text-slate-400 text-sm">{t("planLifetimeSubtitle")}</p>
                <div className="flex items-end gap-1 mt-4 mb-1">
                  <span className="text-4xl font-extrabold text-white font-serif">$149</span>
                  <span className="text-slate-400 mb-1">one-time</span>
                </div>
                <p className="text-teal-400 text-sm font-semibold pb-6">
                  {t("planLifetimeLimit")}
                </p>
              </CardHeader>
              <CardContent className="px-8">
                <ul className="space-y-3 mb-8">
                  {lifetimeFeatures.map((f) => (
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
                  {t("planLifetimeSecure")}
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Pricing testimonials */}
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-10">
          {testimonials
            .filter((t) => t.name === "Sarah K." || t.name === "James L.")
            .map((t) => (
              <div
                key={t.name}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"
              >
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

        {/* Trust badge row */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t("trustMoneyBack")}
          </div>
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t("trustEncrypted")}
          </div>
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {t("trustNoCharges")}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-extrabold text-center mb-8">
            {t("faqHeading")}
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map(({ q, a }, i) => (
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
