"use client";

import { Flame } from "lucide-react";
import type { MomentumStats } from "@/lib/roadmap-momentum";
import { momentumMessage } from "@/lib/roadmap-momentum";

const levelStyles = {
  hot: { flame: "text-amber-400", ring: "border-amber-500/40 bg-amber-500/10", num: "text-amber-300" },
  warm: { flame: "text-amber-400/80", ring: "border-amber-500/30 bg-amber-500/5", num: "text-amber-300/90" },
  cooling: { flame: "text-slate-400", ring: "border-slate-600/50 bg-slate-800/40", num: "text-slate-300" },
  idle: { flame: "text-slate-500", ring: "border-slate-700/50 bg-slate-800/30", num: "text-slate-400" },
  none: { flame: "text-slate-600", ring: "border-slate-700/40 bg-slate-800/20", num: "text-slate-500" },
} as const;

/**
 * Lightweight streak / momentum signal for the roadmap (AIC-685).
 * Renders a flame + week-streak chip and a short encouraging line, derived
 * entirely from milestone completion timestamps.
 */
export default function RoadmapMomentum({ momentum }: { momentum: MomentumStats }) {
  const s = levelStyles[momentum.level];
  const streak = momentum.weekStreak;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${s.ring}`}
      aria-label="Momentum and streak"
    >
      <div className="flex items-center gap-2 shrink-0">
        <Flame className={`h-5 w-5 ${s.flame} ${momentum.level === "hot" ? "animate-pulse" : ""}`} />
        {streak > 0 ? (
          <div className="leading-none">
            <span className={`text-lg font-extrabold tabular-nums ${s.num}`}>{streak}</span>
            <span className="ml-1 text-[11px] font-medium text-slate-400">
              week{streak === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">No streak yet</span>
        )}
      </div>
      <div className="h-6 w-px bg-slate-700/60 shrink-0" />
      <p className="text-xs text-slate-400 leading-snug">{momentumMessage(momentum)}</p>
    </div>
  );
}
