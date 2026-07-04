import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { organizationSchema, breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: "https://ai-career-pivot.com/about",
    },
    openGraph: {
      title: t("meta.ogTitle"),
      description: t("meta.ogDescription"),
      url: "https://ai-career-pivot.com/about",
    },
  };
}

// Principle copy lives in the `about` catalog; keys are enumerated here so the
// number badge / tooltip logic stays index-based while text is translated.
const PRINCIPLE_KEYS = [
  "wholeLifeContext",
  "financialRealism",
  "skillsFirstMapping",
  "timeHorizonedPlanning",
  "evidenceBasedRecommendations",
] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const crumbs = breadcrumbSchema([{ name: t("meta.breadcrumb"), path: "/about" }]);

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t("schema.name"),
    url: "https://ai-career-pivot.com/about",
    dateModified: "2026-06-12",
    description: t("schema.description"),
    mainEntity: {
      ...organizationSchema(),
      foundingDate: "2026",
      mission: t("schema.mission"),
    },
  };
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
            <Link href="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("nav.howItWorks")}</Link>
            <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("nav.faq")}</Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src="/images/about-trust.png"
            alt={t("hero.imageAlt")}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/70 to-[#030712]" />
          <div className="relative z-10 flex items-end h-full max-w-5xl mx-auto px-6 pb-12">
            <header>
              <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">{t("hero.eyebrow")}</p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
                {t("hero.title")}
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
                {t("hero.subtitle")}
              </p>
            </header>
          </div>
        </section>

        <main className="max-w-4xl mx-auto px-6 py-20">

          {/* TL;DR */}
          <section className="mb-12 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-3">{t("tldr.heading")}</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldr.point1")}</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldr.point2")}</li>
              <li className="flex items-start gap-2"><span className="text-teal-400 mt-0.5 shrink-0">•</span>{t("tldr.point3")}</li>
            </ul>
          </section>

          {/* Mission */}
          <section className="mb-20" aria-labelledby="mission-heading">
            <h2 id="mission-heading" className="text-2xl font-bold text-white mb-4">{t("mission.heading")}</h2>
            <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-800">
              <p className="text-slate-300 text-lg leading-relaxed mb-4">
                {t.rich("mission.lead", {
                  strong: (chunks) => <strong className="text-white">{chunks}</strong>,
                })}
              </p>
              <p className="text-slate-400 leading-relaxed">
                {t("mission.body")}
              </p>
            </div>
          </section>

          {/* Methodology */}
          <section className="mb-20" aria-labelledby="methodology-heading">
            <h2 id="methodology-heading" className="text-2xl font-bold text-white mb-2">{t("methodology.heading")}</h2>
            <p className="text-slate-400 mb-8">
              {t("methodology.intro")}
            </p>
            <div className="space-y-4">
              {PRINCIPLE_KEYS.map((key, i) => (
                <Card key={key} className="bg-slate-900/60 border-slate-800 text-white rounded-xl py-0">
                  <CardContent className="px-6 py-6">
                    <div className="flex items-start gap-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-950 border border-teal-800/50 flex items-center justify-center cursor-default">
                            <span className="text-teal-400 font-bold text-sm">{i + 1}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{t("methodology.principleTooltip", { number: i + 1, total: PRINCIPLE_KEYS.length })}</TooltipContent>
                      </Tooltip>
                      <div>
                        <h3 className="text-white font-semibold mb-2">{t(`methodology.principles.${key}.title`)}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{t(`methodology.principles.${key}.description`)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Technology */}
          <section className="mb-20" aria-labelledby="technology-heading">
            <h2 id="technology-heading" className="text-2xl font-bold text-white mb-4">{t("technology.heading")}</h2>
            <div className="bg-slate-900/60 rounded-2xl p-8 border border-slate-800">
              <p className="text-slate-300 leading-relaxed mb-4">
                {t("technology.intro")}
              </p>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>{t("technology.step1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>{t("technology.step2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>{t("technology.step3")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-400 mt-0.5">→</span>
                  <span>{t("technology.step4")}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gradient-to-br from-teal-950/60 to-slate-900/60 rounded-3xl p-10 border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">{t("cta.heading")}</h2>
            <p className="text-slate-400 mb-8">{t("cta.subtitle")}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              {t("cta.button")}
            </Link>
          </section>
        </main>

      </div>
    </>
  );
}
