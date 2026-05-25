"use client";

import { useEffect, useState } from "react";
import type { PivotPlan } from "@/lib/intake";

const RING_SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({ score }: { score: number }) {
  const [offset, setOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
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
          stroke="url(#tealGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
        <defs>
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white">{score}%</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Match</span>
      </div>
    </div>
  );
}

export default function PlanHero({ plan, currentRole }: { plan: PivotPlan; currentRole?: string }) {
  const score = plan.matchScore ?? 0;
  const skillMatch = plan.skillMatchPercent ?? 0;
  const salaryUplift = plan.financialSummary?.salaryUpliftPercent ?? 0;
  const fromRole = currentRole ?? "Your Current Role";

  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-teal-700/30 rounded-2xl p-6 md:p-8 overflow-hidden">
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        boxShadow: "inset 0 0 60px rgba(20, 184, 166, 0.06)",
      }} />

      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {score > 0 && <ScoreRing score={score} />}

        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
            <span className="text-sm text-slate-400 font-medium truncate max-w-[180px]">{fromRole}</span>
            <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="shrink-0">
              <path d="M0 6H22M22 6L17 1.5M22 6L17 10.5" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm text-teal-400 font-bold truncate max-w-[180px]">{plan.targetRole}</span>
          </div>

          {(plan.estimatedTimeToTransition || salaryUplift > 0 || skillMatch > 0) && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 mb-4">
              {plan.estimatedTimeToTransition && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-slate-500">Est. Time</span>
                  <span className="text-white font-semibold">{plan.estimatedTimeToTransition}</span>
                </div>
              )}
              {salaryUplift > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-slate-500">Salary Uplift</span>
                  <span className="text-emerald-400 font-semibold">+{salaryUplift}%</span>
                </div>
              )}
              {skillMatch > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-slate-500">Skill Match</span>
                  <span className="text-teal-300 font-semibold">{skillMatch}%</span>
                </div>
              )}
            </div>
          )}

          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{plan.rationale}</p>
        </div>
      </div>
    </div>
  );
}
