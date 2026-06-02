"use client";

function strokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-teal-400";
  return "stroke-amber-400";
}

function textColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-teal-400";
  return "text-amber-400";
}

export default function PreviewScoreRing({
  score,
  animated,
}: {
  score: number;
  animated: boolean;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * (animated ? score : 0)) / 100;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-slate-700"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Match score: ${score} percent`}
          className={`text-4xl font-extrabold ${textColor(score)}`}
        >
          {animated ? score : 0}%
        </span>
        <span className="text-xs text-slate-400 mt-0.5">Career Match</span>
      </div>
    </div>
  );
}
