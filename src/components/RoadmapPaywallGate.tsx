"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * RoadmapPaywallGate (AIC-687) — the progress-aware free-tier gate for the
 * roadmap hub. Appears *after* the user has invested in the first milestones,
 * so the messaging leans on what they've already accomplished (loss aversion /
 * commitment & consistency). An 80px gradient fade sits above the CTA to hint
 * at locked content below.
 */
export default function RoadmapPaywallGate({
  completedCount,
  transferableSkillsCount,
  lockedMilestoneCount,
  onUpgrade,
  socialProof = "2,400+ career changers using their roadmap",
}: {
  completedCount: number;
  transferableSkillsCount: number;
  lockedMilestoneCount: number;
  onUpgrade: () => void;
  socialProof?: string;
}) {
  const progressLine =
    completedCount > 0
      ? `You've completed ${completedCount} milestone${completedCount === 1 ? "" : "s"}`
      : "You're getting started";
  const skillsLine =
    transferableSkillsCount > 0
      ? ` and identified ${transferableSkillsCount} transferable skill${
          transferableSkillsCount === 1 ? "" : "s"
        }`
      : "";

  return (
    <div className="relative">
      {/* 80px gradient fade over the locked content above */}
      <div
        aria-hidden="true"
        className="pointer-events-none -mt-px h-20 bg-gradient-to-b from-transparent to-slate-950"
      />

      <div className="relative z-[1] rounded-2xl border border-[hsl(var(--accent))]/20 bg-gradient-to-br from-teal-500/10 to-teal-300/[0.05] p-6 text-center">
        <h3 className="text-lg font-bold text-white">You&apos;re making real progress</h3>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-slate-400">
          {progressLine}
          {skillsLine}. Unlock your full personalized roadmap with{" "}
          {lockedMilestoneCount > 0
            ? `${lockedMilestoneCount} more milestones`
            : "every milestone"}
          , skill-gap resources, and progress tracking.
        </p>

        <button
          onClick={onUpgrade}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
        >
          Unlock Full Roadmap
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {socialProof}
        </div>
      </div>
    </div>
  );
}
