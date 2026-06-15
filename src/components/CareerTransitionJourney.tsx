"use client";

import {
  ClipboardCheck,
  Compass,
  BookOpen,
  Send,
  Flag,
  Check,
  ChevronRight,
} from "lucide-react";
import type { PivotPlan, SkillGap } from "@/lib/intake";
import type { PhaseData, MilestoneState } from "@/components/MilestoneChecklist";

interface CareerTransitionJourneyProps {
  currentRole: string;
  targetRole: string;
  phases: PhaseData[];
  statuses: Map<string, MilestoneState>;
  plan: PivotPlan;
  reportCreatedAt: string;
}

type StageStatus = "completed" | "active" | "future";

interface Stage {
  key: string;
  label: string;
  sublabel: string;
  icon: typeof ClipboardCheck;
}

const STAGES: Stage[] = [
  { key: "assessment", label: "Assessment", sublabel: "Know yourself", icon: ClipboardCheck },
  { key: "planning", label: "Planning", sublabel: "Chart your path", icon: Compass },
  { key: "skill-building", label: "Skill Building", sublabel: "Close the gap", icon: BookOpen },
  { key: "applying", label: "Applying", sublabel: "Get noticed", icon: Send },
  { key: "transitioning", label: "Transitioning", sublabel: "Make the move", icon: Flag },
];

function progressKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function computeSkillStats(skillGaps: SkillGap[]) {
  let acquired = 0;
  let transferable = 0;
  let gap = 0;
  for (const sg of skillGaps) {
    if (sg.transferCategory === "direct-transfer") acquired++;
    else if (sg.transferCategory === "partial-transfer") transferable++;
    else gap++;
  }
  return { acquired, transferable, gap, total: skillGaps.length };
}

function computeStageStatuses(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>
): StageStatus[] {
  const totalMilestones = phases.reduce((s, p) => s + p.milestones.length, 0);
  let completed = 0;
  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      if (statuses.get(progressKey(phase.key, i))?.completed) completed++;
    }
  }
  const pct = totalMilestones > 0 ? completed / totalMilestones : 0;

  // Stages 1-2 are auto-completed (report + plan exist if user is on dashboard)
  // Stages 3-5 map to progress
  if (pct >= 1) return ["completed", "completed", "completed", "completed", "completed"];
  if (pct >= 0.75) return ["completed", "completed", "completed", "completed", "active"];
  if (pct >= 0.5) return ["completed", "completed", "completed", "active", "future"];
  // Default: assessment + planning done, skill building active
  return ["completed", "completed", "active", "future", "future"];
}

function computeOverallPercent(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>
): number {
  const total = phases.reduce((s, p) => s + p.milestones.length, 0);
  if (total === 0) return 0;
  let done = 0;
  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      if (statuses.get(progressKey(phase.key, i))?.completed) done++;
    }
  }
  return Math.round((done / total) * 100);
}

function computeActiveStageProgress(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>,
  stageStatuses: StageStatus[]
): number {
  const activeIdx = stageStatuses.indexOf("active");
  if (activeIdx === -1) return 100;

  if (activeIdx <= 1) return 100; // assessment/planning always complete

  // For skill-building (idx 2), use 6mo phase progress
  // For applying (idx 3), use 1yr phase progress
  // For transitioning (idx 4), use 2yr phase progress
  const phaseIdx = activeIdx - 2;
  const phase = phases[phaseIdx];
  if (!phase || phase.milestones.length === 0) return 0;

  let done = 0;
  for (let i = 0; i < phase.milestones.length; i++) {
    if (statuses.get(progressKey(phase.key, i))?.completed) done++;
  }
  return Math.round((done / phase.milestones.length) * 100);
}

function computeTrackFill(stageStatuses: StageStatus[]): number {
  const activeIdx = stageStatuses.indexOf("active");
  if (activeIdx === -1) return 100;
  // Each of 5 nodes is at 0%, 25%, 50%, 75%, 100% of the track
  return activeIdx * 25;
}

function computeTimeElapsed(reportCreatedAt: string): string {
  const months =
    (Date.now() - new Date(reportCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months < 1) return `${Math.max(1, Math.round(months * 4.3))} wk`;
  if (months < 12) return `${months.toFixed(1)} mo`;
  return `${(months / 12).toFixed(1)} yr`;
}

function computeCompletedMilestones(
  phases: PhaseData[],
  statuses: Map<string, MilestoneState>
): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  for (const phase of phases) {
    total += phase.milestones.length;
    for (let i = 0; i < phase.milestones.length; i++) {
      if (statuses.get(progressKey(phase.key, i))?.completed) completed++;
    }
  }
  return { completed, total };
}

