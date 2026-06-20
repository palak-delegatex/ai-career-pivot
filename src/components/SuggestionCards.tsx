"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import type { KeywordMatch } from "@/lib/ats-scoring";

interface SuggestionCardsProps {
  missingKeywords: KeywordMatch[];
  onInsertKeyword: (keyword: string, section: string | null) => void;
}

const PRIORITY_STYLE = {
  required: "bg-red-900/30 border-red-700/40 text-red-300",
  preferred: "bg-amber-900/30 border-amber-700/40 text-amber-300",
  keyword: "bg-slate-700/30 border-slate-600/40 text-slate-300",
};

const PRIORITY_LABEL = {
  required: "Required",
  preferred: "Preferred",
  keyword: "Keyword",
};

export default function SuggestionCards({ missingKeywords, onInsertKeyword }: SuggestionCardsProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...missingKeywords].sort((a, b) => {
    const pri = { required: 0, preferred: 1, keyword: 2 } as const;
    if (pri[a.category] !== pri[b.category]) return pri[a.category] - pri[b.category];
    return b.weight - a.weight;
  });

  const visible = expanded ? sorted : sorted.slice(0, 5);
  const hiddenCount = sorted.length - 5;

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-amber-400 uppercase flex items-center gap-1">
        <Plus className="w-2.5 h-2.5" />
        Suggested Keywords to Add
      </div>

      <div className="space-y-1.5">
        {visible.map((kw, i) => (
          <div
            key={`${kw.keyword}-${i}`}
            className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-2.5 flex items-center gap-2 group hover:border-teal-600/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-white truncate">{kw.keyword}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-medium ${PRIORITY_STYLE[kw.category]}`}>
                  {PRIORITY_LABEL[kw.category]}
                </span>
              </div>
              {kw.suggestedSection && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <ArrowRight className="w-2.5 h-2.5" />
                  Add to {kw.suggestedSection}
                </div>
              )}
            </div>

            <button
              onClick={() => onInsertKeyword(kw.keyword, kw.suggestedSection)}
              className="shrink-0 px-2.5 py-1 rounded-md bg-teal-600/20 border border-teal-600/30 text-teal-400 text-[10px] font-semibold hover:bg-teal-600/30 hover:border-teal-500/50 transition-colors flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5" />
              Insert
            </button>
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors w-full justify-center py-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show all {sorted.length} suggestions
            </>
          )}
        </button>
      )}
    </div>
  );
}
