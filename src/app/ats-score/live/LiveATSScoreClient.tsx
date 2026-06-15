"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Target,
  Search,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  Type,
  Info,
} from "lucide-react";
import {
  computeATSMatchBreakdown,
  detectFormattingIssues,
  parseResumeIntoSections,
  type MatchRateBreakdown,
  type JDKeywords,
  type FormattingIssue,
} from "@/lib/ats-scoring";

// ── Types ────────────────────────────────────────────────────────────────────

interface JDSummary {
  roleTitle: string;
  company: string;
  seniorityLevel: string;
  mustHaves: string[];
  niceToHaves: string[];
  keyResponsibilities: string[];
  extractedKeywords: {
    technicalSkills: string[];
    softSkills: string[];
    tools: string[];
    certifications: string[];
    industryTerms: string[];
  };
  salaryRange: string;
  remotePolicy: string;
}

type Phase = "paste-jd" | "extracting" | "editor";

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

function LiveScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth="7" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={scoreStroke(score)} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-slate-400">/ 100</span>
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
      <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${MATCH_TYPE_STYLE[matchType]}`}>
        <CheckCircle2 className="w-3 h-3" />
        {keyword}
        <span className="text-[9px] opacity-60">{MATCH_TYPE_LABEL[matchType]}</span>
      </span>
    );
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${
      category === "required"
        ? "bg-red-900/20 border-red-700/30 text-red-300"
        : category === "preferred"
          ? "bg-amber-900/20 border-amber-700/30 text-amber-300"
          : "bg-slate-800 border-slate-600 text-slate-300"
    }`}>
      <XCircle className="w-3 h-3" />
      {keyword}
      {category === "required" && <span className="text-[9px] opacity-60">Required</span>}
    </span>
  );
}

