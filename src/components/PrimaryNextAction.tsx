"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Circle,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";

type ScheduleStatus = "on-track" | "behind-schedule" | "at-risk";

interface NextActionItem {
  phase: string;
  phaseLabel: string;
  milestone: string;
  milestoneIndex: number;
  actions: { title: string; instruction: string; timeEstimate: string }[];
}

interface PrimaryNextActionProps {
  nextAction: NextActionItem | null;
  completionPercent: number;
  completedMilestones: number;
  totalMilestones: number;
  streakDays: number;
  status: ScheduleStatus;
  daysElapsed: number;
  targetRole: string;
  reportId: string;
  onMarkDone: (phaseKey: string, milestoneIndex: number) => void;
}

const phaseBadge: Record<string, string> = {
  "6mo": "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
  "1yr": "bg-teal-900/40 border-teal-700/40 text-teal-300",
  "2yr": "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
};

export default function PrimaryNextAction({
  nextAction,
  completionPercent,
  completedMilestones,
  totalMilestones,
  streakDays,
  status,
  daysElapsed,
  targetRole,
  reportId,
  onMarkDone,
}: PrimaryNextActionProps) {
  // Determine the user state so the "next action" framing adapts.
  const isComplete = completionPercent >= 100 || nextAction === null;
  const isFresh = completedMilestones === 0;
  const isStalled =
    !isComplete &&
    !isFresh &&
    (status !== "on-track" || (streakDays === 0 && daysElapsed > 2));

  let eyebrow: string;
  let EyebrowIcon = ArrowRight;
  if (isComplete) {
    eyebrow = "Roadmap complete";
    EyebrowIcon = Trophy;
  } else if (isFresh) {
    eyebrow = "Start here";
    EyebrowIcon = Sparkles;
  } else if (isStalled) {
    eyebrow = "Pick back up";
    EyebrowIcon = Flame;
  } else {
    eyebrow = "Do this next";
    EyebrowIcon = ArrowRight;
  }

  return (
    <div
      data-tour="dashboard-next-action"
      className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-600/40 rounded-2xl p-5 sm:p-7 md:p-8 overflow-hidden shadow-lg shadow-teal-950/20"
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: "inset 0 0 80px rgba(20, 184, 166, 0.08)" }}
      />

      <div className="relative">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
            <EyebrowIcon className="h-3.5 w-3.5" />
            {eyebrow}
          </span>
        </div>

        {isComplete ? (
          <>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
              You&apos;ve completed every milestone on your path to {targetRole}. 🎉
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Keep the momentum going — line up interviews and refine your
              materials.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/report/${reportId}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm text-white transition-colors min-h-[44px]"
              >
                Review your full report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          nextAction && (
            <>
              {/* Phase context */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    phaseBadge[nextAction.phase] ?? phaseBadge["1yr"]
                  }`}
                >
                  {nextAction.phaseLabel} milestone
                </span>
                <span className="text-[11px] text-slate-500">
                  Progress to {targetRole}
                </span>
              </div>

              {/* The single, dominant next action */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
                {nextAction.milestone}
              </h2>

              {/* Concrete first steps, if we have them */}
              {nextAction.actions.length > 0 && (
                <ul className="space-y-2 mb-5">
                  {nextAction.actions.slice(0, 2).map((action, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-sm text-slate-300"
                    >
                      <Circle className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                      <span className="flex-1">{action.title}</span>
                      <span className="text-xs text-slate-500 shrink-0 mt-0.5">
                        {action.timeEstimate}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Primary + secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    onMarkDone(nextAction.phase, nextAction.milestoneIndex)
                  }
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm text-white transition-colors min-h-[44px] cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark this done
                </button>
                <Link
                  href={`/report/${reportId}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors min-h-[44px] px-2"
                >
                  See full roadmap
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          )
        )}

        {/* Single progress signal — thin, subordinate to the action above */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">
              {completedMilestones} of {totalMilestones} milestones ·{" "}
              {completionPercent}%
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                streakDays > 0 ? "text-amber-400" : "text-slate-500"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              {streakDays > 0 ? `${streakDays}-day streak` : "No active streak"}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-[width] duration-1000 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
