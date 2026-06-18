"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  Search,
} from "lucide-react";
import {
  computeATSMatchBreakdown,
  detectFormattingIssues,
  type MatchRateBreakdown,
  type JDKeywords,
  type FormattingIssue,
} from "@/lib/ats-scoring";

// ── Types ────────────────────────────────────────────────────────────────────

interface RealtimeATSPanelProps {
  resumeText: string;
  jobDescription?: string;
  debounceMs?: number;
}

// ── Style constants ─────────────────────────────────────────────────────────

const SEVERITY_STYLE = {
  critical: "text-red-400 bg-red-900/30 border-red-700/40",
  warning: "text-amber-400 bg-amber-900/30 border-amber-700/40",
  minor: "text-blue-400 bg-blue-900/30 border-blue-700/40",
};

const MATCH_TYPE_STYLE = {
  exact: "bg-emerald-900/30 border-emerald-700/40 text-emerald-300",
  variant: "bg-blue-900/30 border-blue-700/40 text-blue-300",
  semantic: "bg-purple-900/30 border-purple-700/40 text-purple-300",
};

const MATCH_TYPE_LABEL = { exact: "Exact", variant: "Variant", semantic: "Semantic" };

// ── Score helpers ───────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreStroke(score: number) {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LiveScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const radius = (size / 2) - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={scoreStroke(score)} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-extrabold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[9px] text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function MiniBar({ value, max = 100, color = "bg-blue-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function KeywordPill({ keyword, matched, matchType, category }: {
  keyword: string;
  matched: boolean;
  matchType: "exact" | "variant" | "semantic" | null;
  category: "required" | "preferred" | "keyword";
}) {
  if (matched && matchType) {
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${MATCH_TYPE_STYLE[matchType]}`}>
        <CheckCircle2 className="w-2.5 h-2.5" />
        {keyword}
        <span className="text-[8px] opacity-60">{MATCH_TYPE_LABEL[matchType]}</span>
      </span>
    );
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${
      category === "required"
        ? "bg-red-900/20 border-red-700/30 text-red-300"
        : category === "preferred"
          ? "bg-amber-900/20 border-amber-700/30 text-amber-300"
          : "bg-slate-800 border-slate-600 text-slate-300"
    }`}>
      <XCircle className="w-2.5 h-2.5" />
      {keyword}
      {category === "required" && <span className="text-[8px] opacity-60">Req</span>}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function RealtimeATSPanel({ resumeText, jobDescription, debounceMs = 300 }: RealtimeATSPanelProps) {
  const [jdKeywords, setJdKeywords] = useState<JDKeywords | null>(null);
  const [breakdown, setBreakdown] = useState<MatchRateBreakdown | null>(null);
  const [formattingIssues, setFormattingIssues] = useState<FormattingIssue[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [showSectionPanel, setShowSectionPanel] = useState(false);
  const [showKeywords, setShowKeywords] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const lastJdRef = useRef<string>("");

  const recompute = useCallback((text: string, keywords: JDKeywords) => {
    if (!text.trim()) {
      setBreakdown(null);
      setFormattingIssues([]);
      return;
    }
    const issues = detectFormattingIssues(text);
    setFormattingIssues(issues);
    const result = computeATSMatchBreakdown(text, keywords);
    setBreakdown(result);
  }, []);

  useEffect(() => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      setJdKeywords(null);
      setBreakdown(null);
      lastJdRef.current = "";
      return;
    }
    const jdTrimmed = jobDescription.trim();
    if (jdTrimmed === lastJdRef.current) return;
    lastJdRef.current = jdTrimmed;

    let cancelled = false;
    setExtracting(true);
    setExtractError("");

    fetch("/api/ats-score/extract-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jdTrimmed }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to extract keywords");
        }
        const keywords: JDKeywords = await res.json();
        setJdKeywords(keywords);
        if (resumeText.trim()) {
          recompute(resumeText, keywords);
        }
      })
      .catch((err) => {
        if (!cancelled) setExtractError(err instanceof Error ? err.message : "Keyword extraction failed");
      })
      .finally(() => {
        if (!cancelled) setExtracting(false);
      });

    return () => { cancelled = true; };
  }, [jobDescription, resumeText, recompute]);

  useEffect(() => {
    if (!jdKeywords || !resumeText.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => recompute(resumeText, jdKeywords), debounceMs);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [resumeText, jdKeywords, recompute, debounceMs]);

  if (!jobDescription || jobDescription.trim().length < 20) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-center">
        <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">
          Add a job description to see real-time ATS match scoring
        </p>
      </div>
    );
  }

  if (extracting) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 text-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Extracting keywords from job description...</p>
      </div>
    );
  }

  if (extractError) {
    return (
      <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
        <p className="text-xs text-red-400">{extractError}</p>
      </div>
    );
  }

  const summary = breakdown?.summary;
  const sectionScores = breakdown?.sectionScores ?? [];
  const matchedKws = breakdown?.keywordMatches.filter(m => m.matched) ?? [];
  const missingKws = breakdown?.keywordMatches.filter(m => !m.matched) ?? [];
  const criticalIssues = formattingIssues.filter(i => i.severity === "critical");
  const totalKeywordCount = (jdKeywords?.required.length ?? 0) + (jdKeywords?.preferred.length ?? 0) + (jdKeywords?.keywords.length ?? 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-[10px] font-semibold">
          <Zap className="w-2.5 h-2.5" />
          Live ATS Score
        </div>
      </div>

      {/* Score ring */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-center">
        {breakdown ? (
          <>
            <LiveScoreRing score={breakdown.overallScore} />
            <div className={`text-sm font-bold mt-1 ${scoreColor(breakdown.overallScore)}`}>
              {scoreLabel(breakdown.overallScore)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {breakdown.overallScore >= 80
                ? "Well-optimized for ATS"
                : breakdown.overallScore >= 60
                  ? "Passes most filters — keep adding keywords"
                  : "Add more matching keywords to improve"}
            </p>

            {/* Sub-scores */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-900/40 rounded-lg p-2">
                <div className={`text-lg font-bold ${scoreColor(breakdown.keywordScore)}`}>{breakdown.keywordScore}</div>
                <div className="text-[9px] text-slate-400">Keywords</div>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-2">
                <div className={`text-lg font-bold ${scoreColor(breakdown.formattingScore)}`}>{breakdown.formattingScore}</div>
                <div className="text-[9px] text-slate-400">Formatting</div>
              </div>
            </div>

            {/* Match rate */}
            {summary && (
              <div className="mt-3 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Keywords matched</span>
                  <span className="text-[10px] font-semibold text-white">{summary.matchedKeywords}/{summary.totalKeywords}</span>
                </div>
                <MiniBar value={summary.matchedKeywords} max={Math.max(summary.totalKeywords, 1)} color="bg-blue-500" />
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div className="text-left">
                    <div className="text-[9px] text-slate-500">Required</div>
                    <div className="text-[10px] font-semibold text-white">{summary.requiredHit}/{summary.requiredTotal}</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[9px] text-slate-500">Preferred</div>
                    <div className="text-[10px] font-semibold text-white">{summary.preferredHit}/{summary.preferredTotal}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-700 mx-auto flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-xs text-slate-400">Edit your resume to see the match score</p>
          </div>
        )}
      </div>

      {/* Formatting Issues */}
      {formattingIssues.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <button
            onClick={() => setShowFormatPanel(!showFormatPanel)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors w-full"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Format Issues ({formattingIssues.length})
            {criticalIssues.length > 0 && (
              <span className="text-[9px] text-red-400 font-normal">({criticalIssues.length} critical)</span>
            )}
            <span className="ml-auto">
              {showFormatPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>
          {showFormatPanel && (
            <div className="space-y-1.5 mt-2">
              {formattingIssues.map((issue, i) => (
                <div key={i} className={`rounded-lg p-2 border text-[10px] ${SEVERITY_STYLE[issue.severity]}`}>
                  <div className="font-semibold">{issue.issue}</div>
                  <p className="text-slate-300 mt-0.5">{issue.fix}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Keywords Panel */}
      {jdKeywords && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <button
            onClick={() => setShowKeywords(!showKeywords)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors w-full"
          >
            <Target className="w-3.5 h-3.5 text-blue-400" />
            Keywords ({totalKeywordCount})
            {matchedKws.length > 0 && (
              <span className="text-[9px] text-emerald-400 font-normal">{matchedKws.length} matched</span>
            )}
            <span className="ml-auto">
              {showKeywords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>

          {showKeywords && (
            <div className="mt-2">
              {matchedKws.length > 0 && (
                <div className="mb-2">
                  <div className="text-[9px] text-emerald-400 font-semibold uppercase mb-1 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Matched ({matchedKws.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {matchedKws.map((m, i) => (
                      <KeywordPill key={i} keyword={m.keyword} matched={true} matchType={m.matchType} category={m.category} />
                    ))}
                  </div>
                </div>
              )}

              {missingKws.length > 0 && (
                <div>
                  <div className="text-[9px] text-red-400 font-semibold uppercase mb-1 flex items-center gap-0.5">
                    <XCircle className="w-2.5 h-2.5" />
                    Missing ({missingKws.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingKws.map((m, i) => (
                      <KeywordPill key={i} keyword={m.keyword} matched={false} matchType={null} category={m.category} />
                    ))}
                  </div>
                  {missingKws.some(m => m.category === "required") && (
                    <div className="mt-1.5 flex items-start gap-1 text-[10px] text-slate-400">
                      <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                      <span>Add missing required keywords to Skills or Experience sections.</span>
                    </div>
                  )}
                </div>
              )}

              {!breakdown && (
                <div className="space-y-1">
                  {jdKeywords.required.length > 0 && (
                    <div>
                      <span className="text-[9px] text-red-400 font-semibold">Required: </span>
                      <span className="text-[9px] text-slate-400">{jdKeywords.required.join(", ")}</span>
                    </div>
                  )}
                  {jdKeywords.preferred.length > 0 && (
                    <div>
                      <span className="text-[9px] text-amber-400 font-semibold">Preferred: </span>
                      <span className="text-[9px] text-slate-400">{jdKeywords.preferred.join(", ")}</span>
                    </div>
                  )}
                  {jdKeywords.keywords.length > 0 && (
                    <div>
                      <span className="text-[9px] text-blue-400 font-semibold">Keywords: </span>
                      <span className="text-[9px] text-slate-400">{jdKeywords.keywords.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section Analysis */}
      {sectionScores.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <button
            onClick={() => setShowSectionPanel(!showSectionPanel)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors w-full"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            Sections ({sectionScores.filter(s => s.present).length}/{sectionScores.length})
            <span className="ml-auto">
              {showSectionPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>
          {showSectionPanel && (
            <div className="grid gap-1.5 mt-2">
              {sectionScores.map((s, i) => (
                <div key={i} className="bg-slate-900/40 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[10px]">{s.section}</span>
                    <span className={`text-[9px] font-medium ${s.present ? (s.coverage >= 75 ? "text-emerald-400" : s.coverage >= 40 ? "text-amber-400" : "text-red-400") : "text-red-400"}`}>
                      {s.present ? `${s.coverage}%` : "Missing"}
                    </span>
                  </div>
                  {s.present && <MiniBar value={s.coverage} color={s.coverage >= 75 ? "bg-emerald-500" : s.coverage >= 40 ? "bg-amber-500" : "bg-red-500"} />}
                  {s.keywordsFound.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {s.keywordsFound.slice(0, 3).map((kw, j) => (
                        <span key={j} className="text-[8px] px-1 py-0.5 rounded bg-emerald-900/30 text-emerald-300">{kw}</span>
                      ))}
                      {s.keywordsFound.length > 3 && <span className="text-[8px] text-slate-500">+{s.keywordsFound.length - 3}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
