"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { PhaseData, MilestoneState } from "@/components/MilestoneChecklist";

interface WeeklyProgressStripProps {
  phases: PhaseData[];
  statuses: Map<string, MilestoneState>;
  reportCreatedAt: string;
}

interface BiweeklyGroup {
  weekNumber: number;
  label: string;
  milestones: { text: string; phaseKey: string; index: number }[];
  status: "completed" | "current" | "future";
}

function progressKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function chunkMilestones(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>,
  reportCreatedAt: string
): BiweeklyGroup[] {
  const sixMonthPhase = phases.find((p) => p.key === "6mo");
  if (!sixMonthPhase || sixMonthPhase.milestones.length === 0) return [];

  const milestones = sixMonthPhase.milestones.map((text, i) => ({
    text,
    phaseKey: sixMonthPhase.key,
    index: i,
    completed: statuses.get(progressKey(sixMonthPhase.key, i))?.completed ?? false,
  }));

  const groupCount = Math.min(6, Math.max(2, milestones.length));
  const perGroup = Math.ceil(milestones.length / groupCount);

  const created = new Date(reportCreatedAt).getTime();
  const elapsedWeeks = Math.max(0, (Date.now() - created) / (1000 * 60 * 60 * 24 * 7));
  const currentBiweek = Math.floor(elapsedWeeks / 2);

  const groups: BiweeklyGroup[] = [];
  for (let g = 0; g < groupCount; g++) {
    const start = g * perGroup;
    const end = Math.min(start + perGroup, milestones.length);
    const chunk = milestones.slice(start, end);

    const allCompleted = chunk.length > 0 && chunk.every((m) => m.completed);
    let status: BiweeklyGroup["status"];
    if (allCompleted) {
      status = "completed";
    } else if (g === currentBiweek || (g < currentBiweek && !allCompleted)) {
      status = "current";
    } else {
      status = g < currentBiweek ? "current" : "future";
    }

    groups.push({
      weekNumber: g + 1,
      label: `Wk ${g * 2 + 1}–${g * 2 + 2}`,
      milestones: chunk.map((m) => ({
        text: m.text,
        phaseKey: m.phaseKey,
        index: m.index,
      })),
      status,
    });
  }

  return groups;
}

export default function WeeklyProgressStrip({
  phases,
  statuses,
  reportCreatedAt,
}: WeeklyProgressStripProps) {
  const groups = useMemo(
    () => chunkMilestones(phases, statuses, reportCreatedAt),
    [phases, statuses, reportCreatedAt]
  );

  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollButtons() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [groups]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const currentIdx = groups.findIndex((g) => g.status === "current");
    if (currentIdx > 0) {
      const card = el.children[currentIdx] as HTMLElement | undefined;
      card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [groups]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  }

  if (groups.length === 0) return null;

  const completedCount = groups.filter((g) => g.status === "completed").length;
  const overallPercent = Math.round((completedCount / groups.length) * 100);

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          12-Week Progress
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            {completedCount}/{groups.length} completed
          </span>
          <div className="w-16 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable strip */}
      <div className="relative group/strip">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-slate-900 to-transparent opacity-0 group-hover/strip:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {groups.map((group) => {
            const isExpanded = expandedWeek === group.weekNumber;
            const isCurrent = group.status === "current";
            const isCompleted = group.status === "completed";
            const isFuture = group.status === "future";

            return (
              <button
                key={group.weekNumber}
                onClick={() =>
                  setExpandedWeek(isExpanded ? null : group.weekNumber)
                }
                className={`shrink-0 w-[120px] rounded-xl border p-3 text-left transition-all ${
                  isCurrent
                    ? "border-teal-500 bg-teal-950/30 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                    : isCompleted
                      ? "border-emerald-700/40 bg-emerald-950/20"
                      : "border-slate-700/40 bg-slate-800/30 opacity-60"
                }`}
              >
                {/* Week header */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-bold ${
                      isCurrent
                        ? "text-teal-300"
                        : isCompleted
                          ? "text-emerald-400"
                          : "text-slate-500"
                    }`}
                  >
                    {group.label}
                  </span>
                  {isCurrent && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                    </span>
                  )}
                  {isCompleted && (
                    <div className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1 rounded-full bg-slate-700/50 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-emerald-500 w-full"
                        : isCurrent
                          ? "bg-teal-500"
                          : "bg-slate-600"
                    }`}
                    style={{
                      width: isCompleted
                        ? "100%"
                        : isCurrent
                          ? `${Math.round(
                              (group.milestones.filter((m) =>
                                statuses.get(progressKey(m.phaseKey, m.index))
                                  ?.completed
                              ).length /
                                Math.max(group.milestones.length, 1)) *
                                100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>

                {/* Action count */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] ${
                      isFuture ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {group.milestones.length} action
                    {group.milestones.length !== 1 ? "s" : ""}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-slate-900 to-transparent opacity-0 group-hover/strip:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Expanded actions panel */}
      {expandedWeek !== null && (
        <div className="mt-2 bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {(() => {
            const group = groups.find((g) => g.weekNumber === expandedWeek);
            if (!group) return null;
            return (
              <>
                <h4 className="text-xs font-bold text-slate-300 mb-2">
                  {group.label} — Actions
                </h4>
                <ul className="space-y-1.5">
                  {group.milestones.map((m) => {
                    const completed =
                      statuses.get(progressKey(m.phaseKey, m.index))
                        ?.completed ?? false;
                    return (
                      <li
                        key={`${m.phaseKey}:${m.index}`}
                        className="flex items-start gap-2"
                      >
                        {completed ? (
                          <div className="h-4 w-4 mt-0.5 shrink-0 rounded-full bg-emerald-600 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 mt-0.5 shrink-0 rounded-full border border-slate-600" />
                        )}
                        <span
                          className={`text-[12px] leading-relaxed ${
                            completed
                              ? "text-slate-500 line-through"
                              : "text-slate-300"
                          }`}
                        >
                          {m.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
