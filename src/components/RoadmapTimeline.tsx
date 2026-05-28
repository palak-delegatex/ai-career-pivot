"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface Phase {
  label: string;
  milestones: string[];
  color: "emerald" | "teal" | "cyan";
}

const nodeColors = {
  emerald: {
    bg: "bg-emerald-500",
    border: "border-emerald-400",
    glow: "shadow-emerald-500/30",
    text: "text-emerald-400",
    bullet: "text-emerald-500",
    line: "from-emerald-500",
    badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
  },
  teal: {
    bg: "bg-teal-500",
    border: "border-teal-400",
    glow: "shadow-teal-500/30",
    text: "text-teal-400",
    bullet: "text-teal-500",
    line: "from-teal-500",
    badge: "bg-teal-900/40 border-teal-700/40 text-teal-300",
  },
  cyan: {
    bg: "bg-cyan-500",
    border: "border-cyan-400",
    glow: "shadow-cyan-500/30",
    text: "text-cyan-400",
    bullet: "text-cyan-500",
    line: "from-cyan-500",
    badge: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
  },
} as const;

const PREVIEW_COUNT = 3;

export default function RoadmapTimeline({
  sixMonthMilestones,
  oneYearMilestones,
  twoYearMilestones,
}: {
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
}) {
  const phases: Phase[] = [
    { label: "6 Months", milestones: sixMonthMilestones, color: "emerald" },
    { label: "1 Year", milestones: oneYearMilestones, color: "teal" },
    { label: "2 Years", milestones: twoYearMilestones, color: "cyan" },
  ];

  return (
    <section aria-label="Career roadmap timeline">
      {/* "You are here" marker */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          You are here
        </span>
      </div>

      {/* Mobile: horizontal swipeable timeline */}
      <div className="md:hidden">
        <ol
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-2 px-2"
          aria-label="Timeline phases"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {phases.map((phase, idx) => {
            const colors = nodeColors[phase.color];
            const hasMore = phase.milestones.length > PREVIEW_COUNT;

            return (
              <li key={phase.label} className="snap-center shrink-0 w-[85vw] max-w-[340px]">
                {/* Phase node */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`h-7 w-7 rounded-full border-2 ${colors.border} ${colors.bg} shadow-lg ${colors.glow} flex items-center justify-center shrink-0`}
                    aria-hidden="true"
                  >
                    <span className="text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold ${colors.text}`}>
                    {phase.label}
                  </h3>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}
                  >
                    {phase.milestones.length} milestones
                  </span>
                </div>

                {/* Phase content */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <ul className="space-y-1.5" role="list">
                    {phase.milestones
                      .slice(0, PREVIEW_COUNT)
                      .map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-300"
                        >
                          <span
                            className={`${colors.bullet} mt-0.5 shrink-0`}
                          >
                            →
                          </span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                  </ul>

                  {hasMore && (
                    <Collapsible>
                      <CollapsibleContent className="overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0">
                        <ul className="space-y-1.5 mt-1.5" role="list">
                          {phase.milestones
                            .slice(PREVIEW_COUNT)
                            .map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-slate-300"
                              >
                                <span
                                  className={`${colors.bullet} mt-0.5 shrink-0`}
                                >
                                  →
                                </span>
                                <span className="leading-snug">{item}</span>
                              </li>
                            ))}
                        </ul>
                      </CollapsibleContent>
                      <CollapsibleTrigger className="mt-2 flex items-center gap-1.5 min-h-[44px] px-2 -mx-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group cursor-pointer">
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
                        <span className="group-data-[panel-open]:hidden">
                          Show {phase.milestones.length - PREVIEW_COUNT} more
                        </span>
                        <span className="hidden group-data-[panel-open]:inline">
                          Show less
                        </span>
                      </CollapsibleTrigger>
                    </Collapsible>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex justify-center gap-1.5 mt-2" aria-hidden="true">
          {phases.map((phase) => (
            <div key={phase.label} className={`w-2 h-2 rounded-full ${nodeColors[phase.color].bg} opacity-50`} />
          ))}
        </div>
      </div>

      {/* Desktop: horizontal timeline */}
      <ol
        className="hidden md:grid md:grid-cols-3 md:gap-0 relative"
        aria-label="Timeline phases"
      >
        {/* Horizontal connector track */}
        <div
          className="absolute top-3 left-[calc(16.67%)] right-[calc(16.67%)] h-0.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-60"
          aria-hidden="true"
        />

        {phases.map((phase, idx) => {
          const colors = nodeColors[phase.color];
          const hasMore = phase.milestones.length > PREVIEW_COUNT;

          return (
            <li key={phase.label} className="relative flex flex-col items-center">
              {/* Phase node */}
              <div
                className={`relative z-10 h-7 w-7 rounded-full border-2 ${colors.border} ${colors.bg} shadow-lg ${colors.glow} flex items-center justify-center mb-4`}
                aria-hidden="true"
              >
                <span className="text-xs font-bold text-white">
                  {idx + 1}
                </span>
              </div>

              {/* Phase card */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 w-full">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <h3 className={`text-sm font-bold ${colors.text}`}>
                    {phase.label}
                  </h3>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}
                  >
                    {phase.milestones.length}
                  </span>
                </div>

                <ul className="space-y-1.5" role="list">
                  {phase.milestones
                    .slice(0, PREVIEW_COUNT)
                    .map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <span
                          className={`${colors.bullet} mt-0.5 shrink-0`}
                        >
                          →
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                </ul>

                {hasMore && (
                  <Collapsible>
                    <CollapsibleContent className="overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0">
                      <ul className="space-y-1.5 mt-1.5" role="list">
                        {phase.milestones
                          .slice(PREVIEW_COUNT)
                          .map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-300"
                            >
                              <span
                                className={`${colors.bullet} mt-0.5 shrink-0`}
                              >
                                →
                              </span>
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                      </ul>
                    </CollapsibleContent>
                    <CollapsibleTrigger className="mt-2 flex items-center gap-1.5 min-h-[44px] px-2 -mx-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group cursor-pointer">
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
                      <span className="group-data-[panel-open]:hidden">
                        +{phase.milestones.length - PREVIEW_COUNT} more
                      </span>
                      <span className="hidden group-data-[panel-open]:inline">
                        Less
                      </span>
                    </CollapsibleTrigger>
                  </Collapsible>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
