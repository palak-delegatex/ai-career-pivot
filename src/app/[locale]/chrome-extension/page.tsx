import type { Metadata } from "next";
import { alternatesFor, localizedPath, ogLocaleFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import StickyCtaBar from "@/components/StickyCtaBar";
import { breadcrumbSchema } from "@/lib/schema";
import { CHROME_STORE_URL, EXTENSION_PUBLISHED } from "@/lib/extension";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "Chrome Extension — Save Jobs & Get ATS Scores | AICareerPivot",
    description:
      "The free AICareerPivot Chrome extension saves jobs from LinkedIn, Indeed, Glassdoor and 8 ATS platforms, shows instant ATS match scores, autofills applications, and syncs everything to your dashboard.",
    alternates: alternatesFor("/chrome-extension", locale),
    openGraph: {
      locale: ogLocaleFor(locale),
      title: "AICareerPivot Chrome Extension — Save Jobs & Get ATS Scores",
      description:
        "Save any job in one click, see your ATS match score before you apply, and autofill applications — free, on the job boards you already use.",
      url: localizedPath("/chrome-extension", locale),
    },
  };
}

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AICareerPivot — Job Saver & ATS Score",
  applicationCategory: "BrowserApplication",
  operatingSystem: "Chrome",
  description:
    "Save jobs from LinkedIn, Indeed, Glassdoor and 8 ATS platforms, get instant ATS match scores, and autofill applications. Everything syncs to your AICareerPivot dashboard.",
  url: "https://ai-career-pivot.com/chrome-extension",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const features = [
  {
    tag: "Capture",
    title: "Save any job in one click",
    description:
      "LinkedIn, Indeed, Glassdoor, ZipRecruiter, Greenhouse, Lever, Workday, Ashby, iCIMS, Taleo, Oracle — the Save button lives right on the listing. No more 40 open tabs and a messy spreadsheet.",
    image: "/images/extension/injected-ui.png",
    alt: "AICareerPivot Save and Score buttons injected into a job listing",
  },
  {
    tag: "Analyze",
    title: "See your ATS match score before you apply",
    description:
      "Every listing gets an instant ATS match score against your profile, with the exact keywords you're missing — so you tailor your resume where it actually counts instead of guessing.",
    image: "/images/extension/ats-score.png",
    alt: "ATS match score with missing keywords shown on a job posting",
  },
  {
    tag: "Apply",
    title: "Autofill applications in seconds",
    description:
      "Fill Greenhouse, Lever, Workday, Ashby and more from your saved profile. Spend seconds per application, not minutes — and keep more energy for the jobs that matter.",
    image: "/images/extension/autofill.png",
    alt: "Application form autofilled by the AICareerPivot extension",
  },
  {
    tag: "Sync",
    title: "Everything flows into your dashboard",
    description:
      "Saved jobs and scores sync straight to your signed-in AICareerPivot account and appear in your web job tracker. One organized pipeline across every device.",
    image: "/images/extension/dashboard.png",
    alt: "Saved jobs and scores synced into the AICareerPivot web dashboard",
  },
];

const steps = [
  {
    number: "01",
    title: "Install & sign in with Google",
    description:
      "Add the extension and sign in with Google. No password is ever handled by the extension — your captures land in your account instantly.",
  },
  {
    number: "02",
    title: "Browse job boards like you already do",
    description:
      "The Save and Score buttons appear right on LinkedIn, Indeed, Glassdoor and every supported ATS platform. Click to capture and score any listing.",
  },
  {
    number: "03",
    title: "Track and apply from your dashboard",
    description:
      "Everything syncs to your AICareerPivot job tracker. Tailor your resume to the keywords you're missing, autofill the application, and move on.",
  },
];

function InstallCta({
  location,
  className,
}: {
  location: string;
  className: string;
}) {
  return EXTENSION_PUBLISHED ? (
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-cta-location={location}
      className={className}
    >
      Add to Chrome — It&apos;s Free
    </a>
  ) : (
    <Link href="/free" data-cta-location={location} className={className}>
      Try It Free in the Web App →
    </Link>
  );
}

