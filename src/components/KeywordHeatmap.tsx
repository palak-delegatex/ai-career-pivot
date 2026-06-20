"use client";

import { useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { KeywordMatch } from "@/lib/ats-scoring";

interface KeywordHeatmapProps {
  text: string;
  keywordMatches: KeywordMatch[];
  className?: string;
}

const HIGHLIGHT_STYLE: Record<string, string> = {
  exact: "bg-emerald-500/20 border-b border-emerald-500/40",
  variant: "bg-blue-500/20 border-b border-blue-500/40",
  semantic: "bg-purple-500/20 border-b border-purple-500/40",
  missing: "bg-red-500/20 border-b border-red-500/40 underline decoration-red-500/40 decoration-wavy",
};

const MATCH_LABEL: Record<string, string> = {
  exact: "Exact match",
  variant: "Variant match",
  semantic: "Semantic match",
  missing: "Missing keyword",
};

const TOOLTIP_BG: Record<string, string> = {
  exact: "bg-emerald-900 border-emerald-700",
  variant: "bg-blue-900 border-blue-700",
  semantic: "bg-purple-900 border-purple-700",
  missing: "bg-red-900 border-red-700",
};

interface HighlightSpan {
  start: number;
  end: number;
  keyword: string;
  type: "exact" | "variant" | "semantic" | "missing";
  foundIn: string[];
}

function buildHighlightSpans(text: string, keywordMatches: KeywordMatch[]): HighlightSpan[] {
  const spans: HighlightSpan[] = [];
  const lowerText = text.toLowerCase();

  for (const match of keywordMatches) {
    const kw = match.keyword.toLowerCase();
    const type = match.matched ? (match.matchType ?? "exact") : "missing";
    let searchFrom = 0;

    while (searchFrom < lowerText.length) {
      const idx = lowerText.indexOf(kw, searchFrom);
      if (idx === -1) break;

      const before = idx > 0 ? lowerText[idx - 1] : " ";
      const after = idx + kw.length < lowerText.length ? lowerText[idx + kw.length] : " ";
      const isWordBoundary = /\W/.test(before) && /\W/.test(after);

      if (isWordBoundary) {
        spans.push({
          start: idx,
          end: idx + kw.length,
          keyword: match.keyword,
          type,
          foundIn: match.foundIn,
        });
      }
      searchFrom = idx + 1;
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);

  const merged: HighlightSpan[] = [];
  for (const span of spans) {
    if (merged.length > 0 && span.start < merged[merged.length - 1].end) continue;
    merged.push(span);
  }

  return merged;
}

function HeatmapTooltip({ keyword, type, foundIn }: { keyword: string; type: string; foundIn: string[] }) {
  return (
    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] whitespace-nowrap z-50 shadow-lg pointer-events-none ${TOOLTIP_BG[type]}`}>
      <div className="font-semibold text-white">{keyword}</div>
      <div className="text-slate-300">{MATCH_LABEL[type]}</div>
      {foundIn.length > 0 && (
        <div className="text-slate-400 mt-0.5">
          Found in: {foundIn.join(", ")}
        </div>
      )}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="w-2 h-2 rotate-45 border-b border-r border-inherit bg-inherit" />
      </div>
    </div>
  );
}

export default function KeywordHeatmap({ text, keywordMatches, className = "" }: KeywordHeatmapProps) {
  const [enabled, setEnabled] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const spans = useMemo(
    () => (enabled ? buildHighlightSpans(text, keywordMatches) : []),
    [text, keywordMatches, enabled],
  );

  const rendered = useMemo(() => {
    if (spans.length === 0) return [{ text, highlight: null, idx: -1 }];

    const parts: { text: string; highlight: HighlightSpan | null; idx: number }[] = [];
    let cursor = 0;

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      if (cursor < span.start) {
        parts.push({ text: text.slice(cursor, span.start), highlight: null, idx: -1 });
      }
      parts.push({ text: text.slice(span.start, span.end), highlight: span, idx: i });
      cursor = span.end;
    }

    if (cursor < text.length) {
      parts.push({ text: text.slice(cursor), highlight: null, idx: -1 });
    }

    return parts;
  }, [text, spans]);

  const matchedCount = keywordMatches.filter(m => m.matched).length;
  const missingCount = keywordMatches.filter(m => !m.matched).length;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
            <span className="text-[9px] text-slate-400">Exact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500/30 border border-blue-500/50" />
            <span className="text-[9px] text-slate-400">Variant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-purple-500/30 border border-purple-500/50" />
            <span className="text-[9px] text-slate-400">Semantic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" />
            <span className="text-[9px] text-slate-400">Missing</span>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-slate-700/50"
        >
          {enabled ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {enabled ? "Hide" : "Show"} heatmap
        </button>
      </div>

      {enabled && (
        <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500">
          <span className="text-emerald-400">{matchedCount} matched</span>
          <span className="text-red-400">{missingCount} missing</span>
        </div>
      )}

      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {rendered.map((part, i) =>
          part.highlight ? (
            <mark
              key={i}
              className={`relative cursor-help rounded-sm px-0.5 -mx-0.5 ${HIGHLIGHT_STYLE[part.highlight.type]}`}
              onMouseEnter={() => setHoveredIdx(part.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {part.text}
              {hoveredIdx === part.idx && (
                <HeatmapTooltip
                  keyword={part.highlight.keyword}
                  type={part.highlight.type}
                  foundIn={part.highlight.foundIn}
                />
              )}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </div>
    </div>
  );
}
