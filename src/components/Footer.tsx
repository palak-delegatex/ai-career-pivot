import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { localePath, defaultLocale, type Locale, hasLocale } from "@/i18n/config";

export function Footer({ lang = "en" }: { lang?: string }) {
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const lp = (path: string) => localePath(path, locale);

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 text-sm">
      <div className="mx-auto max-w-6xl px-6 py-12 pb-20">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-teal-500 to-emerald-600" />
              <span className="text-white font-semibold text-base">AICareerPivot</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4 max-w-xs">
              Your AI-powered career strategist. Personalized transition roadmaps
              based on your skills, finances, and timeline.
            </p>
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} AICareerPivot
            </p>
          </div>

          {/* Product column */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">Product</h3>
            <ul className="space-y-2">
              <li><Link href={lp("/how-it-works")} className="text-slate-400 hover:text-teal-400 transition-colors">How It Works</Link></li>
              <li><Link href={lp("/pricing")} className="text-slate-400 hover:text-teal-400 transition-colors">Pricing</Link></li>
              <li><Link href={lp("/free")} className="text-slate-400 hover:text-teal-400 transition-colors">Free Assessment</Link></li>
              <li><Link href={lp("/mock-interview")} className="text-slate-400 hover:text-teal-400 transition-colors">Mock Interview</Link></li>
              <li><Link href={lp("/gap-analysis")} className="text-slate-400 hover:text-teal-400 transition-colors">Gap Analysis</Link></li>
              <li><Link href={lp("/ats-score")} className="text-slate-400 hover:text-teal-400 transition-colors">ATS Score</Link></li>
              <li><Link href={lp("/resume-generator")} className="text-slate-400 hover:text-teal-400 transition-colors">Resume Generator</Link></li>
              <li><Link href={lp("/dashboard")} className="text-slate-400 hover:text-teal-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2">
              <li><Link href={lp("/blog")} className="text-slate-400 hover:text-teal-400 transition-colors">Blog</Link></li>
              <li><Link href={lp("/faq")} className="text-slate-400 hover:text-teal-400 transition-colors">FAQ</Link></li>
              <li><Link href={lp("/about")} className="text-slate-400 hover:text-teal-400 transition-colors">About Us</Link></li>
              <li><Link href={lp("/assessment")} className="text-slate-400 hover:text-teal-400 transition-colors">Career Assessment</Link></li>
            </ul>
          </div>

          {/* Use Cases column */}
          <div>
            <h3 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">Use Cases</h3>
            <ul className="space-y-2">
              <li><Link href={lp("/free?from=career-pivot")} className="text-slate-400 hover:text-teal-400 transition-colors">Career Pivot Planning</Link></li>
              <li><Link href={lp("/free?from=salary-growth")} className="text-slate-400 hover:text-teal-400 transition-colors">Salary Growth Strategy</Link></li>
              <li><Link href={lp("/free?from=skill-gap")} className="text-slate-400 hover:text-teal-400 transition-colors">Skill Gap Analysis</Link></li>
              <li><Link href={lp("/free?from=job-search")} className="text-slate-400 hover:text-teal-400 transition-colors">AI Job Search</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
          <div className="flex items-center gap-4">
            <p>Your career, your timeline.</p>
            <LocaleSwitcher currentLocale={locale} />
          </div>
          <nav className="flex items-center gap-4" aria-label="Legal">
            <Link href={lp("/privacy")} className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href={lp("/about")} className="hover:text-slate-400 transition-colors">Terms</Link>
            <a href="mailto:hello@ai-career-pivot.com" className="hover:text-slate-400 transition-colors">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