function SkillRing({ skillGaps }: { skillGaps: SkillGap[] }) {
  const { acquired, transferable, total } = computeSkillStats(skillGaps);
  if (total === 0) return null;

  const r = 24;
  const circumference = 2 * Math.PI * r;
  const acquiredLen = (acquired / total) * circumference;
  const transferableLen = (transferable / total) * circumference;
  const gap = total - acquired - transferable;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
          <circle
            cx={28} cy={28} r={r}
            fill="none" stroke="rgb(30,41,59)" strokeWidth={4}
          />
          <circle
            cx={28} cy={28} r={r}
            fill="none" stroke="rgb(16,185,129)" strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${acquiredLen} ${circumference - acquiredLen}`}
            strokeDashoffset={0}
            className="transition-all duration-1000"
          />
          <circle
            cx={28} cy={28} r={r}
            fill="none" stroke="rgb(245,158,11)" strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${transferableLen} ${circumference - transferableLen}`}
            strokeDashoffset={-acquiredLen}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-slate-100">
          {acquired}/{total}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-bold text-slate-100 mb-1.5">Skills Progress</div>
        <div className="flex flex-wrap gap-2.5">
          <span className="flex items-center gap-1 text-[0.6875rem] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            {acquired} Acquired
          </span>
          <span className="flex items-center gap-1 text-[0.6875rem] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            {transferable} Transferable
          </span>
          <span className="flex items-center gap-1 text-[0.6875rem] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-700 flex-shrink-0" />
            {gap} Remaining
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CareerTransitionJourney({
  currentRole,
  targetRole,
  phases,
  statuses,
  plan,
  reportCreatedAt,
}: CareerTransitionJourneyProps) {
  const stageStatuses = computeStageStatuses(phases, statuses);
  const overallPct = computeOverallPercent(phases, statuses);
  const activeIdx = stageStatuses.indexOf("active");
  const activeStage = activeIdx >= 0 ? STAGES[activeIdx] : null;
  const activeStageProgress = computeActiveStageProgress(phases, statuses, stageStatuses);
  const trackFill = computeTrackFill(stageStatuses);
  const { completed, total } = computeCompletedMilestones(phases, statuses);
  const timeElapsed = computeTimeElapsed(reportCreatedAt);
  const skillGaps = plan.skillGaps ?? [];

  const nextActions = (plan.weekOneActions ?? []).slice(0, 3);

  return (
    <div
      className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-8 overflow-hidden"
      role="region"
      aria-label="Career transition journey"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-br from-teal-600/20 to-transparent pointer-events-none z-0" />

      <div className="relative z-[1]">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-[3px] h-6 rounded-sm bg-gradient-to-b from-teal-600 to-teal-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Your Career Pivot Journey</h2>
          <span className="ml-auto text-[0.8125rem] text-slate-500">{overallPct}% complete</span>
        </div>

        {/* Role Bridge */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">Current</span>
            <span className="text-[0.9375rem] font-bold text-slate-100 truncate">{currentRole}</span>
          </div>
          <div className="flex-1 min-w-[2rem] h-px relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-600 to-slate-500" />
            <span className="absolute -top-5 left-[42%] -translate-x-1/2 text-[0.6875rem] font-bold text-teal-400 bg-gray-950 px-1.5 whitespace-nowrap">
              {overallPct}% there
            </span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 text-right">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">Target</span>
            <span className="text-[0.9375rem] font-bold text-teal-400 truncate">{targetRole}</span>
          </div>
        </div>

        {/* Desktop Journey Path */}
        <div className="hidden sm:block relative px-2 mb-8" role="list" aria-label="Journey stages">
          <div className="relative h-32 flex items-center">
            {/* Track */}
            <div className="absolute top-1/2 left-7 right-7 h-1 rounded-sm bg-slate-700 -translate-y-1/2">
              <div
                className="h-full rounded-sm bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-1000"
                style={{ width: `${trackFill}%` }}
              />
            </div>

            {/* Nodes */}
            <div className="relative flex justify-between w-full z-[2]">
              {STAGES.map((stage, i) => {
                const status = stageStatuses[i];
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.key}
                    className={`flex flex-col items-center gap-2.5 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5`}
                    role="listitem"
                    aria-label={`${stage.label} stage, ${status}`}
                    aria-current={status === "active" ? "step" : undefined}
                  >
                    {status === "active" && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[0.5625rem] font-bold uppercase tracking-wider text-teal-400 bg-teal-600/15 px-2 py-0.5 rounded-full border border-teal-600/30 whitespace-nowrap">
                        You are here
                      </span>
                    )}
                    <div
                      className={`flex items-center justify-center rounded-full border-[2.5px] transition-all duration-300 ${
                        status === "completed"
                          ? "w-12 h-12 bg-emerald-500 border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                          : status === "active"
                            ? "w-[3.75rem] h-[3.75rem] bg-teal-600/10 border-teal-400 border-[3px] shadow-[0_0_0_6px_rgba(13,148,136,0.15),0_0_24px_rgba(13,148,136,0.3)] animate-[pulse-ring_2.5s_ease-in-out_infinite]"
                            : "w-12 h-12 bg-slate-900 border-slate-700 opacity-70"
                      }`}
                    >
                      {status === "completed" ? (
                        <Check className="w-[1.125rem] h-[1.125rem] text-white" strokeWidth={2.5} />
                      ) : (
                        <Icon
                          className={`transition-colors duration-300 ${
                            status === "active"
                              ? "w-[1.375rem] h-[1.375rem] text-teal-400"
                              : "w-[1.125rem] h-[1.125rem] text-slate-500"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold text-center whitespace-nowrap transition-colors duration-300 ${
                        status === "completed"
                          ? "text-emerald-500 font-semibold"
                          : status === "active"
                            ? "text-teal-400 font-bold"
                            : "text-slate-500"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Journey Path */}
        <div className="block sm:hidden mb-6" role="list" aria-label="Journey stages">
          <div className="relative pl-10">
            <div className="absolute top-0 bottom-0 left-[1.125rem] w-0.5 bg-slate-800" />
            {STAGES.map((stage, i) => {
              const status = stageStatuses[i];
              const Icon = stage.icon;
              return (
                <div
                  key={stage.key}
                  className={`relative flex items-start gap-3 ${i < STAGES.length - 1 ? "pb-5" : ""}`}
                  role="listitem"
                  aria-current={status === "active" ? "step" : undefined}
                >
                  <div
                    className={`absolute -left-10 top-0.5 flex items-center justify-center rounded-full border-2 z-[2] ${
                      status === "completed"
                        ? "w-6 h-6 bg-emerald-500 border-emerald-500"
                        : status === "active"
                          ? "w-7 h-7 -left-[2.625rem] border-teal-600 shadow-[0_0_0_3px_rgba(13,148,136,0.15)] animate-[pulse-ring_2.5s_ease-in-out_infinite]"
                          : "w-6 h-6 border-slate-800 bg-slate-900"
                    }`}
                  >
                    {status === "completed" ? (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    ) : (
                      <Icon
                        className={`${
                          status === "active"
                            ? "w-3 h-3 text-teal-400"
                            : "w-2.5 h-2.5 text-slate-500"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pt-px">
                    <span
                      className={`text-[0.8125rem] font-semibold ${
                        status === "completed"
                          ? "text-emerald-500"
                          : status === "active"
                            ? "text-teal-400 font-bold"
                            : "text-slate-500"
                      }`}
                    >
                      {stage.label}
                    </span>
                    <span className="text-[0.6875rem] text-slate-500">
                      {status === "active" && activeStageProgress > 0
                        ? `${stage.sublabel} — ${activeStageProgress}% complete`
                        : stage.sublabel}
                    </span>
                    {status === "active" && (
                      <span className="inline-block w-fit text-[0.5625rem] font-bold uppercase tracking-wider text-teal-400 bg-teal-600/12 px-1.5 py-px rounded-full border border-teal-600/25 mt-1">
                        You are here
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Stage Panel */}
        {activeStage && (
          <div className="bg-teal-600/[0.06] border border-teal-600/20 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-teal-400">
                  Stage {activeIdx + 1} of 5
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  {activeStage.label}: {activeStage.sublabel.charAt(0).toUpperCase() + activeStage.sublabel.slice(1)}
                </h3>
              </div>
            </div>
            <p className="text-[0.8125rem] text-slate-400 leading-relaxed mb-4">
              You&apos;re actively closing the skill gap between your {currentRole.toLowerCase()} background and {targetRole}.
              Focus on completing key certifications and building portfolio projects that demonstrate domain expertise.
            </p>

            {/* Stage Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Stage Progress</span>
                <span className="text-xs font-bold text-teal-400">{activeStageProgress}%</span>
              </div>
              <div className="h-1.5 bg-teal-600/15 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-800"
                  style={{ width: `${activeStageProgress}%` }}
                />
              </div>
            </div>

            {/* Skill Gap Ring */}
            {skillGaps.length > 0 && (
              <div className="mb-4">
                <SkillRing skillGaps={skillGaps} />
              </div>
            )}

            {/* Next Actions */}
            {nextActions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Recommended Next
                </div>
                {nextActions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl transition-colors hover:border-teal-600/30 hover:bg-teal-600/[0.04] cursor-pointer"
                    tabIndex={0}
                    role="button"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8125rem] font-medium text-slate-100 leading-snug">
                        {action.title}
                      </div>
                      <div className="text-[0.6875rem] text-slate-500 mt-0.5">
                        {action.timeEstimate} · {action.difficulty === "easy" ? "Quick win" : action.difficulty === "medium" ? "Medium priority" : "High priority"}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1 transition-colors group-hover:text-teal-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">Time Elapsed</span>
            <span className="text-xl font-extrabold text-slate-100 leading-none">{timeElapsed}</span>
            <span className="text-[0.6875rem] text-slate-500">of {plan.estimatedTimeToTransition || "plan"}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">Milestones</span>
            <span className="text-xl font-extrabold text-slate-100 leading-none">{completed}/{total}</span>
            <span className="text-[0.6875rem] text-slate-500">completed</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">Projected</span>
            <span className="text-xl font-extrabold text-emerald-500 leading-none">
              {overallPct >= 50 ? "On Track" : overallPct >= 25 ? "Building" : "Starting"}
            </span>
            <span className="text-[0.6875rem] text-slate-500">Est. {plan.estimatedTimeToTransition || "TBD"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
