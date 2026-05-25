"use client";

import { useState } from "react";
import type { PivotPlan } from "@/lib/intake";

export default function ReportContent({ plans }: { plans: PivotPlan[] }) {
  const [selected, setSelected] = useState(0);
  const plan = plans[selected];

  return (
    <>
      {plans.length > 1 && (
        <div className="flex gap-3 mb-8">
          {plans.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                i === selected
                  ? "bg-teal-600 border-teal-500 text-white"
                  : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"
              }`}
            >
              <span className="block font-bold">{p.targetRole}</span>
              <span className="text-xs opacity-70">{p.targetIndustry}</span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-slate-800/60 border border-teal-700/40 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold text-teal-400">{plan.targetRole}</h2>
              <p className="text-slate-400">{plan.targetIndustry}</p>
            </div>
            <span className="text-xs bg-teal-900/40 border border-teal-700/50 text-teal-300 px-3 py-1 rounded-full whitespace-nowrap ml-4">
              {plan.estimatedTimeToTransition}
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed">{plan.rationale}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "6-Month Milestones", items: plan.sixMonthMilestones, accent: "text-emerald-400", bullet: "text-emerald-500" },
            { label: "1-Year Milestones", items: plan.oneYearMilestones, accent: "text-teal-400", bullet: "text-teal-500" },
            { label: "2-Year Milestones", items: plan.twoYearMilestones, accent: "text-cyan-400", bullet: "text-cyan-500" },
          ].map(({ label, items, accent, bullet }) => (
            <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className={`text-sm font-bold ${accent} mb-3`}>{label}</h3>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className={`${bullet} mt-0.5 shrink-0`}>→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-400 mb-3">Skill Gaps to Close</h3>
            <ul className="space-y-2">
              {(plan.skillGaps ?? []).map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                  {typeof gap === "string" ? gap : (
                    <span>
                      <span className="font-medium text-white">{gap.skill}</span>
                      {" — "}
                      {gap.currentLevel} → {gap.requiredLevel}
                      {gap.resource && <span className="text-amber-300 ml-1">({gap.resource})</span>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-teal-400 mb-3">Key Actions This Week</h3>
            <ul className="space-y-2">
              {(plan.weekOneActions ?? []).length > 0
                ? plan.weekOneActions!.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                      <span>
                        <span className="font-medium text-white">{action.title}</span>
                        {" — "}{action.instruction}
                        <span className="text-slate-500 ml-1">({action.timeEstimate})</span>
                      </span>
                    </li>
                  ))
                : (plan.keyActions ?? []).map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                      {action}
                    </li>
                  ))
              }
            </ul>
          </div>
        </div>

        {(plan.aiToolkit ?? []).length > 0 && (
          <div className="bg-slate-800/60 border border-violet-700/40 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-violet-400 mb-3">AI Toolkit for This Role</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {plan.aiToolkit!.map((item, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-violet-400 font-medium text-sm">{item.tool}</span>
                    <span className="text-xs bg-violet-900/40 border border-violet-700/40 text-violet-300 px-2 py-0.5 rounded-full">{item.proficiencyNeeded}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{item.category}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.useCase}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.financialSummary ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Current Salary</p>
                <p className="text-slate-300 font-medium">{plan.financialSummary.currentSalaryRange}</p>
              </div>
              <div>
                <p className="text-slate-500">Target Salary</p>
                <p className="text-teal-300 font-medium">{plan.financialSummary.targetSalaryRange}</p>
              </div>
              <div>
                <p className="text-slate-500">Salary Uplift</p>
                <p className="text-emerald-400 font-medium">+{plan.financialSummary.salaryUpliftPercent}%</p>
              </div>
              <div>
                <p className="text-slate-500">ROI Timeframe</p>
                <p className="text-slate-300 font-medium">{plan.financialSummary.roiTimeframe}</p>
              </div>
            </div>
            {plan.financialSummary.transitionCosts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-slate-500 text-xs mb-1">Transition Costs</p>
                <ul className="space-y-1">
                  {plan.financialSummary.transitionCosts.map((cost, i) => (
                    <li key={i} className="text-slate-400 text-xs">{cost}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : plan.financialConsiderations ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Financial Considerations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{plan.financialConsiderations}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
