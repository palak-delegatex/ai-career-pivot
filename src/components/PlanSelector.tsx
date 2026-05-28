"use client";

import type { PivotPlan } from "@/lib/intake";

const difficultyIcon = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
};

export default function PlanSelector({
  plans,
  selected,
  onSelect,
}: {
  plans: PivotPlan[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  if (plans.length <= 1) return null;

  return (
    <div className="flex gap-3 mb-8">
      {plans.map((p, i) => {
        const isActive = i === selected;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`flex-1 px-4 py-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors text-left ${
              isActive
                ? "bg-teal-600 border-teal-500 text-white"
                : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"
            }`}
          >
            <span className="block font-bold">{p.targetRole}</span>
            <span className={`text-xs ${isActive ? "opacity-70" : "text-slate-500"}`}>{p.targetIndustry}</span>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {p.matchScore != null && (
                <span className={`text-xs font-medium ${isActive ? "text-teal-100" : "text-teal-400"}`}>
                  {p.matchScore}% match
                </span>
              )}
              {p.tradeoffs && (
                <span className={`text-xs ${isActive ? "opacity-80" : "text-slate-400"}`}>
                  {difficultyIcon[p.tradeoffs.difficulty]} {p.tradeoffs.difficulty} difficulty
                </span>
              )}
              {p.financialSummary && (
                <span className={`text-xs ${isActive ? "text-emerald-100" : "text-emerald-400"}`}>
                  +{p.financialSummary.salaryUpliftPercent}%
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
