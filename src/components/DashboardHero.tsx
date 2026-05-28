"use client";

import { useEffect, useState } from "react";

const RING_SIZE = 140;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ScheduleStatus = "on-track" | "behind-schedule" | "at-risk";

interface DashboardHeroProps {
  completionPercent: number;
  status: ScheduleStatus;
  totalMilestones: number;
  completedMilestones: number;
  remainingMilestones: number;
  targetRole: string;
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

function ProgressRing({ percent }: { percent: number }) {
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE);
    }, 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: RING_SIZE, height: RING_SIZE }}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className="text-slate-700"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#dashboardGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
        <defs>
          <linearGradient
            id="dashboardGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">
          {percent}%
        </span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          Complete
        </span>
      </div>
    </div>
  );
}

export default function DashboardHero({
  completionPercent,
  status,
  totalMilestones,
  completedMilestones,
  remainingMilestones,
  targetRole,
}: DashboardHeroProps) {
  const cfg = statusConfig[status];

  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-teal-700/30 rounded-2xl p-6 md:p-8 overflow-hidden">
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
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-white">
                {totalMilestones}
              </span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                Total
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-emerald-400">
                {completedMilestones}
              </span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                Done
              </span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-bold text-slate-300">
                {remainingMilestones}
              </span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                Remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
