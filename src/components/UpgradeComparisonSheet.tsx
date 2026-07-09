"use client";

import Link from "next/link";
import { Check, X, Sparkles, ArrowRight, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import CheckoutTrustBlock from "@/components/CheckoutTrustBlock";
import GuaranteeCard from "@/components/GuaranteeCard";
import { PROOF_METRICS } from "@/lib/proof-metrics";
import { trackUpgradeSheetCtaClicked } from "@/lib/tracking";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";

/**
 * UpgradeComparisonSheet (AIC-618 D3 / AIC-777)
 *
 * Right-side drawer with a PERSONALIZED free-vs-paid comparison table + trust
 * badges, opened from the /free-results contextual upgrade prompts and the main
 * upsell CTA. Rather than send the user to /pricing (losing the personalized
 * context of the snapshot they're looking at), it lays the two tiers side by
 * side and injects the user's own numbers — target role, matched-path count,
 * salary uplift — into the rows so the gap is concrete and specific.
 *
 * Controlled: the parent owns `open`/`onOpenChange` and passes the `source` that
 * opened it (used for funnel attribution). The "free" column reflects what is
 * already on screen; the "paid" column is the gated Full Report ($19).
 */

type Cell = boolean | string;

interface Row {
  feature: string;
  free: Cell;
  paid: Cell;
}

function buildRows(snapshot: FreeSnapshot): Row[] {
  const pathCount = snapshot.paths.length;
  const uplift = snapshot.estimatedSalaryUplift ?? 15;
  const role = snapshot.paths[0]?.targetRole ?? "your target role";

  return [
    {
      feature: "Best-fit career matches",
      free: "Top 1 path",
      paid: pathCount > 1 ? `All ${pathCount} paths, ranked` : "Every matched path, ranked",
    },
    {
      feature: "Skill-gap analysis",
      free: "Top 3 gaps",
      paid: "Full gap map + how to close each",
    },
    {
      feature: "Milestone roadmap",
      free: false,
      paid: "6 / 12 / 24-month plan",
    },
    {
      feature: "AI certifications roadmap",
      free: false,
      paid: `Tailored to ${role}`,
    },
    {
      feature: "Salary trajectory & bridge plan",
      free: false,
      paid: `+$${uplift}K modeled, ROI breakeven`,
    },
    {
      feature: "Week-by-week action plan + AI coaching",
      free: false,
      paid: true,
    },
    {
      feature: `Live job matches for ${role}`,
      free: "Count only",
      paid: "Personalized match scores",
    },
    {
      feature: "Permanent access & updates",
      free: false,
      paid: true,
    },
  ];
}

function CellValue({ value, accent }: { value: Cell; accent?: boolean }) {
  if (value === true) {
    return (
      <Check
        className={accent ? "w-4 h-4 text-teal-400" : "w-4 h-4 text-slate-500"}
        aria-label="Included"
      />
    );
  }
  if (value === false) {
    return <X className="w-4 h-4 text-slate-600" aria-label="Not included" />;
  }
  return (
    <span
      className={
        accent
          ? "text-[11px] font-semibold leading-tight text-teal-200"
          : "text-[11px] leading-tight text-slate-400"
      }
    >
      {value}
    </span>
  );
}

export default function UpgradeComparisonSheet({
  open,
  onOpenChange,
  snapshot,
  source,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: FreeSnapshot;
  /** Which surface opened the sheet — used for funnel attribution. */
  source: string;
}) {
  const rows = buildRows(snapshot);
  const targetRole = snapshot.paths[0]?.targetRole;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-slate-950 text-slate-100 border-slate-800"
      >
        <SheetHeader className="px-5 pt-5 pb-0">
          <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-300 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            Free vs. Full Report
          </div>
          <SheetTitle className="text-lg font-bold text-white">
            See everything your Full Report unlocks
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-400">
            {targetRole
              ? `Built around your ${targetRole} match — here's exactly what you get beyond the free snapshot.`
              : "Here's exactly what you get beyond the free snapshot."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-5">
          {/* Comparison table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-end px-4 py-3 bg-slate-900/60 border-b border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                What you get
              </span>
              <span className="w-16 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Free
              </span>
              <span className="w-24 text-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-300">
                  <Star className="w-3 h-3 fill-teal-400 text-teal-400" />
                  $19
                </span>
              </span>
            </div>

            {rows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1fr_auto_auto] gap-x-3 items-center px-4 py-3 ${
                  i % 2 === 0 ? "bg-slate-900/20" : "bg-transparent"
                }`}
              >
                <span className="text-xs text-slate-200 pr-1 leading-snug">
                  {row.feature}
                </span>
                <span className="w-16 flex justify-center text-center">
                  <CellValue value={row.free} />
                </span>
                <span className="w-24 flex justify-center text-center rounded-md bg-teal-950/30">
                  <span className="py-1.5 px-1 flex items-center justify-center">
                    <CellValue value={row.paid} accent />
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Social-proof metric strip (single source of truth) */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { value: PROOF_METRICS.pivotsDelivered, label: "Pivots delivered" },
              { value: PROOF_METRICS.avgRating + "★", label: "Avg rating" },
              { value: PROOF_METRICS.salaryUplift, label: "Avg uplift" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-slate-900/50 border border-slate-800 px-2 py-2.5 text-center"
              >
                <p className="text-sm font-bold text-white">{m.value}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          {/* Primary CTA — deep-links to the Report checkout on /pricing rather
              than the top of the page (AIC-785). The user has already made the
              free-vs-paid comparison + plan choice here, so #get-report drops them
              straight onto the $19 checkout form instead of re-deciding across
              three tiers (removes a redundant decision step for the highest-intent
              segment). Measured via the upgrade_sheet_opened → pricing_viewed →
              checkout_started legs of the canonical funnel (dashboard 1809774). */}
          <Link
            href="/pricing#get-report"
            onClick={() =>
              trackUpgradeSheetCtaClicked({
                source,
                plan: "report",
                target_role: targetRole,
              })
            }
            className="mt-4 flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-white transition-colors shadow-lg shadow-teal-900/30"
          >
            Get Full Report — $19
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-slate-500 text-xs mt-2">
            One-time payment · Instant access · 30-day money-back guarantee
          </p>

          {/* Trust badges (AIC-753 components) */}
          <CheckoutTrustBlock
            items={[
              { icon: "shield", text: "30-day money-back guarantee — no questions asked" },
              { icon: "lock", text: "Secure checkout via Stripe" },
              {
                icon: "users",
                text: (
                  <>
                    Joined by <strong className="text-slate-300">{PROOF_METRICS.pivotsDelivered}</strong> career pivoters
                  </>
                ),
              },
            ]}
          />

          <div className="[&>div]:my-4 [&>div]:mx-0">
            <GuaranteeCard
              title="Try it risk-free"
              body="If your Full Report doesn't give you a clearer, more actionable path than the free snapshot, email us within 30 days for a full refund."
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
