"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { computeLiveResumeHealth } from "@/lib/ats-scoring";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-teal-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

function strokeColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-teal-400";
  if (score >= 40) return "stroke-amber-400";
  return "stroke-rose-400";
}

function barBg(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-teal-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function RadialScore({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="7" className="stroke-slate-700" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColor(score)} transition-all duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Resume health score: ${score} out of 100`}
          className={`text-2xl font-extrabold ${scoreColor(score)}`}
        >
          {score}
        </span>
        <span className={`text-[10px] font-semibold ${scoreColor(score)}`}>{label}</span>
      </div>
    </div>
  );
}

function Bar({ name, score }: { name: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-slate-400">{name}</span>
        <span className={`font-medium ${scoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barBg(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900/50 rounded-lg px-2.5 py-2 text-center">
      <div className="text-sm font-bold text-slate-200">{value}</div>
      <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
    </div>
  );
}

/**
 * Live, client-side ATS "Resume Health" meter. Recomputes locally (no API/LLM)
 * from the resume text as the user edits, debounced to stay smooth on every
 * keystroke. JD-independent MVP: formatting + searchability + recruiter signals.
 */
export default function LiveResumeScore({ text }: { text: string }) {
  const [debounced, setDebounced] = useState(text);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
  }, [text]);

  const health = useMemo(() => computeLiveResumeHealth(debounced), [debounced]);

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-teal-400" />
        <h2 className="text-sm font-bold text-white">Live Resume Health</h2>
        <span className="ml-auto text-[10px] text-slate-500">updates as you type</span>
      </div>

      <RadialScore score={health.score} label={health.label} />

      <div className="mt-5 space-y-2.5">
        <Bar name="Searchability" score={health.breakdown.searchability} />
        <Bar name="Formatting" score={health.breakdown.formatting} />
        <Bar name="Recruiter Impact" score={health.breakdown.recruiterTips} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Action verbs" value={pct(health.stats.actionVerbRate)} />
        <Stat label="With metrics" value={pct(health.stats.measurableResultRate)} />
        <Stat
          label="Sections"
          value={`${health.stats.standardSectionsFound}/${health.stats.standardSectionsTotal}`}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {health.topFixes.length > 0 ? "Top fixes" : "Looking good"}
        </h3>
        {health.topFixes.length > 0 ? (
          <ul className="space-y-1.5">
            {health.topFixes.map((fix, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2">
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400 flex gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            No blocking ATS issues detected. Tailor to a job description for keyword scoring.
          </p>
        )}
      </div>
    </div>
  );
}
