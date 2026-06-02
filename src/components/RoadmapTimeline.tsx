"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronDown, Clock, Loader2, BookOpen, Target, Briefcase, Users, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

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
  onSelectMilestone?: (text: string, phaseKey: string, index: number) => void;
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
    cardBorder: "border-emerald-700/40",
    hoverBg: "hover:bg-emerald-900/20",
    text: "text-emerald-400",
    pillBg: "bg-emerald-600",
    pillText: "text-emerald-100",
    pillInactive: "text-emerald-400 border-emerald-700/40",
    glowRing: "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
    bannerBg: "bg-emerald-900/80 border-emerald-500/40",
    bannerText: "text-emerald-300",
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
    cardBorder: "border-teal-700/40",
    hoverBg: "hover:bg-teal-900/20",
    text: "text-teal-400",
    pillBg: "bg-teal-600",
    pillText: "text-teal-100",
    pillInactive: "text-teal-400 border-teal-700/40",
    glowRing: "shadow-[0_0_12px_rgba(20,184,166,0.5)]",
    bannerBg: "bg-teal-900/80 border-teal-500/40",
    bannerText: "text-teal-300",
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
    cardBorder: "border-cyan-700/40",
    hoverBg: "hover:bg-cyan-900/20",
    text: "text-cyan-400",
    pillBg: "bg-cyan-600",
    pillText: "text-cyan-100",
    pillInactive: "text-cyan-400 border-cyan-700/40",
    glowRing: "shadow-[0_0_12px_rgba(6,182,212,0.5)]",
    bannerBg: "bg-cyan-900/80 border-cyan-500/40",
    bannerText: "text-cyan-300",
  },
} as const;

type MilestoneType = "learn" | "achieve" | "do" | "connect";

const TYPE_META: Record<MilestoneType, { icon: typeof BookOpen; label: string }> = {
  learn: { icon: BookOpen, label: "Learn" },
  achieve: { icon: Target, label: "Achieve" },
  do: { icon: Briefcase, label: "Do" },
  connect: { icon: Users, label: "Connect" },
};

const LEARN_KW = ["learn", "study", "course", "read", "research", "understand", "training", "education", "tutorial", "book", "watch"];
const ACHIEVE_KW = ["achieve", "earn", "obtain", "pass", "certif", "goal", "launch", "publish", "ship", "release", "degree", "award"];
const CONNECT_KW = ["network", "connect", "mentor", "community", "meetup", "conference", "linkedin", "attend", "join", "collaborate", "reach out", "contact", "interview"];

function classifyMilestone(text: string): MilestoneType {
  const lower = text.toLowerCase();
  if (CONNECT_KW.some((k) => lower.includes(k))) return "connect";
  if (LEARN_KW.some((k) => lower.includes(k))) return "learn";
  if (ACHIEVE_KW.some((k) => lower.includes(k))) return "achieve";
  return "do";
}

function pKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function deriveStatus(item: MilestoneProgress | undefined): MilestoneStatus {
  if (!item) return "not-started";
  if (item.completed) return "completed";
  return "in-progress";
}

function CheckmarkSvg({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline
        points="3.5 8.5 6.5 11.5 12.5 5"
        className={`text-white ${animate ? "milestone-check-draw" : ""}`}
        style={animate ? { strokeDasharray: 16, strokeDashoffset: 0 } : undefined}
      />
    </svg>
  );
}

function StatusIcon({ status, isSaving, color, justCompleted }: { status: MilestoneStatus; isSaving: boolean; color: keyof typeof C; justCompleted: boolean }) {
  const c = C[color];
  if (isSaving) {
    return (
      <div className="h-[44px] w-[44px] min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0">
        <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className={`h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg ${c.checkBg} border-2 ${c.checkBorder} flex items-center justify-center shrink-0 transition-all ${justCompleted ? "milestone-bounce" : ""}`}>
        <CheckmarkSvg animate={justCompleted} />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className={`h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg border-2 ${c.checkBorder} flex items-center justify-center shrink-0 transition-all`}>
        <Clock className="h-3.5 w-3.5 text-slate-300" />
      </div>
    );
  }
  return (
    <div className="h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-lg border-2 border-slate-600 hover:border-slate-400 flex items-center justify-center shrink-0 transition-all" />
  );
}

