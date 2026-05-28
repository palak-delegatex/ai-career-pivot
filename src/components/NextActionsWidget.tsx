"use client";

import { ArrowRight } from "lucide-react";

interface NextAction {
  phase: string;
  phaseLabel: string;
  milestone: string;
  milestoneIndex: number;
  actions: { title: string; instruction: string; timeEstimate: string }[];
}

interface NextActionsWidgetProps {
  items: NextAction[];
}

const phaseAccent: Record<string, string> = {
  "6mo": "border-l-emerald-500",
  "1yr": "border-l-teal-500",
  "2yr": "border-l-cyan-500",
};

const phaseBadge: Record<string, string> = {
  "6mo": "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
  "1yr": "bg-teal-900/40 border-teal-700/40 text-teal-300",
  "2yr": "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
};

export default function NextActionsWidget({ items }: NextActionsWidgetProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRight className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-bold text-teal-400">Up Next</h3>
      </div>

      <div className="space-y-3">
        {items.slice(0, 3).map((item, i) => (
          <div
            key={`${item.phase}-${item.milestoneIndex}`}
            className={`bg-slate-900/50 border border-slate-700/60 border-l-2 ${
              phaseAccent[item.phase] ?? "border-l-teal-500"
            } rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
                <span className="text-teal-400 font-bold text-sm">
                  {i + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      phaseBadge[item.phase] ?? phaseBadge["1yr"]
                    }`}
                  >
                    {item.phaseLabel}
                  </span>
                </div>
                <p className="font-semibold text-white text-sm leading-snug mb-1">
                  {item.milestone}
                </p>

                {item.actions.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {item.actions.slice(0, 2).map((action, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-xs text-slate-400"
                      >
                        <span className="text-teal-400 mt-0.5 shrink-0">
                          {"\u25CB"}
                        </span>
                        <span className="line-clamp-1">{action.title}</span>
                        <span className="text-slate-600 shrink-0 ml-auto">
                          {action.timeEstimate}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
