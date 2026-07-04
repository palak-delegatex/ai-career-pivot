import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Privacy Policy — AICareerPivot",
  description:
    "AICareerPivot privacy policy. Learn what data we collect, how we use it, and your choices regarding the Chrome extension and web application.",
  alternates: alternatesFor("/privacy", locale),
  openGraph: {
    locale: ogLocaleFor(locale),
    title: "Privacy Policy — AICareerPivot",
    description:
      "AICareerPivot privacy policy. Learn what data we collect, how we use it, and your choices.",
    url: localizedPath("/privacy", locale),
  },
};
}

export default function PrivacyPage() {
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
          <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">About</Link>
          <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">FAQ</Link>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400">Last updated: June 2026</p>
        </header>

        <div className="prose-custom space-y-10">
          <p className="text-slate-300 leading-relaxed">
            AICareerPivot (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the
            AICareerPivot Chrome extension and the web application at
            ai-career-pivot.vercel.app. This privacy policy explains what data the
            extension collects, how it is used, and your choices.
          </p>

          <section aria-labelledby="what-we-collect">
            <h2 id="what-we-collect" className="text-2xl font-bold text-white mb-4">1. What We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-1">Account information</h3>
                <p className="text-slate-400 leading-relaxed">
                  When you sign in with Google, we receive your name, email address, and
                  profile picture from Google OAuth. We use this solely to authenticate you
                  and display your identity in the extension.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Job listing data</h3>
                <p className="text-slate-400 leading-relaxed">
                  When you save a job, the extension extracts the job title, company name,
                  location, salary (if shown), source URL, and the job description text from
                  the page you are viewing. This data is sent to our servers so we can
                  calculate your ATS match score and sync your saved jobs across devices.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Resume content</h3>
                <p className="text-slate-400 leading-relaxed">
                  If you upload or paste a resume, we store it securely so the extension can
                  calculate keyword match scores against job descriptions. Resume data is
                  never shared with employers or third parties.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Application form data</h3>
                <p className="text-slate-400 leading-relaxed">
                  The autofill feature reads form field labels on application pages to
                  determine where to insert your information (name, email, phone, work
                  history, education). Form content is processed locally in your browser;
                  only AI-generated answers to open-ended questions are sent to our servers
                  for generation and returned to you.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Usage analytics</h3>
                <p className="text-slate-400 leading-relaxed">
                  We collect anonymous, aggregated usage events (e.g., &ldquo;job
                  saved&rdquo;, &ldquo;autofill used&rdquo;) through PostHog to improve the
                  product. These events do not contain job descriptions, resume text, or
                  personal information.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="how-we-use">
            <h2 id="how-we-use" className="text-2xl font-bold text-white mb-4">2. How We Use Your Data</h2>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Deliver the service:</strong> calculate ATS scores, sync saved jobs, autofill applications, and provide dashboard analytics.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Improve the product:</strong> analyze aggregated usage patterns to prioritize features and fix bugs.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Communicate with you:</strong> send onboarding emails and product updates. You can unsubscribe at any time.</span>
              </li>
            </ul>
            <p className="text-slate-300 mt-4 leading-relaxed">
              We do <strong>not</strong> sell, rent, or share your personal data with
              advertisers or data brokers.
            </p>
          </section>

          <section aria-labelledby="where-data-lives">
            <h2 id="where-data-lives" className="text-2xl font-bold text-white mb-4">3. Where Your Data Lives</h2>
            <p className="text-slate-400 leading-relaxed">
              Your data is stored in Supabase (hosted on AWS in the United States) and
              served through Vercel. All data is transmitted over HTTPS.
            </p>
          </section>

          <section aria-labelledby="data-retention">
            <h2 id="data-retention" className="text-2xl font-bold text-white mb-4">4. Data Retention</h2>
            <p className="text-slate-400 leading-relaxed">
              Your account data and saved jobs are retained as long as your account is
              active. If you delete your account, we delete all associated data within 30
              days.
            </p>
          </section>

          <section aria-labelledby="third-party">
            <h2 id="third-party" className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="text-left px-4 py-3 text-slate-300 font-semibold">Service</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 text-slate-300 font-semibold">Data shared</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">Google OAuth (via Supabase Auth)</td>
                    <td className="px-4 py-3">Authentication</td>
                    <td className="px-4 py-3">Email, name, profile picture</td>
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">Supabase</td>
                    <td className="px-4 py-3">Database and auth</td>
                    <td className="px-4 py-3">All account and job data</td>
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">Vercel</td>
                    <td className="px-4 py-3">Hosting and API</td>
                    <td className="px-4 py-3">Requests routed through Vercel servers</td>
                  </tr>
                  <tr className="border-b border-slate-800/60">
                    <td className="px-4 py-3">PostHog</td>
                    <td className="px-4 py-3">Product analytics</td>
                    <td className="px-4 py-3">Anonymous usage events (no PII)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Anthropic (Claude)</td>
                    <td className="px-4 py-3">AI text generation</td>
                    <td className="px-4 py-3">Job description + partial profile context for generating application answers</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="your-choices">
            <h2 id="your-choices" className="text-2xl font-bold text-white mb-4">6. Your Choices</h2>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Delete saved jobs</strong> from your dashboard at any time.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Disable autofill</strong> on specific sites using the &ldquo;Never on this site&rdquo; option in the autofill banner.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Uninstall the extension</strong> to stop all data collection immediately.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-400 mt-0.5">→</span>
                <span><strong className="text-slate-300">Delete your account</strong> by visiting your account settings page, which removes all stored data.</span>
              </li>
            </ul>
          </section>

          <section aria-labelledby="childrens-privacy">
            <h2 id="childrens-privacy" className="text-2xl font-bold text-white mb-4">7. Children&apos;s Privacy</h2>
            <p className="text-slate-400 leading-relaxed">
              AICareerPivot is not directed at anyone under 16. We do not knowingly collect
              data from children.
            </p>
          </section>

          <section aria-labelledby="changes">
            <h2 id="changes" className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-slate-400 leading-relaxed">
              We may update this policy from time to time. Material changes will be
              communicated via the extension or email. The &ldquo;Last updated&rdquo; date
              at the top reflects the most recent revision.
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-2xl font-bold text-white mb-4">9. Contact</h2>
            <p className="text-slate-400 leading-relaxed">
              Questions about this policy? Email us at{" "}
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
