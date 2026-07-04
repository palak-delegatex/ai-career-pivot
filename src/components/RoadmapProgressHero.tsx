"use client";

import { Flame } from "lucide-react";

/**
 * RoadmapProgressHero (AIC-687) — the sticky top of the interactive roadmap hub.
 *
 * Renders an animated SVG ring (stroke-dashoffset, 1s cubic-bezier), a per-phase
 * breakdown with a segmented bar, a personalized greeting, and a streak pill.
 * Responsive: stacked on mobile, row on desktop. All motion respects
 * prefers-reduced-motion via the global reduced-motion rules.
 */

export interface HeroPhaseStat {
  key: "6mo" | "1yr" | "2yr";
  label: string;
  completed: number;
  total: number;
  color: "emerald" | "teal" | "cyan";
}

const RING_RADIUS = 36;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 226.19

const dotColor: Record<HeroPhaseStat["color"], string> = {
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
};

const segColor: Record<HeroPhaseStat["color"], string> = {
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
};

export default function RoadmapProgressHero({
  greetingName,
  subtitle,
  percentComplete,
  totalCompleted,
  totalMilestones,
  phaseStats,
  streakDays,
  compact = false,
}: {
  greetingName?: string;
  subtitle?: string;
  percentComplete: number;
  totalCompleted: number;
  totalMilestones: number;
  phaseStats: HeroPhaseStat[];
  streakDays: number;
  /** Tighter padding + smaller ring for the dashboard summary / desktop sidebar. */
  compact?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percentComplete)));
  const dashOffset = RING_CIRCUMFERENCE * (1 - pct / 100);
  const ringSize = compact ? 72 : 88;

  return (
    <div
      className={`rounded-2xl border border-slate-700 bg-gradient-to-b from-teal-500/10 to-transparent ${
        compact ? "p-4" : "p-5"
      }`}
    >
      {/* Greeting + streak */}
      {(greetingName || streakDays > 0) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {greetingName ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Welcome back, {greetingName}
              </p>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
          ) : (
            <span />
          )}
          {streakDays > 0 && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              {streakDays}-day streak
            </div>
          )}
        </div>
      )}

      {/* Ring + phase breakdown */}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div
          className="relative shrink-0"
          style={{ width: ringSize, height: ringSize }}
        >
          <svg
            className="-rotate-90"
            width={ringSize}
            height={ringSize}
            viewBox="0 0 88 88"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="roadmap-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#1e293b"
              strokeWidth="6"
            />
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="url(#roadmap-ring-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-extrabold leading-none text-white"
              style={{ fontSize: compact ? 18 : 22 }}
            >
              {pct}%
            </span>
            <span className="mt-0.5 text-[10px] text-slate-400">complete</span>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1">
          <div
            className="sr-only"
            aria-label={`${totalCompleted} of ${totalMilestones} milestones complete`}
          />
          <div className="space-y-2">
            {phaseStats.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor[p.color]}`} />
                <span className="flex-1 text-xs text-slate-400">{p.label}</span>
                <span className="text-xs font-semibold text-white tabular-nums">
                  {p.completed}/{p.total}
                </span>
              </div>
            ))}
          </div>

          {/* Segmented progress bar — one segment per phase */}
          <div className="mt-3 flex h-1 w-full overflow-hidden rounded-full bg-slate-800">
            {phaseStats.map((p) => (
              <div
                key={p.key}
                className={`h-full ${segColor[p.color]} motion-safe:transition-[width] motion-safe:duration-[800ms] motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]`}
                style={{
                  width: totalMilestones > 0 ? `${(p.completed / totalMilestones) * 100}%` : "0%",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
