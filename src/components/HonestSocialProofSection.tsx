"use client";

/**
 * HonestSocialProofSection (AIC-893).
 *
 * The homepage honest-proof block that replaces the removed 6-card fabricated
 * testimonials section (AIC-890). Three honest zones:
 *   1. Sample-output product demo (labeled walkthroughs)   — Tier 1
 *   2. Early-access / founding-cohort banner                — Tier 2
 *   3. CredibilityStrip (verifiable methodology/data/security) — Tier 3
 *
 * Gated by the `honest-proof` A/B flag: "control" renders nothing (the bare
 * post-removal baseline) so we can measure incremental lift. The banner CTA is
 * tagged as an experiment conversion.
 */
import CredibilityStrip from "@/components/CredibilityStrip";
import SampleOutputCards from "@/components/SampleOutputCards";
import ProductJourney from "@/components/ProductJourney";
import EarlyAccessBanner from "@/components/EarlyAccessBanner";
import { useHonestProofVariant, HONEST_PROOF_FLAG } from "@/lib/useHonestProofVariant";
import { trackCtaClicked, trackExperimentConversion } from "@/lib/tracking";

export default function HonestSocialProofSection() {
  const variant = useHonestProofVariant("home");
  if (variant === "control") return null;

  return (
    <section className="border-y border-slate-800/40 bg-slate-900/30 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-400">
            See what you get
          </p>
          <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">
            Real product output, not{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              borrowed promises
            </span>
          </h2>
          <p className="mx-auto max-w-lg text-slate-400">
            We&rsquo;re newly launched, so instead of testimonials, here&rsquo;s exactly what the
            tool produces — and the real sources behind it.
          </p>
        </div>

        {/* Tier 1 — labeled sample product walkthroughs */}
        <SampleOutputCards className="mb-12" />

        {/* How the product actually works (replaces the removed journey timeline) */}
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            How it works
          </p>
        </div>
        <ProductJourney className="mb-12" />

        {/* Tier 2 — early-access framing */}
        <EarlyAccessBanner
          className="mb-12"
          onCtaClick={() => {
            trackCtaClicked({
              cta_text: "Build my pivot plan — $19",
              cta_location: "home_early_access",
              destination: "/pricing",
            });
            trackExperimentConversion({
              flag: HONEST_PROOF_FLAG,
              variant: "honest",
              event: "cta_clicked",
              page: "home",
            });
          }}
        />

        {/* Tier 3 — verifiable credibility signals */}
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            What your plan is built on
          </p>
        </div>
        <CredibilityStrip />
      </div>
    </section>
  );
}
