"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const phaseDotFill: Record<string, string> = {
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
};

const phaseDotGlow: Record<string, string> = {
  emerald: "drop-shadow(0 0 4px #10b981)",
  teal: "drop-shadow(0 0 4px #14b8a6)",
  cyan: "drop-shadow(0 0 4px #06b6d4)",
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

function MilestoneDot({
  position,
  state,
  color,
  label,
}: {
  position: number;
  state: "completed" | "current" | "future";
  color: string;
  label: string;
}) {
  const fill = phaseDotFill[color] ?? "#14b8a6";
  const glow = phaseDotGlow[color] ?? "drop-shadow(0 0 4px #14b8a6)";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10"
          style={{ left: `${position}%`, transform: `translate(-50%, -50%)` }}
        >
          {state === "completed" && (
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-slate-800"
              style={{ backgroundColor: fill, filter: glow }}
            />
          )}
          {state === "current" && (
            <div className="relative w-3.5 h-3.5">
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-40"
                style={{ backgroundColor: fill }}
              />
              <div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: fill, backgroundColor: "transparent" }}
              />
            </div>
          )}
          {state === "future" && (
            <div className="w-3 h-3 rounded-full border-2 border-slate-500 bg-slate-800" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function PhaseProgressCards({
  phases,
  statuses,
  reportId,
}: PhaseProgressCardsProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="grid gap-3">
        {phases.map((phase) => {
          const total = phase.milestones.length;
          let completed = 0;
          let lastCompletedAt: string | null = null;
          let firstIncompleteIndex = -1;
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
            } else if (firstIncompleteIndex === -1) {
              firstIncompleteIndex = i;
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

              <div className="relative h-4 flex items-center">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      phaseBarColor[phase.color] ?? "bg-teal-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {total > 1 &&
                  phase.milestones.map((milestone, i) => {
                    const pos = ((i + 1) / total) * 100;
                    const s = statuses.get(progressKey(phase.key, i));
                    let dotState: "completed" | "current" | "future";
                    if (s?.completed) {
                      dotState = "completed";
                    } else if (i === firstIncompleteIndex) {
                      dotState = "current";
                    } else {
                      dotState = "future";
                    }
                    return (
                      <MilestoneDot
                        key={i}
                        position={pos}
                        state={dotState}
                        color={phase.color}
                        label={milestone}
                      />
                    );
                  })}
              </div>
            </Link>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
