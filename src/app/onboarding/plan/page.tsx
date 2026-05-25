"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PivotPlan } from "@/lib/intake";
import Link from "next/link";
import PlanHero from "@/components/PlanHero";

export default function PivotPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PivotPlan[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("intake_plans");
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setPlans(JSON.parse(stored));
  }, [router]);

  if (plans.length === 0) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = plans[selected];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🗺️</div>
          <h1 className="text-3xl font-extrabold mb-3">Your Career Pivot Roadmaps</h1>
          <p className="text-slate-400">
            {plans.length} personalized paths based on your actual background — not generic advice.
          </p>
        </div>

        {/* Plan selector */}
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

        {/* Selected plan */}
        <div className="space-y-6">
          {/* Hero */}
          <PlanHero plan={plan} />

          {/* Milestones */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "6-Month Milestones", items: plan.sixMonthMilestones, color: "emerald" },
              { label: "1-Year Milestones", items: plan.oneYearMilestones, color: "teal" },
              { label: "2-Year Milestones", items: plan.twoYearMilestones, color: "cyan" },
            ].map(({ label, items, color }) => (
              <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                <h3 className={`text-sm font-bold text-${color}-400 mb-3`}>{label}</h3>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className={`text-${color}-500 mt-0.5 shrink-0`}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Skill gaps + key actions */}
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
                        {" — "}{gap.currentLevel} → {gap.requiredLevel}
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

          {/* AI Toolkit */}
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

          {/* Financial summary / considerations */}
          {plan.financialSummary ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Financial Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
            </div>
          ) : plan.financialConsiderations ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Financial Considerations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{plan.financialConsiderations}</p>
            </div>
          ) : null}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center bg-slate-800/40 border border-teal-700/30 rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-3">Want the full detailed roadmap?</h3>
          <p className="text-slate-400 mb-6">
            Get a comprehensive week-by-week plan, salary research, and personalized networking scripts.
          </p>
          <Link
            href="/waitlist"
            className="inline-block px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Get Full Access →
          </Link>
        </div>
      </div>
    </div>
  );
}
