"use client";

import { useState } from "react";
import type { PivotPlan } from "@/lib/intake";
import PlanHero from "@/components/PlanHero";
import InteractiveRoadmap from "@/components/InteractiveRoadmap";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import SkillGapChart from "@/components/SkillGapChart";
import SkillTree from "@/components/SkillTree";
import WeekOneActionCards from "@/components/WeekOneActionCards";
import PathComparison from "@/components/PathComparison";
import PlanSelector from "@/components/PlanSelector";
import FollowUpChat from "@/components/FollowUpChat";

export default function ReportContent({ plans, reportId }: { plans: PivotPlan[]; reportId: string }) {
  const [selected, setSelected] = useState(0);
  const plan = plans[selected];

  return (
    <>
      <PlanSelector plans={plans} selected={selected} onSelect={setSelected} />

      {plans.length > 1 && <PathComparison plans={plans} onSelectPlan={setSelected} />}

      <div className="space-y-6">
        <PlanHero plan={plan} />

        <div className="flex justify-end">
          <DownloadPdfButton reportId={reportId} planIndex={selected} targetRole={plan.targetRole} />
        </div>

        <InteractiveRoadmap
          sixMonthMilestones={plan.sixMonthMilestones}
          oneYearMilestones={plan.oneYearMilestones}
          twoYearMilestones={plan.twoYearMilestones}
          reportId={reportId}
          planIndex={selected}
          skillGaps={plan.skillGaps}
          recommendedResources={plan.recommendedResources}
        />

        {(plan.skillGaps ?? []).length > 0 && (
          <SkillGapChart skillGaps={plan.skillGaps!} />
        )}

        {(plan.skillGaps ?? []).length > 0 && (
          <SkillTree skillGaps={plan.skillGaps!} />
        )}

        {(plan.weekOneActions ?? []).length > 0 ? (
          <WeekOneActionCards actions={plan.weekOneActions!} />
        ) : (plan.keyActions ?? []).length > 0 ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-teal-400 mb-3">Key Actions This Week</h3>
            <ul className="space-y-2">
              {plan.keyActions!.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
          <div className="bg-slate-800/60 border border-emerald-700/30 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-emerald-400 mb-5">Salary & Financial Bridge</h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Range</p>
                <p className="text-xl font-bold text-slate-200">{plan.financialSummary.currentSalaryRange}</p>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <span className="text-emerald-400 font-bold text-sm">+{plan.financialSummary.salaryUpliftPercent}%</span>
                <svg width="48" height="20" viewBox="0 0 48 20" fill="none" aria-label={`${plan.financialSummary.salaryUpliftPercent}% salary uplift`}>
                  <path d="M0 10H40M40 10L32 4M40 10L32 16" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex-1 bg-slate-900/60 border border-emerald-700/40 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Target Range</p>
                <p className="text-xl font-bold text-emerald-300">{plan.financialSummary.targetSalaryRange}</p>
              </div>
            </div>

            <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden mb-5" aria-hidden="true">
              <div
                className="h-full rounded-full"
                style={{
                  width: "100%",
                  background: "linear-gradient(to right, #64748b, #14b8a6, #34d399)",
                }}
              />
            </div>

            {plan.financialSummary.transitionCosts.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Transition Costs</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {plan.financialSummary.transitionCosts.map((cost, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2">
                      <span className="text-amber-400 shrink-0 text-xs">$</span>
                      <span className="text-sm text-slate-300">{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-teal-900/20 border border-teal-700/30 rounded-lg px-4 py-2.5">
              <span className="text-teal-400 text-sm">ROI Timeframe:</span>
              <span className="text-white font-medium text-sm">{plan.financialSummary.roiTimeframe}</span>
            </div>
          </div>
        ) : plan.financialConsiderations ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Financial Considerations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{plan.financialConsiderations}</p>
          </div>
        ) : null}

        <FollowUpChat
          reportId={reportId}
          planIndex={selected}
          targetRole={plan.targetRole}
        />
      </div>
    </>
  );
}
