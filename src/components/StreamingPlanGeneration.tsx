"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { PivotPlan, UserProfile, ValuesAssessment } from "@/lib/intake";
import PlanHero from "@/components/PlanHero";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import SkillGapChart from "@/components/SkillGapChart";
import RiskAssessmentCard from "@/components/RiskAssessmentCard";

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type PartialPlans = { plans?: DeepPartial<PivotPlan>[] };

const GENERATION_STEPS = [
  "Analyzing your background",
  "Identifying career paths",
  "Building skill gap analysis",
  "Calculating financial projections",
  "Creating action plans",
  "Finalizing your roadmaps",
];

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
    </div>
  );
}

function CompletedCheck() {
  return (
    <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ProgressIndicator({ partialPlans }: { partialPlans: PartialPlans }) {
  const plans = partialPlans.plans ?? [];
  const firstPlan = plans[0];

  let currentStep = 0;
  if (firstPlan) {
    if (firstPlan.tradeoffs) currentStep = 5;
    else if (firstPlan.financialSummary) currentStep = 4;
    else if (firstPlan.skillGaps?.length) currentStep = 3;
    else if (firstPlan.sixMonthMilestones?.length) currentStep = 2;
    else if (firstPlan.targetRole) currentStep = 1;
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-teal-400">Building Your Roadmaps</h3>
        <span className="text-xs text-slate-500">{plans.length} plan{plans.length !== 1 ? "s" : ""} found</span>
      </div>
      <div className="space-y-2">
        {GENERATION_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            {i < currentStep ? (
              <CompletedCheck />
            ) : i === currentStep ? (
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-600 rounded-full" />
              </div>
            )}
            <span className={i <= currentStep ? "text-slate-300 text-sm" : "text-slate-600 text-sm"}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreamedPlanCard({ plan, index }: { plan: DeepPartial<PivotPlan>; index: number }) {
  const hasBasicInfo = plan.targetRole && plan.rationale;
  const hasMilestones = (plan.sixMonthMilestones?.length ?? 0) > 0;
  const hasSkillGaps = (plan.skillGaps?.length ?? 0) > 0;
  const hasWeekOneActions = (plan.weekOneActions?.length ?? 0) > 0;
  const hasFinancials = !!plan.financialSummary?.currentSalaryRange;

  if (!plan.targetRole) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan {index + 1}</span>
        {plan.matchScore != null && (
          <span className="text-xs bg-teal-900/40 border border-teal-700/40 text-teal-300 px-2 py-0.5 rounded-full">
            {plan.matchScore}% match
          </span>
        )}
      </div>

      {hasBasicInfo && (
        <PlanHero plan={plan as PivotPlan} />
      )}

      {hasMilestones ? (
        <RoadmapTimeline
          phases={[
            { key: "6mo", label: "6 Months", deadline: "6 months", milestones: (plan.sixMonthMilestones ?? []) as string[], color: "emerald" },
            { key: "1yr", label: "1 Year", deadline: "1 year", milestones: (plan.oneYearMilestones ?? []) as string[], color: "teal" },
            { key: "2yr", label: "2 Years", deadline: "2 years", milestones: (plan.twoYearMilestones ?? []) as string[], color: "cyan" },
          ]}
        />
      ) : hasBasicInfo ? (
        <SectionSkeleton label="Building milestones..." />
      ) : null}

      {hasSkillGaps ? (
        <SkillGapChart skillGaps={plan.skillGaps as NonNullable<PivotPlan["skillGaps"]>} />
      ) : hasMilestones ? (
        <SectionSkeleton label="Analyzing skill gaps..." />
      ) : null}

      {(plan.riskAssessments?.length ?? 0) > 0 && (
        <RiskAssessmentCard riskAssessments={plan.riskAssessments as NonNullable<PivotPlan["riskAssessments"]>} />
      )}

      {hasWeekOneActions ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-teal-400 mb-3">Key Actions This Week</h3>
          <ul className="space-y-2">
            {(plan.weekOneActions ?? []).map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-teal-500 mt-0.5 shrink-0">&#10003;</span>
                <span>
                  <span className="font-medium text-white">{action?.title}</span>
                  {action?.instruction && <>{" \u2014 "}{action.instruction}</>}
                  {action?.timeEstimate && <span className="text-slate-500 ml-1">({action.timeEstimate})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : hasSkillGaps ? (
        <SectionSkeleton label="Creating action plan..." />
      ) : null}

      {hasFinancials && plan.financialSummary ? (
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
            {plan.financialSummary.salaryUpliftPercent != null && (
              <div>
                <p className="text-slate-500">Salary Uplift</p>
                <p className="text-emerald-400 font-medium">+{plan.financialSummary.salaryUpliftPercent}%</p>
              </div>
            )}
            {plan.financialSummary.roiTimeframe && (
              <div>
                <p className="text-slate-500">ROI Timeframe</p>
                <p className="text-slate-300 font-medium">{plan.financialSummary.roiTimeframe}</p>
              </div>
            )}
          </div>
        </div>
      ) : hasWeekOneActions ? (
        <SectionSkeleton label="Calculating financials..." />
      ) : null}
    </div>
  );
}

export default function StreamingPlanGeneration({
  profile,
  paymentSessionId,
  valuesAssessment,
  onComplete,
  onError,
}: {
  profile: UserProfile;
  paymentSessionId?: string | null;
  valuesAssessment?: ValuesAssessment;
  onComplete: (plans: PivotPlan[], reportId?: string) => void;
  onError: (error: string) => void;
}) {
  const [partialPlans, setPartialPlans] = useState<PartialPlans>({});
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  const startGeneration = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const res = await fetch("/api/intake/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, paymentSessionId, valuesAssessment }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Plan generation failed");
      }

      const reportId = res.headers.get("x-report-id") ?? undefined;
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        accumulated += decoder.decode(value, { stream: true });

        try {
          const closedJson = tryCloseJson(accumulated);
          const parsed = JSON.parse(closedJson) as PartialPlans;
          setPartialPlans(parsed);
        } catch {
          // partial JSON not parseable yet
        }
      }

      try {
        const finalParsed = JSON.parse(accumulated) as { plans: PivotPlan[] };
        setPartialPlans(finalParsed);
        setDone(true);
        onComplete(finalParsed.plans, reportId);
      } catch {
        onError("Failed to parse the generated plans.");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }, [profile, paymentSessionId, valuesAssessment, onComplete, onError]);

  useEffect(() => {
    startGeneration();
  }, [startGeneration]);

  const plans = partialPlans.plans ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-3">
            {done ? "Your Career Pivot Roadmaps" : "Building Your Roadmaps"}
          </h1>
          <p className="text-slate-400">
            {done
              ? `${plans.length} personalized paths based on your actual background`
              : "Watch your personalized plans take shape in real time"}
          </p>
        </div>

        {!done && <ProgressIndicator partialPlans={partialPlans} />}

        {plans.length > 1 && (
          <div className="flex gap-2 mb-6">
            {plans.map((plan, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlan(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  i === selectedPlan
                    ? "bg-teal-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {plan.targetRole ?? `Plan ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {plans[selectedPlan] && (
          <StreamedPlanCard plan={plans[selectedPlan]} index={selectedPlan} />
        )}

        {plans.length === 0 && !done && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
            <p className="text-slate-400">Connecting to AI...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function tryCloseJson(text: string): string {
  let result = text.trim();
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of result) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  if (inString) result += '"';

  while (openBrackets > 0) { result += "]"; openBrackets--; }
  while (openBraces > 0) { result += "}"; openBraces--; }

  return result;
}
