"use client";

import { useEffect, useState } from "react";
import {
  TrendingDown,
  BookOpen,
  DollarSign,
  Heart,
  Building2,
  AlertTriangle,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { RiskAssessment } from "@/lib/intake";

const CATEGORY_ICONS: Record<RiskAssessment["category"], typeof TrendingDown> = {
  market: TrendingDown,
  skill: BookOpen,
  financial: DollarSign,
  personal: Heart,
  industry: Building2,
};

const CATEGORY_LABELS: Record<RiskAssessment["category"], string> = {
  market: "Market",
  skill: "Skill Gap",
  financial: "Financial",
  personal: "Personal",
  industry: "Industry",
};

const IMPACT_CONFIG = {
  high: {
    label: "High Impact",
    badgeClass: "bg-red-900/40 border-red-700/40 text-red-300",
    accentClass: "border-l-red-500",
    countClass: "text-red-400",
  },
  medium: {
    label: "Medium Impact",
    badgeClass: "bg-amber-900/40 border-amber-700/40 text-amber-300",
    accentClass: "border-l-amber-500",
    countClass: "text-amber-400",
  },
  low: {
    label: "Low Impact",
    badgeClass: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
    accentClass: "border-l-emerald-500",
    countClass: "text-emerald-400",
  },
};

function likelihoodColor(likelihood: number): string {
  if (likelihood >= 70) return "bg-red-500";
  if (likelihood >= 40) return "bg-amber-500";
  return "bg-emerald-500";
}

function likelihoodLabel(likelihood: number): string {
  if (likelihood >= 70) return "High";
  if (likelihood >= 40) return "Moderate";
  return "Low";
}

export default function RiskAssessmentCard({
  riskAssessments,
}: {
  riskAssessments: RiskAssessment[];
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (riskAssessments.length === 0) return null;

  const grouped = {
    high: riskAssessments.filter((r) => r.impact === "high"),
    medium: riskAssessments.filter((r) => r.impact === "medium"),
    low: riskAssessments.filter((r) => r.impact === "low"),
  };

  const impactLevels = (["high", "medium", "low"] as const).filter(
    (level) => grouped[level].length > 0
  );

  return (
    <div className="bg-slate-800/60 border border-red-700/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="size-4 text-red-400" />
        <h3 className="text-sm font-bold text-red-400">
          Risk & Obstacle Assessment
        </h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {impactLevels.map((level) => (
          <span
            key={level}
            className={`text-xs ${IMPACT_CONFIG[level].countClass}`}
          >
            {grouped[level].length} {IMPACT_CONFIG[level].label.toLowerCase()}
          </span>
        ))}
      </div>

      <Accordion type="multiple" className="space-y-0">
        {impactLevels.map((level) => (
          <AccordionItem key={level} value={level} className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-medium ${IMPACT_CONFIG[level].badgeClass}`}
                >
                  {IMPACT_CONFIG[level].label}
                </span>
                <span className="text-xs text-slate-500">
                  {grouped[level].length} risk
                  {grouped[level].length !== 1 ? "s" : ""}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {grouped[level].map((risk, i) => {
                  const Icon = CATEGORY_ICONS[risk.category];
                  return (
                    <div
                      key={i}
                      className={`bg-slate-900/50 border border-slate-700/60 border-l-2 ${IMPACT_CONFIG[level].accentClass} rounded-xl p-4`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700/50 border border-slate-600/40 flex items-center justify-center">
                          <Icon className="size-4 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm leading-snug">
                            {risk.obstacle}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500 capitalize">
                              {CATEGORY_LABELS[risk.category]}
                            </span>
                            {risk.timeframe && (
                              <>
                                <span className="text-slate-600 text-xs">
                                  |
                                </span>
                                <span className="text-xs text-slate-500">
                                  {risk.timeframe}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">
                            Likelihood
                          </span>
                          <span className="text-xs text-slate-400">
                            {risk.likelihood}% —{" "}
                            {likelihoodLabel(risk.likelihood)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${likelihoodColor(risk.likelihood)}`}
                            style={{
                              width: animated ? `${risk.likelihood}%` : "0%",
                            }}
                          />
                        </div>
                      </div>

                      {risk.mitigationSteps.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                            Mitigation Steps
                          </p>
                          <ul className="space-y-1.5">
                            {risk.mitigationSteps.map((step, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-sm text-slate-300"
                              >
                                <Check className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <span className="text-xs leading-relaxed">
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
