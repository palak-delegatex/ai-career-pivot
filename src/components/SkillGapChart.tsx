"use client";

import { useEffect, useState } from "react";
import type { SkillGap } from "@/lib/intake";

const LEVEL_MAP: Record<string, number> = {
  none: 0,
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

function toPercent(level: string): number {
  return LEVEL_MAP[level.toLowerCase()] ?? 50;
}

function severity(current: number, required: number): "minor" | "moderate" | "critical" {
  const ratio = required === 0 ? 1 : current / required;
  if (ratio >= 0.8) return "minor";
  if (ratio >= 0.4) return "moderate";
  return "critical";
}

const SEVERITY_COLORS = {
  minor: { bar: "bg-emerald-500", badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300" },
  moderate: { bar: "bg-amber-500", badge: "bg-amber-900/40 border-amber-700/40 text-amber-300" },
  critical: { bar: "bg-red-500", badge: "bg-red-900/40 border-red-700/40 text-red-300" },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function SkillGapChart({ skillGaps }: { skillGaps: SkillGap[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (skillGaps.length === 0) return null;

  const sorted = [...skillGaps].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
  );

  return (
    <div className="bg-slate-800/60 border border-amber-700/40 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-amber-400 mb-4">Skill Gap Analysis</h3>
      <div className="space-y-4">
        {sorted.map((gap, i) => {
          const current = toPercent(gap.currentLevel);
          const required = toPercent(gap.requiredLevel);
          const sev = severity(current, required);
          const colors = SEVERITY_COLORS[sev];

          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{gap.skill}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${colors.badge}`}
                >
                  {sev}
                </span>
              </div>

              <div className="relative h-5 bg-slate-700/60 rounded-full overflow-hidden">
                {/* Required level (background target) */}
                <div
                  className="absolute inset-y-0 left-0 bg-slate-600/50 rounded-full"
                  style={{ width: `${required}%` }}
                />
                {/* Current level (foreground bar) */}
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${colors.bar}`}
                  style={{ width: animated ? `${current}%` : "0%" }}
                />
                {/* Level labels */}
                <div className="absolute inset-0 flex items-center justify-between px-2">
                  <span className="text-[10px] font-medium text-white/80 capitalize">
                    {gap.currentLevel}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 capitalize">
                    → {gap.requiredLevel}
                  </span>
                </div>
              </div>

              {gap.resource && (
                <p className="text-xs text-amber-300/70 pl-1">
                  📚 {gap.resource}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
