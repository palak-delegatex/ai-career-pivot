"use client";

import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResumeVersion } from "./ResumeVersionList";

interface ResumeComparisonProps {
  versionA: ResumeVersion;
  versionB: ResumeVersion;
  onBack: () => void;
}

function parseLines(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n");
}

function computeBulletDiff(aLines: string[], bLines: string[]) {
  const aBullets = aLines.filter((l) => l.trim().startsWith("•"));
  const bBullets = bLines.filter((l) => l.trim().startsWith("•"));

  const aSet = new Set(aBullets.map((b) => b.trim()));
  const bSet = new Set(bBullets.map((b) => b.trim()));

  const shared = aBullets.filter((b) => bSet.has(b.trim()));
  const onlyA = aBullets.filter((b) => !bSet.has(b.trim()));
  const onlyB = bBullets.filter((b) => !aSet.has(b.trim()));

  return { shared, onlyA, onlyB };
}

function computeSkillDiff(a: string[], b: string[]) {
  const aLower = new Set(a.map((s) => s.toLowerCase()));
  const bLower = new Set(b.map((s) => s.toLowerCase()));

  const shared = a.filter((s) => bLower.has(s.toLowerCase()));
  const onlyA = a.filter((s) => !bLower.has(s.toLowerCase()));
  const onlyB = b.filter((s) => !aLower.has(s.toLowerCase()));

  return { shared, onlyA, onlyB };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ResumeComparison({
  versionA,
  versionB,
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {[versionA, versionB].map((v, i) => (
          <div
            key={v.id}
            className={`p-4 rounded-xl border ${
              i === 0
                ? "bg-blue-900/10 border-blue-700/30"
                : "bg-purple-900/10 border-purple-700/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Badge
                className={`text-[9px] ${
                  i === 0
                    ? "bg-blue-900/40 border-blue-700/30 text-blue-300"
                    : "bg-purple-900/40 border-purple-700/30 text-purple-300"
                }`}
              >
                Version {i === 0 ? "A" : "B"}
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
            <p className="text-sm font-semibold text-slate-100 truncate">
              {v.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {[v.target_role, v.target_company].filter(Boolean).join(" · ")}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {formatDate(v.updated_at)}
            </p>
          </div>
        ))}
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

      {/* Side-by-side full text */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { v: versionA, label: "A", color: "blue" },
          { v: versionB, label: "B", color: "purple" },
        ].map(({ v, label, color }) => (
          <div
            key={v.id}
            className={`rounded-xl border overflow-hidden ${
              color === "blue"
                ? "border-blue-700/30"
                : "border-purple-700/30"
            }`}
          >
            <div
              className={`px-3 py-2 text-xs font-medium ${
                color === "blue"
                  ? "bg-blue-900/20 text-blue-300"
                  : "bg-purple-900/20 text-purple-300"
              }`}
            >
              Version {label}: {v.name}
            </div>
            <ScrollArea className="h-80">
              <pre className="p-4 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {v.generated_text || "(no content)"}
              </pre>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}
