"use client";

import type { RealtimeScores } from "@/hooks/use-realtime-score";

function MiniRing({ score, size = 40 }: { score: number; size?: number }) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;
  const viewBox = size + 4;

  const strokeColor =
    score >= 80
      ? "stroke-emerald-400"
      : score >= 60
        ? "stroke-teal-400"
        : score >= 40
          ? "stroke-amber-400"
          : "stroke-red-400";

  const textColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-teal-400"
        : score >= 40
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${viewBox} ${viewBox}`}>
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          strokeWidth="3"
          className="stroke-slate-700"
        />
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColor} transition-all duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[10px] font-bold ${textColor}`}>{score}</span>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  score,
  detail,
}: {
  label: string;
  score: number | null;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      {score !== null ? (
        <MiniRing score={score} size={32} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-xs text-slate-300 block">{label}</span>
        {detail && (
          <span className="text-[10px] text-slate-500 block truncate">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}

export function LiveScorePanel({ scores }: { scores: RealtimeScores }) {
  const { overall, formatting, searchability, recruiterTips, keywords } = scores;

  const overallColor =
    (overall?.score ?? 0) >= 80
      ? "text-emerald-400"
      : (overall?.score ?? 0) >= 60
        ? "text-teal-400"
        : (overall?.score ?? 0) >= 40
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          Live Score
        </span>
        {scores.loading && (
          <span className="text-[10px] text-teal-400 animate-pulse">
            Scoring…
          </span>
        )}
      </div>

      {/* Overall score */}
      <div className="flex items-center gap-3">
        {overall ? (
          <>
            <MiniRing score={overall.score} size={52} />
            <div>
              <span className={`text-lg font-bold ${overallColor}`}>
                {overall.score}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                {overall.label}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] rounded-full bg-slate-800 animate-pulse" />
            <div>
              <span className="text-sm text-slate-500">Start typing…</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/50 pt-2 space-y-0.5">
        <CategoryRow
          label="Formatting"
          score={formatting?.score ?? null}
          detail={
            formatting
              ? formatting.criticalCount > 0
                ? `${formatting.criticalCount} critical issues`
                : `${formatting.issueCount} issues`
              : undefined
          }
        />
        <CategoryRow
          label="Searchability"
          score={searchability?.score ?? null}
          detail={
            searchability?.jobTitleMatch
              ? "Job title matched"
              : searchability
                ? "Job title not found"
                : undefined
          }
        />
        <CategoryRow
          label="Recruiter Tips"
          score={recruiterTips?.score ?? null}
          detail={
            recruiterTips
              ? `${Math.round(recruiterTips.actionVerbRate * 100)}% action verbs`
              : undefined
          }
        />
        {keywords && (
          <>
            <CategoryRow
              label="Hard Skills"
              score={keywords.hardSkillScore}
              detail={`${keywords.matched}/${keywords.total} matched`}
            />
            <CategoryRow
              label="Soft Skills"
              score={keywords.softSkillScore}
            />
          </>
        )}
      </div>

      {keywords && keywords.topMissing.length > 0 && (
        <div className="border-t border-slate-700/50 pt-2">
          <span className="text-[10px] text-slate-500 block mb-1">
            Missing keywords
          </span>
          <div className="flex flex-wrap gap-1">
            {keywords.topMissing.map((m) => (
              <span
                key={m.keyword}
                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                  m.category === "required"
                    ? "bg-red-900/30 border-red-600/30 text-red-300"
                    : "bg-amber-900/30 border-amber-600/30 text-amber-300"
                }`}
              >
                {m.keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
