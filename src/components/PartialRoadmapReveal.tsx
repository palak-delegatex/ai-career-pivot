"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PROOF_METRICS } from "@/lib/proof-metrics";

/**
 * PartialRoadmapReveal (AIC-824 gate-the-reveal)
 *
 * "Diagnosis free, prescription paid." The first milestone renders fully legible
 * (the user gets one real, personalized step). Every milestone after it fades
 * behind progressively heavier blur — shapes, then silhouettes — so the plan is
 * visibly there but unreadable. Blurred cards are `aria-hidden` + `inert`, so
 * screen readers and keyboard users never land on illegible content; the
 * accessible content is the visible first card + the unlock CTA.
 *
 * Replaces the separate GhostPathCards + GhostMilestoneTimeline gates on
 * /free-results with a single, honest reveal (AIC-827).
 */
export interface PartialRoadmapRevealProps {
  milestones: Array<{ title: string; timeline: string; actions: string[] }>;
  /** How many leading milestones render fully legible. Default 1. */
  visibleCount?: number;
  totalCount: number;
  onUnlock: () => void;
}

/** Opacity ramp per the design spec (index 0 → 3+). */
function opacityFor(idx: number): number {
  if (idx === 0) return 1;
  if (idx === 1) return 0.8;
  if (idx === 2) return 0.65;
  return 0.5;
}

export default function PartialRoadmapReveal({
  milestones,
  visibleCount = 1,
  totalCount,
  onUnlock,
}: PartialRoadmapRevealProps) {
  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-white">Your Personalized Roadmap</h3>
        <Badge variant="outline" className="shrink-0">
          {visibleCount} of {totalCount} milestones visible
        </Badge>
      </div>

      {/* Milestone timeline. `will-change: filter` keeps the progressive blur on
          its own paint layer so scrolling stays smooth on lower-end devices. */}
      <div className="space-y-3" style={{ willChange: "filter" }}>
        {milestones.map((m, idx) => {
          const gated = idx >= visibleCount;
          const blurPx = idx === 0 ? 0 : Math.min(3 + (idx - 1) * 2, 6);
          const isLast = idx === milestones.length - 1;

          return (
            <div key={idx} className="flex items-start gap-3">
              {/* Timeline connector — teal dot + vertical line (shared pattern). */}
              <div className="flex flex-col items-center self-stretch pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                {!isLast && <div className="w-px flex-1 bg-slate-600 mt-1 min-h-[18px]" />}
              </div>

              <div
                className={`flex-1 rounded-xl border border-slate-700/40 bg-slate-700/20 px-4 py-3 overflow-hidden ${
                  gated ? "h-12 sm:h-auto sm:min-h-[80px]" : ""
                }`}
                style={{ filter: blurPx ? `blur(${blurPx}px)` : undefined, opacity: opacityFor(idx) }}
                aria-hidden={gated ? "true" : undefined}
                inert={gated ? true : undefined}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">{m.title}</p>
                  <span className="text-[11px] font-bold text-teal-300 shrink-0">{m.timeline}</span>
                </div>
                <ul className="space-y-0.5">
                  {m.actions.map((a, j) => (
                    <li key={j} className="text-xs text-slate-300 leading-relaxed">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social proof + unlock CTA */}
      <div className="mt-5 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-200">{PROOF_METRICS.pivotsDelivered}</strong> career changers
          unlocked their full roadmap · {PROOF_METRICS.avgRating}★ avg rating
        </p>
        <button
          type="button"
          onClick={onUnlock}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors shadow-lg shadow-teal-900/30"
        >
          <Lock className="w-3.5 h-3.5" />
          Unlock all {totalCount} milestones — $19
        </button>
      </div>
    </div>
  );
}
