"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronDown, Clock, Loader2, Pencil, X, ExternalLink, BookOpen, Target, List, GitBranch, Download, LayoutGrid } from "lucide-react";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import RoadmapKanban from "@/components/RoadmapKanban";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { SkillGap, RecommendedResource } from "@/lib/intake";
import RoadmapMomentum from "@/components/RoadmapMomentum";
import RoadmapNextAction from "@/components/RoadmapNextAction";
import { computeMomentum, deriveNextAction, type RoadmapMilestoneRef } from "@/lib/roadmap-momentum";

type MilestoneStatus = "not-started" | "in-progress" | "completed";

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
  deadline: string;
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
    ring: "ring-emerald-400",
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
    ring: "ring-teal-400",
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
    ring: "ring-cyan-400",
  },
} as const;

function deriveStatus(item: MilestoneProgress | undefined): MilestoneStatus {
  if (!item) return "not-started";
  if (item.completed) return "completed";
  return "in-progress";
}

function nextStatus(current: MilestoneStatus): MilestoneStatus {
  if (current === "not-started") return "in-progress";
  if (current === "in-progress") return "completed";
  return "not-started";
}

export default function InteractiveRoadmap({
  sixMonthMilestones,
  oneYearMilestones,
  twoYearMilestones,
  reportId,
  planIndex,
  skillGaps = [],
  recommendedResources = [],
  pdfButton,
}: {
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
  reportId: string;
  planIndex: number;
  skillGaps?: SkillGap[];
  recommendedResources?: RecommendedResource[];
  pdfButton?: React.ReactNode;
}) {
  const [progress, setProgress] = useState<Map<string, MilestoneProgress>>(new Map());
  const [saving, setSaving] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"timeline" | "checklist" | "board">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("roadmap_view_preference");
      if (saved === "timeline" || saved === "checklist" || saved === "board") return saved;
    }
    return "timeline";
  });
  const [selectedMilestone, setSelectedMilestone] = useState<{
    text: string;
    phase: Phase;
    index: number;
  } | null>(null);

  function setViewAndPersist(v: "timeline" | "checklist" | "board") {
    setView(v);
    localStorage.setItem("roadmap_view_preference", v);
  }

  const phases: Phase[] = [
    { key: "6mo", label: "6 Months", milestones: sixMonthMilestones, color: "emerald", deadline: "6 months" },
    { key: "1yr", label: "1 Year", milestones: oneYearMilestones, color: "teal", deadline: "1 year" },
    { key: "2yr", label: "2 Years", milestones: twoYearMilestones, color: "cyan", deadline: "2 years" },
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

  async function cycleMilestoneStatus(phase: string, milestoneIndex: number) {
    const key = progressKey(phase, milestoneIndex);
    const current = deriveStatus(progress.get(key));
    const next = nextStatus(current);
    setSaving(key);

    const newCompleted = next === "completed";
    const shouldExist = next !== "not-started";

    setProgress((prev) => {
      const updated = new Map(prev);
      if (!shouldExist) {
        updated.delete(key);
      } else {
        updated.set(key, {
          phase,
          milestone_index: milestoneIndex,
          completed: newCompleted,
          notes: prev.get(key)?.notes ?? null,
          completed_at: newCompleted ? new Date().toISOString() : null,
        });
      }
      return updated;
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

  function getRelatedSkillGaps(milestoneText: string): SkillGap[] {
    if (!skillGaps.length) return [];
    const lower = milestoneText.toLowerCase();
    return skillGaps.filter((g) => {
      const skill = g.skill.toLowerCase();
      return lower.includes(skill) || skill.split(/\s+/).some((w) => w.length > 3 && lower.includes(w));
    });
  }

  const totalMilestones = phases.reduce((s, p) => s + p.milestones.length, 0);
  const totalCompleted = phases.reduce((s, p) => s + getPhaseProgress(p), 0);

  // Momentum + "next action" derived from the persisted completion state.
  // Restricted to visible phases so free-tier users still get a real signal
  // (and a next action pointing inside the pre-paywall milestones).
  const orderedRefs = useMemo<RoadmapMilestoneRef[]>(() => {
    const refs: RoadmapMilestoneRef[] = [];
    for (const phase of phases) {
      phase.milestones.forEach((text, index) => {
        refs.push({
          phaseKey: phase.key,
          phaseLabel: phase.label,
          index,
          text,
          status: deriveStatus(progress.get(progressKey(phase.key, index))),
        });
      });
    }
    return refs;
  }, [phases, progress]);

  const momentum = useMemo(() => {
    const completedDates = orderedRefs
      .map((r) => progress.get(progressKey(r.phaseKey, r.index)))
      .filter((p) => p?.completed)
      .map((p) => p!.completed_at);
    return computeMomentum(completedDates, totalMilestones);
  }, [orderedRefs, progress, totalMilestones]);

  const nextAction = useMemo(() => deriveNextAction(orderedRefs), [orderedRefs]);
  const openMilestone = (phaseKey: string, index: number) => {
    const phase = phases.find((p) => p.key === phaseKey);
    if (phase) setSelectedMilestone({ text: phase.milestones[index], phase, index });
  };

  function StatusIcon({ status, isSaving, color }: { status: MilestoneStatus; isSaving: boolean; color: "emerald" | "teal" | "cyan" }) {
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
        <div className={`h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg ${colors.checkBg} ${colors.checkBorder} border-2 flex items-center justify-center transition-all`}>
          <Check className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (status === "in-progress") {
      return (
        <div className={`h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg border-2 ${colors.checkBorder} flex items-center justify-center transition-all ring-2 ${colors.ring} ring-offset-1 ring-offset-slate-900 animate-pulse`}>
          <Clock className="h-4 w-4 text-teal-300" />
        </div>
      );
    }
    return (
      <div className="h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg border-2 border-slate-600 hover:border-slate-400 flex items-center justify-center transition-all" />
    );
  }

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
        <div className="flex items-center gap-3">
          {loaded && (
            <span className="text-xs text-slate-400">
              <span className="text-white font-medium">{totalCompleted}</span> / {totalMilestones} milestones
            </span>
          )}
          {/* View toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewAndPersist("timeline")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === "timeline"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-label="Timeline view"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setViewAndPersist("checklist")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === "checklist"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-label="Checklist view"
            >
              <List className="h-3.5 w-3.5" />
              Checklist
            </button>
            <button
              onClick={() => setViewAndPersist("board")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === "board"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-label="Board view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      {loaded && totalMilestones > 0 && (
        <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${(totalCompleted / totalMilestones) * 100}%` }}
          />
        </div>
      )}

      {/* Next action + momentum — derived from roadmap state */}
      {loaded && totalMilestones > 0 && (
        <>
          <RoadmapNextAction
            next={nextAction}
            percentComplete={momentum.percentComplete}
            saving={saving !== null}
            onAdvance={cycleMilestoneStatus}
            onOpen={openMilestone}
          />
          <div className="mb-4">
            <RoadmapMomentum momentum={momentum} />
          </div>
        </>
      )}

      {/* Secondary action bar */}
      {pdfButton && (
        <div className="flex items-center justify-end mb-4">
          {pdfButton}
        </div>
      )}

      {/* Timeline view */}
      {view === "timeline" && (
        <RoadmapTimeline
          phases={phases}
          progress={progress}
          saving={saving}
          onCycleStatus={cycleMilestoneStatus}
          onSelectMilestone={(text, phaseKey, index) => {
            const phase = phases.find((p) => p.key === phaseKey);
            if (phase) setSelectedMilestone({ text, phase, index });
          }}
        />
      )}

      {/* Checklist view */}
      {view === "checklist" && (
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
                        const status = deriveStatus(item);
                        const isSaving = saving === key;
                        const isEditing = editingNote === key;
                        const hasNote = !!item?.notes;

                        return (
                          <li key={mIdx} className={`rounded-lg px-3 py-2 transition-colors ${colors.hoverBg}`}>
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); cycleMilestoneStatus(phase.key, mIdx); }}
                                disabled={isSaving}
                                className="shrink-0 cursor-pointer bg-transparent border-0 p-0"
                                aria-label={`Status: ${status}. Click to change.`}
                              >
                                <StatusIcon status={status} isSaving={isSaving} color={phase.color} />
                              </button>

                              <button
                                onClick={() => setSelectedMilestone({ text: milestone, phase, index: mIdx })}
                                className="flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0 min-h-[44px] flex items-center"
                              >
                                <span
                                  className={`text-sm leading-snug ${
                                    status === "completed"
                                      ? "text-slate-500 line-through"
                                      : status === "in-progress"
                                      ? `${colors.text} font-medium`
                                      : "text-slate-300"
                                  }`}
                                >
                                  {milestone}
                                </span>
                              </button>

                              {!isEditing && (
                                <button
                                  onClick={() => {
                                    setEditingNote(key);
                                    setNoteText(item?.notes ?? "");
                                  }}
                                  className="mt-2 shrink-0 text-slate-600 hover:text-slate-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                  aria-label="Add note"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {status === "completed" && item?.completed_at && (
                              <span className="text-[10px] text-slate-600 ml-[56px] block">
                                Completed {new Date(item.completed_at).toLocaleDateString()}
                              </span>
                            )}

                            {hasNote && !isEditing && (
                              <p className="text-xs text-slate-500 mt-1 ml-[56px] italic">{item!.notes}</p>
                            )}

                            {isEditing && (
                              <div className="mt-2 ml-[56px] flex gap-2">
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
                                  className="text-xs text-teal-400 hover:text-teal-300 px-2 min-h-[44px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingNote(null); setNoteText(""); }}
                                  className="text-xs text-slate-500 hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
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
      )}

      {/* Board view */}
      {view === "board" && (
        <RoadmapKanban
          phases={phases}
          progress={progress}
          saving={saving}
          onCycleStatus={cycleMilestoneStatus}
          onSelectMilestone={(text, phaseKey, index) => {
            const phase = phases.find((p) => p.key === phaseKey);
            if (phase) setSelectedMilestone({ text, phase, index });
          }}
        />
      )}

      {/* Milestone Detail Sheet */}
      <Sheet
        open={!!selectedMilestone}
        onOpenChange={(open) => { if (!open) setSelectedMilestone(null); }}
      >
        <SheetContent side="right" className="bg-slate-900 border-slate-700 overflow-y-auto">
          {selectedMilestone && (() => {
            const { text, phase, index } = selectedMilestone;
            const key = progressKey(phase.key, index);
            const item = progress.get(key);
            const status = deriveStatus(item);
            const colors = phaseColors[phase.color];
            const related = getRelatedSkillGaps(text);

            return (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}>
                      {phase.label}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      status === "completed"
                        ? "bg-emerald-900/40 border-emerald-700/40 text-emerald-300"
                        : status === "in-progress"
                        ? "bg-teal-900/40 border-teal-700/40 text-teal-300"
                        : "bg-slate-700/40 border-slate-600/40 text-slate-400"
                    }`}>
                      {status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Not Started"}
                    </span>
                  </div>
                  <SheetTitle className="text-white text-base">{text}</SheetTitle>
                  <SheetDescription className="text-slate-400 text-xs">
                    Target deadline: within {phase.deadline}
                  </SheetDescription>
                </SheetHeader>

                <Separator className="bg-slate-700" />

                {/* Status toggle */}
                <div className="px-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Status</p>
                  <div className="flex gap-2">
                    {(["not-started", "in-progress", "completed"] as MilestoneStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          const currentStatus = deriveStatus(progress.get(key));
                          if (s === currentStatus) return;
                          let targetCompleted = false;
                          if (s === "completed") targetCompleted = true;

                          setSaving(key);
                          setProgress((prev) => {
                            const updated = new Map(prev);
                            if (s === "not-started") {
                              updated.delete(key);
                            } else {
                              updated.set(key, {
                                phase: phase.key,
                                milestone_index: index,
                                completed: targetCompleted,
                                notes: prev.get(key)?.notes ?? null,
                                completed_at: targetCompleted ? new Date().toISOString() : null,
                              });
                            }
                            return updated;
                          });

                          fetch("/api/roadmap/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              reportId,
                              planIndex,
                              phase: phase.key,
                              milestoneIndex: index,
                              completed: targetCompleted,
                              notes: progress.get(key)?.notes ?? null,
                            }),
                          }).finally(() => setSaving(null));
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                          s === status
                            ? s === "completed"
                              ? "bg-emerald-600 text-white"
                              : s === "in-progress"
                              ? "bg-teal-600 text-white"
                              : "bg-slate-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {s === "not-started" ? "Not Started" : s === "in-progress" ? "In Progress" : "Completed"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Related skill gaps */}
                {related.length > 0 && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div className="px-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-3.5 w-3.5 text-amber-400" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Related Skill Gaps</p>
                      </div>
                      <div className="space-y-2">
                        {related.map((gap, i) => (
                          <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">{gap.skill}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${
                                gap.priority === "high"
                                  ? "bg-red-900/40 border-red-700/40 text-red-300"
                                  : gap.priority === "medium"
                                  ? "bg-amber-900/40 border-amber-700/40 text-amber-300"
                                  : "bg-emerald-900/40 border-emerald-700/40 text-emerald-300"
                              }`}>
                                {gap.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {gap.currentLevel} → {gap.requiredLevel}
                            </p>
                            {gap.resource && (
                              <p className="text-xs text-amber-300/70 mt-1">{gap.resource}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Recommended resources */}
                {recommendedResources.length > 0 && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div className="px-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Resources</p>
                      </div>
                      <div className="space-y-2">
                        {recommendedResources.slice(0, 4).map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-slate-800/80 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">{res.name}</span>
                              <ExternalLink className="h-3 w-3 text-slate-500 shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500">{res.provider}</span>
                              <span className="text-[10px] text-slate-600">·</span>
                              <span className="text-[10px] text-slate-500">{res.type}</span>
                              {res.cost && (
                                <>
                                  <span className="text-[10px] text-slate-600">·</span>
                                  <span className="text-[10px] text-emerald-400">{res.cost}</span>
                                </>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <Separator className="bg-slate-700" />
                <div className="px-4 pb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                  {item?.notes ? (
                    <p className="text-sm text-slate-300 italic">{item.notes}</p>
                  ) : (
                    <p className="text-xs text-slate-600">No notes yet. Use the pencil icon to add one.</p>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </section>
  );
}
