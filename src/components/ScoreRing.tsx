"use client";

export function ScoreRing({
  score,
  animated,
  label = "Job Fit",
  size = 112,
}: {
  score: number;
  animated: boolean;
  label?: string;
  size?: number;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (circumference * (animated ? score : 0)) / 100;

  const strokeColor =
    score >= 80
      ? "stroke-emerald-400"
      : score >= 60
        ? "stroke-teal-400"
        : score >= 40
          ? "stroke-amber-400"
          : "stroke-red-400";

  const textColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-teal-400"
        : score >= 40
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      aria-label={`ATS compatibility score: ${score} percent`}
    >
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
          className={`${strokeColor} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${textColor}`}>
          {animated ? score : 0}%
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">{label}</span>
      </div>
    </div>
  );
}
