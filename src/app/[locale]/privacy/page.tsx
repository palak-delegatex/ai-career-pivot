import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: {
      canonical: "https://ai-career-pivot.com/privacy",
    },
    openGraph: {
      title: t("page.metaOgTitle"),
      description: t("page.metaOgDescription"),
      url: "https://ai-career-pivot.com/privacy",
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  return (
    <div className="min-h-screen bg-slate-950 text-white">
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
          <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("nav.about")}</Link>
          <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">{t("nav.faq")}</Link>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
          >
            {t("nav.getStarted")}
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
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

          <section aria-labelledby="what-we-collect">
            <h2 id="what-we-collect" className="text-2xl font-bold text-white mb-4">{t("s1.heading")}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-1">{t("s1.account.title")}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {t("s1.account.body")}
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{t("s1.jobData.title")}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {t("s1.jobData.body")}
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{t("s1.resume.title")}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {t("s1.resume.body")}
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{t("s1.autofill.title")}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {t("s1.autofill.body")}
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">{t("s1.analytics.title")}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {t("s1.analytics.body")}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="how-we-use">
            <h2 id="how-we-use" className="text-2xl font-bold text-white mb-4">{t("s2.heading")}</h2>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s2.item1")}</strong> {t("s2.item1.body")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s2.item2")}</strong> {t("s2.item2.body")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s2.item3")}</strong> {t("s2.item3.body")}</span>
              </li>
            </ul>
            <p className="text-slate-300 mt-4 leading-relaxed">
              {t("s2.noSell")}
            </p>
          </section>

          <section aria-labelledby="where-data-lives">
            <h2 id="where-data-lives" className="text-2xl font-bold text-white mb-4">{t("s3.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">
              {t("s3.body")}
            </p>
          </section>

          <section aria-labelledby="data-retention">
            <h2 id="data-retention" className="text-2xl font-bold text-white mb-4">{t("s4.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">
              {t("s4.body")}
            </p>
          </section>

          <section aria-labelledby="third-party">
            <h2 id="third-party" className="text-2xl font-bold text-white mb-4">{t("s5.heading")}</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="text-left px-4 py-3 text-slate-300 font-semibold">{t("s5.col.service")}</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-semibold">{t("s5.col.purpose")}</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-semibold">{t("s5.col.dataShared")}</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">Google OAuth (via Supabase Auth)</td>
                    <td className="px-4 py-3">{t("s5.row1.purpose")}</td>
                    <td className="px-4 py-3">{t("s5.row1.data")}</td>
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">Supabase</td>
                    <td className="px-4 py-3">{t("s5.row2.purpose")}</td>
                    <td className="px-4 py-3">{t("s5.row2.data")}</td>
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">Vercel</td>
                    <td className="px-4 py-3">{t("s5.row3.purpose")}</td>
                    <td className="px-4 py-3">{t("s5.row3.data")}</td>
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">PostHog</td>
                    <td className="px-4 py-3">{t("s5.row4.purpose")}</td>
                    <td className="px-4 py-3">{t("s5.row4.data")}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Anthropic (Claude)</td>
                    <td className="px-4 py-3">{t("s5.row5.purpose")}</td>
                    <td className="px-4 py-3">{t("s5.row5.data")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="your-choices">
            <h2 id="your-choices" className="text-2xl font-bold text-white mb-4">{t("s6.heading")}</h2>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s6.choice1")}</strong> {t("s6.choice1.body")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s6.choice2")}</strong> {t("s6.choice2.body")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s6.choice3")}</strong> {t("s6.choice3.body")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">{t("s6.choice4")}</strong> {t("s6.choice4.body")}</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="childrens-privacy">
            <h2 id="childrens-privacy" className="text-2xl font-bold text-white mb-4">{t("s7.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">
              {t("s7.body")}
            </p>
          </section>

          <section aria-labelledby="changes">
            <h2 id="changes" className="text-2xl font-bold text-white mb-4">{t("s8.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">
              {t("s8.body")}
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-2xl font-bold text-white mb-4">{t("s9.heading")}</h2>
            <p className="text-slate-400 leading-relaxed">
              {t("s9.body")}{" "}
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
