"use client";

import { useEffect } from "react";
import { trackPricingViewed, pageSource } from "@/lib/tracking";

// Fires `pricing_viewed` once per /pricing mount (AIC-742). A dedicated tracker
// rather than piggybacking on PricingHeroCta so page-view instrumentation does
// not break if the hero CTA is removed or A/B-swapped. Renders nothing.
export default function PricingPageTracker() {
  useEffect(() => {
    trackPricingViewed({ source: pageSource() });
  }, []);

  return null;
}
