"use client";

import { useState } from "react";
import { Check, ChevronDown, Clock, Loader2 } from "lucide-react";

type MilestoneStatus = "not-started" | "in-progress" | "completed";

interface MilestoneProgress {
  phase: string;
  milestone_index: number;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

export interface TimelinePhase {
  key: string;
  label: string;
  deadline: string;
  milestones: string[];
  color: "emerald" | "teal" | "cyan";
}

interface RoadmapTimelineProps {
  phases: TimelinePhase[];
  progress?: Map<string, MilestoneProgress>;
  saving?: string | null;
  onCycleStatus?: (phase: string, milestoneIndex: number) => void;
}

const C = {
  emerald: {
    nodeBg: "bg-emerald-600",
    nodeBorder: "border-emerald-400",
    nodeGlow: "shadow-emerald-500/40",
    nodeText: "text-emerald-400",
    badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
    checkBg: "bg-emerald-600",
    checkBorder: "border-emerald-500",
    progressBar: "bg-emerald-500",
    inProgress: "text-emerald-300",
    connector: "bg-emerald-500",
  },
  teal: {
    nodeBg: "bg-teal-600",
    nodeBorder: "border-teal-400",
    nodeGlow: "shadow-teal-500/40",
    nodeText: "text-teal-400",
    badge: "bg-teal-900/40 border-teal-700/40 text-teal-300",
    checkBg: "bg-teal-600",
    checkBorder: "border-teal-500",
    progressBar: "bg-teal-500",
    inProgress: "text-teal-300",
    connector: "bg-teal-500",
  },
  cyan: {
    nodeBg: "bg-cyan-600",
    nodeBorder: "border-cyan-400",
    nodeGlow: "shadow-cyan-500/40",
    nodeText: "text-cyan-400",
    badge: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
    checkBg: "bg-cyan-600",
    checkBorder: "border-cyan-500",
    progressBar: "bg-cyan-500",
    inProgress: "text-cyan-300",
    connector: "bg-cyan-500",
  },
} as const;

function pKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function deriveStatus(item: MilestoneProgress | undefined): MilestoneStatus {
  if (!item) return "not-started";
  if (item.completed) return "completed";
  return "in-progress";
}

function StatusIcon({
  status,
  isSaving,
  color,
}: {
  status: MilestoneStatus;
  isSaving: boolean;
  color: keyof typeof C;
}) {
  const c = C[color];
  if (isSaving) {
    return (
      <div className="h-8 w-8 flex items-center justify-center shrink-0">
        <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className={`h-8 w-8 rounded-full ${c.checkBg} border-2 ${c.checkBorder} flex items-center justify-center shrink-0 transition-all`}>
        <Check className="h-3.5 w-3.5 text-white" />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className={`h-8 w-8 rounded-full border-2 ${c.checkBorder} flex items-center justify-center shrink-0 transition-all`}>
        <Clock className="h-3.5 w-3.5 text-slate-300" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-full border-2 border-slate-600 hover:border-slate-400 flex items-center justify-center shrink-0 transition-all" />
  );
}

export default function RoadmapTimeline({ phases, progress = new Map(), saving = null, onCycleStatus }: RoadmapTimelineProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([phases[0]?.key]));

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="relative" role="list" aria-label="Career roadmap timeline">
      {phases.map((phase, phaseIdx) => {
        const c = C[phase.color];
        const isExpanded = expanded.has(phase.key);
        const isLast = phaseIdx === phases.length - 1;

        let doneCount = 0;
        const items = phase.milestones.map((text, i) => {
          const key = pKey(phase.key, i);
          const status = deriveStatus(progress.get(key));
          if (status === "completed") doneCount++;
          return { text, i, key, status };
        });
        const pct = phase.milestones.length > 0 ? Math.round((doneCount / phase.milestones.length) * 100) : 0;
        const allDone = doneCount === phase.milestones.length && phase.milestones.length > 0;

        return (
          <div key={phase.key} className="flex gap-5" role="listitem">
            {/* Spine */}
            <div className="flex flex-col items-center shrink-0 pt-1">
              <button
                onClick={() => toggle(phase.key)}
                className={`relative h-10 w-10 rounded-full border-2 ${c.nodeBorder} ${allDone ? c.nodeBg : "bg-slate-800"} shadow-lg ${c.nodeGlow} flex items-center justify-center shrink-0 transition-all z-10 cursor-pointer`}
                aria-label={`${phase.label} — ${isExpanded ? "collapse" : "expand"}`}
              >
                {allDone ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <span className={`text-xs font-bold ${c.nodeText}`}>{phaseIdx + 1}</span>
                )}
              </button>

              {!isLast && (
                <div className="w-0.5 flex-1 min-h-[32px] mt-1 bg-slate-700/60 relative overflow-hidden">
                  <div
                    className={`absolute inset-x-0 top-0 ${c.connector} transition-all duration-700`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
              <button
                onClick={() => toggle(phase.key)}
                className="w-full text-left flex items-center gap-3 mb-3 cursor-pointer bg-transparent border-0 p-0"
                aria-expanded={isExpanded}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-base font-bold ${c.nodeText}`}>{phase.label}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.badge}`}>
                      {doneCount}/{phase.milestones.length}
                    </span>
                    {allDone && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-400">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <div className="h-1 rounded-full bg-slate-700/50 mt-1.5 overflow-hidden w-48 max-w-full">
                    <div
                      className={`h-full rounded-full ${c.progressBar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {isExpanded && (
                <div className="space-y-2 mb-2">
                  {items.map(({ text, i, key, status }) => {
                    const isSaving = saving === key;
                    return (
                      <div key={i} className="flex items-start gap-3 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3 py-2.5">
                        <button
                          onClick={() => onCycleStatus?.(phase.key, i)}
                          disabled={isSaving || !onCycleStatus}
                          className={`shrink-0 bg-transparent border-0 p-0 mt-0.5 ${onCycleStatus ? "cursor-pointer" : "cursor-default"}`}
                          aria-label={`${text}: ${status}${onCycleStatus ? ". Click to change." : ""}`}
                        >
                          <StatusIcon status={status} isSaving={isSaving} color={phase.color} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${
                            status === "completed" ? "line-through text-slate-500"
                            : status === "in-progress" ? `font-medium ${c.inProgress}`
                            : "text-slate-300"
                          }`}>
                            {text}
                          </p>
                          {status === "in-progress" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                              <Clock className="h-2.5 w-2.5" /> In progress
                            </span>
                          )}
                          {status === "completed" && progress.get(key)?.completed_at && (
                            <span className="text-[10px] text-slate-600 block mt-0.5">
                              Completed {new Date(progress.get(key)!.completed_at!).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
