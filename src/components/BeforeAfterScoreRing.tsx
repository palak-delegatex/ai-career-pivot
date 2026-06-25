"use client";

import { useEffect, useState } from "react";

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "stroke-emerald-400", text: "text-emerald-400", label: "Excellent" };
  if (score >= 60) return { stroke: "stroke-teal-400", text: "text-teal-400", label: "Good" };
  if (score >= 40) return { stroke: "stroke-amber-400", text: "text-amber-400", label: "Needs Work" };
  return { stroke: "stroke-red-400", text: "text-red-400", label: "Poor" };
}

function getLabelBg(score: number) {
  if (score >= 80) return "bg-emerald-400/10 border-emerald-400/25 text-emerald-400";
  if (score >= 60) return "bg-teal-400/10 border-teal-400/25 text-teal-400";
  if (score >= 40) return "bg-amber-400/10 border-amber-400/25 text-amber-400";
  return "bg-red-400/10 border-red-400/25 text-red-400";
}

export function BeforeAfterScoreRing({
  beforeScore,
  afterScore,
  animated = true,
  size = 160,
}: {
  beforeScore: number;
  afterScore: number;
  animated?: boolean;
  size?: number;
}) {
  const [show, setShow] = useState(!animated);

  useEffect(() => {
    if (animated) {
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }
  }, [animated]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const beforeOffset = circumference - (circumference * (show ? beforeScore : 0)) / 100;
  const afterOffset = circumference - (circumference * (show ? afterScore : 0)) / 100;
  const ghostOffset = circumference - (circumference * (show ? beforeScore : 0)) / 100;

  const beforeColor = getScoreColor(beforeScore);
  const afterColor = getScoreColor(afterScore);
  const delta = afterScore - beforeScore;
  const isCelebration = afterScore >= 80;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-10 max-[900px]:flex-col max-[900px]:gap-5">
        {/* Before ring */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Current Score
          </span>
          <div
            className="relative mx-auto"
            style={{ width: size, height: size }}
            role="meter"
            aria-label={`Current ATS score: ${beforeScore} percent`}
            aria-valuenow={beforeScore}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-700" />
              <circle
                cx="60" cy="60" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={beforeOffset}
                className={`${beforeColor.stroke} transition-all duration-700 ease-out motion-reduce:transition-none`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold leading-none ${beforeColor.text}`}>
                {show ? beforeScore : 0}
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-slate-400">out of 100</span>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getLabelBg(beforeScore)}`}>
            {beforeColor.label}
          </span>
        </div>

        {/* Arrow connector */}
        <div className="flex flex-col items-center gap-2 max-[900px]:rotate-90">
          <span className="animate-pulse text-3xl text-teal-400 motion-reduce:animate-none">&rarr;</span>
          {delta > 0 && (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1 text-xl font-extrabold text-emerald-400">
              +{delta}
            </span>
          )}
        </div>

        {/* After ring with ghost arc */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Optimized Score
          </span>
          <div
            className={`relative mx-auto ${isCelebration ? "after:absolute after:inset-[-2px] after:animate-pulse after:rounded-full after:bg-gradient-to-br after:from-emerald-400/40 after:via-teal-400/20 after:to-transparent" : ""}`}
            style={{ width: size, height: size }}
            role="meter"
            aria-label={`Optimized ATS score: ${afterScore} percent`}
            aria-valuenow={afterScore}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <svg className="relative z-10 h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-700" />
              {/* Ghost arc showing before state */}
              <circle
                cx="60" cy="60" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={ghostOffset}
                className={`${afterColor.stroke} opacity-20 transition-all duration-700 ease-out motion-reduce:transition-none`}
              />
              {/* After progress */}
              <circle
                cx="60" cy="60" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={afterOffset}
                className={`${afterColor.stroke} transition-all duration-700 ease-out motion-reduce:transition-none`}
              />
            </svg>
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold leading-none ${afterColor.text}`}>
                {show ? afterScore : 0}
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-slate-400">out of 100</span>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getLabelBg(afterScore)}`}>
            {afterColor.label}
          </span>
        </div>
      </div>
    </div>
  );
}
