"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Briefcase,
  Plus,
  Link2,
  X,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Sparkles,
  BookOpen,
  Scale,
  Megaphone,
  Search,
  Pencil,
  ArrowRightLeft,
  Trash2,
  ExternalLink,
  Zap,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrackedJob, JobStage, JobSource } from "@/lib/job-tracker";
import {
  STAGES,
  STAGE_CTAS,
  pickCompanyColor,
  detectSource,
  daysInStage,
  daysInStageUrgency,
} from "@/lib/job-tracker";
import JobDetailView from "@/components/JobDetailView";

interface JobTrackerKanbanProps {
  jobs: TrackedJob[];
  email: string;
  onJobsChange: (jobs: TrackedJob[]) => void;
}

// ─── Helpers ───

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
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

const SOURCE_LABELS: Record<JobSource, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  direct: "Direct",
  other: "Other",
};

const CTA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Clock,
  BookOpen,
  Scale,
  Megaphone,
  Search,
};

// ─── MatchBadge ───

function MatchBadge({ score }: { score: number }) {
  if (score === 0) return null;
  const tier = matchTier(score);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${MATCH_STYLES[tier]}`}
    >
      <TrendingUp className="h-2.5 w-2.5" />
      {score}%
    </span>
  );
}

// ─── DaysInStageBadge ───

function DaysInStageBadge({ stageChangedAt }: { stageChangedAt: string }) {
  const days = daysInStage(stageChangedAt);
  const urgency = daysInStageUrgency(days);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] ${urgency}`}>
      <Clock className="h-2.5 w-2.5" />
      {days}d in stage
    </span>
  );
}

// ─── ClippedBadge ───

function ClippedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 border border-violet-500/25 text-violet-300">
      <Zap className="h-2.5 w-2.5" />
      Clipped
    </span>
  );
}

// ─── StageActionCTA ───

function StageActionCTA({ stage }: { stage: JobStage }) {
  const cta = STAGE_CTAS[stage];
  const Icon = CTA_ICONS[cta.icon];
  return (
    <button className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-primary/[0.08] border border-primary/15 rounded-lg text-[11px] text-primary font-medium hover:bg-primary/[0.12] transition-colors">
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {cta.label}
    </button>
  );
}

// ─── CardOverflowMenu ───

