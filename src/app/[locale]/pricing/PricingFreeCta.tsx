"use client";

import Link from "next/link";
import { trackCtaClicked } from "@/lib/tracking";

// CTA for the Free Snapshot tier card on /pricing (AIC-778). The Free tier is
// the zero-commitment anchor of the three-tier ladder — it routes into the
// /free snapshot funnel rather than checkout, so there's no email/price form
// here, just a tracked on-ramp.
const DESTINATION = "/free?ref=pricing_free_tier";

export default function PricingFreeCta() {
  return (
    <Link
      href={DESTINATION}
      onClick={() =>
        trackCtaClicked({
          cta_text: "Get Free Snapshot",
          cta_location: "pricing_free_tier",
          destination: DESTINATION,
        })
      }
      className="block w-full text-center px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold transition-colors border border-slate-600"
    >
      Get Free Snapshot
    </Link>
  );
}
