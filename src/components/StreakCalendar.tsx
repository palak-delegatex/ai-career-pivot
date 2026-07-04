"use client";

import { useEffect, useState, useCallback } from "react";
import { Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakCalendarProps {
  activeDays: Set<string>;
  phaseForDay: Map<string, string>;
  streakDays: number;
  /**
   * When true, render without the card chrome + title so the calendar can be
   * embedded inside another card (e.g. the roadmap MomentumStrip, AIC-687).
   */
  bare?: boolean;
}

const phaseColor: Record<string, string> = {
  "6mo": "bg-emerald-500",
  "1yr": "bg-teal-500",
  "2yr": "bg-cyan-500",
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const STREAK_TOASTS_KEY = "aicareerpivot:streak:toasts";

const STREAK_MILESTONES = [7, 14, 30] as const;

const STREAK_MESSAGES: Record<number, string> = {
  7: "1 week streak! You're building real momentum.",
  14: "2 week streak! Consistency is your superpower.",
  30: "30-day streak! You're unstoppable.",
};

function getShownToasts(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STREAK_TOASTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markToastShown(milestone: number) {
  const shown = getShownToasts();
  shown.add(milestone);
  localStorage.setItem(STREAK_TOASTS_KEY, JSON.stringify([...shown]));
}

function getLast28Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function computeStreakRuns(days: string[], activeDays: Set<string>): Map<string, number> {
  const streakMap = new Map<string, number>();
  let run = 0;
  for (const day of days) {
    if (activeDays.has(day)) {
      run++;
    } else {
      run = 0;
    }
    streakMap.set(day, run);
  }
  return streakMap;
}

export default function StreakCalendar({
  activeDays,
  phaseForDay,
  streakDays,
  bare = false,
}: StreakCalendarProps) {
  const [toast, setToast] = useState<string | null>(null);

  const days = getLast28Days();
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const streakRuns = computeStreakRuns(days, activeDays);

  useEffect(() => {
    const shown = getShownToasts();
    for (const milestone of STREAK_MILESTONES) {
      if (streakDays >= milestone && !shown.has(milestone)) {
        markToastShown(milestone);
        setToast(STREAK_MESSAGES[milestone]);
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [streakDays]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
  const hadStreakButBroke =
    streakDays === 0 &&
    !activeDays.has(todayStr) &&
    activeDays.has(yesterdayStr);

  return (
    <div
      className={
        bare ? "" : "bg-slate-800/60 border border-slate-700 rounded-2xl p-5"
      }
    >
      {!bare && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300">Streak Calendar</h3>
          {streakDays >= 3 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-semibold">{streakDays}d</span>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-orange-900/30 border border-orange-700/40 text-orange-300 text-xs font-medium animate-[fade-in_300ms_ease-out]">
          {toast}
        </div>
      )}

      {hadStreakButBroke && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs">
          Your streak paused — complete a milestone today to restart it!
        </div>
      )}

      <div className="flex gap-1 mb-1">
        {DAY_LABELS.map((l, i) => (
          <div
            key={i}
            className="w-8 h-4 flex items-center justify-center text-[10px] text-slate-500"
          >
            {l}
          </div>
        ))}
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="flex flex-col gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex gap-1">
              {week.map((day) => {
                const active = activeDays.has(day);
                const phase = phaseForDay.get(day);
                const dayStreak = streakRuns.get(day) ?? 0;
                const colorClass = active
                  ? phaseColor[phase ?? "6mo"] ?? "bg-teal-500"
                  : "bg-slate-700/60";
                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-md ${colorClass} transition-colors cursor-default`}
                        />
                        {dayStreak >= 3 && (
                          <Flame className="absolute -top-1 -right-1 h-3 w-3 text-orange-400" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {new Date(day + "T12:00:00").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        {active ? " — milestone completed" : " — no activity"}
                        {dayStreak >= 3 && ` (${dayStreak}-day streak)`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
