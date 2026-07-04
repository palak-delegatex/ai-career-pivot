"use client";

import { useState, useRef } from "react";
import NextStepCTA from "@/components/NextStepCTA";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  Target,
  Search,
  Zap,
} from "lucide-react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormatIssue {
  issue: string;
  severity: "critical" | "warning" | "minor";
  fix: string;
  category: string;
}

interface FoundKeyword {
  keyword: string;
  matchType: "exact" | "variant" | "semantic";
  foundIn: string[];
  frequency: number;
  skillType: "hard" | "soft" | "other";
}

interface MissingKeyword {
  keyword: string;
  importance: "critical" | "important" | "helpful";
  suggestion: string;
  suggestedSection: string | null;
  skillType: "hard" | "soft" | "other";
}

interface SectionItem {
  section: string;
  present: boolean;
  quality: "strong" | "adequate" | "weak" | "missing";
  keywordsFound: string[];
  keywordsMissing: string[];
  coverage: number;
  suggestion: string;
}

interface ContentSuggestion {
  area: string;
  current: string;
  improved: string;
}

interface MatchSummary {
  totalKeywords: number;
  matchedKeywords: number;
  missingKeywords: number;
  exactMatches: number;
  variantMatches: number;
  semanticMatches: number;
  requiredHit: number;
  requiredTotal: number;
  preferredHit: number;
  preferredTotal: number;
}

interface CategoryCheck {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
  fix: string | null;
}

interface CategoryScoreItem {
  name: string;
  key: string;
  score: number;
  weight: number;
  checks: CategoryCheck[];
}

interface ATSResult {
  overallScore: number;
  scoreLabel: string;
  formattingScore: number;
  keywordScore: number;
  categoryScores?: CategoryScoreItem[];
  formatIssues: FormatIssue[];
  keywordAnalysis: {
    foundKeywords: FoundKeyword[];
    missingKeywords: MissingKeyword[];
    keywordDensityScore: number;
    summary: MatchSummary;
  };
  sectionAnalysis: SectionItem[];
  searchability?: {
    score: number;
    contactFields: { email: boolean; phone: boolean; location: boolean; linkedin: boolean; name: boolean };
    jobTitleMatch: boolean;
  };
  recruiterTips?: {
    score: number;
    actionVerbRate: number;
    measurableResultRate: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    estimatedPages: number;
  };
  contentSuggestions: ContentSuggestion[];
  quantificationScore: {
    score: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    suggestions: string[];
  };
  topPriorityFixes: string[];
}

type Phase = "upload" | "loading" | "results";

// ── Styles ───────────────────────────────────────────────────────────────────

const SEVERITY_STYLE = {
  critical: "text-red-400 bg-red-900/30 border-red-700/40",
  warning: "text-amber-400 bg-amber-900/30 border-amber-700/40",
  minor: "text-blue-400 bg-blue-900/30 border-blue-700/40",
};

const QUALITY_STYLE = {
  strong: "text-emerald-400",
  adequate: "text-blue-400",
  weak: "text-amber-400",
  missing: "text-red-400",
};

const MATCH_TYPE_STYLE = {
  exact: "bg-emerald-900/30 border-emerald-700/40 text-emerald-300",
  variant: "bg-blue-900/30 border-blue-700/40 text-blue-300",
  semantic: "bg-purple-900/30 border-purple-700/40 text-purple-300",
};

const MATCH_TYPE_LABEL = {
  exact: "Exact",
  variant: "Variant",
  semantic: "Semantic",
};

