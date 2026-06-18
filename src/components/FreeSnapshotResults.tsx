"use client";

import { useState } from "react";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400 bg-red-950/40 border-red-800/40",
  medium: "text-yellow-400 bg-yellow-950/30 border-yellow-800/30",
  low: "text-emerald-400 bg-emerald-950/30 border-emerald-800/30",
};

function MatchScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#2dd4bf" : score >= 50 ? "#f59e0b" : "#f87171";

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} stroke="#334155" strokeWidth="6" fill="none" />
        <circle
          cx="36" cy="36" r={radius}
          stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

interface FreeSnapshotResultsProps {
  snapshot: FreeSnapshot;
}

export default function FreeSnapshotResults({ snapshot }: FreeSnapshotResultsProps) {
  const [selectedPath, setSelectedPath] = useState(0);
  const activePath = snapshot.paths[selectedPath];

  return (
    <div className="space-y-6">
      {/* Profile summary */}
      {snapshot.profileSummary && (
        <div className="rounded-xl bg-teal-950/20 border border-teal-800/30 px-5 py-4">
          <p className="text-sm text-teal-300/90 leading-relaxed">{snapshot.profileSummary}</p>
        </div>
      )}

      {/* Transferable strengths */}
      {snapshot.topTransferableStrengths?.length > 0 && (
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-5">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-4">
            Hidden Strengths You Didn&apos;t Know You Had
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {snapshot.topTransferableStrengths.map((s) => (
              <div key={s.skill} className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3">
                <p className="text-sm font-semibold text-white mb-1">{s.skill}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      style={{ width: `${s.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-teal-400 w-8 text-right">{s.confidence}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.aiBoostExplanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Path selector tabs */}
      {snapshot.paths.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {snapshot.paths.map((path, i) => (
            <button
              key={i}
              onClick={() => setSelectedPath(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                i === selectedPath
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {path.targetRole}
            </button>
          ))}
        </div>
      )}

      {/* Active path card */}
      {activePath && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <div className="flex items-start gap-4 mb-4">
            <MatchScoreRing score={activePath.matchScore} />
            <div>
              <h3 className="text-lg font-bold text-white">{activePath.targetRole}</h3>
              <p className="text-slate-400 text-sm">{activePath.targetIndustry}</p>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">{activePath.rationale}</p>
            </div>
          </div>

          {/* Skill gaps */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Top Skill Gaps to Close
            </p>
            <div className="space-y-2">
              {activePath.topSkillGaps.map((gap) => (
                <div key={gap.skill} className="flex items-center gap-3 rounded-lg bg-slate-700/30 p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{gap.skill}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${PRIORITY_COLORS[gap.priority]}`}>
                        {gap.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-600">
                        <div
                          className="h-1.5 rounded-full bg-teal-500"
                          style={{ width: `${gap.transferabilityScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-20 text-right">
                        {gap.transferabilityScore}% carries over
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary uplift teaser */}
          {snapshot.estimatedSalaryUplift && (
            <div className="mt-4 rounded-lg bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-800/30 p-3 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-900/50 border border-emerald-700/40 shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Estimated +${snapshot.estimatedSalaryUplift}K salary uplift</p>
                <p className="text-xs text-slate-400">Full salary trajectory available in complete report</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
