"use client";

/**
 * useHonestProofVariant (AIC-893 — CEO instrumentation condition).
 *
 * The honest-proof rebuild ships behind an A/B flag so we can measure the
 * incremental conversion lift of honest social proof vs. the current bare
 * control (the state AIC-890 left the surfaces in). PostHog feature flag
 * `honest-proof` returns:
 *   - "honest"  → render the rebuilt Tier 1-3 proof surfaces
 *   - "control" → render bare (no proof), i.e. the post-removal baseline
 *
 * Emits `experiment_viewed` once the flag resolves so exposure is attributable.
 * Conversion is measured off the existing funnel events (cta_clicked /
 * locked_report_unlock_click) tagged via trackExperimentConversion.
 *
 * Reads the flag inside PostHog's `onFeatureFlags` subscription (matching
 * PricingHeroCta) so we only assign once flags have actually loaded — before
 * that we default to "honest" so the proof renders rather than flashing bare.
 */
import { useEffect, useState } from "react";
import { getFeatureFlagVariant, trackExperimentViewed } from "@/lib/tracking";

export const HONEST_PROOF_FLAG = "honest-proof";

export type HonestProofVariant = "honest" | "control";

export function useHonestProofVariant(page: string): HonestProofVariant {
  // Default to "honest" so the proof renders for visitors who load before the
  // flag resolves (and if PostHog is unavailable). The split only takes effect
  // once the flag loads and explicitly assigns "control".
  const [variant, setVariant] = useState<HonestProofVariant>("honest");

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.onFeatureFlags(() => {
        const raw = getFeatureFlagVariant(HONEST_PROOF_FLAG, "honest");
        const resolved: HonestProofVariant = raw === "control" ? "control" : "honest";
        setVariant(resolved);
        trackExperimentViewed({ flag: HONEST_PROOF_FLAG, variant: resolved, page });
      });
    });
  }, [page]);

  return variant;
}
