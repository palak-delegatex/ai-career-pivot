import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const l = useTranslations("footer.links");

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 text-sm">
      <div className="mx-auto max-w-6xl px-6 py-12 pb-20">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-teal-500 to-emerald-600" />
              <span className="text-white font-semibold text-base">{tc("brand")}</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4 max-w-xs">
              {t("description")}
            </p>
            <p className="text-slate-600 text-xs">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
          </div>

          {/* Product column */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">{t("productHeading")}</h3>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className="text-slate-400 hover:text-teal-400 transition-colors">{l("howItWorks")}</Link></li>
              <li><Link href="/pricing" className="text-slate-400 hover:text-teal-400 transition-colors">{l("pricing")}</Link></li>
              <li><Link href="/free" className="text-slate-400 hover:text-teal-400 transition-colors">{l("freeAssessment")}</Link></li>
              <li><Link href="/mock-interview" className="text-slate-400 hover:text-teal-400 transition-colors">{l("mockInterview")}</Link></li>
              <li><Link href="/gap-analysis" className="text-slate-400 hover:text-teal-400 transition-colors">{l("gapAnalysis")}</Link></li>
              <li><Link href="/ats-score" className="text-slate-400 hover:text-teal-400 transition-colors">{l("atsScore")}</Link></li>
              <li><Link href="/resume-generator" className="text-slate-400 hover:text-teal-400 transition-colors">{l("resumeGenerator")}</Link></li>
              <li><Link href="/dashboard" className="text-slate-400 hover:text-teal-400 transition-colors">{l("dashboard")}</Link></li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">{t("resourcesHeading")}</h3>
            <ul className="space-y-2">
              <li><Link href="/blog" className="text-slate-400 hover:text-teal-400 transition-colors">{l("blog")}</Link></li>
              <li><Link href="/faq" className="text-slate-400 hover:text-teal-400 transition-colors">{l("faq")}</Link></li>
              <li><Link href="/about" className="text-slate-400 hover:text-teal-400 transition-colors">{l("aboutUs")}</Link></li>
              <li><Link href="/assessment" className="text-slate-400 hover:text-teal-400 transition-colors">{l("careerAssessment")}</Link></li>
            </ul>
          </div>

          {/* Use Cases column */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">{t("useCasesHeading")}</h3>
            <ul className="space-y-2">
              <li><Link href="/free?from=career-pivot" className="text-slate-400 hover:text-teal-400 transition-colors">{l("careerPivotPlanning")}</Link></li>
              <li><Link href="/free?from=salary-growth" className="text-slate-400 hover:text-teal-400 transition-colors">{l("salaryGrowthStrategy")}</Link></li>
              <li><Link href="/free?from=skill-gap" className="text-slate-400 hover:text-teal-400 transition-colors">{l("skillGapAnalysis")}</Link></li>
              <li><Link href="/free?from=job-search" className="text-slate-400 hover:text-teal-400 transition-colors">{l("aiJobSearch")}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
          <p>{tc("tagline")}</p>
          <nav className="flex items-center gap-4" aria-label="Legal">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">{l("privacy")}</Link>
            <Link href="/about" className="hover:text-slate-400 transition-colors">{l("terms")}</Link>
            <a href="mailto:hello@ai-career-pivot.com" className="hover:text-slate-400 transition-colors">{l("contact")}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
