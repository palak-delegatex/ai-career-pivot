"use client";

import { ArrowRight, Clock, Loader2, BookOpen, Target, PartyPopper } from "lucide-react";
import type { RoadmapMilestoneRef } from "@/lib/roadmap-momentum";

/**
 * NextStepCard (AIC-687) — a single, prominent "Your Next Step" hero card.
 *
 * Derives from the first uncompleted milestone (passed in as `next`) and updates
 * automatically as milestones are completed. Replaces the old list-of-three
 * "next actions" widget with a single-action focus (Hick's Law / goal-gradient).
 * When the roadmap is fully complete it becomes a celebratory summary.
 */
export default function NextStepCard({
  next,
  description,
  timeEstimate,
  resourceCount = 0,
  saving = false,
  onStart,
  onOpen,
  compact = false,
}: {
  next: RoadmapMilestoneRef | null;
  /** Optional supporting line (e.g. related skill-gap context). */
  description?: string;
  /** e.g. "~2 hours". */
  timeEstimate?: string;
  resourceCount?: number;
  saving?: boolean;
  /** Advance the milestone status (not-started -> in-progress -> completed). */
  onStart: (phaseKey: string, index: number) => void;
  /** Open the milestone detail sheet. */
  onOpen: (phaseKey: string, index: number) => void;
  compact?: boolean;
}) {
  if (!next) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4">
        <PartyPopper className="h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            Roadmap complete — every milestone checked off.
          </p>
          <p className="text-xs text-emerald-400/70">
            You&apos;ve run the whole pivot. Time to set your next goal.
          </p>
        </div>
      </div>
    );
  }

  const isInProgress = next.status === "in-progress";
  const ctaLabel = isInProgress ? "Mark this complete" : "Start this step";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--accent))]/20 bg-gradient-to-br from-teal-500/15 to-teal-300/[0.06] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      {/* Top accent bar: emerald -> accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-[hsl(var(--accent))]" />

      <div className="mb-3 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--accent))]">
          <Clock className="h-3.5 w-3.5" />
          Your Next Step
        </span>
        <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
          {next.phaseLabel} phase
        </span>
      </div>

      <button
        onClick={() => onOpen(next.phaseKey, next.index)}
        className="group block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
      >
        <span className="text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-teal-200">
          {next.text}
        </span>
      </button>

      {description && (
        <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{description}</p>
      )}

      {(timeEstimate || resourceCount > 0 || isInProgress) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {timeEstimate && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {timeEstimate}
            </span>
          )}
          {resourceCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <BookOpen className="h-3.5 w-3.5" />
              {resourceCount} resource{resourceCount === 1 ? "" : "s"} available
            </span>
          )}
          {isInProgress && (
            <span className="flex items-center gap-1 text-xs text-amber-300/80">
              <Target className="h-3.5 w-3.5" />
              In progress
            </span>
          )}
        </div>
      )}

      <button
        onClick={() => onStart(next.phaseKey, next.index)}
        disabled={saving}
        className="mt-4 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
