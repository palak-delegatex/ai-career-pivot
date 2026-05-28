"use client";

import { Check, ChevronDown, Clock, Loader2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

export type MilestoneStatus = "not-started" | "in-progress" | "completed";

export interface PhaseData {
  key: string;
  label: string;
  milestones: string[];
  color: "emerald" | "teal" | "cyan";
}

export interface MilestoneState {
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

interface MilestoneChecklistProps {
  phases: PhaseData[];
  statuses: Map<string, MilestoneState>;
  onToggle: (phaseKey: string, milestoneIndex: number) => void;
  savingKey: string | null;
}

const phaseColors = {
  emerald: {
    bg: "bg-emerald-500",
    border: "border-emerald-400",
    glow: "shadow-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
    checkBg: "bg-emerald-600",
    checkBorder: "border-emerald-500",
    progressBar: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-900/30",
  },
  teal: {
    bg: "bg-teal-500",
    border: "border-teal-400",
    glow: "shadow-teal-500/30",
    text: "text-teal-400",
    badge: "bg-teal-900/40 border-teal-700/40 text-teal-300",
    checkBg: "bg-teal-600",
    checkBorder: "border-teal-500",
    progressBar: "bg-teal-500",
    hoverBg: "hover:bg-teal-900/30",
  },
  cyan: {
    bg: "bg-cyan-500",
    border: "border-cyan-400",
    glow: "shadow-cyan-500/30",
    text: "text-cyan-400",
    badge: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
    checkBg: "bg-cyan-600",
    checkBorder: "border-cyan-500",
    progressBar: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-900/30",
  },
} as const;

function progressKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function deriveStatus(item: MilestoneState | undefined): MilestoneStatus {
  if (!item) return "not-started";
  if (item.completed) return "completed";
  return "in-progress";
}

export default function MilestoneChecklist({
  phases,
  statuses,
  onToggle,
  savingKey,
}: MilestoneChecklistProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
        Milestone Checklist
      </h3>

      <ol className="space-y-3" aria-label="Milestone phases">
        {phases.map((phase, phaseIdx) => {
          const colors = phaseColors[phase.color];
          let phaseCompleted = 0;
          const sortedMilestones = phase.milestones.map((m, i) => {
            const key = progressKey(phase.key, i);
            const state = statuses.get(key);
            const status = deriveStatus(state);
            if (status === "completed") phaseCompleted++;
            return { text: m, originalIndex: i, status, state, key };
          });

          sortedMilestones.sort((a, b) => {
            if (a.status === "completed" && b.status !== "completed") return 1;
            if (a.status !== "completed" && b.status === "completed") return -1;
            return 0;
          });

          const phasePercent =
            phase.milestones.length > 0
              ? Math.round((phaseCompleted / phase.milestones.length) * 100)
              : 0;

          return (
            <li key={phase.key}>
              <Collapsible defaultOpen={phaseIdx === 0}>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                  <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`h-7 w-7 rounded-full border-2 ${colors.border} ${colors.bg} shadow-lg ${colors.glow} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-xs font-bold text-white">
                        {phaseIdx + 1}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold ${colors.text}`}>
                          {phase.label}
                        </h4>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}
                        >
                          {phaseCompleted}/{phase.milestones.length}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-700/50 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors.progressBar} transition-all duration-500`}
                          style={{ width: `${phasePercent}%` }}
                        />
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[panel-open]:rotate-180 shrink-0" />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0">
                    <ul className="px-4 pb-3 space-y-1" role="list">
                      {sortedMilestones.map((milestone) => {
                        const isSaving = savingKey === milestone.key;

                        return (
                          <li
                            key={milestone.originalIndex}
                            className={`rounded-lg px-3 py-2 transition-colors ${colors.hoverBg}`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  onToggle(phase.key, milestone.originalIndex)
                                }
                                disabled={isSaving}
                                className="shrink-0 cursor-pointer bg-transparent border-0 p-0"
                                aria-label={`${milestone.text}: ${milestone.status}. Click to change.`}
                              >
                                <StatusIcon
                                  status={milestone.status}
                                  isSaving={isSaving}
                                  color={phase.color}
                                />
                              </button>

                              <span
                                className={`text-sm leading-snug flex-1 ${
                                  milestone.status === "completed"
                                    ? "text-slate-500 line-through"
                                    : milestone.status === "in-progress"
                                    ? `${colors.text} font-medium`
                                    : "text-slate-300"
                                }`}
                              >
                                {milestone.text}
                              </span>
                            </div>

                            {milestone.status === "completed" &&
                              milestone.state?.completed_at && (
                                <span className="text-[10px] text-slate-600 ml-[56px] block">
                                  Completed{" "}
                                  {new Date(
                                    milestone.state.completed_at
                                  ).toLocaleDateString()}
                                </span>
                              )}
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatusIcon({
  status,
  isSaving,
  color,
}: {
  status: MilestoneStatus;
  isSaving: boolean;
  color: "emerald" | "teal" | "cyan";
}) {
  const colors = phaseColors[color];

  if (isSaving) {
    return (
      <div className="h-[44px] w-[44px] min-h-[44px] min-w-[44px] flex items-center justify-center">
        <Loader2 className="h-4 w-4 text-white animate-spin" />
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div
        className={`h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg ${colors.checkBg} ${colors.checkBorder} border-2 flex items-center justify-center transition-all`}
      >
        <Check className="h-4 w-4 text-white" />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div
        className={`h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg border-2 ${colors.checkBorder} flex items-center justify-center transition-all`}
      >
        <Clock className="h-4 w-4 text-teal-300" />
      </div>
    );
  }
  return (
    <div className="h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg border-2 border-slate-600 hover:border-slate-400 flex items-center justify-center transition-all" />
  );
}