function JDSummaryCard({ summary, onClose }: { summary: JDSummary; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const allKeywords = [
    ...summary.extractedKeywords.technicalSkills,
    ...summary.extractedKeywords.tools,
    ...summary.extractedKeywords.softSkills,
    ...summary.extractedKeywords.certifications,
    ...summary.extractedKeywords.industryTerms,
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">JD Summary</span>
          </div>
          <div className="text-xs text-slate-400">
            {summary.roleTitle}
            {summary.company !== "Not specified" && ` at ${summary.company}`}
            {summary.seniorityLevel !== "Not specified" && ` · ${summary.seniorityLevel}`}
            {summary.remotePolicy !== "Not specified" && ` · ${summary.remotePolicy}`}
          </div>
        </div>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">Hide</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[10px] font-semibold text-red-400 uppercase mb-1">Must-Haves</div>
          <ul className="space-y-0.5">
            {summary.mustHaves.slice(0, expanded ? undefined : 4).map((item, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">*</span>
                {item}
              </li>
            ))}
            {!expanded && summary.mustHaves.length > 4 && (
              <li className="text-[10px] text-slate-500">+{summary.mustHaves.length - 4} more</li>
            )}
          </ul>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-amber-400 uppercase mb-1">Nice-to-Haves</div>
          <ul className="space-y-0.5">
            {summary.niceToHaves.slice(0, expanded ? undefined : 4).map((item, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">+</span>
                {item}
              </li>
            ))}
            {!expanded && summary.niceToHaves.length > 4 && (
              <li className="text-[10px] text-slate-500">+{summary.niceToHaves.length - 4} more</li>
            )}
          </ul>
        </div>
      </div>

      {expanded && (
        <>
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-blue-400 uppercase mb-1">Key Responsibilities</div>
            <ul className="space-y-0.5">
              {summary.keyResponsibilities.map((item, i) => (
                <li key={i} className="text-xs text-slate-300">&bull; {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-purple-400 uppercase mb-1">
              Extracted Keywords ({allKeywords.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {allKeywords.map((kw, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/20 border border-purple-700/20 text-purple-300">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 mt-2"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Less" : "More details"}
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function LiveATSScoreClient() {
  const [phase, setPhase] = useState<Phase>("paste-jd");
  const [jobDescription, setJobDescription] = useState("");
  const [jdKeywords, setJdKeywords] = useState<JDKeywords | null>(null);
  const [jdSummary, setJdSummary] = useState<JDSummary | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [resumeText, setResumeText] = useState("");
  const [breakdown, setBreakdown] = useState<MatchRateBreakdown | null>(null);
  const [formattingIssues, setFormattingIssues] = useState<FormattingIssue[]>([]);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [showSectionPanel, setShowSectionPanel] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

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
    if (!jdKeywords || !resumeText.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => recompute(resumeText, jdKeywords), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [resumeText, jdKeywords, recompute]);

  async function extractKeywords() {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError("Paste a job description (at least 20 characters)");
      return;
    }
    setExtracting(true);
    setError("");

    try {
      const [kwRes, summaryRes] = await Promise.all([
        fetch("/api/ats-score/extract-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: jobDescription.trim() }),
        }),
        fetch("/api/ats-score/summarize-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: jobDescription.trim() }),
        }),
      ]);

      if (!kwRes.ok) {
        const data = await kwRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to extract keywords");
      }

      const keywords: JDKeywords = await kwRes.json();
      setJdKeywords(keywords);

      if (summaryRes.ok) {
        const summary: JDSummary = await summaryRes.json();
        setJdSummary(summary);
      }

      setPhase("editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setExtracting(false);
    }
  }

  // ── Paste JD Phase ──────────────────────────────────────────────────────

  if (phase === "paste-jd") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            Real-Time ATS Scoring
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Live Resume Match Scorer
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Paste a job description, then write or edit your resume with real-time ATS
            match scoring. Watch your score update as you type.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <ClipboardPaste className="w-4 h-4 text-purple-400" />
              Paste Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting here..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
            <div className="text-xs text-slate-500 mt-1">
              {jobDescription.length > 0 && `${jobDescription.length} characters`}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={extractKeywords}
            disabled={extracting || jobDescription.trim().length < 20}
            className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {extracting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Job Description...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Start Live Scoring
              </>
            )}
          </button>

          <div className="flex items-center gap-4 text-xs text-slate-500 justify-center">
            <span>Extracts keywords &amp; summarizes the JD in ~5 seconds</span>
            <span>&bull;</span>
            <Link href="/ats-score" className="text-blue-400 hover:text-blue-300">
              Upload a file instead
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Editor Phase ────────────────────────────────────────────────────────

  const summary = breakdown?.summary;
  const sectionScores = breakdown?.sectionScores ?? [];
  const matchedKws = breakdown?.keywordMatches.filter(m => m.matched) ?? [];
  const missingKws = breakdown?.keywordMatches.filter(m => !m.matched) ?? [];
  const criticalIssues = formattingIssues.filter(i => i.severity === "critical");
  const warningIssues = formattingIssues.filter(i => i.severity === "warning");
  const totalKeywordCount = (jdKeywords?.required.length ?? 0) + (jdKeywords?.preferred.length ?? 0) + (jdKeywords?.keywords.length ?? 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-semibold">
            <Zap className="w-3 h-3" />
            Live
          </div>
          <h1 className="text-xl font-bold tracking-tight">ATS Match Scorer</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setPhase("paste-jd"); setJdKeywords(null); setJdSummary(null); setBreakdown(null); setResumeText(""); }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            New JD
          </button>
          <Link href="/ats-score" className="text-xs text-blue-400 hover:text-blue-300">
            File upload mode
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Left: Editor */}
        <div className="space-y-4">
          {/* JD Summary */}
          {jdSummary && showSummary && (
            <JDSummaryCard summary={jdSummary} onClose={() => setShowSummary(false)} />
          )}
          {!showSummary && jdSummary && (
            <button
              onClick={() => setShowSummary(true)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Show JD summary
            </button>
          )}

          {/* Resume textarea */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Type className="w-4 h-4 text-blue-400" />
              Resume Text
              <span className="text-[10px] text-slate-500 font-normal">(paste or type — score updates live)</span>
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={"Paste your resume text here, or start typing...\n\nExample:\n\nJohn Smith\njohn@email.com | (555) 123-4567\n\nSUMMARY\nExperienced software engineer with 5+ years...\n\nEXPERIENCE\nSenior Developer — Acme Corp (2020-2024)\n• Built and deployed microservices...\n\nSKILLS\nPython, JavaScript, React, AWS..."}
              rows={20}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{resumeText.length > 0 ? `${resumeText.split("\n").filter(l => l.trim()).length} lines` : "Start typing to see your score"}</span>
              {formattingIssues.length > 0 && (
                <span className={criticalIssues.length > 0 ? "text-red-400" : "text-amber-400"}>
                  {criticalIssues.length > 0 ? `${criticalIssues.length} critical format issue${criticalIssues.length > 1 ? "s" : ""}` : `${warningIssues.length} format warning${warningIssues.length > 1 ? "s" : ""}`}
                </span>
              )}
            </div>
          </div>

          {/* Formatting Issues (collapsible) */}
          {formattingIssues.length > 0 && (
            <div>
              <button
                onClick={() => setShowFormatPanel(!showFormatPanel)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors mb-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Format Issues ({formattingIssues.length})
                {showFormatPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showFormatPanel && (
                <div className="space-y-2">
                  {formattingIssues.map((issue, i) => (
                    <div key={i} className={`rounded-lg p-3 border text-sm ${SEVERITY_STYLE[issue.severity]}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs">{issue.issue}</span>
                        <span className="text-[10px] capitalize">{issue.severity}</span>
                      </div>
                      <p className="text-xs text-slate-300">{issue.fix}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section Analysis (collapsible) */}
          {sectionScores.length > 0 && (
            <div>
              <button
                onClick={() => setShowSectionPanel(!showSectionPanel)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors mb-2"
              >
                <Search className="w-4 h-4 text-blue-400" />
                Section Analysis ({sectionScores.filter(s => s.present).length}/{sectionScores.length} present)
                {showSectionPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showSectionPanel && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {sectionScores.map((s, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs">{s.section}</span>
                        <span className={`text-[10px] font-medium ${s.present ? (s.coverage >= 75 ? "text-emerald-400" : s.coverage >= 40 ? "text-amber-400" : "text-red-400") : "text-red-400"}`}>
                          {s.present ? `${s.coverage}%` : "Missing"}
                        </span>
                      </div>
                      {s.present && <MiniBar value={s.coverage} color={s.coverage >= 75 ? "bg-emerald-500" : s.coverage >= 40 ? "bg-amber-500" : "bg-red-500"} />}
                      {s.keywordsFound.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.keywordsFound.slice(0, 3).map((kw, j) => (
                            <span key={j} className="text-[9px] px-1 py-0.5 rounded bg-emerald-900/30 text-emerald-300">{kw}</span>
                          ))}
                          {s.keywordsFound.length > 3 && <span className="text-[9px] text-slate-500">+{s.keywordsFound.length - 3}</span>}
                        </div>
                      )}
                      {s.keywordsMissing.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.keywordsMissing.slice(0, 2).map((kw, j) => (
                            <span key={j} className="text-[9px] px-1 py-0.5 rounded bg-red-900/20 text-red-300">+{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Score Panel */}
        <div className="space-y-4">
          {/* Score ring */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 text-center sticky top-4">
            {breakdown ? (
              <>
                <LiveScoreRing score={breakdown.overallScore} />
                <div className={`text-lg font-bold mt-2 ${scoreColor(breakdown.overallScore)}`}>
                  {scoreLabel(breakdown.overallScore)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {breakdown.overallScore >= 80
                    ? "Well-optimized for ATS"
                    : breakdown.overallScore >= 60
                      ? "Passes most filters — keep adding keywords"
                      : "Add more matching keywords to improve"}
                </p>

                {/* Sub-scores */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <div className={`text-xl font-bold ${scoreColor(breakdown.keywordScore)}`}>{breakdown.keywordScore}</div>
                    <div className="text-[10px] text-slate-400">Keywords</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-3">
                    <div className={`text-xl font-bold ${scoreColor(breakdown.formattingScore)}`}>{breakdown.formattingScore}</div>
                    <div className="text-[10px] text-slate-400">Formatting</div>
                  </div>
                </div>

                {/* Match rate bar */}
                {summary && (
                  <div className="mt-4 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Keywords matched</span>
                      <span className="text-xs font-semibold text-white">{summary.matchedKeywords}/{summary.totalKeywords}</span>
                    </div>
                    <MiniBar value={summary.matchedKeywords} max={Math.max(summary.totalKeywords, 1)} color="bg-blue-500" />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-left">
                        <div className="text-[10px] text-slate-500">Required</div>
                        <div className="text-xs font-semibold text-white">{summary.requiredHit}/{summary.requiredTotal}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-slate-500">Preferred</div>
                        <div className="text-xs font-semibold text-white">{summary.preferredHit}/{summary.preferredTotal}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6">
                <div className="w-20 h-20 rounded-full border-4 border-slate-700 mx-auto flex items-center justify-center mb-3">
                  <Type className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-400">
                  Paste or type your resume to see your match score
                </p>
              </div>
            )}
          </div>

          {/* Keywords Panel */}
          {jdKeywords && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold">Keywords ({totalKeywordCount})</span>
              </div>

              {/* Matched */}
              {matchedKws.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Matched ({matchedKws.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedKws.map((m, i) => (
                      <KeywordPill key={i} keyword={m.keyword} matched={true} matchType={m.matchType} category={m.category} />
                    ))}
                  </div>
                </div>
              )}

              {/* Missing */}
              {missingKws.length > 0 && (
                <div>
                  <div className="text-[10px] text-red-400 font-semibold uppercase mb-1.5 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Missing ({missingKws.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingKws.map((m, i) => (
                      <KeywordPill key={i} keyword={m.keyword} matched={false} matchType={null} category={m.category} />
                    ))}
                  </div>
                  {missingKws.some(m => m.category === "required") && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>Add missing required keywords to your Skills or Experience sections for maximum ATS match rate.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!breakdown && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">From JD</div>
                  {jdKeywords.required.length > 0 && (
                    <div>
                      <span className="text-[10px] text-red-400 font-semibold">Required: </span>
                      <span className="text-[10px] text-slate-400">{jdKeywords.required.join(", ")}</span>
                    </div>
                  )}
                  {jdKeywords.preferred.length > 0 && (
                    <div>
                      <span className="text-[10px] text-amber-400 font-semibold">Preferred: </span>
                      <span className="text-[10px] text-slate-400">{jdKeywords.preferred.join(", ")}</span>
                    </div>
                  )}
                  {jdKeywords.keywords.length > 0 && (
                    <div>
                      <span className="text-[10px] text-blue-400 font-semibold">Keywords: </span>
                      <span className="text-[10px] text-slate-400">{jdKeywords.keywords.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick tips */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-300 mb-2">ATS Tips</div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-blue-400" />
                Use standard section headings: EXPERIENCE, SKILLS, EDUCATION
              </li>
              <li className="flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-blue-400" />
                Include exact keywords from the job description
              </li>
              <li className="flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-blue-400" />
                Avoid tables, images, and multi-column layouts
              </li>
              <li className="flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-blue-400" />
                Quantify achievements with numbers and percentages
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href="/resume-generator"
              className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-center transition-colors"
            >
              Generate ATS-Optimized Resume
            </Link>
            <Link
              href="/dashboard"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm text-center transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
