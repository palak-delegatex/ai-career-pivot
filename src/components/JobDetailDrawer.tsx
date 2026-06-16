"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  TrendingUp,
  Link2,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type {
  TrackedJob,
  JobStage,
  StageHistoryEntry,
} from "@/lib/job-tracker";
import { STAGES } from "@/lib/job-tracker";

interface JobDetailDrawerProps {
  job: TrackedJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onJobUpdate: (updated: TrackedJob) => void;
}

function matchTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

const MATCH_BAR_COLORS = {
  high: "bg-emerald-500",
  mid: "bg-amber-500",
  low: "bg-slate-500",
};

const MATCH_LABELS = {
  high: "Strong Match",
  mid: "Moderate Match",
  low: "Low Match",
};

const STAGE_PILL_COLORS: Record<JobStage, string> = {
  saved: "bg-slate-500/15 border-slate-500/30 text-slate-300",
  applied: "bg-teal-500/15 border-teal-500/30 text-teal-300",
  phone_screen: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  interview: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  offer: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  rejected: "bg-red-500/15 border-red-500/30 text-red-300",
};

const STAGE_PILL_ACTIVE: Record<JobStage, string> = {
  saved: "bg-slate-500/30 border-slate-400 text-slate-200",
  applied: "bg-teal-500/30 border-teal-400 text-teal-200",
  phone_screen: "bg-cyan-500/30 border-cyan-400 text-cyan-200",
  interview: "bg-amber-500/30 border-amber-400 text-amber-200",
  offer: "bg-emerald-500/30 border-emerald-400 text-emerald-200",
  rejected: "bg-red-500/30 border-red-400 text-red-200",
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimelineDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stageLabel(stage: JobStage): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}

// ─── MatchScoreBar ───

function MatchScoreBar({ score }: { score: number }) {
  const tier = matchTier(score);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
          <TrendingUp className="h-3.5 w-3.5" />
          Match Score
        </div>
        <span className="text-[13px] font-bold text-gray-50">{score}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${MATCH_BAR_COLORS[tier]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-[11px] text-slate-500 mt-1">{MATCH_LABELS[tier]}</div>
    </div>
  );
}

// ─── StagePillSelector ───

