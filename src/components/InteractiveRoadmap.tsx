"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown, Loader2, Pencil, X } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface MilestoneProgress {
  phase: string;
  milestone_index: number;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

interface Phase {
  key: string;
  label: string;
  milestones: string[];
  color: "emerald" | "teal" | "cyan";
}

const phaseColors = {
  emerald: {
    bg: "bg-emerald-500",
    border: "border-emerald-400",
    glow: "shadow-emerald-500/30",
    text: "text-emerald-400",
    bullet: "text-emerald-500",
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
    bullet: "text-teal-500",
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
    bullet: "text-cyan-500",
    badge: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
    checkBg: "bg-cyan-600",
    checkBorder: "border-cyan-500",
    progressBar: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-900/30",
  },
} as const;

export default function InteractiveRoadmap({
  sixMonthMilestones,
  oneYearMilestones,
  twoYearMilestones,
  reportId,
  planIndex,
}: {
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
  reportId: string;
  planIndex: number;
}) {
  const [progress, setProgress] = useState<Map<string, MilestoneProgress>>(new Map());
  const [saving, setSaving] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loaded, setLoaded] = useState(false);

  const phases: Phase[] = [
    { key: "6mo", label: "6 Months", milestones: sixMonthMilestones, color: "emerald" },
    { key: "1yr", label: "1 Year", milestones: oneYearMilestones, color: "teal" },
    { key: "2yr", label: "2 Years", milestones: twoYearMilestones, color: "cyan" },
  ];

  const progressKey = (phase: string, idx: number) => `${phase}:${idx}`;

  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/roadmap/progress?reportId=${reportId}&planIndex=${planIndex}`
      );
      if (!res.ok) return;
      const { progress: items } = (await res.json()) as { progress: MilestoneProgress[] };
      const map = new Map<string, MilestoneProgress>();
      for (const item of items) {
        map.set(progressKey(item.phase, item.milestone_index), item);
      }
      setProgress(map);
    } finally {
      setLoaded(true);
    }
  }, [reportId, planIndex]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  async function toggleMilestone(phase: string, milestoneIndex: number, currentCompleted: boolean) {
    const key = progressKey(phase, milestoneIndex);
    setSaving(key);

    const newCompleted = !currentCompleted;
    setProgress((prev) => {
      const next = new Map(prev);
      next.set(key, {
        phase,
        milestone_index: milestoneIndex,
        completed: newCompleted,
        notes: prev.get(key)?.notes ?? null,
        completed_at: newCompleted ? new Date().toISOString() : null,
      });
      return next;
    });

    try {
      await fetch("/api/roadmap/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          planIndex,
          phase,
          milestoneIndex,
          completed: newCompleted,
          notes: progress.get(key)?.notes ?? null,
        }),
      });
    } finally {
      setSaving(null);
    }
  }

  async function saveNote(phase: string, milestoneIndex: number) {
    const key = progressKey(phase, milestoneIndex);
    setSaving(key);

    setProgress((prev) => {
      const next = new Map(prev);
      const existing = prev.get(key);
      next.set(key, {
        phase,
        milestone_index: milestoneIndex,
        completed: existing?.completed ?? false,
        notes: noteText || null,
        completed_at: existing?.completed_at ?? null,
      });
      return next;
    });

    try {
      await fetch("/api/roadmap/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          planIndex,
          phase,
          milestoneIndex,
          completed: progress.get(key)?.completed ?? false,
          notes: noteText || null,
        }),
      });
    } finally {
      setSaving(null);
      setEditingNote(null);
      setNoteText("");
    }
  }

  function getPhaseProgress(phase: Phase) {
    let completed = 0;
    for (let i = 0; i < phase.milestones.length; i++) {
      if (progress.get(progressKey(phase.key, i))?.completed) completed++;
    }
    return completed;
  }

  const totalMilestones = phases.reduce((s, p) => s + p.milestones.length, 0);
  const totalCompleted = phases.reduce((s, p) => s + getPhaseProgress(p), 0);

  return (
    <section aria-label="Interactive career roadmap">
      {/* Overall progress header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Your Progress
          </span>
        </div>
        {loaded && (
          <span className="text-xs text-slate-400">
            <span className="text-white font-medium">{totalCompleted}</span> / {totalMilestones} milestones
          </span>
        )}
      </div>

      {/* Overall progress bar */}
      {loaded && totalMilestones > 0 && (
        <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-6">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${(totalCompleted / totalMilestones) * 100}%` }}
          />
        </div>
      )}

      {/* Phases */}
      <ol className="space-y-4" aria-label="Timeline phases">
        {phases.map((phase, phaseIdx) => {
          const colors = phaseColors[phase.color];
          const phaseCompleted = getPhaseProgress(phase);
          const phasePercent = phase.milestones.length > 0
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
                      <span className="text-xs font-bold text-white">{phaseIdx + 1}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${colors.text}`}>{phase.label}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}>
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
                      {phase.milestones.map((milestone, mIdx) => {
                        const key = progressKey(phase.key, mIdx);
                        const item = progress.get(key);
                        const isCompleted = item?.completed ?? false;
                        const isSaving = saving === key;
                        const isEditing = editingNote === key;
                        const hasNote = !!item?.notes;

                        return (
                          <li key={mIdx} className={`rounded-lg px-3 py-2.5 transition-colors ${colors.hoverBg}`}>
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleMilestone(phase.key, mIdx, isCompleted)}
                                disabled={isSaving}
                                className={`mt-0.5 shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? `${colors.checkBg} ${colors.checkBorder}`
                                    : "border-slate-600 hover:border-slate-400"
                                }`}
                                aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3 w-3 text-white animate-spin" />
                                ) : isCompleted ? (
                                  <Check className="h-3 w-3 text-white" />
                                ) : null}
                              </button>

                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-sm leading-snug ${
                                    isCompleted ? "text-slate-500 line-through" : "text-slate-300"
                                  }`}
                                >
                                  {milestone}
                                </span>

                                {isCompleted && item?.completed_at && (
                                  <span className="text-[10px] text-slate-600 ml-2">
                                    {new Date(item.completed_at).toLocaleDateString()}
                                  </span>
                                )}

                                {hasNote && !isEditing && (
                                  <p className="text-xs text-slate-500 mt-1 italic">{item!.notes}</p>
                                )}

                                {isEditing && (
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="text"
                                      value={noteText}
                                      onChange={(e) => setNoteText(e.target.value)}
                                      placeholder="Add a note..."
                                      className="flex-1 bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-400"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveNote(phase.key, mIdx);
                                        if (e.key === "Escape") { setEditingNote(null); setNoteText(""); }
                                      }}
                                    />
                                    <button
                                      onClick={() => saveNote(phase.key, mIdx)}
                                      className="text-xs text-teal-400 hover:text-teal-300 px-2"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => { setEditingNote(null); setNoteText(""); }}
                                      className="text-xs text-slate-500 hover:text-slate-300"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {!isEditing && (
                                <button
                                  onClick={() => {
                                    setEditingNote(key);
                                    setNoteText(item?.notes ?? "");
                                  }}
                                  className="mt-0.5 shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
                                  aria-label="Add note"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
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
    </section>
  );
}
