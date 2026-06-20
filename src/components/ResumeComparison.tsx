"use client";

import { useRef, useCallback, useMemo } from "react";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResumeVersion } from "./ResumeVersionList";

interface ResumeComparisonProps {
  versionA: ResumeVersion;
  versionB: ResumeVersion;
  versions: ResumeVersion[];
  onVersionChange: (side: "a" | "b", version: ResumeVersion) => void;
  onBack: () => void;
}

// --- Word-level diff (LCS-based) ---

interface DiffToken {
  text: string;
  type: "unchanged" | "added" | "removed";
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text.split(/(\n)/).flatMap((part) => {
    if (part === "\n") return ["\n"];
    return part.split(/\s+/).filter(Boolean);
  });
}

function computeWordDiff(
  textA: string | null,
  textB: string | null
): { tokensA: DiffToken[]; tokensB: DiffToken[] } {
  const wordsA = tokenize(textA || "");
  const wordsB = tokenize(textB || "");
  const m = wordsA.length;
  const n = wordsB.length;

  if (m === 0 && n === 0) return { tokensA: [], tokensB: [] };
  if (m === 0)
    return {
      tokensA: [],
      tokensB: wordsB.map((w) => ({ text: w, type: "added" })),
    };
  if (n === 0)
    return {
      tokensA: wordsA.map((w) => ({ text: w, type: "removed" })),
      tokensB: [],
    };

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsA[i - 1] === wordsB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const tokensA: DiffToken[] = [];
  const tokensB: DiffToken[] = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
      tokensA.unshift({ text: wordsA[i - 1], type: "unchanged" });
      tokensB.unshift({ text: wordsB[j - 1], type: "unchanged" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tokensB.unshift({ text: wordsB[j - 1], type: "added" });
      j--;
    } else {
      tokensA.unshift({ text: wordsA[i - 1], type: "removed" });
      i--;
    }
  }

  return { tokensA, tokensB };
}

// --- Section parsing & comparison ---

const SECTION_PATTERNS: [string, RegExp][] = [
  [
    "Summary",
    /^(?:\*\*)?(?:professional\s+|career\s+)?(?:summary|objective|profile)(?:\*\*)?:?\s*$/i,
  ],
  [
    "Skills",
    /^(?:\*\*)?(?:technical\s+|core\s+|key\s+)?skills?(?:\*\*)?:?\s*$/i,
  ],
  [
    "Experience",
    /^(?:\*\*)?(?:work\s+|professional\s+)?experience(?:\*\*)?:?\s*$/i,
  ],
  [
    "Education",
    /^(?:\*\*)?education(?:\s+&\s+training)?(?:\*\*)?:?\s*$/i,
  ],
];

function parseSections(text: string | null): Record<string, string> {
  if (!text) return {};
  const sections: Record<string, string> = {};
  const lines = text.split("\n");
  let currentSection = "";
  const currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    let matched: string | null = null;
    if (trimmed) {
      for (const [name, pattern] of SECTION_PATTERNS) {
        if (pattern.test(trimmed)) {
          matched = name;
          break;
        }
      }
    }
    if (matched) {
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n").trim();
        currentContent.length = 0;
      }
      currentSection = matched;
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections[currentSection] = currentContent.join("\n").trim();
  }
  return sections;
}

function sectionWordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

function computeSectionScores(
  textA: string | null,
  textB: string | null
): { name: string; pctA: number; pctB: number }[] {
  const sectionsA = parseSections(textA);
  const sectionsB = parseSections(textB);
  const allNames = new Set([
    ...Object.keys(sectionsA),
    ...Object.keys(sectionsB),
  ]);
  const results: { name: string; pctA: number; pctB: number }[] = [];

  for (const name of ["Summary", "Skills", "Experience", "Education"]) {
    if (!allNames.has(name)) continue;
    const wA = sectionWordSet(sectionsA[name] || "");
    const wB = sectionWordSet(sectionsB[name] || "");
    if (wA.size === 0 && wB.size === 0) continue;
    const shared = [...wA].filter((w) => wB.has(w)).length;
    const pctA = wA.size > 0 ? Math.round((shared / wA.size) * 100) : 0;
    const pctB = wB.size > 0 ? Math.round((shared / wB.size) * 100) : 0;
    results.push({ name, pctA, pctB });
  }
  return results;
}

// --- Existing helpers ---

function parseLines(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n");
}

function computeBulletDiff(aLines: string[], bLines: string[]) {
  const aBullets = aLines.filter((l) => l.trim().startsWith("•"));
  const bBullets = bLines.filter((l) => l.trim().startsWith("•"));
  const aSet = new Set(aBullets.map((b) => b.trim()));
  const bSet = new Set(bBullets.map((b) => b.trim()));
  return {
    shared: aBullets.filter((b) => bSet.has(b.trim())),
    onlyA: aBullets.filter((b) => !bSet.has(b.trim())),
    onlyB: bBullets.filter((b) => !aSet.has(b.trim())),
  };
}

