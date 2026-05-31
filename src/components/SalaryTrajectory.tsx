"use client";

import { useEffect, useState } from "react";
import type { MilestoneSalary } from "@/lib/intake";

const PHASE_CONFIG = {
  "6-month": { label: "6 Months", color: "bg-emerald-500", textColor: "text-emerald-400", borderColor: "border-emerald-700/40" },
  "1-year": { label: "1 Year", color: "bg-teal-500", textColor: "text-teal-400", borderColor: "border-teal-700/40" },
  "2-year": { label: "2 Years", color: "bg-cyan-500", textColor: "text-cyan-400", borderColor: "border-cyan-700/40" },
} as const;

const DEMAND_CONFIG = {
  low: { color: "bg-slate-600", textColor: "text-slate-400", label: "Low Demand" },
  moderate: { color: "bg-amber-600", textColor: "text-amber-400", label: "Moderate Demand" },
  high: { color: "bg-emerald-600", textColor: "text-emerald-400", label: "High Demand" },
  "very-high": { color: "bg-teal-600", textColor: "text-teal-300", label: "Very High Demand" },
} as const;

function parseSalaryMid(range: string): number {
  const nums = range.match(/[\d,]+/g)?.map((s) => parseInt(s.replace(/,/g, ""), 10)) ?? [];
  if (nums.length >= 2) return (nums[0] + nums[1]) / 2;
  if (nums.length === 1) return nums[0];
  return 0;
}

export default function SalaryTrajectory({
  milestoneSalaries,
  currentSalaryRange,
  targetSalaryRange,
}: {
  milestoneSalaries: MilestoneSalary[];
  currentSalaryRange: string;
  targetSalaryRange: string;
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (milestoneSalaries.length === 0) return null;

  const currentMid = parseSalaryMid(currentSalaryRange);
  const targetMid = parseSalaryMid(targetSalaryRange);
  const allMids = [currentMid, ...milestoneSalaries.map((m) => parseSalaryMid(m.expectedSalaryRange)), targetMid];
  const maxSalary = Math.max(...allMids);

  const points = [
    { label: "Current", salary: currentSalaryRange, mid: currentMid },
    ...milestoneSalaries.map((m) => ({
      label: PHASE_CONFIG[m.phase]?.label ?? m.phase,
      salary: m.expectedSalaryRange,
      mid: parseSalaryMid(m.expectedSalaryRange),
      demand: m.marketDemandLevel,
      trend: m.demandTrend,
      phase: m.phase,
    })),
    { label: "Target", salary: targetSalaryRange, mid: targetMid },
  ];

  return (
    <div className="bg-slate-800/60 border border-teal-700/40 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-teal-400 mb-1">Salary Trajectory</h3>
      <p className="text-xs text-slate-400 mb-5">Expected compensation at each career stage</p>

      {/* Visual progression */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-600 via-teal-600 to-cyan-600" />

        <div className="space-y-0">
          {points.map((point, i) => {
            const barWidth = maxSalary > 0 ? (point.mid / maxSalary) * 100 : 0;
            const isFirst = i === 0;
            const isLast = i === points.length - 1;
            const phasePoint = "phase" in point ? point : null;
            const demandCfg = phasePoint?.demand ? DEMAND_CONFIG[phasePoint.demand as keyof typeof DEMAND_CONFIG] : null;

            return (
              <div key={i} className="relative pl-10 py-3">
                {/* Node dot */}
                <div
                  className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-800 ${
                    isFirst
                      ? "bg-slate-500"
                      : isLast
                      ? "bg-cyan-400"
                      : phasePoint?.phase
                      ? PHASE_CONFIG[phasePoint.phase as keyof typeof PHASE_CONFIG]?.color ?? "bg-teal-500"
                      : "bg-teal-500"
                  }`}
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        isFirst
                          ? "text-slate-400"
                          : isLast
                          ? "text-cyan-300"
                          : phasePoint?.phase
                          ? PHASE_CONFIG[phasePoint.phase as keyof typeof PHASE_CONFIG]?.textColor ?? "text-teal-400"
                          : "text-teal-400"
                      }`}
                    >
                      {point.label}
                    </span>
                    <span className="text-sm font-bold text-white">{point.salary}</span>
                  </div>

                  {/* Salary bar */}
                  <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isFirst
                          ? "bg-slate-500"
                          : isLast
                          ? "bg-cyan-500"
                          : phasePoint?.phase
                          ? PHASE_CONFIG[phasePoint.phase as keyof typeof PHASE_CONFIG]?.color ?? "bg-teal-500"
                          : "bg-teal-500"
                      }`}
                      style={{ width: animated ? `${barWidth}%` : "0%" }}
                    />
                  </div>

                  {/* Demand indicator */}
                  {demandCfg && (
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${demandCfg.color}`} />
                      <span className={`text-[10px] ${demandCfg.textColor}`}>{demandCfg.label}</span>
                      {phasePoint?.trend && (
                        <span className="text-[10px] text-slate-500">— {phasePoint.trend}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
