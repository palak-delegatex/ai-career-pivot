"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PivotPlan, UserProfile } from "@/lib/intake";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { trackPlanSelected, trackPdfDownloadStarted, trackPdfDownloadCompleted, trackPdfDownloadError, trackCtaClicked, trackExperimentConversion } from "@/lib/tracking";
import PlanHero from "@/components/PlanHero";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import SkillGapChart from "@/components/SkillGapChart";
import RiskAssessmentCard from "@/components/RiskAssessmentCard";
import PathComparison from "@/components/PathComparison";
import PlanSelector from "@/components/PlanSelector";
import SocialProofStrip from "@/components/SocialProofStrip";
import { testimonials } from "@/lib/testimonials";
import PricingCheckout from "@/app/[locale]/pricing/PricingCheckout";

// Trust metrics shown beside the plan-page CTA — same numbers used on
// /free-results so the social proof reads consistently across the funnel.
const CHECKOUT_TRUST_METRICS = [
  { value: "500+", label: "Pivots" },
  { value: "92%", label: "Progress" },
  { value: "$15K+", label: "Avg uplift" },
];

// Inline checkout tiers on the plan page — a value summary shown at the
// checkout-decision moment so users buy in context instead of bouncing to
// /pricing and re-entering the email we already captured (AIC-372).
const CHECKOUT_TIERS = [
  { key: "report", name: "Report", price: "$19", summary: "Full roadmap, one-time" },
  { key: "lifetime", name: "Lifetime", price: "$149", summary: "Everything, forever", popular: true },
] as const;

export default function PivotPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PivotPlan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selected, setSelected] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [tier, setTier] = useState<"report" | "lifetime">("lifetime");

  useEffect(() => {
    const stored = sessionStorage.getItem("intake_plans");
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setPlans(JSON.parse(stored));

    const storedProfile = sessionStorage.getItem("intake_profile");
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, [router]);

  function handlePlanSelected(i: number) {
    trackPlanSelected({ plan_index: i, target_role: plans[i].targetRole, target_industry: plans[i].targetIndustry });
    const ctaVariant = sessionStorage.getItem("ab_onboarding_cta_copy") ?? "control";
    trackExperimentConversion({ flag: "onboarding_cta_copy", variant: ctaVariant, event: "plan_selected", page: "plan" });
    setSelected(i);
  }

  async function handleDownloadPdf() {
    const targetRole = plans[selected].targetRole;
    trackPdfDownloadStarted({ source: "onboarding", target_role: targetRole });
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/plan/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, plan: plans[selected] }),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `career-pivot-${targetRole.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      trackPdfDownloadCompleted({ source: "onboarding", target_role: targetRole });
    } catch (err) {
      trackPdfDownloadError({ source: "onboarding", error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setDownloadingPdf(false);
    }
  }

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
        <PlanSelector
          plans={plans}
          selected={selected}
          onSelect={(i) => { handlePlanSelected(i); }}
        />

        {/* Cross-path comparison */}
        {plans.length > 1 && (
          <PathComparison
            plans={plans}
            onSelectPlan={(i) => { handlePlanSelected(i); }}
          />
        )}

        {/* Selected plan */}
        <div className="space-y-6">
          {/* Hero */}
          <PlanHero plan={plan} />

          {/* PDF Download */}
          <div className="flex justify-end">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadingPdf ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>

          {/* Milestones */}
          <RoadmapTimeline
            phases={[
              { key: "6mo", label: "6 Months", deadline: "6 months", milestones: plan.sixMonthMilestones, color: "emerald" },
              { key: "1yr", label: "1 Year", deadline: "1 year", milestones: plan.oneYearMilestones, color: "teal" },
              { key: "2yr", label: "2 Years", deadline: "2 years", milestones: plan.twoYearMilestones, color: "cyan" },
            ]}
          />

          {/* Risk Assessment */}
          {(plan.riskAssessments ?? []).length > 0 && (
            <RiskAssessmentCard riskAssessments={plan.riskAssessments!} />
          )}

          {/* Skill Gap Analysis */}
          {(plan.skillGaps ?? []).length > 0 && (
            <SkillGapChart skillGaps={plan.skillGaps!} />
          )}

          {/* Key Actions This Week */}
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

          {/* Recommended Resources */}
          {(plan.recommendedResources ?? []).length > 0 && (
            <div className="bg-slate-800/60 border border-teal-700/40 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-teal-400 mb-3">Recommended Resources</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {plan.recommendedResources!.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 hover:border-teal-600/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-teal-300 font-medium text-sm group-hover:text-teal-200 transition-colors">{resource.name}</span>
                      <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6H21m0 0v7.5m0-7.5l-9 9" /></svg>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{resource.provider}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-teal-900/40 border border-teal-700/40 text-teal-300 px-2 py-0.5 rounded-full">{resource.type}</span>
                      <span className="text-xs text-slate-400">{resource.cost}</span>
                      <span className="text-xs text-slate-500">· {resource.timeEstimate}</span>
                    </div>
                  </a>
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

        {/* CTA — inline checkout so users can buy in the moment instead of
            bouncing to /pricing and re-entering the email we already have.
            Directly targets the plan_selected → checkout_started drop-off (AIC-372). */}
        <div className="mt-10 bg-slate-800/40 border border-teal-700/30 rounded-2xl p-8">
          {/* Social proof at the checkout-decision moment — reassurance right
              before the upgrade CTA (AIC-437). */}
          <div className="max-w-md mx-auto mb-6">
            <SocialProofStrip
              testimonial={testimonials[0]}
              metrics={CHECKOUT_TRUST_METRICS}
              variant="featured"
            />
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2">Get your full detailed roadmap</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              A comprehensive week-by-week plan, salary research, and personalized networking scripts for{" "}
              <span className="text-teal-300 font-medium">{plan.targetRole}</span>.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Plan tier toggle — value summary during checkout */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CHECKOUT_TIERS.map((tierOption) => {
                const isActive = tier === tierOption.key;
                return (
                  <button
                    key={tierOption.key}
                    type="button"
                    onClick={() => setTier(tierOption.key)}
                    aria-pressed={isActive}
                    className={`relative rounded-xl border-2 p-4 text-left transition-colors ${
                      isActive
                        ? "border-teal-500 bg-teal-950/30"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    {"popular" in tierOption && tierOption.popular && (
                      <span className="absolute -top-2.5 right-3 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Best value
                      </span>
                    )}
                    <div className="font-bold text-white">{tierOption.name}</div>
                    <div className="text-2xl font-extrabold text-white">{tierOption.price}</div>
                    <div className="text-xs text-slate-400">{tierOption.summary}</div>
                  </button>
                );
              })}
            </div>

            <PricingCheckout
              key={tier}
              plan={tier}
              prefillEmail={profile?.email ?? ""}
              ctaLocation="plan_page_inline"
              sourceFeature="onboarding_plan"
            />

            <p className="text-center text-slate-500 text-xs mt-3">
              30-day money-back guarantee · Secure checkout via Stripe
            </p>
            <div className="text-center mt-4">
              <Link
                href={profile?.email ? `/pricing?email=${encodeURIComponent(profile.email)}` : "/pricing"}
                onClick={() => trackCtaClicked({ cta_text: "Compare plans", cta_location: "plan_page", destination: "/pricing" })}
                className="text-teal-400 text-sm hover:text-teal-300 underline underline-offset-2"
              >
                Compare plans &amp; read FAQ →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
