"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { PhaseData, MilestoneState } from "@/components/MilestoneChecklist";

interface PhaseProgressCardsProps {
  phases: PhaseData[];
  statuses: Map<string, MilestoneState>;
  reportId: string;
}

const phaseBarColor: Record<string, string> = {
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
};

const phaseBorderColor: Record<string, string> = {
  emerald: "border-emerald-700/40",
  teal: "border-teal-700/40",
  cyan: "border-cyan-700/40",
};

const phaseTextColor: Record<string, string> = {
  emerald: "text-emerald-400",
  teal: "text-teal-400",
  cyan: "text-cyan-400",
};

function progressKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

export default function PhaseProgressCards({
  phases,
  statuses,
  reportId,
}: PhaseProgressCardsProps) {
  return (
    <div className="grid gap-3">
      {phases.map((phase) => {
        const total = phase.milestones.length;
        let completed = 0;
        let lastCompletedAt: string | null = null;
        for (let i = 0; i < total; i++) {
          const s = statuses.get(progressKey(phase.key, i));
          if (s?.completed) {
            completed++;
            if (
              s.completed_at &&
              (!lastCompletedAt || s.completed_at > lastCompletedAt)
            ) {
              lastCompletedAt = s.completed_at;
            }
          }
        }
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isComplete = completed === total && total > 0;

        return (
          <Link
            key={phase.key}
            href={`/report/${reportId}`}
            className={`block bg-slate-800/60 border ${
              isComplete
                ? "border-emerald-600/50"
                : phaseBorderColor[phase.color] ?? "border-slate-700"
            } rounded-xl p-4 hover:bg-slate-800/80 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${phaseTextColor[phase.color]}`}>
                  {phase.label}
                </span>
                {isComplete && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-700/40">
                    <CheckCircle className="h-3 w-3" />
                    {lastCompletedAt
                      ? new Date(lastCompletedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Done"}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {completed}/{total} · {pct}%
              </span>
            </div>

            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  phaseBarColor[phase.color] ?? "bg-teal-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