const CATEGORY_COLOR: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  hard_skills: { bar: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-900/20", border: "border-blue-700/30" },
  soft_skills: { bar: "bg-violet-500", text: "text-violet-400", bg: "bg-violet-900/20", border: "border-violet-700/30" },
  keyword_density: { bar: "bg-cyan-500", text: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-700/30" },
  searchability: { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/30" },
  formatting: { bar: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-700/30" },
  recruiter_tips: { bar: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-900/20", border: "border-rose-700/30" },
};

const SKILL_TYPE_LABEL: Record<string, string> = {
  hard: "Hard Skill",
  soft: "Soft Skill",
  other: "Keyword",
};

// ── Components ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 144 }: { score: number; size?: number }) {
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
  const strokeColor =
    score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#334155" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={strokeColor} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${color}`}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

function MiniBar({ value, max = 100, color = "bg-blue-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MatchBreakdownBadges({ summary }: { summary: MatchSummary }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-2">
        <div className="text-lg font-bold text-emerald-400">{summary.exactMatches}</div>
        <div className="text-[10px] text-emerald-300/70">Exact</div>
      </div>
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2">
        <div className="text-lg font-bold text-blue-400">{summary.variantMatches}</div>
        <div className="text-[10px] text-blue-300/70">Variant</div>
      </div>
      <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-2">
        <div className="text-lg font-bold text-purple-400">{summary.semanticMatches}</div>
        <div className="text-[10px] text-purple-300/70">Semantic</div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ATSScoreClient() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (!allowed.includes(f.type)) {
      setError("Only PDF, DOCX, DOC, and TXT files are supported");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    setFile(f);
    setError("");
  }

  async function analyze() {
    if (!file) return;
    setPhase("loading");
    setError("");

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }

    try {
      const res = await fetch("/api/ats-score", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }
      const data: ATSResult = await res.json();
      setResult(data);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("upload");
    }
  }

  if (phase === "loading") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Scanning Your Resume</h2>
        <p className="text-slate-400 text-sm">
          Running formatting checks, keyword matching, and content analysis...
        </p>
      </main>
    );
  }

  if (phase === "results" && result) {
    const criticals = result.formatIssues.filter((i) => i.severity === "critical");
    const warnings = result.formatIssues.filter((i) => i.severity === "warning");
    const summary = result.keywordAnalysis.summary;

    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              ATS Score Results
            </h1>
            <p className="text-slate-400 text-sm">
              {file?.name}
              {jobDescription.trim() && " · Compared against job description"}
            </p>
          </div>
          <button
            onClick={() => { setPhase("upload"); setResult(null); setFile(null); }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Scan another resume
          </button>
        </div>

        {/* Score + Top Fixes */}
        <div className="flex items-start gap-8 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 mb-8">
          <ScoreRing score={result.overallScore} />
          <div className="flex-1">
            <div className="text-2xl font-bold mb-1">{result.scoreLabel}</div>
            <p className="text-slate-400 text-sm mb-4">
              {result.overallScore >= 80
                ? "Your resume is well-optimized for ATS systems."
                : result.overallScore >= 60
                  ? "Your resume passes most ATS filters but has room for improvement."
                  : "Your resume may get filtered out by ATS systems. Priority fixes below."}
            </p>
            <div className="text-sm font-semibold text-white mb-2">Top Priority Fixes</div>
            <ol className="space-y-1.5">
              {result.topPriorityFixes.map((fix, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {fix}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Category Breakdown */}
        {result.categoryScores && result.categoryScores.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Score Breakdown</h2>
            <div className="space-y-3">
              {result.categoryScores.map((cat) => {
                const colors = CATEGORY_COLOR[cat.key] || CATEGORY_COLOR.hard_skills;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{cat.name}</span>
                        <span className="text-[10px] text-slate-500">{Math.round(cat.weight * 100)}% weight</span>
                      </div>
                      <span className={`text-sm font-bold ${colors.text}`}>{cat.score}/100</span>
                    </div>
                    <MiniBar value={cat.score} color={colors.bar} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Match Rate Breakdown */}
        {summary && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Match Rate Breakdown
            </h2>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-6 mb-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Required Skills</span>
                    <span className="text-sm font-bold text-white">{summary.requiredHit}/{summary.requiredTotal}</span>
                  </div>
                  <MiniBar
                    value={summary.requiredHit}
                    max={Math.max(summary.requiredTotal, 1)}
                    color={summary.requiredHit / Math.max(summary.requiredTotal, 1) >= 0.7 ? "bg-emerald-500" : "bg-red-500"}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Preferred Skills</span>
                    <span className="text-sm font-bold text-white">{summary.preferredHit}/{summary.preferredTotal}</span>
                  </div>
                  <MiniBar
                    value={summary.preferredHit}
                    max={Math.max(summary.preferredTotal, 1)}
                    color={summary.preferredHit / Math.max(summary.preferredTotal, 1) >= 0.5 ? "bg-emerald-500" : "bg-amber-500"}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-300">Overall Keywords</span>
                <span className="text-sm font-bold text-white">{summary.matchedKeywords}/{summary.totalKeywords} matched</span>
              </div>
              <MiniBar
                value={summary.matchedKeywords}
                max={Math.max(summary.totalKeywords, 1)}
                color="bg-blue-500"
              />
              <div className="mt-4">
                <div className="text-xs text-slate-400 mb-2">Match types</div>
                <MatchBreakdownBadges summary={summary} />
              </div>
            </div>
          </section>
        )}

        {/* Found Keywords */}
        {result.keywordAnalysis.foundKeywords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Matched Keywords ({result.keywordAnalysis.foundKeywords.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.keywordAnalysis.foundKeywords.map((kw, i) => (
                <span
                  key={i}
                  className={`text-xs px-2.5 py-1.5 rounded-full border flex items-center gap-1.5 ${MATCH_TYPE_STYLE[kw.matchType]}`}
                  title={`${MATCH_TYPE_LABEL[kw.matchType]} match · ${SKILL_TYPE_LABEL[kw.skillType]} · ${kw.frequency}x · Found in: ${kw.foundIn.join(", ") || "semantic"}`}
                >
                  {kw.keyword}
                  {kw.frequency > 1 && <span className="text-[9px] opacity-60">{kw.frequency}x</span>}
                  <span className="text-[9px] opacity-60">{MATCH_TYPE_LABEL[kw.matchType]}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Missing Keywords */}
        {result.keywordAnalysis.missingKeywords.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Missing Keywords ({result.keywordAnalysis.missingKeywords.length})
            </h2>
            <div className="space-y-3">
              {result.keywordAnalysis.missingKeywords.map((kw, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{kw.keyword}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
                      kw.importance === "critical" ? SEVERITY_STYLE.critical
                        : kw.importance === "important" ? SEVERITY_STYLE.warning
                          : SEVERITY_STYLE.minor
                    }`}>
                      {kw.importance}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                      {SKILL_TYPE_LABEL[kw.skillType]}
                    </span>
                    {kw.suggestedSection && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {kw.suggestedSection}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{kw.suggestion}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Format Issues */}
        {result.formatIssues.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Format Issues ({criticals.length} critical, {warnings.length} warnings)
            </h2>
            <div className="space-y-3">
              {result.formatIssues.map((issue, i) => (
                <div key={i} className={`rounded-xl p-4 border ${SEVERITY_STYLE[issue.severity]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{issue.issue}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400 capitalize">{issue.category.replace("_", " ")}</span>
                      <span className="text-xs font-medium capitalize">{issue.severity}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">{issue.fix}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section Analysis */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            Section Analysis
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.sectionAnalysis.map((s, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{s.section}</span>
                  <span className={`text-xs font-medium capitalize ${QUALITY_STYLE[s.quality]}`}>
                    {s.present ? s.quality : "missing"}
                  </span>
                </div>
                {s.present && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500">Keyword coverage</span>
                      <span className="text-[10px] text-slate-400">{s.coverage}%</span>
                    </div>
                    <MiniBar
                      value={s.coverage}
                      color={s.coverage >= 75 ? "bg-emerald-500" : s.coverage >= 40 ? "bg-amber-500" : "bg-red-500"}
                    />
                  </div>
                )}
                {s.keywordsFound.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {s.keywordsFound.slice(0, 5).map((kw, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300">{kw}</span>
                    ))}
                    {s.keywordsFound.length > 5 && (
                      <span className="text-[10px] text-slate-500">+{s.keywordsFound.length - 5} more</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-400">{s.suggestion}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Content Improvements */}
        {result.contentSuggestions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Content Improvements
            </h2>
            <div className="space-y-4">
              {result.contentSuggestions.map((s, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-2">{s.area}</div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                      <div className="text-[10px] text-red-400 font-semibold mb-1">CURRENT</div>
                      <p className="text-sm text-slate-300">{s.current}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 mt-3 shrink-0" />
                    <div className="flex-1 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
                      <div className="text-[10px] text-emerald-400 font-semibold mb-1">IMPROVED</div>
                      <p className="text-sm text-slate-300">{s.improved}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category Detail Checks */}
        {result.categoryScores && result.categoryScores.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Detailed Checks ({result.categoryScores.reduce((s, c) => s + c.checks.length, 0)} total)
            </h2>
            <div className="space-y-4">
              {result.categoryScores.map((cat) => {
                const colors = CATEGORY_COLOR[cat.key] || CATEGORY_COLOR.hard_skills;
                const passed = cat.checks.filter(c => c.passed).length;
                const total = cat.checks.length;
                return (
                  <div key={cat.key} className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${colors.text}`}>{cat.name}</span>
                        <span className="text-xs text-slate-400">{passed}/{total} passed</span>
                      </div>
                      <span className={`text-lg font-bold ${colors.text}`}>{cat.score}</span>
                    </div>
                    <div className="space-y-2">
                      {cat.checks.map((check, j) => (
                        <div key={j} className="flex items-start gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-300">{check.detail}</div>
                            {!check.passed && check.fix && (
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 shrink-0" />
                                {check.fix}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <NextStepCTA fromTool="ats-score" />

        <div className="flex justify-center mt-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Upload phase
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-semibold mb-4">
          <FileText className="w-3.5 h-3.5" />
          ATS Compatibility Score
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          Will Your Resume Pass?
        </h1>
        <p className="text-slate-400 leading-relaxed">
          Upload your resume and get an instant ATS score with formatting checks,
          keyword matching, and specific fixes to beat applicant tracking systems.
        </p>
      </div>

      <div className="space-y-6">
        {/* File upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-950/20"
              : file
                ? "border-emerald-600/40 bg-emerald-950/10"
                : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/30"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium mb-1">
                Drop your resume here or click to browse
              </p>
              <p className="text-xs text-slate-500">PDF, DOCX, DOC, or TXT — max 5MB</p>
            </>
          )}
        </div>

        {/* Optional JD */}
        <button
          onClick={() => setShowJd(!showJd)}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <FileText className="w-4 h-4 text-blue-400" />
          Compare against a job description
          <span className="text-xs text-slate-500 font-normal">(recommended)</span>
          {showJd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showJd && (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job posting here for keyword-specific scoring..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={analyze}
          disabled={!file}
          className="w-full px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Score My Resume
        </button>

        <p className="text-slate-500 text-xs text-center">
          AI-powered analysis takes ~15 seconds
        </p>
      </div>
    </main>
  );
}
