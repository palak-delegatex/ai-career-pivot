import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: "https://ai-career-pivot.com/faq",
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://ai-career-pivot.com/faq",
    },
  };
}

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"] as const;

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  const faqs = FAQ_KEYS.map((key) => ({
    question: t(`${key}.question`),
    answer: t(`${key}.answer`),
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: "2026-06-12",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const crumbs = breadcrumbSchema([{ name: t("breadcrumb"), path: "/faq" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqSchema, crumbs]) }}
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
            <Link href="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("navHowItWorks")}</Link>
            <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("navAbout")}</Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              {t("navGetStarted")}
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-20">
          <header className="mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">{t("eyebrow")}</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              {t("heading")}
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              {t("subheading")}
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
            <h2 className="text-2xl font-bold text-white mb-3">{t("ctaHeading")}</h2>
            <p className="text-slate-400 mb-8">{t("ctaSubheading")}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </main>

      </div>
    </>
  );
}
