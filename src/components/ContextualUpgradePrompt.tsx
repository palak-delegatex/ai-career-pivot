"use client";

import { type ReactNode, type ComponentType } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import InlineGuaranteeBadge from "@/components/InlineGuaranteeBadge";
import { PROOF_METRICS } from "@/lib/proof-metrics";

/**
 * ContextualUpgradePrompt (AIC-618 D2 / AIC-824 gate-the-reveal)
 *
 * Placed inline WHERE the gated content would appear, showing a blurred preview
 * of the real data type underneath a lock overlay + inline CTA. Loss aversion:
 * users see the value exists but cannot read it, so the upgrade closes a
 * concrete, visible gap. The blurred preview is `aria-hidden` + `inert` so it is
 * fully removed from the accessibility tree and tab order — the readable content
 * is the overlay copy, not the illegible backdrop.
 *
 * Extracted from free-results (AIC-827) so /ats-score can reuse the same gate.
 *
 * Variants:
 *  - `default`  — centered icon + title + hook + proof nudge + full CTA.
 *  - `compact`  — single row `[count badge] [hook] [CTA]`, 44px min-height,
 *                 slightly more opaque backdrop. Used for the tighter, stacked
 *                 section gates on /ats-score.
 */
export interface ContextualUpgradePromptProps {
  title: string;
  hook: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  /** Opens the free-vs-paid comparison sheet (AIC-777) instead of leaving for /pricing. */
  onUnlock: () => void;
  variant?: "default" | "compact";
  /** compact only — shown as a Badge (e.g. `12`). */
  count?: number;
  /** compact only — label after the count (e.g. "missing keywords"). */
  countLabel?: string;
}

export default function ContextualUpgradePrompt({
  title,
  hook,
  icon: Icon,
  children,
  onUnlock,
  variant = "default",
  count,
  countLabel,
}: ContextualUpgradePromptProps) {
  if (variant === "compact") {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
        <div className="blur-[5px] select-none pointer-events-none" aria-hidden="true" inert>
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 bg-slate-900/70 backdrop-blur-[2px] text-center">
          <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3 sm:text-left">
            {typeof count === "number" && (
              <Badge variant="secondary" className="shrink-0">
                {count}
                {countLabel ? ` ${countLabel}` : ""}
              </Badge>
            )}
            <p className="flex-1 text-xs text-slate-300 leading-snug">{hook}</p>
            <button
              type="button"
              onClick={onUnlock}
              className="w-full sm:w-auto min-h-[44px] shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors shadow-lg shadow-teal-900/30"
            >
              Unlock — $19
            </button>
          </div>
          <InlineGuaranteeBadge variant="short" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
      <div className="blur-[5px] select-none pointer-events-none" aria-hidden="true" inert>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-slate-900/60 backdrop-blur-[1px] gap-1.5">
        {Icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-600/20 border border-teal-600/40">
            <Icon className="w-4 h-4 text-teal-300" />
          </div>
        )}
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-300 max-w-xs">{hook}</p>
        <div className="mt-2">
          <p className="text-xs font-medium text-teal-300/90">
            Free AI snapshot in {PROOF_METRICS.freeSpeed} · {PROOF_METRICS.noSignup} to start
          </p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors shadow-lg shadow-teal-900/30"
        >
          <Lock className="w-3.5 h-3.5" />
          Get Full Report — $19
        </button>
        <p className="text-xs text-slate-400 mt-1">
          Includes everything · full roadmap, milestones &amp; salary model
        </p>
        <InlineGuaranteeBadge variant="short" className="mt-1" />
      </div>
    </div>
  );
}
