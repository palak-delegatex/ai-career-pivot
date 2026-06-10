"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Calendar } from "lucide-react";

const RING_SIZE_SM = 100;
const RING_SIZE_MD = 140;
const STROKE_WIDTH_SM = 10;
const STROKE_WIDTH_MD = 12;
const RADIUS_SM = (RING_SIZE_SM - STROKE_WIDTH_SM) / 2;
const RADIUS_MD = (RING_SIZE_MD - STROKE_WIDTH_MD) / 2;
const CIRCUMFERENCE_SM = 2 * Math.PI * RADIUS_SM;
const CIRCUMFERENCE_MD = 2 * Math.PI * RADIUS_MD;

type ScheduleStatus = "on-track" | "behind-schedule" | "at-risk";

interface DashboardHeroProps {
  completionPercent: number;
  status: ScheduleStatus;
  totalMilestones: number;
  completedMilestones: number;
  remainingMilestones: number;
  targetRole: string;
  streakDays?: number;
  daysElapsed?: number;
  currentPhaseLabel?: string;
}

const statusConfig: Record<
  ScheduleStatus,
  { label: string; className: string }
> = {
  "on-track": {
    label: "On Track",
    className:
      "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
  },
  "behind-schedule": {
    label: "Behind Schedule",
    className:
      "bg-amber-900/40 border-amber-700/40 text-amber-300",
  },
  "at-risk": {
    label: "At Risk",
    className: "bg-red-900/40 border-red-700/40 text-red-300",
  },
};

function RingSvg({
  size,
  radius,
  strokeWidth,
  circumference,
  offset,
  gradientId,
}: {
  size: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  offset: number;
  gradientId: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const [offsetSm, setOffsetSm] = useState(CIRCUMFERENCE_SM);
  const [offsetMd, setOffsetMd] = useState(CIRCUMFERENCE_MD);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffsetSm(CIRCUMFERENCE_SM - (percent / 100) * CIRCUMFERENCE_SM);
      setOffsetMd(CIRCUMFERENCE_MD - (percent / 100) * CIRCUMFERENCE_MD);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <>
      {/* Small ring: below md */}
      <div
        className="relative shrink-0 md:hidden"
        style={{ width: RING_SIZE_SM, height: RING_SIZE_SM }}
      >
        <RingSvg
          size={RING_SIZE_SM}
          radius={RADIUS_SM}
          strokeWidth={STROKE_WIDTH_SM}
          circumference={CIRCUMFERENCE_SM}
          offset={offsetSm}
          gradientId="dashboardGradientSm"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-white">{percent}%</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">Complete</span>
        </div>
      </div>
      {/* Large ring: md+ */}
      <div
        className="relative shrink-0 hidden md:block"
        style={{ width: RING_SIZE_MD, height: RING_SIZE_MD }}
      >
        <RingSvg
          size={RING_SIZE_MD}
          radius={RADIUS_MD}
          strokeWidth={STROKE_WIDTH_MD}
          circumference={CIRCUMFERENCE_MD}
          offset={offsetMd}
          gradientId="dashboardGradientMd"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">{percent}%</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Complete</span>
        </div>
      </div>
    </>
  );
}

export default function DashboardHero({
  completionPercent,
  status,
  totalMilestones,
  completedMilestones,
  remainingMilestones,
  targetRole,
  streakDays = 0,
  daysElapsed,
  currentPhaseLabel,
}: DashboardHeroProps) {
  const cfg = statusConfig[status];

  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-teal-700/30 rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden">
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: "inset 0 0 60px rgba(20, 184, 166, 0.06)" }}
      />

      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <ProgressRing percent={completionPercent} />

        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
            <h2 className="text-lg font-bold text-white">
              Progress to {targetRole}
            </h2>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full border ${cfg.className}`}
            >
              {cfg.label}
            </span>
            {currentPhaseLabel && (
              <span className="text-xs font-medium px-3 py-1 rounded-full border bg-teal-900/40 border-teal-700/40 text-teal-300">
                {currentPhaseLabel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${
              streakDays > 0 ? "text-amber-400" : "text-slate-500"
            }`}>
              <Flame className="h-4 w-4" />
              {streakDays > 0
                ? `${streakDays}-day streak`
                : "Resume your streak"}
            </div>
            {daysElapsed !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Day {daysElapsed}
              </div>
            )}
          </div>

          {completionPercent >= 100 ? (
            <div className="flex items-center gap-3 mt-1 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-700/40">
              <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  All milestones complete!
                </p>
                <p className="text-xs text-slate-400">
                  You&apos;ve finished every milestone on your roadmap to {targetRole}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 sm:gap-x-6 gap-y-2">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {totalMilestones}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {completedMilestones}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider">
                  Done
                </span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-xl sm:text-2xl font-bold text-slate-300">
                  {remainingMilestones}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wider">
                  Remaining
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
