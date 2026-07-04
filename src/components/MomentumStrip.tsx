"use client";

import { Flame } from "lucide-react";
import StreakCalendar from "@/components/StreakCalendar";
import CompletionBadges from "@/components/CompletionBadges";

/**
 * MomentumStrip (AIC-687) — a single card that wraps the 28-day StreakCalendar
 * and a horizontally-scrolling CompletionBadges row. Compact variant is used in
 * the desktop sidebar; the full variant sits at the bottom of the mobile hub.
 */
export default function MomentumStrip({
  activeDays,
  phaseForDay,
  streakDays,
  earnedBadges,
  compact = false,
}: {
  activeDays: Set<string>;
  phaseForDay: Map<string, string>;
  streakDays: number;
  earnedBadges: Set<string>;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-700 bg-slate-800/60 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Your Momentum</h3>
        {streakDays > 0 && (
          <div className="flex items-center gap-1 text-amber-300">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">
              {streakDays} day{streakDays === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      <StreakCalendar
        activeDays={activeDays}
        phaseForDay={phaseForDay}
        streakDays={streakDays}
        bare
      />

      <div className="mt-4 border-t border-slate-700/60 pt-4">
        <CompletionBadges earnedBadges={earnedBadges} layout="scroll" />
      </div>
    </div>
  );
}
