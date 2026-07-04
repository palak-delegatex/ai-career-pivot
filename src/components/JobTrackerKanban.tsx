"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Plus,
  Link2,
  X,
  TrendingUp,
  Clock,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Calendar,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import type { TrackedJob, JobStage, JobSource } from "@/lib/job-tracker";
import { STAGES, pickCompanyColor, detectSource } from "@/lib/job-tracker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface JobTrackerKanbanProps {
  jobs: TrackedJob[];
  email: string;
  onJobsChange: (jobs: TrackedJob[]) => void;
}

// ─── Helpers ───

type Translator = ReturnType<typeof useTranslations>;

function timeAgo(t: Translator, dateStr: string | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t("time.today");
  if (days === 1) return t("time.dayAgo", { count: 1 });
  if (days < 30) return t("time.daysAgo", { count: days });
  return t("time.weeksAgo", { count: Math.floor(days / 7) });
}

function matchTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

const MATCH_STYLES = {
  high: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  mid: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  low: "bg-slate-400/10 border-slate-400/20 text-slate-400",
};

const SOURCE_STYLES: Record<JobSource, string> = {
  linkedin: "bg-blue-500/10 border-blue-500/25 text-blue-300",
  indeed: "bg-indigo-500/10 border-indigo-500/25 text-indigo-300",
  glassdoor: "bg-green-500/10 border-green-500/25 text-green-300",
  direct: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
  other: "bg-slate-400/10 border-slate-400/25 text-slate-400",
};

// Brand names stay untranslated; generic labels are looked up in SourceBadge.
const SOURCE_BRAND_LABELS: Partial<Record<JobSource, string>> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
};

const STAGE_ORDER: JobStage[] = ["saved", "applied", "phone_screen", "interview", "offer"];

function getNextStage(current: JobStage): JobStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

function columnStats(jobs: TrackedJob[]): { avgScore: number; oldestDays: number } {
  if (jobs.length === 0) return { avgScore: 0, oldestDays: 0 };
  const totalScore = jobs.reduce((sum, j) => sum + j.match_score, 0);
  const avgScore = Math.round(totalScore / jobs.length);
  const now = Date.now();
  const oldestDays = Math.max(
    ...jobs.map((j) => Math.floor((now - new Date(j.created_at).getTime()) / (1000 * 60 * 60 * 24)))
  );
  return { avgScore, oldestDays };
}

// ─── MatchBadge ───

function MatchBadge({ score }: { score: number }) {
  const t = useTranslations("jobTracker");
  if (score === 0) return null;
  const tier = matchTier(score);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${MATCH_STYLES[tier]}`}
    >
      <TrendingUp className="h-2.5 w-2.5" />
      {t("matchBadge", { score })}
    </span>
  );
}

// ─── SourceBadge ───

function SourceBadge({ source }: { source: JobSource }) {
  const t = useTranslations("jobTracker");
  const label = SOURCE_BRAND_LABELS[source] ?? t(`source.${source}`);
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SOURCE_STYLES[source]}`}
    >
      {label}
    </span>
  );
}

// ─── JobCard ───

