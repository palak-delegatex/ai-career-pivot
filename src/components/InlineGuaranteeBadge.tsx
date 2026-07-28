import { ShieldCheck } from "lucide-react";

/**
 * InlineGuaranteeBadge (AIC-844 / design AIC-840)
 *
 * Risk-reversal micro-badge — a ShieldCheck + "30-day money-back guarantee" —
 * placed at every decision-point surface (paywall, sticky CTA, checkout,
 * roadmap gate, free-tool upgrade CTAs) where our existing 30-day guarantee
 * (GuaranteeCard) wasn't being surfaced. Peak-End Rule: the last thing the user
 * reads before deciding removes the downside of clicking.
 *
 * Variants:
 *  - `default` — teal-tinted pill, for standalone placement near a CTA.
 *  - `short`   — bare icon + text, no chrome, for tight rows (sticky bar,
 *                compact upgrade prompt) where a pill would crowd the layout.
 */
export default function InlineGuaranteeBadge({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "short";
  className?: string;
}) {
  if (variant === "short") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs text-slate-400 ${className}`}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        30-day money-back guarantee
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      30-day money-back guarantee
    </span>
  );
}
