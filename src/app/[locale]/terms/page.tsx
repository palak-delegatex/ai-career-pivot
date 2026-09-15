import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: alternatesFor("/terms", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: t("page.metaOgTitle"),
      description: t("page.metaOgDescription"),
      url: localizedPath("/terms", locale),
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SiteNav />

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">{t("eyebrow")}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            {t("heading")}
          </h1>
          <p className="text-slate-400">{t("lastUpdated")}</p>
        </header>

        <div className="prose-custom space-y-10">
          <p className="text-slate-300 leading-relaxed">
            {t("intro")}
          </p>

          <section aria-labelledby="who-we-are">
            <h2 id="who-we-are" className="text-2xl font-bold text-white mb-4">{t("s1.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s1.body")}</p>
          </section>

          <section aria-labelledby="eligibility">
            <h2 id="eligibility" className="text-2xl font-bold text-white mb-4">{t("s2.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s2.body")}</p>
          </section>

          <section aria-labelledby="your-account">
            <h2 id="your-account" className="text-2xl font-bold text-white mb-4">{t("s3.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s3.body")}</p>
          </section>

          <section aria-labelledby="acceptable-use">
            <h2 id="acceptable-use" className="text-2xl font-bold text-white mb-4">{t("s4.heading")}</h2>
            <p className="text-slate-400 leading-relaxed mb-4">{t("s4.intro")}</p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span>{t("s4.item1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span>{t("s4.item2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span>{t("s4.item3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span>{t("s4.item4")}</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="payments">
            <h2 id="payments" className="text-2xl font-bold text-white mb-4">{t("s5.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s5.body")}</p>
          </section>

          <section aria-labelledby="your-content">
            <h2 id="your-content" className="text-2xl font-bold text-white mb-4">{t("s6.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s6.body")}</p>
          </section>

          <section aria-labelledby="intellectual-property">
            <h2 id="intellectual-property" className="text-2xl font-bold text-white mb-4">{t("s7.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s7.body")}</p>
          </section>

          <section aria-labelledby="ai-output">
            <h2 id="ai-output" className="text-2xl font-bold text-white mb-4">{t("s8.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s8.body")}</p>
          </section>

          <section aria-labelledby="disclaimers">
            <h2 id="disclaimers" className="text-2xl font-bold text-white mb-4">{t("s9.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s9.body")}</p>
          </section>

          <section aria-labelledby="liability">
            <h2 id="liability" className="text-2xl font-bold text-white mb-4">{t("s10.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s10.body")}</p>
          </section>

          <section aria-labelledby="termination">
            <h2 id="termination" className="text-2xl font-bold text-white mb-4">{t("s11.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s11.body")}</p>
          </section>

          <section aria-labelledby="changes">
            <h2 id="changes" className="text-2xl font-bold text-white mb-4">{t("s12.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">{t("s12.body")}</p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-2xl font-bold text-white mb-4">{t("s13.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">
              {t("s13.body")}{" "}
              <a href="mailto:support@aicareerpivot.com" className="text-teal-400 hover:text-teal-300 transition-colors">
                support@aicareerpivot.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
