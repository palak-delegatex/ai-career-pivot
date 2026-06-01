"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakCalendarProps {
  activeDays: Set<string>;
  phaseForDay: Map<string, string>;
}

const phaseColor: Record<string, string> = {
  "6mo": "bg-emerald-500",
  "1yr": "bg-teal-500",
  "2yr": "bg-cyan-500",
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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

export default function StreakCalendar({
  activeDays,
  phaseForDay,
}: StreakCalendarProps) {
  const days = getLast28Days();
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-slate-300 mb-4">
        Streak Calendar
      </h3>

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
                const colorClass = active
                  ? phaseColor[phase ?? "6mo"] ?? "bg-teal-500"
                  : "bg-slate-700/60";
                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-8 h-8 rounded-md ${colorClass} transition-colors cursor-default`}
                      />
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
