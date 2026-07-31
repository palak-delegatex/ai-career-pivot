"use client";

// Pricing-cadence A/B experiment (AIC-884 item 3).
// Flag: "pricing-cadence" → "control" (one-time $19) | "annual_anchored" (annual/monthly ladder).
// Uses inline price_data at checkout — no Stripe dashboard objects needed.

import { useEffect, useState } from "react";
import { getFeatureFlagVariant, trackExperimentViewed } from "@/lib/tracking";
import PricingCheckout from "./PricingCheckout";

const FLAG = "pricing-cadence";

export default function PricingCadenceExperiment() {
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const v = getFeatureFlagVariant(FLAG, "control");
    setVariant(v);
    trackExperimentViewed({ flag: FLAG, variant: v, page: "pricing" });
  }, []);

  if (variant === null) return null;

  if (variant === "annual_anchored") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-teal-950/30 border-2 border-teal-600/60 p-5 relative">
          <div className="absolute -top-3 left-4">
            <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </span>
          </div>
          <div className="mb-1">
            <span className="text-3xl font-extrabold text-white">$79</span>
            <span className="text-slate-400 text-sm ml-1">/ year</span>
          </div>
          <p className="text-teal-300 text-xs font-semibold mb-3">
            Just $6.58/mo — save 34% vs monthly
          </p>
          <PricingCheckout plan="report_annual" ctaLocation="pricing_cadence_annual" />
        </div>
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
          <div className="mb-1">
            <span className="text-2xl font-bold text-white">$9.99</span>
            <span className="text-slate-400 text-sm ml-1">/ month</span>
          </div>
          <p className="text-slate-400 text-xs mb-3">Billed monthly — cancel any time</p>
          <PricingCheckout plan="report_monthly" ctaLocation="pricing_cadence_monthly" />
        </div>
      </div>
    );
  }

  // Control: existing one-time report checkout
  return <PricingCheckout plan="report" ctaLocation="pricing_page" />;
}
