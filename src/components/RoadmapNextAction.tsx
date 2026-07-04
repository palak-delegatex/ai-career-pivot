"use client";

import { ArrowRight, Check, Loader2, Sparkles, PartyPopper } from "lucide-react";
import type { RoadmapMilestoneRef } from "@/lib/roadmap-momentum";

/**
 * Surfaces the single "next action" derived from roadmap state (AIC-685).
 * When everything is complete it becomes a celebratory summary instead.
 */
export default function RoadmapNextAction({
  next,
  percentComplete,
  saving,
  onAdvance,
  onOpen,
}: {
  next: RoadmapMilestoneRef | null;
  percentComplete: number;
  saving: boolean;
  /** Advance the milestone status (not-started -> in-progress -> completed). */
  onAdvance: (phaseKey: string, index: number) => void;
  /** Open the milestone detail sheet. */
  onOpen: (phaseKey: string, index: number) => void;
}) {
  if (!next) {
    if (percentComplete < 100) return null;
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
        <PartyPopper className="h-5 w-5 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">Roadmap complete — every milestone checked off.</p>
          <p className="text-xs text-emerald-400/70">You&apos;ve run the whole pivot. Time to set your next goal.</p>
        </div>
      </div>
    );
  }

  const isInProgress = next.status === "in-progress";
  const ctaLabel = isInProgress ? "Mark complete" : "Start this";

  return (
    <div className="mb-4 rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/10 to-cyan-500/5 px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="h-3.5 w-3.5 text-teal-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">
          Your next move
        </span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-teal-700/40 bg-teal-900/40 text-teal-300">
          {next.phaseLabel}
        </span>
        {isInProgress && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-700/40 bg-amber-900/40 text-amber-300">
            In progress
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => onOpen(next.phaseKey, next.index)}
          className="flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0 group"
        >
          <span className="text-sm font-medium text-white group-hover:text-teal-200 transition-colors">
            {next.text}
          </span>
          <span className="ml-1.5 inline-flex items-center text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>

        <button
          onClick={() => onAdvance(next.phaseKey, next.index)}
          disabled={saving}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 px-3 py-2 text-xs font-semibold text-white transition-colors min-h-[40px] cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
