"use client";

import { TrendingUp, Mic2, Keyboard, Gauge } from "lucide-react";
import type { InterviewSession } from "@/lib/mock-interview-score";

// AIC-828: the retention surface. Past mock sessions were thrown away; now we
// list them and draw simple trend lines so a returning user can see delivery
// improving (or not) over time — the reason to come back and practice again.

// A minimal SVG line sparkline. `values` is oldest→newest; nulls are gaps.
function TrendLine({
  values,
  colorClass,
  height = 40,
}: {
  values: (number | null)[];
  colorClass: string;
  height?: number;
}) {
  const width = 140;
  const points = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);
  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.v));
  const min = Math.min(...points.map((p) => p.v));
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const y = (v: number) => height - 4 - ((v - min) / range) * (height - 8);

  const coords = points.map((p) => ({ x: p.i * stepX, y: y(p.v) }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <path d={path} fill="none" strokeWidth={2} className={colorClass} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3 : 2} className={colorClass.replace("stroke-", "fill-")} />
      ))}
    </svg>
  );
}

function TrendCard({
  label,
  values,
  latest,
  suffix,
  colorClass,
}: {
  label: string;
  values: (number | null)[];
  latest: number | null;
  suffix: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-3">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-sm font-bold text-white">
          {latest != null ? `${latest}${suffix}` : "—"}
        </span>
      </div>
      <TrendLine values={values} colorClass={colorClass} />
    </div>
  );
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MockTrendPanel({ sessions }: { sessions: InterviewSession[] }) {
  if (sessions.length === 0) return null;

  // Sessions arrive newest-first; charts read left-to-right oldest→newest.
  const chronological = [...sessions].reverse();
  const scoreSeries = chronological.map((s) => s.overall_score);
  const fillerSeries = chronological.map((s) => s.filler_pct);
  const wpmSeries = chronological.map((s) => s.wpm);

  const latest = sessions[0];
  const hasVoiceData = sessions.some((s) => s.overall_score != null || s.wpm != null);

  return (
    <div className="mt-10 pt-8 border-t border-slate-800">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Your progress</h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        {sessions.length} saved {sessions.length === 1 ? "session" : "sessions"}. Practice again to keep the trend moving.
      </p>

      {hasVoiceData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <TrendCard label="Delivery score" values={scoreSeries} latest={latest.overall_score} suffix="/100" colorClass="stroke-purple-400" />
          <TrendCard label="Filler words" values={fillerSeries} latest={latest.filler_pct} suffix="%" colorClass="stroke-amber-400" />
          <TrendCard label="Pace" values={wpmSeries} latest={latest.wpm} suffix=" wpm" colorClass="stroke-teal-400" />
        </div>
      )}

      <div className="space-y-1.5">
        {sessions.slice(0, 8).map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-lg bg-slate-800/40 border border-slate-800 px-3 py-2 text-sm"
          >
            {s.input_mode === "voice" ? (
              <Mic2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            ) : (
              <Keyboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className="font-medium text-white truncate flex-1">{s.target_role}</span>
            {s.overall_score != null && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-300">
                <Gauge className="w-3 h-3" />
                {s.overall_score}
              </span>
            )}
            {s.jd_fit_score != null && (
              <span className="text-xs text-emerald-400">JD {s.jd_fit_score}/10</span>
            )}
            <span className="text-xs text-slate-500 shrink-0 w-16 text-right">{relativeDate(s.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