function CardOverflowMenu({
  job,
  onDelete,
  onMoveToStage,
}: {
  job: TrackedJob;
  onDelete: (id: string) => void;
  onMoveToStage: (id: string, stage: JobStage) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {job.url && (
          <DropdownMenuItem
            onClick={() => window.open(job.url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            Open URL
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>
          <Pencil className="h-3.5 w-3.5 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
            Move to...
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {STAGES.filter((s) => s.key !== job.stage).map((s) => (
              <DropdownMenuItem
                key={s.key}
                onClick={() => onMoveToStage(job.id, s.key)}
              >
                <span className={`w-2 h-2 rounded-full ${s.dotColor} mr-2`} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(job.id)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── SortableJobCard ───

function SortableJobCard({
  job,
  onDelete,
  onMoveToStage,
  onSelect,
  isPassed,
}: {
  job: TrackedJob;
  onDelete: (id: string) => void;
  onMoveToStage: (id: string, stage: JobStage) => void;
  onSelect?: (id: string) => void;
  isPassed?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-card border rounded-xl p-3.5 transition-all ${
        isDragging
          ? "border-primary ring-2 ring-primary/20 opacity-80 scale-[1.02] rotate-[2deg] shadow-2xl z-50"
          : "border-border hover:border-primary/50 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
      } ${isPassed ? "opacity-60" : ""}`}
      {...attributes}
    >
      {/* Grip + Overflow row */}
      <div className="flex items-center justify-between mb-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-60 transition-opacity p-1 -ml-1"
          aria-roledescription="sortable"
        >
          <GripVertical className="h-3.5 w-3.5 text-slate-500" />
        </div>
        <CardOverflowMenu
          job={job}
          onDelete={onDelete}
          onMoveToStage={onMoveToStage}
        />
      </div>

      {/* Company avatar + Role + Company·Source */}
      <div
        className="flex items-start gap-2.5 mb-2.5 cursor-pointer"
        onClick={() => onSelect?.(job.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(job.id); }}
      >
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[13px] font-bold text-white shrink-0`}
        >
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-gray-50 leading-tight line-clamp-2">
            {job.role}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {job.company}
            {job.source !== "other" && (
              <span className="text-slate-600"> · via {SOURCE_LABELS[job.source]}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            {job.stage === "exploring"
              ? `Added ${timeAgo(job.created_at)}`
              : job.stage === "passed"
                ? `Passed ${timeAgo(job.stage_changed_at)}`
                : `Applied ${timeAgo(job.applied_at || job.created_at)}`}
          </div>
        </div>
      </div>

      {/* Badges row: match + days-in-stage + clipped */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
        <MatchBadge score={job.match_score} />
        <DaysInStageBadge stageChangedAt={job.stage_changed_at} />
        {job.source_type === "extension_clip" && <ClippedBadge />}
      </div>

      {/* Stage CTA */}
      <StageActionCTA stage={job.stage} />

      {/* Notes preview */}
      {job.notes && (
        <div className="flex items-start gap-1.5 mt-2 text-[11px] text-slate-500 line-clamp-1">
          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{job.notes}</span>
        </div>
      )}
    </div>
  );
}

// ─── DragOverlayCard (static preview during drag) ───

function DragOverlayCard({ job }: { job: TrackedJob }) {
  return (
    <div className="bg-card border-primary ring-2 ring-primary/20 rounded-xl p-3.5 shadow-2xl scale-[1.02] rotate-[2deg] opacity-90 w-[240px]">
      <div className="flex items-start gap-2.5">
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
    </div>
  );
}

// ─── KanbanColumn ───

function KanbanColumn({
  stageKey,
  label,
  dotColor,
  emptyState,
  jobs,
  isOver,
  onDelete,
  onMoveToStage,
  onSelectJob,
}: {
  stageKey: JobStage;
  label: string;
  dotColor: string;
  emptyState: string;
  jobs: TrackedJob[];
  isOver: boolean;
  onDelete: (id: string) => void;
  onMoveToStage: (id: string, stage: JobStage) => void;
  onSelectJob?: (id: string) => void;
}) {
  return (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
          {jobs.length}
        </span>
      </div>
      <SortableContext
        items={jobs.map((j) => j.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          data-stage={stageKey}
          className={`rounded-2xl border p-2 min-h-[280px] flex flex-col gap-2 transition-colors ${
            isOver
              ? "bg-primary/[0.06] border-primary/30 border-solid"
              : "bg-card/50 border-dashed border-slate-800"
          }`}
        >
          {jobs.length === 0 && (
            <div className="text-center py-10 text-slate-600 text-[12px] italic">
              {emptyState}
            </div>
          )}
          {jobs.map((job) => (
            <SortableJobCard
              key={job.id}
              job={job}
              onDelete={onDelete}
              onMoveToStage={onMoveToStage}
              onSelect={onSelectJob}
              isPassed={stageKey === "passed"}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── CollapsedPassedColumn ───

function CollapsedPassedColumn({
  count,
  onExpand,
}: {
  count: number;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className="w-10 min-h-[280px] bg-card/50 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-slate-700 hover:bg-card/80 transition-colors shrink-0"
    >
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
        {count}
      </span>
      <span
        className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
        style={{ writingMode: "vertical-lr", textOrientation: "mixed" }}
      >
        Passed
      </span>
    </button>
  );
}

// ─── MobileAccordion ───

function MobileAccordion({
  jobs,
  onDelete,
  onMoveToStage,
  onSelectJob,
}: {
  jobs: TrackedJob[];
  onDelete: (id: string) => void;
  onMoveToStage: (id: string, stage: JobStage) => void;
  onSelectJob?: (id: string) => void;
}) {
  const [open, setOpen] = useState<JobStage | null>(null);
  const grouped = useMemo(() => {
    const map = new Map<JobStage, TrackedJob[]>();
    for (const s of STAGES) map.set(s.key, []);
    for (const j of jobs) map.get(j.stage)?.push(j);
    return map;
  }, [jobs]);

  return (
    <div className="flex flex-col gap-2 md:hidden">
      {STAGES.map((s) => {
        const stageJobs = grouped.get(s.key) ?? [];
        const isOpen = open === s.key;
        return (
          <div
            key={s.key}
            className="border border-slate-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(isOpen ? null : s.key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 text-[13px] font-semibold text-gray-50 hover:bg-slate-800/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block ${s.dotColor}`} />
                {s.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
                  {stageJobs.length}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            {isOpen && (
              <div className="p-3 bg-slate-900/30 flex flex-col gap-2">
                {stageJobs.length === 0 && (
                  <p className="text-[12px] text-slate-600 py-2 px-2 italic">
                    {s.emptyState}
                  </p>
                )}
                {stageJobs.map((job) => (
                  <MobileJobCard
                    key={job.id}
                    job={job}
                    onDelete={onDelete}
                    onMoveToStage={onMoveToStage}
                    onSelect={onSelectJob}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MobileJobCard (with stage selector dropdown) ───

function MobileJobCard({
  job,
  onDelete,
  onMoveToStage,
  onSelect,
}: {
  job: TrackedJob;
  onDelete: (id: string) => void;
  onMoveToStage: (id: string, stage: JobStage) => void;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className={`relative bg-card border border-border rounded-xl p-3.5 ${job.stage === "passed" ? "opacity-60" : ""}`}>
      {/* Overflow menu */}
      <div className="absolute top-2.5 right-2.5">
        <CardOverflowMenu job={job} onDelete={onDelete} onMoveToStage={onMoveToStage} />
      </div>

      {/* Company avatar + Role + Company·Source */}
      <div
        className="flex items-start gap-2.5 mb-2.5 pr-8 cursor-pointer"
        onClick={() => onSelect?.(job.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(job.id); }}
      >
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[13px] font-bold text-white shrink-0`}
        >
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-gray-50 leading-tight line-clamp-2">
            {job.role}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {job.company}
            {job.source !== "other" && (
              <span className="text-slate-600"> · via {SOURCE_LABELS[job.source]}</span>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
        <MatchBadge score={job.match_score} />
        <DaysInStageBadge stageChangedAt={job.stage_changed_at} />
        {job.source_type === "extension_clip" && <ClippedBadge />}
      </div>

      {/* Stage CTA */}
      <StageActionCTA stage={job.stage} />

      {/* Notes preview */}
      {job.notes && (
        <div className="flex items-start gap-1.5 mt-2 text-[11px] text-slate-500">
          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{job.notes}</span>
        </div>
      )}

      {/* Mobile stage selector */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-800">
        <Select
          value={job.stage}
          onValueChange={(val) => onMoveToStage(job.id, val as JobStage)}
        >
          <SelectTrigger className="h-8 text-[11px] bg-white/[0.04] border-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s.key} value={s.key} className="text-[12px]">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.dotColor}`} />
                  {s.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Funnel Analytics ───

const FUNNEL_STAGES: JobStage[] = [
  "exploring",
  "applied",
  "interviewing",
  "offer",
  "pivoted",
];

const FUNNEL_LABELS: Record<string, string> = {
  exploring: "Exploring",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  pivoted: "Pivoted",
};

function FunnelAnalytics({ jobs }: { jobs: TrackedJob[] }) {
  const cumulativeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const stageIndex: Record<string, number> = {};
    FUNNEL_STAGES.forEach((s, i) => {
      stageIndex[s] = i;
      counts[s] = 0;
    });
    stageIndex["passed"] = 5;

    for (const job of jobs) {
      const jIdx =
        job.stage === "passed" ? 5 : (stageIndex[job.stage] ?? 0);
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
    "from-amber-400/40 to-amber-400/20",
    "from-emerald-400/40 to-emerald-400/20",
    "from-violet-400/40 to-violet-400/20",
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
      .filter((j) => j.stage !== "exploring")
      .map((j) => {
        const created = new Date(j.created_at).getTime();
        const changed = new Date(j.stage_changed_at).getTime();
        return (changed - created) / (1000 * 60 * 60 * 24);
      });
    if (durations.length === 0) return "--";
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return `${avg.toFixed(1)}d`;
  }, [jobs]);

  const appliedToInterviewRate = cumulativeCounts["applied"] > 0
    ? Math.round((cumulativeCounts["interviewing"] / cumulativeCounts["applied"]) * 100)
    : 0;

  const interviewToOfferRate = cumulativeCounts["interviewing"] > 0
    ? Math.round((cumulativeCounts["offer"] / cumulativeCounts["interviewing"]) * 100)
    : 0;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2.5 mb-5">
        <Activity className="h-5 w-5 text-teal-500" />
        <h2 className="font-serif text-xl font-bold text-gray-50">
          Pipeline Analytics
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
                    {FUNNEL_LABELS[s]}
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
                    {FUNNEL_LABELS[s]}
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
                Avg. in {FUNNEL_LABELS[s]}
              </div>
            </div>
          ))}
          <div className="text-center py-2">
            <div className="text-sm font-bold font-mono text-gray-50">
              {totalPipelineAvg}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Avg. Total Pipeline
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {interviewToOfferRate >= 55 && (
          <div className="bg-emerald-500/[0.06] border border-emerald-500/25 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-50 mb-1">
                Strong Interview Performance
              </div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                Your Interviewing to Offer rate ({interviewToOfferRate}%) is
                well above the 55% benchmark. You&apos;re making strong impressions.
              </div>
            </div>
          </div>
        )}

        {appliedToInterviewRate > 0 && appliedToInterviewRate < 45 && (
          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-50 mb-1">
                Low Applied to Interview Rate
              </div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                Your Applied to Interviewing rate ({appliedToInterviewRate}%) is
                below the 45% average. Applications may need stronger tailoring.
              </div>
              <div className="mt-2 px-2.5 py-2 bg-teal-500/[0.08] rounded-lg text-[11px] text-teal-300 leading-snug">
                Try: Customize your resume for each job description. Use our AI
                Resume Tailoring tool to match keywords. Follow up 5 days after
                applying.
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
                Add Jobs to See Insights
              </div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                Track your applications to unlock pipeline analytics and
                AI-powered insights about your career pivot.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState<JobStage>("exploring");

  function handleSubmit() {
    if (!role.trim() || !company.trim()) return;
    const source = url ? detectSource(url) : "other";
    onAdd({ role: role.trim(), company: company.trim(), url, source, stage, notes });
    setUrl("");
    setRole("");
    setCompany("");
    setNotes("");
    setStage("exploring");
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
          <span className="text-base font-bold text-gray-50">Add Job to Tracker</span>
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
              placeholder="Paste a job URL (LinkedIn, Indeed, Glassdoor...)"
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-slate-700 rounded-xl text-sm text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-600 text-center mb-5">
            We&apos;ll auto-fill the job details and compute your match score
          </p>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              or enter manually
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Manual fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            <div>
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
                Role
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. ML Engineer"
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
                Company
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
              Notes
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referral from Sarah, deadline Jun 15..."
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Stage selector */}
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-slate-400 mb-2">
              Add to stage
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.filter((s) => s.key !== "passed").map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
                    stage === s.key
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
                      : "border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400"
                  }`}
                >
                  {s.label}
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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!role.trim() || !company.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add to Tracker
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
  const [jobs, setJobs] = useState(initialJobs);
  const [view, setView] = useState<"board" | "analytics">("board");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<JobStage | null>(null);
  const [passedExpanded, setPassedExpanded] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeJob = useMemo(
    () => (activeId ? jobs.find((j) => j.id === activeId) ?? null : null),
    [activeId, jobs]
  );

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overEl = event.over;
    if (!overEl) {
      setOverStage(null);
      return;
    }
    const overJob = jobs.find((j) => j.id === overEl.id);
    if (overJob) {
      setOverStage(overJob.stage);
    }
  }, [jobs]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverStage(null);

      if (!over) return;

      const draggedJob = jobs.find((j) => j.id === active.id);
      if (!draggedJob) return;

      let newStage: JobStage | null = null;

      const overJob = jobs.find((j) => j.id === over.id);
      if (overJob && overJob.id !== draggedJob.id) {
        newStage = overJob.stage;
      }

      if (!newStage || newStage === draggedJob.stage) return;

      const updated = jobs.map((j) =>
        j.id === draggedJob.id
          ? { ...j, stage: newStage!, stage_changed_at: new Date().toISOString() }
          : j
      );
      updateJobs(updated);

      await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggedJob.id, email, stage: newStage }),
      });
    },
    [jobs, email, updateJobs]
  );

  const handleMoveToStage = useCallback(
    async (id: string, newStage: JobStage) => {
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

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverStage(null);
  }, []);

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

  const activeStages = STAGES.filter((s) => s.key !== "passed");
  const passedJobs = grouped.get("passed") ?? [];

  const selectedJob = selectedJobId
    ? jobs.find((j) => j.id === selectedJobId) ?? null
    : null;

  const handleJobUpdateFromDetail = useCallback(
    (updated: TrackedJob) => {
      updateJobs(jobs.map((j) => (j.id === updated.id ? updated : j)));
    },
    [jobs, updateJobs]
  );

  if (selectedJob) {
    return (
      <JobDetailView
        job={selectedJob}
        email={email}
        onBack={() => setSelectedJobId(null)}
        onJobUpdate={handleJobUpdateFromDetail}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-teal-500" />
          <h1 className="font-serif text-2xl font-bold text-gray-50">
            Job Tracker
          </h1>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
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
              Board
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                view === "analytics"
                  ? "bg-teal-500/20 text-teal-300"
                  : "text-slate-400 hover:text-gray-50 hover:bg-white/[0.04]"
              }`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Job
          </button>
        </div>
      </div>

      {/* Board view */}
      {view === "board" && (
        <>
          {/* Desktop Kanban with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className="hidden md:flex gap-3 overflow-x-auto pb-2"
              role="application"
              aria-label="Job tracker board"
            >
              {activeStages.map((s) => (
                <div key={s.key} className="flex-1 min-w-[200px]">
                  <KanbanColumn
                    stageKey={s.key}
                    label={s.label}
                    dotColor={s.dotColor}
                    emptyState={s.emptyState}
                    jobs={grouped.get(s.key) ?? []}
                    isOver={overStage === s.key}
                    onDelete={handleDelete}
                    onMoveToStage={handleMoveToStage}
                    onSelectJob={setSelectedJobId}
                  />
                </div>
              ))}

              {/* Passed column — collapsed or expanded */}
              {passedExpanded ? (
                <div className="min-w-[200px] flex-1">
                  <KanbanColumn
                    stageKey="passed"
                    label="Passed"
                    dotColor="bg-slate-500"
                    emptyState="No passes yet — that's a good sign"
                    jobs={passedJobs}
                    isOver={overStage === "passed"}
                    onDelete={handleDelete}
                    onMoveToStage={handleMoveToStage}
                    onSelectJob={setSelectedJobId}
                  />
                </div>
              ) : (
                <CollapsedPassedColumn
                  count={passedJobs.length}
                  onExpand={() => setPassedExpanded(true)}
                />
              )}
            </div>

            <DragOverlay dropAnimation={{
              duration: 200,
              easing: "ease-out",
            }}>
              {activeJob ? <DragOverlayCard job={activeJob} /> : null}
            </DragOverlay>
          </DndContext>

          {/* Mobile accordion */}
          <MobileAccordion
            jobs={jobs}
            onDelete={handleDelete}
            onMoveToStage={handleMoveToStage}
            onSelectJob={setSelectedJobId}
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
    </div>
  );
}
