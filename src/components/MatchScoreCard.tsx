"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { UserProfile } from "@/lib/intake";

interface MatchScoreData {
  overallScore: number;
  dimensions: { name: string; score: number }[];
  suggestions: string[];
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-teal-400";
  return "text-amber-400";
}

function strokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-teal-400";
  return "stroke-amber-400";
}

function barBg(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-teal-400";
  return "bg-amber-400";
}

function RadialScore({ score, animated }: { score: number; animated: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * (animated ? score : 0)) / 100;

  return (
    <div className="relative w-32 h-32 mx-auto">
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
          className={`${strokeColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Match score: ${score} percent`}
          className={`text-3xl font-extrabold ${scoreColor(score)}`}
        >
          {animated ? score : 0}%
        </span>
        <span className="text-xs text-slate-400">Market Fit</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6 animate-pulse">
      <div className="h-5 w-36 bg-slate-700 rounded mb-6" />
      <div className="w-32 h-32 mx-auto rounded-full bg-slate-700 mb-6" />
      <div className="space-y-3">
        <div className="h-3 bg-slate-700 rounded w-full" />
        <div className="h-3 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-5/6" />
      </div>
    </div>
  );
}

export function MatchScoreCard({ profile }: { profile: UserProfile }) {
  const [data, setData] = useState<MatchScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/intake/match-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((result: MatchScoreData) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
        requestAnimationFrame(() => {
          setTimeout(() => setAnimated(true), 100);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (loading) return <SkeletonCard />;
  if (error || !data) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-bold text-teal-400 mb-4">Profile Match Score</h2>

      <RadialScore score={data.overallScore} animated={animated} />

      <Collapsible>
        <CollapsibleTrigger className="group flex items-center gap-2 w-full mt-5 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
          <ChevronDown className="w-4 h-4 transition-transform group-data-[panel-open]:rotate-180" />
          Score Breakdown
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 space-y-3">
            {data.dimensions.map((dim) => (
              <div key={dim.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{dim.name}</span>
                  <span className={`font-medium ${scoreColor(dim.score)}`}>
                    {dim.score}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barBg(dim.score)}`}
                    style={{ width: animated ? `${dim.score}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {data.suggestions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Suggestions
          </h3>
          <ul className="space-y-1.5">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-slate-400 flex gap-2">
                <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