function StagePillSelector({
  current,
  onChange,
}: {
  current: JobStage;
  onChange: (stage: JobStage) => void;
}) {
  return (
    <div className="mb-5">
      <div className="text-[12px] font-semibold text-slate-400 mb-2">Stage</div>
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
              current === s.key
                ? STAGE_PILL_ACTIVE[s.key]
                : STAGE_PILL_COLORS[s.key] + " hover:opacity-80"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ActivityTimeline ───

function ActivityTimeline({
  history,
  createdAt,
}: {
  history: StageHistoryEntry[];
  createdAt: string;
}) {
  const entries = [
    ...history.map((h) => ({
      type: "stage_change" as const,
      from: h.from,
      to: h.to,
      at: h.at,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div>
      <div className="text-[12px] font-semibold text-slate-400 mb-3">
        Activity Timeline
      </div>
      <div className="relative pl-4 border-l border-slate-800">
        {entries.map((entry, i) => (
          <div key={i} className="relative mb-4 last:mb-0">
            <div className="absolute -left-[calc(1rem+4px)] top-1 w-2 h-2 rounded-full bg-teal-500" />
            <div className="flex items-center gap-1.5 text-[12px] text-gray-50">
              <span className="font-medium">{stageLabel(entry.from)}</span>
              <ArrowRight className="h-3 w-3 text-slate-600" />
              <span className="font-medium">{stageLabel(entry.to)}</span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {formatTimelineDate(entry.at)}
            </div>
          </div>
        ))}

        <div className="relative mb-0">
          <div className="absolute -left-[calc(1rem+4px)] top-1 w-2 h-2 rounded-full bg-slate-600" />
          <div className="text-[12px] text-gray-50">Job added</div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            {formatTimelineDate(createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Drawer ───

export default function JobDetailDrawer({
  job,
  open,
  onOpenChange,
  email,
  onJobUpdate,
}: JobDetailDrawerProps) {
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (job) {
      setNotes(job.notes ?? "");
      setNextAction(job.next_action ?? "");
      setSalaryRange(job.salary_range ?? "");
      setLocation(job.location ?? "");
      setUrl(job.url ?? "");
    }
  }, [job]);

  const persistField = useCallback(
    async (field: string, value: string) => {
      if (!job) return;
      const res = await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, email, [field]: value }),
      });
      if (res.ok && isMountedRef.current) {
        const { job: updated } = await res.json();
        onJobUpdate(updated);
      }
    },
    [job, email, onJobUpdate]
  );

  const debouncedSave = useCallback(
    (field: string, value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persistField(field, value), 800);
    },
    [persistField]
  );

  const handleStageChange = useCallback(
    async (newStage: JobStage) => {
      if (!job || job.stage === newStage) return;
      const res = await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, email, stage: newStage }),
      });
      if (res.ok && isMountedRef.current) {
        const { job: updated } = await res.json();
        onJobUpdate(updated);
      }
    },
    [job, email, onJobUpdate]
  );

  if (!job) return null;

  const stageHistory: StageHistoryEntry[] = Array.isArray(job.stage_history)
    ? job.stage_history
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] bg-slate-950 border-slate-800 overflow-y-auto p-0"
      >
        <SheetHeader className="p-5 pb-0">
          {/* Company avatar + title */}
          <div className="flex items-start gap-3 mb-1">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[15px] font-bold text-white shrink-0`}
            >
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-[15px] font-bold text-gray-50 leading-tight">
                {job.role}
              </SheetTitle>
              <SheetDescription className="text-[13px] text-slate-400 mt-0.5">
                {job.company}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-5 pt-4 pb-6 flex flex-col gap-0">
          {/* Match Score Bar */}
          {job.match_score > 0 && <MatchScoreBar score={job.match_score} />}

          {/* Stage Pill Selector */}
          <StagePillSelector
            current={job.stage}
            onChange={handleStageChange}
          />

          {/* Quick Fields */}
          <div className="grid grid-cols-1 gap-3 mb-5">
            {/* Job URL */}
            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Job URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    debouncedSave("url", e.target.value);
                  }}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
                />
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-teal-300 hover:border-teal-500/30 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Applied Date (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Applied Date
              </label>
              <div className="px-3 py-2 bg-white/[0.03] border border-slate-800/60 rounded-lg text-[13px] text-slate-300">
                {formatDate(job.applied_at)}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Salary Range
              </label>
              <input
                value={salaryRange}
                onChange={(e) => {
                  setSalaryRange(e.target.value);
                  debouncedSave("salary_range", e.target.value);
                }}
                placeholder="e.g. $120k - $160k"
                className="w-full px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </label>
              <input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  debouncedSave("location", e.target.value);
                }}
                placeholder="e.g. San Francisco, CA / Remote"
                className="w-full px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Notes textarea with auto-save */}
          <div className="mb-5">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
              <FileText className="h-3.5 w-3.5" />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                debouncedSave("notes", e.target.value);
              }}
              rows={4}
              placeholder="Interview prep notes, referral contacts, key requirements..."
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors resize-none leading-relaxed"
            />
            <div className="text-[10px] text-slate-600 mt-1">Auto-saves as you type</div>
          </div>

          {/* Next Action */}
          <div className="mb-6">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Next Action
            </label>
            <input
              value={nextAction}
              onChange={(e) => {
                setNextAction(e.target.value);
                debouncedSave("next_action", e.target.value);
              }}
              placeholder="e.g. Follow up with recruiter on Monday"
              className="w-full px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Activity Timeline */}
          <div className="pt-4 border-t border-slate-800">
            <ActivityTimeline
              history={stageHistory}
              createdAt={job.created_at}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
