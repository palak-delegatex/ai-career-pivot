"use client";

import { Sparkles, TrendingUp } from "lucide-react";

interface WeeklyCheckInProps {
  completionPercent: number;
  completedMilestones: number;
  totalMilestones: number;
  lastSessionDate: string | null;
  onReview: () => void;
  onDismiss: () => void;
}

export default function WeeklyCheckIn({
  completionPercent,
  completedMilestones,
  totalMilestones,
  lastSessionDate,
  onReview,
  onDismiss,
}: WeeklyCheckInProps) {
  const daysSince = lastSessionDate
    ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-[var(--card)] border-l-4 border-[var(--accent)] rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white mb-1">Welcome back!</h3>
          <p className="text-xs text-slate-400 mb-3">
            {daysSince !== null
              ? `It's been ${daysSince} day${daysSince !== 1 ? "s" : ""} since your last session. `
              : "Ready for your first coaching session? "}
            Let&apos;s check in on your progress.
          </p>

          <div className="flex items-center gap-3 mb-4 bg-slate-800/40 rounded-lg p-3">
            <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 font-medium">Milestone progress</span>
                <span className="text-xs text-teal-400 font-bold">{completionPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {completedMilestones} of {totalMilestones} milestones completed
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onReview}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              Review my progress
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
