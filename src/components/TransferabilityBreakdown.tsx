"use client";

import { useEffect, useState } from "react";
import type { SkillGap } from "@/lib/intake";

const CATEGORY_CONFIG = {
  "direct-transfer": {
    label: "Direct Transfer",
    color: "bg-emerald-500",
    badgeClass: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
    ringColor: "text-emerald-400",
  },
  "partial-transfer": {
    label: "Partial Transfer",
    color: "bg-amber-500",
    badgeClass: "bg-amber-900/40 border-amber-700/40 text-amber-300",
    ringColor: "text-amber-400",
  },
  "new-skill": {
    label: "New Skill",
    color: "bg-red-500",
    badgeClass: "bg-red-900/40 border-red-700/40 text-red-300",
    ringColor: "text-red-400",
  },
} as const;

function computeStats(gaps: SkillGap[]) {
  const categorized = gaps.filter((g) => g.transferCategory);
  const direct = categorized.filter((g) => g.transferCategory === "direct-transfer").length;
  const partial = categorized.filter((g) => g.transferCategory === "partial-transfer").length;
  const newSkill = categorized.filter((g) => g.transferCategory === "new-skill").length;
  const total = categorized.length || 1;
  const avgScore = categorized.length
    ? Math.round(categorized.reduce((sum, g) => sum + (g.transferabilityScore ?? 0), 0) / categorized.length)
    : 0;
  return { direct, partial, newSkill, total, avgScore };
}

export default function TransferabilityBreakdown({ skillGaps }: { skillGaps: SkillGap[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const categorized = skillGaps.filter((g) => g.transferCategory);
  if (categorized.length === 0) return null;

  const stats = computeStats(skillGaps);

  const groups: Record<string, SkillGap[]> = {
    "direct-transfer": [],
    "partial-transfer": [],
    "new-skill": [],
  };
  for (const gap of categorized) {
    groups[gap.transferCategory!].push(gap);
  }

  return (
    <div className="bg-slate-800/60 border border-emerald-700/40 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-emerald-400 mb-1">
        Skill Transferability Analysis
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        What you already bring vs. what you&apos;ll need to learn
      </p>

      {/* Summary bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-300">
            Overall Transferability
          </span>
          <span className="text-sm font-bold text-white">{stats.avgScore}%</span>
        </div>
        <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-700 ease-out"
            style={{
              width: animated
                ? `${(stats.direct / stats.total) * 100}%`
                : "0%",
            }}
          />
          <div
            className="bg-amber-500 transition-all duration-700 ease-out delay-100"
            style={{
              width: animated
                ? `${(stats.partial / stats.total) * 100}%`
                : "0%",
            }}
          />
          <div
            className="bg-red-500 transition-all duration-700 ease-out delay-200"
            style={{
              width: animated
                ? `${(stats.newSkill / stats.total) * 100}%`
                : "0%",
            }}
          />
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Transfers ({stats.direct})
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Partial ({stats.partial})
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            New ({stats.newSkill})
          </span>
        </div>
      </div>

      {/* Skill list grouped by category */}
      <div className="space-y-4">
        {(["direct-transfer", "partial-transfer", "new-skill"] as const).map(
          (category) => {
            const items = groups[category];
            if (items.length === 0) return null;
            const config = CATEGORY_CONFIG[category];

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${config.color}`} />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({items.length})
                  </span>
                </div>
                <div className="space-y-2 pl-4">
                  {items
                    .sort(
                      (a, b) =>
                        (b.transferabilityScore ?? 0) -
                        (a.transferabilityScore ?? 0)
                    )
                    .map((gap, i) => (
                      <div
                        key={i}
                        className="bg-slate-700/30 rounded-lg p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {gap.skill}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.badgeClass}`}
                            >
                              {gap.transferabilityScore ?? 0}%
                            </span>
                          </div>
                        </div>
                        {/* Score bar */}
                        <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${config.color}`}
                            style={{
                              width: animated
                                ? `${gap.transferabilityScore ?? 0}%`
                                : "0%",
                            }}
                          />
                        </div>
                        {gap.transferNote && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {gap.transferNote}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span>
                            {gap.currentLevel} → {gap.requiredLevel}
                          </span>
                          <span className="capitalize">
                            Priority: {gap.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