function JobCard({
  job,
  onDragStart,
  onDelete,
  onExpand,
  onMoveStage,
  isRejected,
}: {
  job: TrackedJob;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDelete: (id: string) => void;
  onExpand?: (job: TrackedJob) => void;
  onMoveStage?: (id: string) => void;
  isRejected?: boolean;
}) {
  const t = useTranslations("jobTracker");
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onExpand?.(job);
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      onMoveStage?.(job.id);
    }
  };

  return (
    <div
      draggable
      tabIndex={0}
      role="button"
      aria-label={t("card.ariaLabel", {
        role: job.role,
        company: job.company,
        score: job.match_score,
      })}
      onDragStart={(e) => onDragStart(e, job.id)}
      onClick={() => onExpand?.(job)}
      onKeyDown={handleKeyDown}
      className={`group relative bg-slate-900 border border-slate-700 rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all hover:border-teal-500/50 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${isRejected ? "opacity-60" : ""}`}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-40 md:opacity-0 md:group-hover:opacity-40 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center">
        <GripVertical className="h-3.5 w-3.5 text-slate-500" />
      </div>

      {job.notes && (
        <div className="absolute top-2.5 right-2.5 text-slate-600 opacity-60">
          <FileText className="h-3.5 w-3.5" />
        </div>
      )}

      <button
        onClick={() => onDelete(job.id)}
        className="absolute top-2.5 right-2.5 text-slate-700 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-2.5 mb-2.5">
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[13px] font-bold text-white shrink-0`}
        >
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-gray-50 leading-tight line-clamp-2">
            {job.role}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{job.company}</div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-1.5 mt-2">
        <MatchBadge score={job.match_score} />
        {job.source !== "other" && <SourceBadge source={job.source} />}
      </div>

      {job.match_score > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.hash = "gap-analysis";
          }}
          className="flex items-center gap-1 mt-2 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
        >
          <BarChart3 className="h-3 w-3" />
          {t("viewGapAnalysis")}
        </button>
      )}

      {job.next_action && (
        <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 bg-teal-500/[0.08] border border-teal-500/15 rounded-lg text-[11px] text-teal-300">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{job.next_action}</span>
        </div>
      )}

      <div className="text-[10px] text-slate-600 mt-1.5">
        {job.stage === "saved"
          ? t("card.savedAgo", { time: timeAgo(t, job.created_at) })
          : job.stage === "rejected"
            ? t("card.rejectedAgo", { time: timeAgo(t, job.stage_changed_at) })
            : t("card.appliedAgo", {
                time: timeAgo(t, job.applied_at || job.created_at),
              })}
      </div>
    </div>
  );
}

// ─── KanbanColumn ───

function KanbanColumn({
  stageKey,
  dotColor,
  jobs,
  onDragStart,
  onDrop,
  onDelete,
  onExpand,
  onMoveStage,
}: {
  stageKey: JobStage;
  dotColor: string;
  jobs: TrackedJob[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (stage: JobStage) => void;
  onDelete: (id: string) => void;
  onExpand: (job: TrackedJob) => void;
  onMoveStage: (id: string) => void;
}) {
  const t = useTranslations("jobTracker");
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="min-w-[200px] scroll-snap-start">
      <div className="px-1 mb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
              {t(`status.${stageKey}`)}
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
            {jobs.length}
          </span>
        </div>
        {jobs.length > 0 && (() => {
          const stats = columnStats(jobs);
          return (
            <div className="flex items-center gap-2.5 mt-1.5 px-0.5">
              {stats.avgScore > 0 && (
                <span className="text-[10px] text-slate-500" title={t("column.avgScoreTitle")}>
                  <TrendingUp className="inline h-2.5 w-2.5 mr-0.5" />
                  {t("column.avgScore", { score: stats.avgScore })}
                </span>
              )}
              <span className="text-[10px] text-slate-600" title={t("column.oldestCardTitle")}>
                <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                {t("column.oldestDays", { days: stats.oldestDays })}
              </span>
            </div>
          );
        })()}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onDrop(stageKey);
        }}
        className={`rounded-2xl border p-2 min-h-[280px] flex flex-col gap-2 transition-colors ${
          dragOver
            ? "bg-teal-500/[0.06] border-teal-500/30"
            : "bg-slate-900/50 border-slate-800"
        }`}
      >
        {jobs.length === 0 && (
          <div className="text-center py-10 text-slate-600 text-[12px] italic">
            {stageKey === "offer"
              ? t("column.emptyOffer")
              : t("column.emptyDrop")}
          </div>
        )}
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onDragStart={onDragStart}
            onDelete={onDelete}
            onExpand={onExpand}
            onMoveStage={onMoveStage}
            isRejected={stageKey === "rejected"}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MobileCardStack ───

function MobileCardStack({
  jobs,
  onStageChange,
  onDelete,
  onExpand,
}: {
  jobs: TrackedJob[];
  onStageChange: (id: string, newStage: JobStage) => void;
  onDelete: (id: string) => void;
  onExpand: (job: TrackedJob) => void;
}) {
  const t = useTranslations("jobTracker");
  const [activeStage, setActiveStage] = useState<JobStage>("saved");
  const stageJobs = useMemo(
    () => jobs.filter((j) => j.stage === activeStage),
    [jobs, activeStage]
  );

  const SWIPE_THRESHOLD = 100;

  const handleDragEnd = (job: TrackedJob, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      const next = getNextStage(job.stage);
      if (next) onStageChange(job.id, next);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onStageChange(job.id, "rejected");
    }
  };

  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {STAGES.map((s) => {
          const count = jobs.filter((j) => j.stage === s.key).length;
          return (
            <button
              key={s.key}
              onClick={() => setActiveStage(s.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
                activeStage === s.key
                  ? "bg-teal-500/15 border border-teal-500/30 text-teal-300"
                  : "border border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
              {t(`status.${s.key}`)}
              <span className="text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {stageJobs.length > 0 && activeStage !== "rejected" && (
        <p className="text-[10px] text-slate-600 text-center">
          {t("mobile.swipeHint")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {stageJobs.map((job) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, info) => handleDragEnd(job, info)}
              whileDrag={{ scale: 1.02 }}
              style={{ touchAction: "pan-y" }}
              className="relative"
            >
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-1 text-red-400">
                  <X className="h-4 w-4" />
                  <span className="text-[11px] font-medium">{t("mobile.reject")}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <span className="text-[11px] font-medium">{t("mobile.advance")}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
              <div
                onClick={() => onExpand(job)}
                className="relative bg-slate-900 border border-slate-700 rounded-xl p-3.5 cursor-pointer"
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[13px] font-bold text-white shrink-0`}
                  >
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-50 leading-tight line-clamp-2">
                      {job.role}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{job.company}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(job.id);
                    }}
                    className="text-slate-700 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center flex-wrap gap-1.5">
                  <MatchBadge score={job.match_score} />
                  {job.source !== "other" && <SourceBadge source={job.source} />}
                </div>
                {job.match_score > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.hash = "gap-analysis";
                    }}
                    className="flex items-center gap-1 mt-2 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    <BarChart3 className="h-3 w-3" />
                    {t("viewGapAnalysis")}
                  </button>
                )}
                <div className="text-[10px] text-slate-600 mt-1.5">
                  {timeAgo(t, job.created_at)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {stageJobs.length === 0 && (
          <p className="text-center py-8 text-[12px] text-slate-600 italic">
            {t("mobile.noJobsInStage", { stage: t(`status.${activeStage}`) })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Funnel Analytics ───

const FUNNEL_STAGES: JobStage[] = [
  "saved",
  "applied",
  "phone_screen",
  "interview",
  "offer",
];
function FunnelAnalytics({ jobs }: { jobs: TrackedJob[] }) {
  const t = useTranslations("jobTracker");

  const cumulativeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const stageIndex: Record<string, number> = {};
    FUNNEL_STAGES.forEach((s, i) => {
      stageIndex[s] = i;
      counts[s] = 0;
    });
    stageIndex["rejected"] = 5;

    for (const job of jobs) {
      const jIdx =
        job.stage === "rejected" ? 5 : (stageIndex[job.stage] ?? 0);
      for (let i = 0; i < FUNNEL_STAGES.length; i++) {
        if (i <= jIdx) counts[FUNNEL_STAGES[i]]++;
      }
    }
    return counts;
  }, [jobs]);

  const totalJobs = jobs.length;

  const conversionRates = useMemo(() => {
    const rates: { rate: string; tier: "good" | "ok" | "low" }[] = [];
    for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
      const from = cumulativeCounts[FUNNEL_STAGES[i]];
      const to = cumulativeCounts[FUNNEL_STAGES[i + 1]];
      if (from === 0) {
        rates.push({ rate: "--", tier: "ok" });
      } else {
        const pct = Math.round((to / from) * 100);
        rates.push({
          rate: `${pct}%`,
          tier: pct >= 60 ? "good" : pct >= 35 ? "ok" : "low",
        });
      }
    }
    return rates;
  }, [cumulativeCounts]);

  const RATE_STYLES = {
    good: "bg-emerald-500/15 text-emerald-300",
    ok: "bg-amber-500/15 text-amber-300",
    low: "bg-red-500/15 text-red-300",
  };

  const BAR_COLORS = [
    "from-slate-400/30 to-slate-400/15",
    "from-teal-500/40 to-teal-500/20",
    "from-cyan-400/40 to-cyan-400/20",
    "from-amber-400/40 to-amber-400/20",
    "from-emerald-400/40 to-emerald-400/20",
  ];

  const timeInStage = useMemo(() => {
    const stageTimes: Record<string, number[]> = {};
    for (const s of FUNNEL_STAGES) stageTimes[s] = [];

    for (const job of jobs) {
      const created = new Date(job.created_at).getTime();
      const changed = new Date(job.stage_changed_at).getTime();
      const diffDays = Math.max(0.5, (changed - created) / (1000 * 60 * 60 * 24));
      if (stageTimes[job.stage]) {
        stageTimes[job.stage].push(diffDays);
      }
    }

    return FUNNEL_STAGES.map((s) => {
      const times = stageTimes[s];
      if (times.length === 0) return "--";
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return `${avg.toFixed(1)}d`;
    });
  }, [jobs]);

  const totalPipelineAvg = useMemo(() => {
    const durations = jobs
      .filter((j) => j.stage !== "saved")
      .map((j) => {
        const created = new Date(j.created_at).getTime();
        const changed = new Date(j.stage_changed_at).getTime();
        return (changed - created) / (1000 * 60 * 60 * 24);
      });
    if (durations.length === 0) return "--";
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return `${avg.toFixed(1)}d`;
  }, [jobs]);

  const appliedToScreenRate = cumulativeCounts["applied"] > 0
    ? Math.round((cumulativeCounts["phone_screen"] / cumulativeCounts["applied"]) * 100)
    : 0;

  const screenToInterviewRate = cumulativeCounts["phone_screen"] > 0
    ? Math.round((cumulativeCounts["interview"] / cumulativeCounts["phone_screen"]) * 100)
    : 0;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2.5 mb-5">
        <Activity className="h-5 w-5 text-teal-500" />
        <h2 className="font-serif text-xl font-bold text-gray-50">
          {t("analytics.title")}
        </h2>
      </div>

      {/* Funnel bars */}
      <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6 mb-5">
        <div className="hidden sm:flex items-center justify-between gap-0">
          {FUNNEL_STAGES.map((s, i) => {
            const count = cumulativeCounts[s];
            const widthPct = totalJobs > 0 ? Math.max(20, (count / totalJobs) * 100) : 20;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`h-12 rounded-lg bg-gradient-to-br ${BAR_COLORS[i]} flex items-center justify-center transition-transform hover:scale-y-105`}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-lg font-bold text-white drop-shadow">
                      {count}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 text-center">
                    {t(`status.${s}`)}
                  </span>
                </div>

                {i < FUNNEL_STAGES.length - 1 && (
                  <div className="flex flex-col items-center gap-1 px-1 shrink-0">
                    <span className="text-[14px] text-slate-600">&rarr;</span>
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${RATE_STYLES[conversionRates[i].tier]}`}
                    >
                      {conversionRates[i].rate}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile funnel - stacked */}
        <div className="sm:hidden flex flex-col gap-0">
          {FUNNEL_STAGES.map((s, i) => {
            const count = cumulativeCounts[s];
            const widthPct = totalJobs > 0 ? Math.max(30, (count / totalJobs) * 100) : 30;
            return (
              <div key={s}>
                <div className="flex flex-col items-center gap-2 py-2">
                  <div
                    className={`h-10 rounded-lg bg-gradient-to-br ${BAR_COLORS[i]} flex items-center justify-center`}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-base font-bold text-white drop-shadow">
                      {count}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {t(`status.${s}`)}
                  </span>
                </div>
                {i < FUNNEL_STAGES.length - 1 && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <span className="text-[14px] text-slate-600 rotate-90">&rarr;</span>
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${RATE_STYLES[conversionRates[i].tier]}`}
                    >
                      {conversionRates[i].rate}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time in stage */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-800">
          {FUNNEL_STAGES.map((s, i) => (
            <div key={s} className="text-center py-2">
              <div className="text-sm font-bold font-mono text-gray-50">
                {timeInStage[i]}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                {t("analytics.avgInStage", { stage: t(`status.${s}`) })}
              </div>
            </div>
          ))}
          <div className="text-center py-2">
            <div className="text-sm font-bold font-mono text-gray-50">
              {totalPipelineAvg}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {t("analytics.avgTotalPipeline")}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {screenToInterviewRate >= 55 && (
          <div className="bg-emerald-500/[0.06] border border-emerald-500/25 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-50 mb-1">
                {t("analytics.insights.strongScreen.title")}
              </div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                {t("analytics.insights.strongScreen.body", {
                  rate: screenToInterviewRate,
                })}
              </div>
            </div>
          </div>
        )}

        {appliedToScreenRate > 0 && appliedToScreenRate < 45 && (
          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-50 mb-1">
                {t("analytics.insights.lowScreen.title")}
              </div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                {t("analytics.insights.lowScreen.body", {
                  rate: appliedToScreenRate,
                })}
              </div>
              <div className="mt-2 px-2.5 py-2 bg-teal-500/[0.08] rounded-lg text-[11px] text-teal-300 leading-snug">
                {t("analytics.insights.lowScreen.tip")}
              </div>
            </div>
          </div>
        )}

        {totalJobs === 0 && (
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex gap-3 col-span-full">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-50 mb-1">
                {t("analytics.insights.empty.title")}
              </div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                {t("analytics.insights.empty.body")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── JobDetailSheet ───

function JobDetailSheet({
  job,
  open,
  onOpenChange,
  onNotesChange,
}: {
  job: TrackedJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotesChange: (id: string, notes: string) => void;
}) {
  const t = useTranslations("jobTracker");
  const [editNotes, setEditNotes] = useState(job?.notes ?? "");
  const isMobile = useIsMobile();

  useEffect(() => {
    setEditNotes(job?.notes ?? "");
  }, [job]);

  if (!job) return null;

  const tier = matchTier(job.match_score);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "bg-slate-950 border-slate-800 overflow-y-auto rounded-t-2xl max-h-[85vh]"
            : "bg-slate-950 border-slate-800 overflow-y-auto"
        }
      >
        {isMobile && <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2 mb-1 shrink-0" />}
        <SheetHeader className="pb-0">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[15px] font-bold text-white shrink-0`}
            >
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <SheetTitle className="text-gray-50 text-base leading-tight">
                {job.role}
              </SheetTitle>
              <SheetDescription className="text-slate-400 text-[13px] mt-0.5">
                {job.company}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 flex flex-col gap-5">
          {job.match_score > 0 && (
            <div className={`p-3 rounded-xl border ${MATCH_STYLES[tier]}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-bold">{t("detail.matchScore", { score: job.match_score })}</span>
                </div>
                <button
                  onClick={() => {
                    onOpenChange(false);
                    window.location.hash = "gap-analysis";
                  }}
                  className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300"
                >
                  <BarChart3 className="h-3 w-3" />
                  {t("detail.gapAnalysis")}
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{t("detail.stage")}</div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${STAGES.find((s) => s.key === job.stage)?.dotColor ?? "bg-slate-500"}`} />
                <span className="text-[13px] font-semibold text-gray-50">
                  {t(`status.${job.stage}`)}
                </span>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                <Calendar className="inline h-2.5 w-2.5 mr-0.5" />
                {t("detail.interviewDate")}
              </div>
              <div className="text-[13px] text-gray-50">
                {job.stage === "interview" || job.stage === "phone_screen"
                  ? timeAgo(t, job.stage_changed_at) || t("detail.notSet")
                  : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{t("detail.source")}</div>
              <SourceBadge source={job.source} />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{t("detail.added")}</div>
              <div className="text-[13px] text-gray-50">{timeAgo(t, job.created_at)}</div>
            </div>
          </div>

          {job.url && (
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                {t("detail.linkedDocuments")}
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[13px] text-teal-400 hover:text-teal-300 hover:border-teal-500/30 transition-colors"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
              </a>
            </div>
          )}

          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">
              {t("detail.notes")}
            </div>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              onBlur={() => onNotesChange(job.id, editNotes)}
              rows={4}
              placeholder={t("detail.notesPlaceholder")}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {job.next_action && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/[0.08] border border-teal-500/15 rounded-xl text-[12px] text-teal-300">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{job.next_action}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── QuickAddModal ───

function QuickAddModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    role: string;
    company: string;
    url: string;
    source: JobSource;
    stage: JobStage;
    notes: string;
  }) => void;
}) {
  const t = useTranslations("jobTracker");
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState<JobStage>("saved");

  function handleSubmit() {
    if (!role.trim() || !company.trim()) return;
    const source = url ? detectSource(url) : "other";
    onAdd({ role: role.trim(), company: company.trim(), url, source, stage, notes });
    setUrl("");
    setRole("");
    setCompany("");
    setNotes("");
    setStage("saved");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <span className="text-base font-bold text-gray-50">{t("modal.title")}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-slate-800 rounded-lg text-slate-400 hover:bg-white/5 hover:text-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* URL paste */}
          <div className="relative mb-4">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("modal.urlPlaceholder")}
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-slate-700 rounded-xl text-sm text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-600 text-center mb-5">
            {t("modal.autoFillHint")}
          </p>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              {t("modal.orManually")}
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Manual fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            <div>
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
                {t("modal.roleLabel")}
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={t("modal.rolePlaceholder")}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
                {t("modal.companyLabel")}
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t("modal.companyPlaceholder")}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
              {t("modal.notesLabel")}
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("modal.notesPlaceholder")}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Stage selector */}
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-slate-400 mb-2">
              {t("modal.addToStage")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.filter((s) => s.key !== "rejected").map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
                    stage === s.key
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
                      : "border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400"
                  }`}
                >
                  {t(`status.${s.key}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-800 rounded-lg text-[13px] font-medium text-slate-400 hover:border-slate-700 hover:text-gray-50 transition-colors"
          >
            {t("modal.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!role.trim() || !company.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("modal.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function JobTrackerKanban({
  jobs: initialJobs,
  email,
  onJobsChange,
}: JobTrackerKanbanProps) {
  const t = useTranslations("jobTracker");
  const [jobs, setJobs] = useState(initialJobs);
  const [view, setView] = useState<"board" | "analytics">("board");
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedJob, setExpandedJob] = useState<TrackedJob | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const updateJobs = useCallback(
    (next: TrackedJob[]) => {
      setJobs(next);
      onJobsChange(next);
    },
    [onJobsChange]
  );

  const grouped = useMemo(() => {
    const map = new Map<JobStage, TrackedJob[]>();
    for (const s of STAGES) map.set(s.key, []);
    for (const j of jobs) map.get(j.stage)?.push(j);
    return map;
  }, [jobs]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      dragIdRef.current = id;
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDrop = useCallback(
    async (newStage: JobStage) => {
      const id = dragIdRef.current;
      if (!id) return;
      dragIdRef.current = null;

      const job = jobs.find((j) => j.id === id);
      if (!job || job.stage === newStage) return;

      const updated = jobs.map((j) =>
        j.id === id
          ? { ...j, stage: newStage, stage_changed_at: new Date().toISOString() }
          : j
      );
      updateJobs(updated);

      await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, stage: newStage }),
      });
    },
    [jobs, email, updateJobs]
  );

  const handleAdd = useCallback(
    async (data: {
      role: string;
      company: string;
      url: string;
      source: JobSource;
      stage: JobStage;
      notes: string;
    }) => {
      const res = await fetch("/api/job-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...data,
          company_color: pickCompanyColor(data.company),
        }),
      });
      if (res.ok) {
        const { job } = await res.json();
        updateJobs([job, ...jobs]);
      }
    },
    [email, jobs, updateJobs]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      updateJobs(jobs.filter((j) => j.id !== id));
      await fetch("/api/job-tracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email }),
      });
    },
    [jobs, email, updateJobs]
  );

  const changeStage = useCallback(
    async (id: string, newStage: JobStage) => {
      const job = jobs.find((j) => j.id === id);
      if (!job || job.stage === newStage) return;
      const updated = jobs.map((j) =>
        j.id === id ? { ...j, stage: newStage, stage_changed_at: new Date().toISOString() } : j
      );
      updateJobs(updated);
      await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, stage: newStage }),
      });
    },
    [jobs, email, updateJobs]
  );

  const handleMoveStage = useCallback(
    (id: string) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;
      const next = getNextStage(job.stage);
      if (next) changeStage(id, next);
    },
    [jobs, changeStage]
  );

  const handleNotesChange = useCallback(
    async (id: string, notes: string) => {
      const updated = jobs.map((j) => (j.id === id ? { ...j, notes } : j));
      updateJobs(updated);
      await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, notes }),
      });
    },
    [jobs, email, updateJobs]
  );

  const handleBoardKeyDown = useCallback((e: React.KeyboardEvent) => {
    const cards = Array.from(
      (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="button"][tabindex="0"]')
    );
    const idx = cards.indexOf(document.activeElement as HTMLElement);
    if (idx < 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      cards[Math.min(idx + 1, cards.length - 1)]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      cards[Math.max(idx - 1, 0)]?.focus();
    }
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-teal-500" />
          <h1 className="font-serif text-2xl font-bold text-gray-50">
            {t("header.title")}
          </h1>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300">
            {t("header.jobCount", { count: jobs.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("board")}
              className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                view === "board"
                  ? "bg-teal-500/20 text-teal-300"
                  : "text-slate-400 hover:text-gray-50 hover:bg-white/[0.04]"
              }`}
            >
              {t("header.board")}
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                view === "analytics"
                  ? "bg-teal-500/20 text-teal-300"
                  : "text-slate-400 hover:text-gray-50 hover:bg-white/[0.04]"
              }`}
            >
              {t("header.analytics")}
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("header.addJob")}
          </button>
        </div>
      </div>

      {/* Board view */}
      {view === "board" && (
        <>
          {/* Desktop Kanban */}
          <div
            className="hidden md:grid grid-cols-6 gap-3 overflow-x-auto pb-2 scroll-snap-x-mandatory -webkit-overflow-scrolling-touch kanban-grid"
            onKeyDown={handleBoardKeyDown}
            role="region"
            aria-label={t("board.ariaLabel")}
          >
            {STAGES.map((s) => (
              <KanbanColumn
                key={s.key}
                stageKey={s.key}
                dotColor={s.dotColor}
                jobs={grouped.get(s.key) ?? []}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDelete={handleDelete}
                onExpand={setExpandedJob}
                onMoveStage={handleMoveStage}
              />
            ))}
          </div>
          {/* Mobile card stack with swipe */}
          <MobileCardStack
            jobs={jobs}
            onStageChange={changeStage}
            onDelete={handleDelete}
            onExpand={setExpandedJob}
          />
        </>
      )}

      {/* Analytics view */}
      {view === "analytics" && <FunnelAnalytics jobs={jobs} />}

      {/* Quick-Add modal */}
      <QuickAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />

      {/* Job detail sheet */}
      <JobDetailSheet
        job={expandedJob}
        open={expandedJob !== null}
        onOpenChange={(open) => { if (!open) setExpandedJob(null); }}
        onNotesChange={handleNotesChange}
      />
    </div>
  );
}
