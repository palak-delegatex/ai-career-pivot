import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import StickyCtaBar from "@/components/StickyCtaBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorks" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://ai-career-pivot.com/how-it-works",
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://ai-career-pivot.com/how-it-works",
    },
  };
}

// Non-translatable presentation metadata for each step. User-facing copy
// (title/subtitle/description/details) is resolved via next-intl below.
const stepMeta = [
  { number: "01", accent: "from-teal-500 to-emerald-500" },
  { number: "02", accent: "from-teal-400 to-cyan-500" },
  { number: "03", accent: "from-cyan-500 to-teal-500" },
] as const;

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("howItWorks");
  const crumbs = breadcrumbSchema([{ name: t("breadcrumb"), path: "/how-it-works" }]);

  const howItWorksSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("schemaName"),
    description: t("schemaDescription"),
    url: "https://ai-career-pivot.com/how-it-works",
    dateModified: "2026-06-12",
    step: [1, 2, 3].map((n) => ({
      "@type": "HowToStep",
      position: n,
      name: t(`step${n}Title`),
      text: t(`step${n}Description`),
    })),
  };

  const steps = stepMeta.map((meta, i) => {
    const n = i + 1;
    return {
      number: meta.number,
      accent: meta.accent,
      title: t(`step${n}Title`),
      subtitle: t(`step${n}Subtitle`),
      description: t(`step${n}Description`),
      details: [
        t(`step${n}Detail1`),
        t(`step${n}Detail2`),
        t(`step${n}Detail3`),
        t(`step${n}Detail4`),
        t(`step${n}Detail5`),
        t(`step${n}Detail6`),
      ],
    };
  });

  const whyItWorks = [1, 2, 3].map((n) => ({
    title: t(`why${n}Title`),
    description: t(`why${n}Description`),
  }));

  const roadmapIncludes = [
    t("includes1"),
    t("includes2"),
    t("includes3"),
    t("includes4"),
    t("includes5"),
    t("includes6"),
    t("includes7"),
    t("includes8"),
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([howItWorksSchema, crumbs]) }}
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
            <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("navAbout")}</Link>
            <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("navFaq")}</Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              {t("navGetStarted")}
            </Link>
          </div>
        </nav>

        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src="/images/how-it-works.png"
            alt={t("heroImageAlt")}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/70 to-[#030712]" />
          <div className="relative z-10 flex items-end h-full max-w-5xl mx-auto px-6 pb-12">
            <header>
              <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">{t("heroEyebrow")}</p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
                {t("heroTitle")}
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                {t("heroSubtitle")}
              </p>
            </header>
          </div>
        </section>

        <main className="max-w-4xl mx-auto px-6 py-20">

          {/* TL;DR */}
          <section className="mb-12 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">{t("tldrHeading")}</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldrPoint1")}</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldrPoint2")}</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldrPoint3")}</li>
            </ul>
          </section>

          {/* The three steps — tabbed on desktop */}
          <div className="mb-24">
            <Tabs defaultValue="step-01">
              <TabsList className="mb-8 bg-slate-800/80 w-full sm:w-auto">
                {steps.map((step) => (
                  <TabsTrigger key={step.number} value={`step-${step.number}`} className="flex-1 sm:flex-none">
                    {step.number}
                  </TabsTrigger>
                ))}
              </TabsList>
              {steps.map((step) => (
                <TabsContent key={step.number} value={`step-${step.number}`}>
                  <article>
                    <div className="flex items-start gap-6">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center`}>
                        <span className="text-white font-bold">{step.number}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-500 text-sm font-medium mb-1">{step.subtitle}</p>
                        <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
                        <p className="text-slate-400 leading-relaxed mb-5">{step.description}</p>
                        <Card className="bg-slate-900/60 border-slate-800 text-white rounded-xl py-0">
                          <CardContent className="p-5">
                            <ul className="space-y-2.5">
                              {step.details.map((detail) => (
                                <li key={detail} className="flex items-start gap-3 text-sm text-slate-400">
                                  <span className="text-teal-400 mt-0.5 flex-shrink-0">→</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </article>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Why it works */}
          <section className="mb-20" aria-labelledby="why-heading">
            <h2 id="why-heading" className="text-2xl font-bold text-white mb-8">{t("whyHeading")}</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {whyItWorks.map((item) => (
                <Card key={item.title} className="bg-slate-900/60 border-slate-800 text-white rounded-xl py-0">
                  <CardContent className="p-5">
                    <h3 className="text-white font-semibold mb-2 text-sm">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* What you get */}
          <section className="mb-20 bg-slate-900/60 rounded-2xl border border-slate-800 p-8" aria-labelledby="output-heading">
            <h2 id="output-heading" className="text-xl font-bold text-white mb-4">{t("includesHeading")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {roadmapIncludes.map((item) => (
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
            <h2 className="text-2xl font-bold text-white mb-3">{t("ctaHeading")}</h2>
            <p className="text-slate-400 mb-8">{t("ctaSubtitle")}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              {t("ctaButton")}
            </Link>
            <div className="mt-4">
              <Link href="/faq" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                {t("ctaFaqLink")}
              </Link>
            </div>
          </section>
        </main>

        <StickyCtaBar />
      </div>
    </>
  );
}
