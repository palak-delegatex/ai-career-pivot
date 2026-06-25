"use client";

import { Check, X } from "lucide-react";

export type SuggestionStatus = "pending" | "accepted" | "rejected";

export interface SuggestionChange {
  section: string;
  changeType: "rewrite" | "reorder" | "add" | "keyword";
  original: string;
  tailored: string;
  reason: string;
}

const changeTypeStyles: Record<string, string> = {
  keyword: "bg-blue-400/10 border-blue-400/25 text-blue-400",
  rewrite: "bg-purple-400/10 border-purple-400/25 text-purple-400",
  add: "bg-emerald-400/10 border-emerald-400/25 text-emerald-400",
  reorder: "bg-amber-400/10 border-amber-400/25 text-amber-400",
};

export function SuggestionCard({
  change,
  impact,
  status,
  onAccept,
  onReject,
}: {
  change: SuggestionChange;
  impact: number;
  status: SuggestionStatus;
  onAccept: () => void;
  onReject: () => void;
}) {
  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";

  return (
    <div
      className={`mb-3 rounded-xl border p-4 transition-all duration-200 ${
        isAccepted
          ? "border-emerald-400/30 bg-emerald-400/[0.04]"
          : isRejected
            ? "border-slate-700 opacity-50"
            : "border-slate-700 bg-slate-800 hover:border-slate-600"
      }`}
    >
      {/* Header: type badge + section + impact */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${changeTypeStyles[change.changeType] ?? changeTypeStyles.keyword}`}
          >
            {change.changeType}
          </span>
          <span className="text-[10px] font-medium text-slate-500">{change.section}</span>
        </div>
        {impact > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
            &#9650; +{impact} pts
          </span>
        )}
      </div>

      {/* Diff view */}
      <div className="mb-3 space-y-2">
        {change.changeType !== "add" && change.original && (
          <div className="flex gap-2">
            <span className="w-[52px] shrink-0 pt-1 text-[10px] font-semibold text-red-400">Before</span>
            <div className="flex-1 rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-[13px] leading-relaxed text-slate-400 line-through decoration-red-400/30">
              {change.original}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <span className="w-[52px] shrink-0 pt-1 text-[10px] font-semibold text-emerald-400">
            {change.changeType === "add" ? "Add" : "After"}
          </span>
          <div className="flex-1 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-[13px] leading-relaxed text-slate-200">
            {change.tailored}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-3 border-l-2 border-slate-700 pl-3 text-[11px] leading-relaxed text-slate-500">
        {change.reason}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isAccepted ? (
          <button className="flex items-center gap-1 rounded-lg bg-emerald-400/15 px-4 py-1.5 text-[11px] font-semibold text-emerald-400">
            <Check className="h-3 w-3" /> Accepted
          </button>
        ) : isRejected ? (
          <button className="flex items-center gap-1 rounded-lg border border-slate-600 px-4 py-1.5 text-[11px] font-semibold text-slate-400 opacity-60">
            Dismissed
          </button>
        ) : (
          <>
            <button
              onClick={onAccept}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Check className="h-3 w-3" /> Accept
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1 rounded-lg border border-slate-600 bg-transparent px-4 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <X className="h-3 w-3" /> Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}