function PhaseNavBar({
  phases,
  phaseDoneMap,
  activePhaseKey,
  onClickPhase,
}: {
  phases: TimelinePhase[];
  phaseDoneMap: Map<string, { done: number; total: number }>;
  activePhaseKey: string;
  onClickPhase: (key: string) => void;
}) {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-slate-900/70 border-b border-slate-700/50 -mx-1 px-1 py-2 mb-4 flex gap-2">
      {phases.map((phase) => {
        const c = C[phase.color];
        const stats = phaseDoneMap.get(phase.key) ?? { done: 0, total: 0 };
        const isActive = activePhaseKey === phase.key;

        return (
          <button
            key={phase.key}
            onClick={() => onClickPhase(phase.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              isActive
                ? `${c.pillBg} ${c.pillText} border-transparent shadow-md`
                : `bg-transparent ${c.pillInactive} hover:bg-slate-800/60`
            }`}
          >
            <span>{phase.label}</span>
            <span className={`text-[10px] ${isActive ? "opacity-80" : "opacity-60"}`}>
              {stats.done}/{stats.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PhaseCompleteBanner({ phase, show }: { phase: TimelinePhase; show: boolean }) {
  const c = C[phase.color];
  if (!show) return null;
  return (
    <div className={`phase-complete-banner ${c.bannerBg} border rounded-lg px-4 py-2 mb-2 flex items-center gap-2`}>
      <Check className={`h-4 w-4 ${c.bannerText}`} />
      <span className={`text-sm font-medium ${c.bannerText}`}>
        {phase.label} Complete!
      </span>
    </div>
  );
}

export default function RoadmapTimeline({ phases, progress = new Map(), saving = null, onCycleStatus, onSelectMilestone }: RoadmapTimelineProps) {
  const totalMilestones = phases.reduce((s, p) => s + p.milestones.length, 0);
  const totalCompleted = phases.reduce((s, p) => {
    let done = 0;
    for (let i = 0; i < p.milestones.length; i++) {
      if (progress.get(pKey(p.key, i))?.completed) done++;
    }
    return s + done;
  }, 0);
  const overallPct = totalMilestones > 0 ? (totalCompleted / totalMilestones) * 100 : 0;

  const [celebratingPhase, setCelebratingPhase] = useState<string | null>(null);
  const [bannerPhase, setBannerPhase] = useState<string | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const [activePhaseKey, setActivePhaseKey] = useState<string>(phases[0]?.key ?? "");
  const [openPhases, setOpenPhases] = useState<Set<string>>(() => new Set(phases.length > 0 ? [phases[0].key] : []));
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const prevProgressRef = useRef<Map<string, MilestoneProgress>>(new Map());
  const phaseRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const phaseDoneMap = new Map<string, { done: number; total: number }>();
  for (const phase of phases) {
    let done = 0;
    for (let i = 0; i < phase.milestones.length; i++) {
      if (progress.get(pKey(phase.key, i))?.completed) done++;
    }
    phaseDoneMap.set(phase.key, { done, total: phase.milestones.length });
  }

  useEffect(() => {
    const newlyCompleted = new Set<string>();
    for (const [key, val] of progress) {
      const prev = prevProgressRef.current.get(key);
      if (val.completed && !prev?.completed) {
        newlyCompleted.add(key);
      }
    }
    if (newlyCompleted.size > 0) {
      setRecentlyCompleted(newlyCompleted);
      const timer = setTimeout(() => setRecentlyCompleted(new Set()), 400);
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = new Map(progress);
  }, [progress]);

  useEffect(() => {
    const nowComplete = new Set<string>();
    for (const phase of phases) {
      let done = 0;
      for (let i = 0; i < phase.milestones.length; i++) {
        if (progress.get(pKey(phase.key, i))?.completed) done++;
      }
      if (done === phase.milestones.length && phase.milestones.length > 0) {
        nowComplete.add(phase.key);
      }
    }
    for (const key of nowComplete) {
      if (!prevCompletedRef.current.has(key)) {
        setCelebratingPhase(key);
        setBannerPhase(key);
        const confettiTimer = setTimeout(() => setCelebratingPhase(null), 700);
        const bannerTimer = setTimeout(() => setBannerPhase(null), 2000);
        return () => { clearTimeout(confettiTimer); clearTimeout(bannerTimer); };
      }
    }
    prevCompletedRef.current = nowComplete;
  }, [progress, phases]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute("data-phase-key");
            if (key) setActivePhaseKey(key);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    for (const [, el] of phaseRefs.current) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [phases]);

  const scrollToPhase = useCallback((key: string) => {
    const el = phaseRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpenPhases((prev) => new Set(prev).add(key));
    }
  }, []);

  const findCurrentPhaseKey = useCallback((): string | null => {
    for (const phase of phases) {
      const stats = phaseDoneMap.get(phase.key);
      if (stats && stats.done < stats.total) return phase.key;
    }
    return null;
  }, [phases, phaseDoneMap]);

  const currentPhaseKey = findCurrentPhaseKey();

  return (
    <div className="relative" role="list" aria-label="Career roadmap timeline" ref={containerRef}>
      {/* Sticky phase nav bar */}
      <PhaseNavBar
        phases={phases}
        phaseDoneMap={phaseDoneMap}
        activePhaseKey={activePhaseKey}
        onClickPhase={scrollToPhase}
      />

      {/* Timeline spine */}
      <div
        className="absolute left-5 md:left-[19px] top-12 bottom-0 w-0.5 md:w-1 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-slate-700/40" />
        <div
          className="absolute inset-x-0 top-0 rounded-full transition-all duration-700"
          style={{
            height: `${overallPct}%`,
            background: "linear-gradient(to bottom, #10b981, #14b8a6, #06b6d4)",
          }}
        />
      </div>

      {phases.map((phase, phaseIdx) => {
        const c = C[phase.color];
        const isLast = phaseIdx === phases.length - 1;
        const isCurrentPhase = currentPhaseKey === phase.key;
        const isOpen = openPhases.has(phase.key);

        let doneCount = 0;
        const items = phase.milestones.map((text, i) => {
          const key = pKey(phase.key, i);
          const status = deriveStatus(progress.get(key));
          if (status === "completed") doneCount++;
          return { text, i, key, status, type: classifyMilestone(text) };
        });
        const pct = phase.milestones.length > 0 ? Math.round((doneCount / phase.milestones.length) * 100) : 0;
        const allDone = doneCount === phase.milestones.length && phase.milestones.length > 0;
        const isCelebrating = celebratingPhase === phase.key;
        const showBanner = bannerPhase === phase.key;

        const nextUncompleted = items.find((it) => it.status !== "completed");

        const grouped = new Map<MilestoneType, typeof items>();
        for (const item of items) {
          const group = grouped.get(item.type) ?? [];
          group.push(item);
          grouped.set(item.type, group);
        }
        const typeOrder: MilestoneType[] = ["learn", "achieve", "do", "connect"];

        return (
          <div
            key={phase.key}
            ref={(el) => { if (el) phaseRefs.current.set(phase.key, el); }}
            data-phase-key={phase.key}
            className={`relative flex gap-4 md:gap-6 ${isLast ? "" : "pb-6"} scroll-mt-16`}
            role="listitem"
          >
            {/* Phase node on spine — clickable with hover/pulse */}
            <div className="flex flex-col items-center shrink-0 z-10 pt-1">
              <button
                onClick={() => {
                  scrollToPhase(phase.key);
                  setOpenPhases((prev) => {
                    const next = new Set(prev);
                    if (next.has(phase.key)) next.delete(phase.key);
                    else next.add(phase.key);
                    return next;
                  });
                }}
                className="relative cursor-pointer bg-transparent border-0 p-0 group"
                aria-label={`${phase.label}: ${doneCount}/${phase.milestones.length} complete. Click to expand.`}
              >
                {isCurrentPhase && !allDone && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-30 border-2 border-current" style={{ color: phase.color === "emerald" ? "#10b981" : phase.color === "teal" ? "#14b8a6" : "#06b6d4" }} />
                )}
                <div
                  className={`relative h-10 w-10 rounded-full border-2 ${c.nodeBorder} ${allDone ? c.nodeBg : "bg-slate-800"} shadow-lg ${c.nodeGlow} flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:${c.glowRing}`}
                >
                  {allDone ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className={`text-xs font-bold ${c.nodeText}`}>{phaseIdx + 1}</span>
                  )}
                </div>
              </button>
            </div>

            {/* Horizontal connector (desktop only) */}
            <div className="hidden md:flex items-start pt-[18px] shrink-0" aria-hidden="true">
              <div className={`w-4 h-0.5 ${allDone ? c.connector : "bg-slate-700/60"} rounded-full transition-colors duration-300`} />
            </div>

            {/* Phase card */}
            <div className="flex-1 min-w-0">
              <PhaseCompleteBanner phase={phase} show={showBanner} />
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => {
                  setOpenPhases((prev) => {
                    const next = new Set(prev);
                    if (open) next.add(phase.key); else next.delete(phase.key);
                    return next;
                  });
                }}
              >
                <div
                  className={`relative bg-slate-800/60 border ${allDone ? c.cardBorder : "border-slate-700"} rounded-xl overflow-hidden transition-all ${allDone ? "card-glow glow-active" : ""} ${isCelebrating ? "phase-confetti" : ""}`}
                >
                  <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer group">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-base font-heading font-bold ${c.nodeText}`}>{phase.label}</h4>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.badge}`}>
                          {doneCount}/{phase.milestones.length}
                        </span>
                        {allDone && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-400">
                            Complete
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 ml-auto hidden sm:inline">
                          {phase.deadline}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-700/50 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.progressBar} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[panel-open]:rotate-180 shrink-0" />
                  </CollapsibleTrigger>

                  {/* Collapsed summary: next uncompleted milestone preview */}
                  {!isOpen && nextUncompleted && (
                    <div className="px-4 pb-3 flex items-center gap-2 text-xs text-slate-400">
                      <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">
                        Next: <span className={c.text}>{nextUncompleted.text}</span>
                      </span>
                    </div>
                  )}

                  <CollapsibleContent className="overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0">
                    <div className="px-4 pb-4 space-y-4">
                      {typeOrder.map((type) => {
                        const group = grouped.get(type);
                        if (!group || group.length === 0) return null;
                        const meta = TYPE_META[type];
                        const Icon = meta.icon;

                        return (
                          <div key={type}>
                            <div className="flex items-center gap-2 mb-2 mt-1">
                              <Icon className={`h-3.5 w-3.5 ${c.text}`} />
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{meta.label}</span>
                            </div>
                            <div className="space-y-1.5">
                              {group.map(({ text, i, key, status }) => {
                                const isSaving = saving === key;
                                const justCompleted = recentlyCompleted.has(key);
                                return (
                                  <div key={i} className={`flex items-start gap-3 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3 py-2.5 ${c.hoverBg} transition-colors`}>
                                    <button
                                      onClick={() => onCycleStatus?.(phase.key, i)}
                                      disabled={isSaving || !onCycleStatus}
                                      className={`shrink-0 bg-transparent border-0 p-0 mt-0.5 ${onCycleStatus ? "cursor-pointer" : "cursor-default"}`}
                                      aria-label={`${text}: ${status}${onCycleStatus ? ". Click to change." : ""}`}
                                    >
                                      <StatusIcon status={status} isSaving={isSaving} color={phase.color} justCompleted={justCompleted} />
                                    </button>
                                    <button
                                      onClick={() => onSelectMilestone?.(text, phase.key, i)}
                                      className="flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0 min-h-[44px] flex items-center"
                                    >
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
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>
        );
      })}
    </div>
  );
}
