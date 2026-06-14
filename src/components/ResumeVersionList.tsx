"use client";

import { useState } from "react";
import {
  FileText,
  Copy,
  Archive,
  Trash2,
  GitCompareArrows,
  Plus,
  Send,
  CheckCircle2,
  PenLine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ResumeVersion {
  id: string;
  email: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  job_description: string | null;
  template: string;
  status: "draft" | "ready" | "sent" | "archived";
  match_score: number | null;
  content: Record<string, unknown>;
  enabled_skills: string[];
  enabled_experience_indices: number[];
  sections: Record<string, unknown>;
  generated_text: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<
  ResumeVersion["status"],
  { icon: typeof FileText; label: string; className: string }
> = {
  draft: {
    icon: PenLine,
    label: "Draft",
    className: "bg-amber-900/30 border-amber-700/30 text-amber-300",
  },
  ready: {
    icon: CheckCircle2,
    label: "Ready",
    className: "bg-emerald-900/30 border-emerald-700/30 text-emerald-300",
  },
  sent: {
    icon: Send,
    label: "Sent",
    className: "bg-cyan-900/30 border-cyan-700/30 text-cyan-300",
  },
  archived: {
    icon: Archive,
    label: "Archived",
    className: "bg-slate-700/40 border-slate-600/30 text-slate-400",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ResumeVersionListProps {
  versions: ResumeVersion[];
  onSelect: (version: ResumeVersion) => void;
  onDuplicate: (version: ResumeVersion) => void;
  onArchive: (version: ResumeVersion) => void;
  onDelete: (version: ResumeVersion) => void;
  onCompare: (a: ResumeVersion, b: ResumeVersion) => void;
  onCreate: () => void;
}

export default function ResumeVersionList({
  versions,
  onSelect,
  onDuplicate,
  onArchive,
  onDelete,
  onCompare,
  onCreate,
}: ResumeVersionListProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<ResumeVersion[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? versions
      : versions.filter((v) => v.status === statusFilter);

  function handleCompareToggle(version: ResumeVersion) {
    setCompareSelection((prev) => {
      const exists = prev.find((v) => v.id === version.id);
      if (exists) return prev.filter((v) => v.id !== version.id);
      if (prev.length >= 2) return [prev[1], version];
      return [...prev, version];
    });
  }

  function handleCompareConfirm() {
    if (compareSelection.length === 2) {
      onCompare(compareSelection[0], compareSelection[1]);
      setCompareMode(false);
      setCompareSelection([]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-100">Resume Versions</h3>
          <Badge className="bg-teal-900/40 border-teal-700/40 text-teal-300 text-xs">
            {versions.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareSelection([]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              compareMode
                ? "bg-cyan-600 text-white"
                : "bg-slate-700/60 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            Compare
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Version
          </button>
        </div>
      </div>

      {/* Compare bar */}
      {compareMode && (
        <div className="flex items-center justify-between bg-cyan-900/20 border border-cyan-700/30 rounded-lg px-4 py-2.5">
          <span className="text-xs text-cyan-300">
            Select 2 versions to compare ({compareSelection.length}/2)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCompareMode(false);
                setCompareSelection([]);
              }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCompareConfirm}
              disabled={compareSelection.length !== 2}
              className="px-3 py-1 rounded bg-cyan-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-500 transition-colors"
            >
              Compare
            </button>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-1.5">
        {["all", "draft", "ready", "sent", "archived"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-slate-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Version cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-slate-700/40 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 mb-1">No resume versions yet</p>
            <p className="text-xs text-slate-500 mb-4">
              Create your first version to get started
            </p>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Version
            </button>
          </div>
        ) : (
          filtered.map((version) => {
            const statusCfg = STATUS_CONFIG[version.status];
            const StatusIcon = statusCfg.icon;
            const isSelected = compareSelection.some((v) => v.id === version.id);

            return (
              <div
                key={version.id}
                onClick={() =>
                  compareMode ? handleCompareToggle(version) : onSelect(version)
                }
                className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-900/20 border-cyan-600/50"
                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                {compareMode && (
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-500"
                        : "border-slate-500"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {version.name}
                    </span>
                    <Badge
                      className={`text-[9px] border ${statusCfg.className}`}
                    >
                      <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {version.target_role && (
                      <span className="truncate">{version.target_role}</span>
                    )}
                    {version.target_role && version.target_company && (
                      <span>·</span>
                    )}
                    {version.target_company && (
                      <span className="truncate">{version.target_company}</span>
                    )}
                    <span>·</span>
                    <span>{formatDate(version.updated_at)}</span>
                  </div>
                </div>

                {version.match_score !== null && (
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className={`text-lg font-bold ${
                        version.match_score >= 80
                          ? "text-emerald-400"
                          : version.match_score >= 60
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {version.match_score}%
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                      Match
                    </span>
                  </div>
                )}

                {!compareMode && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(version);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(version);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Archive"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(version);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
