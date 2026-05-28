"use client";

import type { SkillGap } from "@/lib/intake";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Tier {
  label: string;
  color: "emerald" | "teal" | "cyan" | "violet";
  skills: SkillGap[];
}

const tierColors = {
  emerald: {
    bg: "bg-emerald-900/40",
    border: "border-emerald-700/40",
    text: "text-emerald-300",
    chip: "bg-emerald-900/60 border-emerald-600/50 text-emerald-200 hover:bg-emerald-800/60",
    dot: "bg-emerald-500",
    line: "from-emerald-500",
  },
  teal: {
    bg: "bg-teal-900/40",
    border: "border-teal-700/40",
    text: "text-teal-300",
    chip: "bg-teal-900/60 border-teal-600/50 text-teal-200 hover:bg-teal-800/60",
    dot: "bg-teal-500",
    line: "from-teal-500",
  },
  cyan: {
    bg: "bg-cyan-900/40",
    border: "border-cyan-700/40",
    text: "text-cyan-300",
    chip: "bg-cyan-900/60 border-cyan-600/50 text-cyan-200 hover:bg-cyan-800/60",
    dot: "bg-cyan-500",
    line: "from-cyan-500",
  },
  violet: {
    bg: "bg-violet-900/40",
    border: "border-violet-700/40",
    text: "text-violet-300",
    chip: "bg-violet-900/60 border-violet-600/50 text-violet-200 hover:bg-violet-800/60",
    dot: "bg-violet-500",
    line: "from-violet-500",
  },
} as const;

const PRIORITY_BADGE = {
  high: "bg-red-900/40 border-red-700/40 text-red-300",
  medium: "bg-amber-900/40 border-amber-700/40 text-amber-300",
  low: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
} as const;

function categorizeTier(gap: SkillGap): number {
  const current = gap.currentLevel.toLowerCase();
  const required = gap.requiredLevel.toLowerCase();
  if (current === "none" || current === "beginner") {
    if (required === "beginner" || required === "intermediate") return 0;
    if (required === "advanced") return 1;
    return 2;
  }
  if (current === "intermediate") {
    if (required === "advanced") return 1;
    return 2;
  }
  return 3;
}

export default function SkillTree({ skillGaps }: { skillGaps: SkillGap[] }) {
  if (skillGaps.length === 0) return null;

  const tierMap: SkillGap[][] = [[], [], [], []];
  for (const gap of skillGaps) {
    tierMap[categorizeTier(gap)].push(gap);
  }

  const allTiers: Tier[] = [
    { label: "Foundational", color: "emerald", skills: tierMap[0] },
    { label: "Intermediate", color: "teal", skills: tierMap[1] },
    { label: "Advanced", color: "cyan", skills: tierMap[2] },
    { label: "Leadership", color: "violet", skills: tierMap[3] },
  ];
  const tiers = allTiers.filter((t) => t.skills.length > 0);

  if (tiers.length === 0) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-teal-400 mb-4">Skill Tree</h3>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start gap-0 relative">
        {tiers.map((tier, idx) => {
          const colors = tierColors[tier.color];
          const isLast = idx === tiers.length - 1;

          return (
            <div key={tier.label} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className="absolute top-4 left-1/2 right-0 h-0.5 bg-gradient-to-r from-slate-600 to-slate-700/50 translate-x-[50%] w-full z-0"
                  aria-hidden="true"
                />
              )}

              {/* Tier node */}
              <div className={`relative z-10 h-8 w-8 rounded-full ${colors.dot} flex items-center justify-center mb-3 shadow-lg`}>
                <span className="text-xs font-bold text-white">{idx + 1}</span>
              </div>

              {/* Tier card */}
              <div className={`w-full border rounded-xl p-3 ${colors.bg} ${colors.border}`}>
                <p className={`text-xs font-semibold ${colors.text} text-center mb-2`}>{tier.label}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {tier.skills.map((gap, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <button
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer min-h-[44px] ${colors.chip}`}
                        >
                          {gap.skill}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] bg-slate-800 border border-slate-600 p-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-white text-xs">{gap.skill}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${PRIORITY_BADGE[gap.priority]}`}>
                              {gap.priority}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">
                            {gap.currentLevel} → {gap.requiredLevel}
                          </p>
                          {gap.resource && (
                            <p className="text-amber-300/80 text-[11px]">{gap.resource}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: collapsible tiers */}
      <div className="md:hidden space-y-2" aria-label="Skill tree tiers">
        {tiers.map((tier, idx) => {
          const colors = tierColors[tier.color];

          return (
            <Collapsible key={tier.label} defaultOpen={idx === 0}>
              <div className={`border rounded-xl ${colors.bg} ${colors.border}`}>
                <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 min-h-[44px] cursor-pointer group">
                  <div className={`h-7 w-7 rounded-full ${colors.dot} flex items-center justify-center shadow-lg shrink-0`}>
                    <span className="text-xs font-bold text-white">{idx + 1}</span>
                  </div>
                  <p className={`text-sm font-semibold ${colors.text} flex-1 text-left`}>{tier.label}</p>
                  <span className="text-xs text-slate-500">{tier.skills.length} skills</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-data-[panel-open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0">
                  <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                    {tier.skills.map((gap, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <button
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer min-h-[44px] ${colors.chip}`}
                          >
                            {gap.skill}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[240px] bg-slate-800 border border-slate-600 p-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-white text-xs">{gap.skill}</span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium capitalize ${PRIORITY_BADGE[gap.priority]}`}>
                                {gap.priority}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs">
                              {gap.currentLevel} → {gap.requiredLevel}
                            </p>
                            {gap.resource && (
                              <p className="text-amber-300/80 text-xs">{gap.resource}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
