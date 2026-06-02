"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        <span className="text-lg font-bold">{score}</span>
      </div>
    </div>
  );
}

function GatedSection({ label }: { label: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="blur-sm select-none pointer-events-none">
        <div className="space-y-2 p-4 bg-slate-800/40 rounded-xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-slate-600" />
              <div className={`h-3 rounded bg-slate-600 ${i === 0 ? "w-48" : i === 1 ? "w-36" : "w-40"}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-[1px] rounded-xl gap-2">
        <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs text-slate-300 font-medium">{label} — Unlock for $5</span>
      </div>
    </div>
  );
}

export default function FreeResultsClient() {
  const [snapshot, setSnapshot] = useState<FreeSnapshot | null>(null);
  const [selectedPath, setSelectedPath] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("free_snapshot");
    if (!raw) { setNotFound(true); return; }
    try {
      setSnapshot(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-slate-400 mb-4">No snapshot found. Please upload your resume first.</p>
        <Link href="/free" className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block">
          Get Free Snapshot
        </Link>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading your snapshot...</p>
      </main>
    );
  }

  const activePath = snapshot.paths[selectedPath];

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-3">
          Free Skill-Gap Snapshot
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Your Career Pivot Matches</h1>
        {snapshot.profileSummary && (
          <p className="text-slate-400 text-sm">{snapshot.profileSummary}</p>
        )}
      </div>

      {/* Transferable strengths */}
      {snapshot.topTransferableStrengths?.length > 0 && (
        <div className="rounded-2xl bg-teal-950/30 border border-teal-800/30 p-4 mb-6">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Your Strongest Assets</p>
          <div className="flex flex-wrap gap-2">
            {snapshot.topTransferableStrengths.map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-teal-900/40 border border-teal-700/40 text-teal-300 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Path selector tabs */}
      {snapshot.paths.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
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
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <MatchScoreRing score={activePath.matchScore} />
            <div>
              <h2 className="text-xl font-bold">{activePath.targetRole}</h2>
              <p className="text-slate-400 text-sm">{activePath.targetIndustry}</p>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">{activePath.rationale}</p>
            </div>
          </div>

          {/* Top skill gaps */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Top Skill Gaps to Close
            </p>
            <div className="space-y-2">
              {activePath.topSkillGaps.map((gap) => (
                <div key={gap.skill} className="flex items-center gap-3 rounded-lg bg-slate-700/30 p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{gap.skill}</span>
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

          {/* Gated sections */}
          <div className="space-y-3">
            <GatedSection label="6-month / 1-year / 2-year milestones" />
            <GatedSection label="Financial bridge — salary trajectory & ROI" />
            <GatedSection label="AI coaching + weekly action plan" />
          </div>
        </div>
      )}

      {/* Upsell CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-900/40 to-slate-800/60 border border-teal-700/40 p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Unlock Your Full Roadmap</h3>
        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
          Get the complete plan: 6 / 12 / 24-month milestones, salary trajectory,
          financial bridge, AI toolkit, and unlimited coaching — all for $5.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/30"
          >
            Get Full Report — $5 →
          </Link>
          <Link
            href="/free"
            className="px-6 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-sm transition-colors"
          >
            Try a different resume
          </Link>
        </div>
        <p className="text-slate-500 text-xs mt-3">One-time payment. Instant delivery.</p>
      </div>

      {/* Social proof nudge */}
      <p className="text-center text-slate-500 text-xs mt-6">
        Seeing a path you like?{" "}
        <Link href="/pricing" className="text-teal-400 hover:text-teal-300 underline">
          Get the complete plan with milestones, salary data, and AI coaching for $5.
        </Link>
      </p>
    </main>
  );
}