function computeSkillDiff(a: string[], b: string[]) {
  const aLower = new Set(a.map((s) => s.toLowerCase()));
  const bLower = new Set(b.map((s) => s.toLowerCase()));
  return {
    shared: a.filter((s) => bLower.has(s.toLowerCase())),
    onlyA: a.filter((s) => !bLower.has(s.toLowerCase())),
    onlyB: b.filter((s) => !aLower.has(s.toLowerCase())),
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Diff pane renderer ---

function DiffPane({ tokens }: { tokens: DiffToken[] }) {
  const groups: { type: DiffToken["type"] | "br"; text: string }[] = [];
  let cur: DiffToken[] = [];
  let curType: DiffToken["type"] | null = null;

  function flush() {
    if (cur.length > 0) {
      groups.push({ type: curType!, text: cur.map((t) => t.text).join(" ") });
      cur = [];
      curType = null;
    }
  }

  for (const token of tokens) {
    if (token.text === "\n") {
      flush();
      groups.push({ type: "br", text: "" });
    } else if (token.type === curType) {
      cur.push(token);
    } else {
      flush();
      cur = [token];
      curType = token.type;
    }
  }
  flush();

  return (
    <div className="p-4 text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
      {groups.map((g, i) => {
        if (g.type === "br") return <br key={i} />;
        const needsSpace =
          i > 0 && groups[i - 1].type !== "br";
        const cls =
          g.type === "added"
            ? "bg-emerald-500/20 rounded-sm px-0.5"
            : g.type === "removed"
              ? "bg-red-500/20 line-through rounded-sm px-0.5"
              : undefined;
        return (
          <span key={i}>
            {needsSpace ? " " : ""}
            {cls ? <span className={cls}>{g.text}</span> : g.text}
          </span>
        );
      })}
      {groups.length === 0 && (
        <span className="text-slate-500 italic">(no content)</span>
      )}
    </div>
  );
}

// --- Main component ---

export default function ResumeComparison({
  versionA,
  versionB,
  versions,
  onVersionChange,
  onBack,
}: ResumeComparisonProps) {
  const aLines = parseLines(versionA.generated_text);
  const bLines = parseLines(versionB.generated_text);
  const bulletDiff = computeBulletDiff(aLines, bLines);
  const skillDiff = computeSkillDiff(
    versionA.enabled_skills || [],
    versionB.enabled_skills || []
  );

  const scoreDelta =
    versionA.match_score !== null && versionB.match_score !== null
      ? versionB.match_score - versionA.match_score
      : null;

  const { tokensA, tokensB } = useMemo(
    () => computeWordDiff(versionA.generated_text, versionB.generated_text),
    [versionA.generated_text, versionB.generated_text]
  );

  const sectionScores = useMemo(
    () => computeSectionScores(versionA.generated_text, versionB.generated_text),
    [versionA.generated_text, versionB.generated_text]
  );

  // Synchronized scrolling
  const paneARef = useRef<HTMLDivElement>(null);
  const paneBRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const handleScrollA = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    const a = paneARef.current;
    const b = paneBRef.current;
    if (a && b) {
      const maxA = a.scrollHeight - a.clientHeight;
      if (maxA > 0) {
        const ratio = a.scrollTop / maxA;
        b.scrollTop = ratio * (b.scrollHeight - b.clientHeight);
      }
    }
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const handleScrollB = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    const a = paneARef.current;
    const b = paneBRef.current;
    if (a && b) {
      const maxB = b.scrollHeight - b.clientHeight;
      if (maxB > 0) {
        const ratio = b.scrollTop / maxB;
        a.scrollTop = ratio * (a.scrollHeight - a.clientHeight);
      }
    }
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const hasSectionScores =
    sectionScores.length > 0 &&
    versionA.match_score !== null &&
    versionB.match_score !== null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <GitCompareArrows className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-bold text-slate-100">Compare Versions</h3>
      </div>

      {/* Summary cards with version dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["a", "b"] as const).map((side) => {
          const v = side === "a" ? versionA : versionB;
          const isBlue = side === "a";
          return (
            <div
              key={side}
              className={`p-4 rounded-xl border ${
                isBlue
                  ? "bg-blue-900/10 border-blue-700/30"
                  : "bg-purple-900/10 border-purple-700/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  className={`text-[9px] ${
                    isBlue
                      ? "bg-blue-900/40 border-blue-700/30 text-blue-300"
                      : "bg-purple-900/40 border-purple-700/30 text-purple-300"
                  }`}
                >
                  Version {side.toUpperCase()}
                </Badge>
                {v.match_score !== null && (
                  <span
                    className={`text-sm font-bold ${
                      v.match_score >= 80
                        ? "text-emerald-400"
                        : v.match_score >= 60
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {v.match_score}% match
                  </span>
                )}
              </div>
              <select
                value={v.id}
                onChange={(e) => {
                  const found = versions.find((ver) => ver.id === e.target.value);
                  if (found) onVersionChange(side, found);
                }}
                className={`w-full text-sm font-semibold truncate rounded-md px-2 py-1.5 mb-1 border bg-slate-800/80 text-slate-100 outline-none focus:ring-1 ${
                  isBlue
                    ? "border-blue-700/30 focus:ring-blue-500/40"
                    : "border-purple-700/30 focus:ring-purple-500/40"
                }`}
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    {ver.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {[v.target_role, v.target_company].filter(Boolean).join(" · ")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {formatDate(v.updated_at)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Score delta */}
      {scoreDelta !== null && (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-xs text-slate-400">Match Score Delta:</span>
          <span
            className={`text-sm font-bold ${
              scoreDelta > 0
                ? "text-emerald-400"
                : scoreDelta < 0
                  ? "text-red-400"
                  : "text-slate-400"
            }`}
          >
            {scoreDelta > 0 ? "+" : ""}
            {scoreDelta}%
          </span>
        </div>
      )}

      {/* Full-text side-by-side diff with word-level highlighting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(
          [
            { side: "a" as const, v: versionA, tokens: tokensA, color: "blue" },
            { side: "b" as const, v: versionB, tokens: tokensB, color: "purple" },
          ] as const
        ).map(({ side, v, tokens, color }) => (
          <div
            key={side}
            className={`rounded-xl border overflow-hidden ${
              color === "blue"
                ? "border-blue-700/30"
                : "border-purple-700/30"
            }`}
          >
            <div
              className={`px-3 py-2 text-xs font-medium flex items-center justify-between ${
                color === "blue"
                  ? "bg-blue-900/20 text-blue-300"
                  : "bg-purple-900/20 text-purple-300"
              }`}
            >
              <span>
                Version {side.toUpperCase()}: {v.name}
              </span>
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500/40" />
                  Added
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-red-500/40" />
                  Removed
                </span>
              </div>
            </div>
            <div
              ref={side === "a" ? paneARef : paneBRef}
              onScroll={side === "a" ? handleScrollA : handleScrollB}
              className="h-80 overflow-y-auto"
            >
              <DiffPane tokens={tokens} />
            </div>
          </div>
        ))}
      </div>

      {/* Section comparison bars */}
      {hasSectionScores && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-3">
            Section Comparison
          </h4>
          <div className="space-y-3">
            {sectionScores.map(({ name, pctA, pctB }) => (
              <div key={name}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">
                  {name}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-blue-300 w-6 shrink-0">
                      A
                    </span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2.5">
                      <div
                        className="bg-blue-500/60 h-2.5 rounded-full transition-all"
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-blue-300 w-8 text-right shrink-0">
                      {pctA}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-purple-300 w-6 shrink-0">
                      B
                    </span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2.5">
                      <div
                        className="bg-purple-500/60 h-2.5 rounded-full transition-all"
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-purple-300 w-8 text-right shrink-0">
                      {pctB}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills diff */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-3">
          Skills Comparison
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Shared ({skillDiff.shared.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {skillDiff.shared.map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700/60 text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">
              Only in A ({skillDiff.onlyA.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {skillDiff.onlyA.map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-blue-900/30 text-blue-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-2">
              Only in B ({skillDiff.onlyB.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {skillDiff.onlyB.map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-purple-900/30 text-purple-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bullet diff */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-3">
          Content Comparison
        </h4>
        <div className="space-y-3">
          {bulletDiff.shared.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
                Shared bullets ({bulletDiff.shared.length})
              </p>
              {bulletDiff.shared.map((b, i) => (
                <p key={i} className="text-xs text-slate-400 pl-2">
                  {b.trim()}
                </p>
              ))}
            </div>
          )}
          {bulletDiff.onlyA.length > 0 && (
            <div>
              <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1.5">
                Only in Version A ({bulletDiff.onlyA.length})
              </p>
              {bulletDiff.onlyA.map((b, i) => (
                <p
                  key={i}
                  className="text-xs text-blue-300/80 pl-2 border-l-2 border-blue-700/40"
                >
                  {b.trim()}
                </p>
              ))}
            </div>
          )}
          {bulletDiff.onlyB.length > 0 && (
            <div>
              <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1.5">
                Only in Version B ({bulletDiff.onlyB.length})
              </p>
              {bulletDiff.onlyB.map((b, i) => (
                <p
                  key={i}
                  className="text-xs text-purple-300/80 pl-2 border-l-2 border-purple-700/40"
                >
                  {b.trim()}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
