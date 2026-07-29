import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { Link } from "@/i18n/navigation";

/**
 * AIC-867 compliance kill.
 *
 * This page previously rendered unmeasured outcomes as fact (72% success rate,
 * +38% avg salary, "n=2,847 completed transitions", invented named
 * testimonials) — the same FTC + Google structured-data exposure as AIC-862.
 * The fabricated data/components (success-stories.ts, testimonials.ts,
 * CareerTransitionStats, etc.) are intentionally NOT rendered here anymore.
 *
 * This is a neutral retirement notice, not an honest-copy rebuild — that work
 * (rebuild vs. retire using the AIC-860 honest signals) stays with CMO on the
 * parent AIC-866. The route is also noindex,nofollow (see page.tsx) and removed
 * from the sitemap, so it is not served or crawled as a fact-bearing page.
 */
export default function SuccessStoriesClient() {
  return (
    <div>
      <div className="mesh-bg" />
      <SiteNav />

      <main
        id="main-content"
        className="relative z-10 flex min-h-[60vh] items-center justify-center px-6 py-24"
      >
        <div className="max-w-xl text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
            This page is being updated
          </h1>
          <p className="mb-8 text-lg text-slate-400">
            We&rsquo;re rebuilding this page so every claim reflects verified,
            measured data. It will return once we can back it up honestly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
