"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getFeatureFlagVariant, trackExperimentViewed, trackExperimentConversion, trackCtaClicked } from "@/lib/tracking";

// Pricing → onboarding was leaking ~86% of visitors (AIC-531): the pay-wall was
// the only forward action on /pricing, so anyone not ready to buy simply bounced.
// This surfaces a prominent, zero-commitment on-ramp into the free snapshot funnel
// (/free) — the "preview before you pay" the funnel was missing. Copy is A/B
// tested via the `pricing_hero_cta` PostHog flag so we can measure lift on the
// pricing→onboarding_started conversion.
const FLAG = "pricing_hero_cta";
const DESTINATION = "/free?ref=pricing_hero";

export default function PricingHeroCta() {
  const t = useTranslations("pricing");
  const [variant, setVariant] = useState("control");

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.onFeatureFlags(() => {
        const v = getFeatureFlagVariant(FLAG, "control");
        setVariant(v);
        trackExperimentViewed({ flag: FLAG, variant: v, page: "pricing" });
      });
    });
  }, []);

  const ctaLabel = variant === "benefit" ? t("heroFreeCtaBenefit") : t("heroFreeCtaControl");

  function handleClick() {
    trackCtaClicked({ cta_text: ctaLabel, cta_location: "pricing_hero", destination: DESTINATION });
    trackExperimentConversion({ flag: FLAG, variant, event: "cta_clicked", page: "pricing" });
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <p className="text-slate-400 text-sm">{t("heroFreeCtaEyebrow")}</p>
      <Link
        href={DESTINATION}
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-base transition-colors shadow-lg shadow-teal-900/50"
      >
        {ctaLabel}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
      <p className="text-slate-500 text-xs">{t("heroFreeCtaSub")}</p>
    </div>
  );
}
