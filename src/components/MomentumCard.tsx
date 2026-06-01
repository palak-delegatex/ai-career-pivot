"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface MomentumCardProps {
  weeklyActivity: number[];
  monthlyCompleted: number;
  previousMonthCompleted: number;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const barWidth = 20;
  const gap = 6;
  const height = 48;
  const totalWidth = data.length * barWidth + (data.length - 1) * gap;

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
      className="shrink-0"
    >
      {data.map((val, i) => {
        const barHeight = Math.max((val / max) * height, 2);
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={4}
            className={val > 0 ? "fill-teal-500" : "fill-slate-700"}
          />
        );
      })}
    </svg>
  );
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function MomentumCard({
  weeklyActivity,
  monthlyCompleted,
  previousMonthCompleted,
}: MomentumCardProps) {
  const trend = monthlyCompleted - previousMonthCompleted;
  const trendUp = trend >= 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-slate-300 mb-4">Momentum</h3>

      <div className="flex items-end gap-1 mb-2">
        <Sparkline data={weeklyActivity} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mb-4">
        {DAYS.map((d, i) => (
          <span key={i} style={{ width: 20, textAlign: "center" }}>
            {d}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div>
          <span className="text-lg font-bold text-white">{monthlyCompleted}</span>
          <span className="text-xs text-slate-400 ml-1">this month</span>
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            trendUp ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {trendUp ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {trend > 0 ? "+" : ""}
          {trend} vs last month
        </div>
      </div>
    </div>
  );
}
