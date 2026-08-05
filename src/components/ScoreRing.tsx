"use client";

export function ScoreRing({
  score,
  animated,
  label = "Job Fit",
  size = 112,
  target,
}: {
  score: number;
  animated: boolean;
  label?: string;
  size?: number;
  target?: number;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (circumference * (animated ? score : 0)) / 100;

  // Target anchor (AIC-1058 / AIC-883 spec 1). When a target is provided, draw a
  // short dashed tick across the ring at the target position. It's rendered
  // inside the same -rotate-90 <svg> and uses the identical clockwise-from-3-o'clock
  // parametrization as the progress arc, so it lines up exactly with where the arc
  // reaches at `target`%. Turns emerald once the live score meets the target.
  const hasTarget = typeof target === "number" && target > 0 && target < 100;
  const targetMet = hasTarget && score >= (target as number);
  const tickAngle = hasTarget ? (2 * Math.PI * (target as number)) / 100 : 0;
  const tickCos = Math.cos(tickAngle);
  const tickSin = Math.sin(tickAngle);

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
        {hasTarget && (
          <line
            x1={60 + 48 * tickCos}
            y1={60 + 48 * tickSin}
            x2={60 + 60 * tickCos}
            y2={60 + 60 * tickSin}
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeLinecap="round"
            className={
              targetMet
                ? "stroke-emerald-400 transition-colors"
                : "stroke-slate-400 transition-colors"
            }
          />
        )}
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
