"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PivotPlan } from "@/lib/intake";
import Link from "next/link";

function readPlans(): PivotPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem("intake_plans");
    return raw ? (JSON.parse(raw) as PivotPlan[]) : [];
  } catch {
    return [];
  }
}

export default function PivotPlanPage() {
  const router = useRouter();
  const [plans] = useState<PivotPlan[]>(readPlans);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (plans.length === 0) router.replace("/onboarding");
  }, [plans.length, router]);

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
          {/* Header */}
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
                {plan.skillGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-teal-400 mb-3">Key Actions This Week</h3>
              <ul className="space-y-2">
                {plan.keyActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-teal-500 mt-0.5 shrink-0">✓</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Financial considerations */}
          {plan.financialConsiderations && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Financial Considerations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{plan.financialConsiderations}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center bg-slate-800/40 border border-teal-700/30 rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-3">Build the detailed roadmap for {plan.targetRole}</h3>
          <p className="text-slate-400 mb-6">
            Add your finances, family situation, and risk tolerance to generate a step-by-step 2-year plan
            with skills, certs, networking targets, and income bridge strategies.
          </p>
          <button
            onClick={() => {
              sessionStorage.setItem("intake_selected_plan_index", String(selected));
              router.push("/onboarding/roadmap");
            }}
            className="inline-block px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Build My Detailed Roadmap →
          </button>
          <p className="mt-4 text-xs text-slate-500">
            Or <Link href="/waitlist" className="underline hover:text-slate-300">join the waitlist</Link> for full coaching access.
          </p>
        </div>
      </div>
    </div>
  );
}
