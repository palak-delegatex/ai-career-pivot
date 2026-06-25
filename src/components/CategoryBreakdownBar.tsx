"use client";

function getBarGradient(score: number) {
  if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-emerald-400";
  if (score >= 60) return "bg-gradient-to-r from-teal-600 to-teal-400";
  if (score >= 40) return "bg-gradient-to-r from-amber-500 to-amber-400";
  return "bg-gradient-to-r from-red-500 to-red-400";
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-teal-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function CategoryBreakdownBar({
  name,
  icon,
  beforeScore,
  afterScore,
  weight,
}: {
  name: string;
  icon: React.ReactNode;
  beforeScore: number;
  afterScore: number;
  weight: number;
}) {
  const delta = afterScore - beforeScore;

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-medium text-slate-300">
          <span className="text-sm">{icon}</span>
          {name}
        </span>
        <span className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500 line-through">{beforeScore}%</span>
          <span className={`font-bold ${getScoreTextColor(afterScore)}`}>{afterScore}%</span>
          {delta > 0 && (
            <span className="rounded-full bg-emerald-400/10 px-1.5 py-px text-[10px] font-bold text-emerald-400">
              +{delta}
            </span>
          )}
        </span>
      </div>
      <div
        className="relative h-5 overflow-hidden rounded-md bg-slate-700"
        role="meter"
        aria-label={`${name}: ${afterScore} percent, was ${beforeScore} percent`}
        aria-valuenow={afterScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Ghost bar (before) */}
        <div
          className="absolute inset-y-0 left-0 rounded-md bg-slate-600 opacity-50"
          style={{ width: `${beforeScore}%` }}
        />
        {/* Solid bar (after) */}
        <div
          className={`absolute inset-y-0 left-0 rounded-md transition-all duration-[800ms] ease-out motion-reduce:transition-none ${getBarGradient(afterScore)}`}
          style={{ width: `${afterScore}%` }}
        />
      </div>
      <div className="mt-0.5 text-right text-[10px] text-slate-600">
        Weight: {Math.round(weight * 100)}%
      </div>
    </div>
  );
}
