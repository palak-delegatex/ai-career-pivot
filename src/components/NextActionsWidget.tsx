"use client";

import {
  ArrowRight,
  CheckCircle,
  BookOpen,
  Briefcase,
  Rocket,
  Clock,
} from "lucide-react";

interface NextAction {
  phase: string;
  phaseLabel: string;
  milestone: string;
  milestoneIndex: number;
  actions: { title: string; instruction: string; timeEstimate: string }[];
}

interface NextActionsWidgetProps {
  items: NextAction[];
  onMarkDone?: (phaseKey: string, milestoneIndex: number) => void;
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

const phaseDot: Record<string, string> = {
  "6mo": "bg-emerald-500",
  "1yr": "bg-teal-500",
  "2yr": "bg-cyan-500",
};

const phaseIcon: Record<string, React.ReactNode> = {
  "6mo": <BookOpen className="h-3.5 w-3.5" />,
  "1yr": <Briefcase className="h-3.5 w-3.5" />,
  "2yr": <Rocket className="h-3.5 w-3.5" />,
};

const phaseEstimate: Record<string, string> = {
  "6mo": "within 6 months",
  "1yr": "within 1 year",
  "2yr": "within 2 years",
};

export default function NextActionsWidget({ items, onMarkDone }: NextActionsWidgetProps) {
  if (items.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
        <CheckCircle className="h-8 w-8 text-emerald-500/40 mb-2" />
        <p className="text-sm font-semibold text-slate-400">All caught up!</p>
        <p className="text-xs text-slate-500 mt-1">You&apos;ve completed every milestone. Nice work.</p>
      </div>
    );
  }

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
                  <span className={`w-2 h-2 rounded-full ${phaseDot[item.phase] ?? "bg-teal-500"}`} />
                  <span className="text-teal-400">
                    {phaseIcon[item.phase] ?? phaseIcon["1yr"]}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      phaseBadge[item.phase] ?? phaseBadge["1yr"]
                    }`}
                  >
                    {item.phaseLabel}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-2.5 w-2.5" />
                    {phaseEstimate[item.phase] ?? ""}
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
                        <span className="line-clamp-2 sm:line-clamp-1">{action.title}</span>
                        <span className="text-slate-600 shrink-0 ml-auto">
                          {action.timeEstimate}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {onMarkDone && (
                  <button
                    onClick={() => onMarkDone(item.phase, item.milestoneIndex)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors cursor-pointer bg-transparent border-0 py-2 px-1 -ml-1 min-h-[44px]"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
