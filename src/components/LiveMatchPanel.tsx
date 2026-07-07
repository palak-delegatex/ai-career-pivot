"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ScoreRing";
import {
  CheckCircle2,
  Plus,
  Loader2,
  Sparkles,
  Copy,
  Download,
} from "lucide-react";
import {
  computeATSMatchBreakdown,
  type JDKeywords,
} from "@/lib/ats-scoring";
import {
  trackLiveMatchScoreUpdated,
  trackLiveMatchSuggestionInserted,
} from "@/lib/tracking";

interface Suggestion {
  keyword: string;
  bullet: string;
  section: "skills" | "experience" | "summary";
}

interface LiveMatchPanelProps {
  /** Resume markdown to seed the editable draft (e.g. the tailored output). */
  initialResume: string;
  /** JD keywords already parsed upstream — no re-parse needed for live scoring. */
  jdKeywords: JDKeywords;
  /** Raw JD text, used only to generate gap-fill suggestions. */
  jobDescription: string;
  locale?: string;
  onDownload?: (markdown: string) => void;
}

const SECTION_HEADINGS: Record<Suggestion["section"], string> = {
  skills: "## Skills",
  experience: "## Experience",
  summary: "## Professional Summary",
};

/**
 * Insert a line directly beneath the target section heading. If the heading is
 * absent, append the section (with heading) to the end of the document.
 */
function insertLineIntoSection(
  text: string,
  section: Suggestion["section"],
  line: string
): string {
  const heading = SECTION_HEADINGS[section];
  const lines = text.split("\n");
  const idx = lines.findIndex(
    (l) => l.trim().toLowerCase() === heading.toLowerCase()
  );
  const entry = section === "skills" ? line : `- ${line}`;

  if (idx === -1) {
    const suffix = text.trim().length ? "\n\n" : "";
    return `${text.trimEnd()}${suffix}${heading}\n${entry}\n`;
  }
  lines.splice(idx + 1, 0, entry);
  return lines.join("\n");
}

export function LiveMatchPanel({
  initialResume,
  jdKeywords,
  jobDescription,
  locale,
  onDownload,
}: LiveMatchPanelProps) {
  const [resumeText, setResumeText] = useState(initialResume);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [inserted, setInserted] = useState<Set<string>>(new Set());
  const [animated, setAnimated] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastScoreRef = useRef<number | null>(null);

  // Deterministic re-score on every edit — runs entirely client-side, no network.
  const breakdown = useMemo(
    () => computeATSMatchBreakdown(resumeText, jdKeywords),
    [resumeText, jdKeywords]
  );

  const matched = useMemo(
    () => breakdown.keywordMatches.filter((k) => k.matched),
    [breakdown]
  );
  const missing = useMemo(
    () => breakdown.keywordMatches.filter((k) => !k.matched),
    [breakdown]
  );

  // Animate the ring toward each new score.
  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, [breakdown.overallScore]);

  // Emit a debounced analytics signal when the live score changes.
  useEffect(() => {
    const t = setTimeout(() => {
      if (lastScoreRef.current !== breakdown.overallScore) {
        lastScoreRef.current = breakdown.overallScore;
        trackLiveMatchScoreUpdated({
          score: breakdown.overallScore,
          matched: breakdown.summary.matchedKeywords,
          missing: breakdown.summary.missingKeywords,
        });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [breakdown.overallScore, breakdown.summary.matchedKeywords, breakdown.summary.missingKeywords]);

  // Lazily fetch one polished gap-fill line per keyword (single Sonnet call).
  useEffect(() => {
    let cancelled = false;
    const allKeywords = Array.from(
      new Set(breakdown.keywordMatches.map((k) => k.keyword))
    );
    if (allKeywords.length === 0) return;
    setLoadingSuggestions(true);
    fetch("/api/resume/keyword-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription,
        resumeText: initialResume,
        keywords: allKeywords,
        locale,
      }),
    })
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((data: { suggestions?: Suggestion[] }) => {
        if (cancelled) return;
        const map: Record<string, Suggestion> = {};
        for (const s of data.suggestions || []) {
          if (s && s.keyword) map[s.keyword.toLowerCase()] = s;
        }
        setSuggestions(map);
      })
      .catch(() => {
        /* insert falls back to a deterministic skills entry */
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });
    return () => {
      cancelled = true;
    };
    // Seed suggestions once from the initial JD/resume; live re-scoring is
    // deterministic and does not need fresh LLM calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInsert = useCallback(
    (keyword: string) => {
      const suggestion = suggestions[keyword.toLowerCase()];
      const line = suggestion?.bullet || keyword;
      const section = suggestion?.section || "skills";
      setResumeText((prev) => insertLineIntoSection(prev, section, line));
      setInserted((prev) => new Set(prev).add(keyword.toLowerCase()));
      trackLiveMatchSuggestionInserted({ keyword, section });
    },
    [suggestions]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [resumeText]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      {/* Left: live score + keyword gaps */}
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
          <ScoreRing score={breakdown.overallScore} animated={animated} label="Live Match" />
          <div className="flex gap-4 text-center text-[11px] text-slate-400">
            <div>
              <span className="block text-emerald-400 font-semibold text-sm">
                {breakdown.summary.requiredHit}/{breakdown.summary.requiredTotal}
              </span>
              required
            </div>
            <div>
              <span className="block text-teal-400 font-semibold text-sm">
                {breakdown.summary.preferredHit}/{breakdown.summary.preferredTotal}
              </span>
              preferred
            </div>
            <div>
              <span className="block text-slate-200 font-semibold text-sm">
                {breakdown.summary.matchedKeywords}/{breakdown.summary.totalKeywords}
              </span>
              keywords
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Updates live as you edit the resume →
          </p>
        </div>

        {/* Missing keywords with one-click insert */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Missing keywords ({missing.length})
            </p>
            {loadingSuggestions && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> drafting fixes
              </span>
            )}
          </div>
          {missing.length === 0 ? (
            <p className="text-xs text-emerald-400">
              Every JD keyword is covered. 🎯
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((k) => (
                <button
                  key={k.keyword}
                  type="button"
                  onClick={() => handleInsert(k.keyword)}
                  title={
                    suggestions[k.keyword.toLowerCase()]?.bullet ||
                    `Insert "${k.keyword}"`
                  }
                  className="group inline-flex items-center gap-1 rounded-md border border-amber-700/40 bg-amber-900/20 px-2 py-1 text-[10px] text-amber-300 transition-colors hover:border-teal-500/60 hover:bg-teal-900/30 hover:text-teal-200"
                >
                  <Plus className="h-2.5 w-2.5" />
                  {k.keyword}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matched keywords */}
        {matched.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Matched ({matched.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((k) => (
                <Badge
                  key={k.keyword}
                  className="border-emerald-600/30 bg-emerald-900/40 text-[10px] text-emerald-300"
                >
                  <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                  {k.keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: editable resume draft */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3 w-3 text-teal-400" /> Resume draft (editable)
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-teal-500/60"
            >
              <Copy className="h-2.5 w-2.5" />
              {copied ? "Copied" : "Copy"}
            </button>
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(resumeText)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-teal-500/60"
              >
                <Download className="h-2.5 w-2.5" /> PDF
              </button>
            )}
          </div>
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          spellCheck={false}
          className="h-[420px] w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-300 focus:border-teal-500 focus:outline-none"
        />
        {inserted.size > 0 && (
          <p className="text-[10px] text-slate-500">
            Inserted {inserted.size} suggestion{inserted.size === 1 ? "" : "s"} —
            review and refine the wording before exporting.
          </p>
        )}
      </div>
    </div>
  );
}
