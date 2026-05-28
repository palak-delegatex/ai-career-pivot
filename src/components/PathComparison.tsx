"use client";

import { useState } from "react";
import type { PivotPlan, MarketData } from "@/lib/intake";

const difficultyColor = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

const difficultyBg = {
  low: "bg-emerald-900/30 border-emerald-700/40",
  medium: "bg-amber-900/30 border-amber-700/40",
  high: "bg-red-900/30 border-red-700/40",
};

function Badge({ value }: { value: "low" | "medium" | "high" }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${difficultyBg[value]} ${difficultyColor[value]}`}>
      {value}
    </span>
  );
}

function CompareRow({ label, values }: { label: string; values: React.ReactNode[] }) {
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}>
      <div className="py-3 px-3 text-xs text-slate-500 font-medium flex items-center">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="py-3 px-3 border-l border-slate-700/50 flex items-center">{v}</div>
      ))}
    </div>
  );
}

function bestForTag(plans: PivotPlan[]): Map<number, string[]> {
  const tags = new Map<number, string[]>();
  plans.forEach((_, i) => tags.set(i, []));

  const scored = plans.map((p, i) => ({ p, i }));

  const highestMatch = scored.reduce((best, cur) =>
    (cur.p.matchScore ?? 0) > (best.p.matchScore ?? 0) ? cur : best
  );
  tags.get(highestMatch.i)!.push("Best Match");

  const lowestRisk = scored.reduce((best, cur) => {
    const order = { low: 0, medium: 1, high: 2 } as const;
    return order[cur.p.tradeoffs?.riskLevel ?? "high"] < order[best.p.tradeoffs?.riskLevel ?? "high"] ? cur : best;
  });
  tags.get(lowestRisk.i)!.push("Lowest Risk");

  const highestIncome = scored.reduce((best, cur) =>
    (cur.p.financialSummary?.salaryUpliftPercent ?? 0) > (best.p.financialSummary?.salaryUpliftPercent ?? 0) ? cur : best
  );
  tags.get(highestIncome.i)!.push("Highest Income");

  const easiest = scored.reduce((best, cur) => {
    const order = { low: 0, medium: 1, high: 2 } as const;
    return order[cur.p.tradeoffs?.difficulty ?? "high"] < order[best.p.tradeoffs?.difficulty ?? "high"] ? cur : best;
  });
  tags.get(easiest.i)!.push("Easiest Transition");

  return tags;
}

const tagColors: Record<string, string> = {
  "Best Match": "bg-teal-900/40 border-teal-600/40 text-teal-300",
  "Lowest Risk": "bg-emerald-900/40 border-emerald-600/40 text-emerald-300",
  "Highest Income": "bg-amber-900/40 border-amber-600/40 text-amber-300",
  "Easiest Transition": "bg-blue-900/40 border-blue-600/40 text-blue-300",
};

function fmtSalary(n: number): string {
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function growthColor(pct: number | null): string {
  if (pct === null) return "text-slate-500";
  if (pct >= 20) return "text-emerald-400";
  if (pct >= 10) return "text-teal-400";
  if (pct >= 5) return "text-amber-400";
  return "text-slate-400";
}

export default function PathComparison({ plans, onSelectPlan, marketData }: { plans: PivotPlan[]; onSelectPlan?: (index: number) => void; marketData?: Record<string, MarketData> }) {
  const [expanded, setExpanded] = useState(true);
  const plansWithTradeoffs = plans.filter((p) => p.tradeoffs);
  if (plansWithTradeoffs.length < 2) return null;

  const tags = bestForTag(plansWithTradeoffs);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 border-b border-slate-700 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-200 text-left">Path Comparison</h3>
          <p className="text-xs text-slate-500 mt-0.5">Side-by-side trade-offs across all paths</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <>
          {/* Recommendation tags */}
          <div
            className="grid bg-slate-900/40 border-b border-slate-700/40"
            style={{ gridTemplateColumns: `140px repeat(${plansWithTradeoffs.length}, 1fr)` }}
          >
            <div className="py-3 px-3 flex items-center">
              <span className="text-xs text-slate-500 font-medium">Best for</span>
            </div>
            {plansWithTradeoffs.map((p, i) => (
              <div key={i} className="py-3 px-3 border-l border-slate-700/50">
                <div className="flex flex-wrap gap-1">
                  {(tags.get(i) ?? []).map((tag) => (
                    <span key={tag} className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium ${tagColors[tag] ?? "bg-slate-800 border-slate-600 text-slate-300"}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Header row */}
          <div
            className="grid bg-slate-900/40"
            style={{ gridTemplateColumns: `140px repeat(${plansWithTradeoffs.length}, 1fr)` }}
          >
            <div className="py-3 px-3" />
            {plansWithTradeoffs.map((p, i) => (
              <div key={i} className="py-3 px-3 border-l border-slate-700/50">
                <button
                  onClick={() => onSelectPlan?.(plans.indexOf(p))}
                  className={`text-left w-full ${onSelectPlan ? "hover:opacity-80 cursor-pointer" : ""}`}
                  disabled={!onSelectPlan}
                >
                  <p className="text-xs font-bold text-teal-400 truncate">{p.targetRole}</p>
                  <p className="text-[10px] text-slate-500 truncate">{p.targetIndustry}</p>
                  {p.matchScore != null && (
                    <p className="text-[10px] text-teal-500 mt-1">{p.matchScore}% match</p>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-700/40">
            <CompareRow
              label="Difficulty"
              values={plansWithTradeoffs.map((p) => <Badge key={p.targetRole} value={p.tradeoffs!.difficulty} />)}
            />
            <CompareRow
              label="Risk Level"
              values={plansWithTradeoffs.map((p) => <Badge key={p.targetRole} value={p.tradeoffs!.riskLevel} />)}
            />
            <CompareRow
              label="Time to First Role"
              values={plansWithTradeoffs.map((p) => (
                <span key={p.targetRole} className="text-xs text-slate-300">{p.tradeoffs!.timeToFirstRole}</span>
              ))}
            />
            <CompareRow
              label="Income (Near-term)"
              values={plansWithTradeoffs.map((p) => (
                <span key={p.targetRole} className="text-xs text-amber-300">{p.tradeoffs!.incomeImpactNear}</span>
              ))}
            />
            <CompareRow
              label="Income (Long-term)"
              values={plansWithTradeoffs.map((p) => (
                <span key={p.targetRole} className="text-xs text-emerald-300">{p.tradeoffs!.incomePotentialLong}</span>
              ))}
            />
            <CompareRow
              label="Salary Uplift"
              values={plansWithTradeoffs.map((p) => (
                <span key={p.targetRole} className="text-xs font-medium text-emerald-400">
                  {p.financialSummary ? `+${p.financialSummary.salaryUpliftPercent}%` : "—"}
                </span>
              ))}
            />
            {marketData && Object.keys(marketData).length > 0 && (
              <>
                <CompareRow
                  label="Market Salary"
                  values={plansWithTradeoffs.map((p) => {
                    const md = marketData[p.targetRole];
                    if (!md) return <span key={p.targetRole} className="text-xs text-slate-500">—</span>;
                    return (
                      <div key={p.targetRole}>
                        <span className="text-xs font-medium text-teal-300">{fmtSalary(md.salaryMedian)}</span>
                        <span className="text-[10px] text-slate-500 ml-1">median</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {fmtSalary(md.salaryP25)} – {fmtSalary(md.salaryP75)}
                        </p>
                      </div>
                    );
                  })}
                />
                <CompareRow
                  label="Demand Growth"
                  values={plansWithTradeoffs.map((p) => {
                    const md = marketData[p.targetRole];
                    if (!md || md.growthPercent === null) return <span key={p.targetRole} className="text-xs text-slate-500">—</span>;
                    return (
                      <div key={p.targetRole}>
                        <span className={`text-xs font-medium ${growthColor(md.growthPercent)}`}>
                          +{md.growthPercent}%
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{md.growthLabel}</p>
                      </div>
                    );
                  })}
                />
              </>
            )}
            <CompareRow
              label="Skill Match"
              values={plansWithTradeoffs.map((p) => (
                <span key={p.targetRole} className="text-xs text-slate-300">
                  {p.skillMatchPercent != null ? `${p.skillMatchPercent}%` : "—"}
                </span>
              ))}
            />
            <CompareRow
              label="Pros"
              values={plansWithTradeoffs.map((p) => (
                <ul key={p.targetRole} className="space-y-1">
                  {p.tradeoffs!.pros.map((pro, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <span className="text-emerald-500 shrink-0 mt-0.5">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              ))}
            />
            <CompareRow
              label="Cons"
              values={plansWithTradeoffs.map((p) => (
                <ul key={p.targetRole} className="space-y-1">
                  {p.tradeoffs!.cons.map((con, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-slate-400">
                      <span className="text-red-500 shrink-0 mt-0.5">−</span>
                      {con}
                    </li>
                  ))}
                </ul>
              ))}
            />
          </div>
        </>
      )}
    </div>
  );
}
