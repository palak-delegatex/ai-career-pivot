"use client";

import type { SkillDelta } from "@/lib/intake";
import { CheckCircle2, CircleDashed, Circle, ArrowRight } from "lucide-react";

// AIC-829: surfaces the MEASURED current-vs-target skill delta that the roadmap
// is derived from — the top-10 target-role skills scored against the user's
// actual background, plus the milestone that closes each measured gap. This is
// the pivoter wedge made visible: milestones map to specific gaps, not generic
// advice.

const STATUS_META = {
  have: {
    label: "You have this",
    icon: CheckCircle2,
    pill: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
    dot: "text-emerald-400",
  },
  partial: {
    label: "Transferable",
    icon: CircleDashed,
    pill: "bg-amber-900/40 border-amber-700/40 text-amber-300",
    dot: "text-amber-400",
  },
  gap: {
    label: "Gap to close",
    icon: Circle,
    pill: "bg-rose-900/40 border-rose-700/40 text-rose-300",
    dot: "text-rose-400",
  },
} as const;

const PHASE_LABEL: Record<string, string> = {
  "6-month": "6 Months",
  "1-year": "1 Year",
  "2-year": "2 Years",
};

export default function SkillDeltaPanel({
  skillDelta,
  targetRole,
}: {
  skillDelta: SkillDelta;
  targetRole?: string;
}) {
  const skills = skillDelta.targetTopSkills ?? [];
  if (skills.length === 0) return null;

  const closingBySkill = new Map<string, { phase: string; milestone: string }>();
  for (const c of skillDelta.closingMilestones ?? []) {
    if (c?.gapSkill && !closingBySkill.has(c.gapSkill)) {
      closingBySkill.set(c.gapSkill, { phase: c.phase, milestone: c.milestone });
    }
  }

  const total = skills.length;
  const have = skillDelta.haveCount ?? skills.filter((s) => s.status === "have").length;
  const partial = skillDelta.partialCount ?? skills.filter((s) => s.status === "partial").length;
  const gap = skillDelta.gapCount ?? skills.filter((s) => s.status === "gap").length;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-bold text-teal-400">
          Measured Skill Delta
          {targetRole ? <span className="text-slate-500 font-medium"> · {targetRole}</span> : null}
        </h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        The {total} skills this role needs most, scored against your actual background — your roadmap is built to close each gap.
      </p>

      {/* Delta summary bar */}
      <div className="flex items-center gap-2 mb-5" role="img" aria-label={`${have} skills you have, ${partial} transferable, ${gap} gaps to close`}>
        {have > 0 && (
          <div className="h-2 rounded-full bg-emerald-500" style={{ flexGrow: have }} />
        )}
        {partial > 0 && (
          <div className="h-2 rounded-full bg-amber-500" style={{ flexGrow: partial }} />
        )}
        {gap > 0 && (
          <div className="h-2 rounded-full bg-rose-500" style={{ flexGrow: gap }} />
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs mb-5">
        <span className="text-emerald-300"><span className="font-bold">{have}</span> already have</span>
        <span className="text-amber-300"><span className="font-bold">{partial}</span> transferable</span>
        <span className="text-rose-300"><span className="font-bold">{gap}</span> to close</span>
      </div>

      {/* Per-skill breakdown */}
      <ul className="space-y-2.5">
        {skills.map((s, i) => {
          const meta = STATUS_META[s.status] ?? STATUS_META.gap;
          const Icon = meta.icon;
          const closing = closingBySkill.get(s.skill);
          return (
            <li key={`${s.skill}-${i}`} className="flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-white">{s.skill}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${meta.pill}`}>
                    {meta.label}
                  </span>
                  {s.importance === "critical" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-slate-600 text-slate-400">
                      critical
                    </span>
                  )}
                </div>
                {s.evidence && (
                  <p className="text-xs text-slate-400 mt-0.5">{s.evidence}</p>
                )}
                {closing && s.status !== "have" && (
                  <div className="flex items-start gap-1.5 mt-1.5 text-xs text-teal-300/90">
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-500" />
                    <span>
                      <span className="text-slate-500">Closed by {PHASE_LABEL[closing.phase] ?? closing.phase}:</span>{" "}
                      {closing.milestone}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