export default function ChromeExtensionPage() {
  const crumbs = breadcrumbSchema([
    { name: "Chrome Extension", path: "/chrome-extension" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([appSchema, crumbs]) }}
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
            <Link href="/how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">How It Works</Link>
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Pricing</Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 text-white"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 grid md:grid-cols-2 gap-12 items-center">
          <header>
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">
              Chrome Extension
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
              Save jobs and score your resume without leaving the job board
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              The free AICareerPivot extension lives on LinkedIn, Indeed, Glassdoor
              and 8 ATS platforms. Save any listing in one click, see your ATS match
              score before you apply, and autofill applications — with everything
              syncing to your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <InstallCta
                location="extension_hero"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
              />
              {!EXTENSION_PUBLISHED && (
                <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Coming soon to the Chrome Web Store
                </span>
              )}
            </div>
          </header>
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-teal-950/40">
            <Image
              src="/images/extension/injected-ui.png"
              alt="AICareerPivot extension showing Save and ATS Score buttons on a job listing"
              width={1280}
              height={800}
              priority
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </section>

        <main className="max-w-5xl mx-auto px-6 pb-20">
          {/* Supported platforms strip */}
          <section className="mb-24 bg-slate-900/60 border border-slate-800 rounded-2xl p-8" aria-labelledby="platforms-heading">
            <h2 id="platforms-heading" className="text-sm font-semibold text-teal-400 uppercase tracking-widest mb-4 text-center">
              Works where you already job hunt
            </h2>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-slate-300 text-sm font-medium">
              {[
                "LinkedIn",
                "Indeed",
                "Glassdoor",
                "ZipRecruiter",
                "Greenhouse",
                "Lever",
                "Workday",
                "Ashby",
                "iCIMS",
                "Taleo",
                "Oracle Cloud",
              ].map((p) => (
                <span key={p} className="flex items-center gap-2">
                  <span className="text-teal-400">•</span>
                  {p}
                </span>
              ))}
            </div>
          </section>

          {/* Feature breakdown */}
          <section className="mb-24 space-y-20" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Features</h2>
            {features.map((feature, i) => (
              <article
                key={feature.title}
                className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div>
                  <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-3">
                    {feature.tag}
                  </p>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/40">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    width={1280}
                    height={800}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </article>
            ))}
          </section>

          {/* How it works */}
          <section className="mb-24" aria-labelledby="how-heading">
            <h2 id="how-heading" className="text-2xl font-bold text-white mb-8 text-center">
              One click, from listing to application
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {steps.map((step) => (
                <Card key={step.number} className="bg-slate-900/60 border-slate-800 text-white rounded-xl py-0">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-4">
                      <span className="text-white font-bold">{step.number}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Pricing tie-in */}
          <section className="mb-24" aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="text-2xl font-bold text-white mb-3 text-center">
              The extension is free. Forever.
            </h2>
            <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
              Save unlimited jobs, score your match, and autofill applications at no
              cost. When you&apos;re ready for a full transition strategy, unlock it in
              the web app.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 border-slate-800 text-white rounded-2xl py-0">
                <CardContent className="p-8">
                  <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-2">Free</p>
                  <h3 className="text-xl font-bold text-white mb-5">The Chrome extension</h3>
                  <ul className="space-y-3 text-sm text-slate-400">
                    {[
                      "Save unlimited jobs from every supported platform",
                      "Instant ATS match scores with missing keywords",
                      "Autofill applications from your saved profile",
                      "Sync to your web job tracker",
                      "LinkedIn profile optimizer",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="text-teal-400 mt-0.5 flex-shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-teal-950/60 to-slate-900/60 border-teal-500/20 text-white rounded-2xl py-0">
                <CardContent className="p-8">
                  <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-2">From $19</p>
                  <h3 className="text-xl font-bold text-white mb-5">The full career pivot roadmap</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    {[
                      "Personalized 6-month, 1-year & 2-year transition plan",
                      "Skills gap analysis and prioritized learning path",
                      "Financial viability & income continuity strategy",
                      "Lifetime access with unlimited updates for $149",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="text-teal-400 mt-0.5 flex-shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/pricing"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-all duration-200 text-white"
                  >
                    See plans →
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center bg-gradient-to-br from-teal-950/60 to-slate-900/60 rounded-3xl p-10 border border-teal-500/20">
            <h2 className="text-2xl font-bold text-white mb-3">Apply smarter, not harder</h2>
            <p className="text-slate-400 mb-8">
              {EXTENSION_PUBLISHED
                ? "Add AICareerPivot to Chrome and turn every job board into one click."
                : "The extension is landing on the Chrome Web Store soon. Start free in the web app today."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <InstallCta
                location="extension_footer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 text-white"
              />
              <Link href="/how-it-works" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                See how it works →
              </Link>
            </div>
          </section>
        </main>

        <StickyCtaBar />
      </div>
    </>
  );
}
