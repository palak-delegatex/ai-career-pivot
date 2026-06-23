"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreviewScoreRing from "@/components/PreviewScoreRing";
import {
  trackPreviewStarted,
  trackPreviewCompleted,
  trackPreviewCtaClicked,
} from "@/lib/tracking";

interface SkillGapItem {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  priority: "high" | "medium" | "low";
}

interface PreviewResult {
  matchScore: number;
  summary: string;
  skillGaps: SkillGapItem[];
  topActions: string[];
  transferableStrengths: string[];
}

function severity(current: number, required: number): "minor" | "moderate" | "critical" {
  const ratio = required === 0 ? 1 : current / required;
  if (ratio >= 0.8) return "minor";
  if (ratio >= 0.4) return "moderate";
  return "critical";
}

const SEVERITY_COLORS = {
  minor: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
  },
  moderate: {
    bar: "bg-amber-500",
    badge: "bg-amber-900/40 border-amber-700/40 text-amber-300",
  },
  critical: {
    bar: "bg-red-500",
    badge: "bg-red-900/40 border-red-700/40 text-red-300",
  },
};

function SkeletonResults() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-center">
        <div className="w-36 h-36 rounded-full bg-slate-700" />
      </div>
      <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-slate-700 rounded w-28" />
              <div className="h-3 bg-slate-700 rounded w-16" />
            </div>
            <div className="h-5 bg-slate-700/60 rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-700 rounded w-full" />
        ))}
      </div>
    </div>
  );
}

export default function PreviewClient() {
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [animated, setAnimated] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentRole.trim() || !targetRole.trim()) return;

      setLoading(true);
      setResult(null);
      setAnimated(false);
      setError("");

      trackPreviewStarted({
        current_role: currentRole,
        target_role: targetRole,
      });

      try {
        const res = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentRole, targetRole }),
        });

        if (!res.ok) throw new Error("Analysis failed");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let raw = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
        }

        const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed: PreviewResult = JSON.parse(cleaned);
        setResult(parsed);
        setLoading(false);

        trackPreviewCompleted({
          current_role: currentRole,
          target_role: targetRole,
          match_score: parsed.matchScore,
        });

        requestAnimationFrame(() => {
          setTimeout(() => setAnimated(true), 100);
        });

        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    },
    [currentRole, targetRole],
  );

  return (
    <main className="max-w-2xl mx-auto px-4 pt-24 pb-20 sm:px-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/30 border border-teal-700/30 text-teal-300 text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Free — no signup required
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight mb-3">
          Skill-Gap Preview
        </h1>
        <p className="text-slate-400 text-base max-w-md mx-auto">
          See how your current skills stack up against your dream role in seconds.
        </p>
      </div>

      {/* Intake Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="current-role"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Current Role
            </label>
            <input
              id="current-role"
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g. Marketing Manager"
              className="w-full h-10 px-3 rounded-lg bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors"
              required
            />
          </div>
          <div>
            <label
              htmlFor="target-role"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Target Role
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Product Manager"
              className="w-full h-10 px-3 rounded-lg bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading || !currentRole.trim() || !targetRole.trim()}
          className="w-full mt-5 h-11 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze My Skill Gap
            </span>
          )}
        </Button>
      </form>

      {/* Skeleton Loading */}
      {loading && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <SkeletonResults />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div ref={resultsRef} className="space-y-6">
          {/* Score Ring + Summary */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-center">
            <h2 className="text-lg font-bold text-teal-400 mb-4">Your Career Match</h2>
            <PreviewScoreRing score={result.matchScore} animated={animated} />
            <p className="text-slate-300 text-sm mt-4 max-w-md mx-auto">
              {result.summary}
            </p>

            {/* Transferable Strengths */}
            {result.transferableStrengths.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {result.transferableStrengths.map((strength, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-teal-900/30 border border-teal-700/30 text-teal-300"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Skill Gap Chart */}
          <div className="bg-slate-800/60 border border-amber-700/40 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-400 mb-4">
              Skill Gap Analysis
            </h3>
            <div className="space-y-4">
              {result.skillGaps.map((gap, i) => {
                const sev = severity(gap.currentLevel, gap.requiredLevel);
                const colors = SEVERITY_COLORS[sev];

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {gap.skill}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${colors.badge}`}
                      >
                        {sev}
                      </span>
                    </div>
                    <div className="relative h-5 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-600/50 rounded-full"
                        style={{ width: `${gap.requiredLevel}%` }}
                      />
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${colors.bar}`}
                        style={{
                          width: animated ? `${gap.currentLevel}%` : "0%",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        <span className="text-[10px] font-medium text-white/80">
                          You: {gap.currentLevel}%
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          Needed: {gap.requiredLevel}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blurred Top Actions + CTA */}
          <div className="relative bg-slate-800/60 border border-slate-700 rounded-2xl p-6 overflow-hidden">
            <h3 className="text-sm font-bold text-teal-400 mb-3">
              Top 3 Actions to Close the Gap
            </h3>
            <div className="relative">
              <ol className="space-y-2.5 select-none" aria-hidden="true">
                {result.topActions.map((action, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-slate-300 blur-[6px]"
                  >
                    <span className="text-teal-500 font-bold shrink-0">
                      {i + 1}.
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>

              {/* Overlay CTA */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] rounded-xl">
                <Lock className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-sm text-slate-300 mb-3 text-center px-4">
                  Unlock your personalized action plan
                </p>
                <Link
                  href="/pricing"
                  onClick={() =>
                    trackPreviewCtaClicked({
                      cta_location: "preview_actions",
                      destination: "/pricing",
                    })
                  }
                >
                  <Button className="h-9 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-5">
                    Get Full Plan
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center pt-2 pb-4">
            <p className="text-slate-400 text-sm mb-4">
              Want a complete career pivot roadmap with weekly milestones?
            </p>
            <Link
              href="/pricing"
              onClick={() =>
                trackPreviewCtaClicked({
                  cta_location: "preview_bottom",
                  destination: "/pricing",
                })
              }
            >
              <Button className="h-11 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-8">
                Start Your Full Career Pivot
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
