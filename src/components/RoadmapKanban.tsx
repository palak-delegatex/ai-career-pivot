"use client";

import { BookOpen, Target, Briefcase, Users, Check, Clock, Loader2 } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

type MilestoneStatus = "not-started" | "in-progress" | "completed";

interface MilestoneProgress {
  phase: string;
  milestone_index: number;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

export interface KanbanPhase {
  key: string;
  label: string;
  deadline: string;
  milestones: string[];
  color: "emerald" | "teal" | "cyan";
}

interface RoadmapKanbanProps {
  phases: KanbanPhase[];
  progress?: Map<string, MilestoneProgress>;
  saving?: string | null;
  onCycleStatus?: (phase: string, milestoneIndex: number) => void;
  onSelectMilestone?: (text: string, phaseKey: string, index: number) => void;
}

type MilestoneType = "learn" | "achieve" | "do" | "connect";

const TYPE_META: Record<MilestoneType, { icon: typeof BookOpen; label: string }> = {
  learn: { icon: BookOpen, label: "Learn" },
  achieve: { icon: Target, label: "Achieve" },
  do: { icon: Briefcase, label: "Do" },
  connect: { icon: Users, label: "Connect" },
};

const LEARN_KW = ["learn", "study", "course", "read", "research", "understand", "training", "education", "tutorial", "book", "watch"];
const ACHIEVE_KW = ["achieve", "earn", "obtain", "pass", "certif", "goal", "launch", "publish", "ship", "release", "degree", "award"];
const CONNECT_KW = ["network", "connect", "mentor", "community", "meetup", "conference", "linkedin", "attend", "join", "collaborate", "reach out", "contact", "interview"];

function classifyMilestone(text: string): MilestoneType {
  const lower = text.toLowerCase();
  if (CONNECT_KW.some((k) => lower.includes(k))) return "connect";
  if (LEARN_KW.some((k) => lower.includes(k))) return "learn";
  if (ACHIEVE_KW.some((k) => lower.includes(k))) return "achieve";
  return "do";
}

function pKey(phase: string, idx: number) {
  return `${phase}:${idx}`;
}

function deriveStatus(item: MilestoneProgress | undefined): MilestoneStatus {
  if (!item) return "not-started";
  if (item.completed) return "completed";
  return "in-progress";
}

const PHASE_BADGE: Record<string, string> = {
  emerald: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
  teal: "bg-teal-900/40 border-teal-700/40 text-teal-300",
  cyan: "bg-cyan-900/40 border-cyan-700/40 text-cyan-300",
};

interface MilestoneEntry {
  text: string;
  phaseKey: string;
  phaseLabel: string;
  phaseColor: "emerald" | "teal" | "cyan";
  index: number;
  status: MilestoneStatus;
  isSaving: boolean;
  type: MilestoneType;
}

const COLUMNS: { key: MilestoneStatus; label: string; emptyText: string }[] = [
  { key: "not-started", label: "Not Started", emptyText: "No milestones to start yet" },
  { key: "in-progress", label: "In Progress", emptyText: "Move milestones here when you begin" },
  { key: "completed", label: "Completed", emptyText: "Complete milestones to see them here" },
];

function KanbanCard({
  entry,
  onCycleStatus,
  onSelect,
}: {
  entry: MilestoneEntry;
  onCycleStatus?: (phase: string, milestoneIndex: number) => void;
  onSelect?: () => void;
}) {
  const TypeIcon = TYPE_META[entry.type].icon;
  const isCompleted = entry.status === "completed";

  return (
    <div
      className={`bg-card border rounded-lg p-3 hover:border-primary/50 transition-colors ${
        isCompleted ? "opacity-75" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-label={`${entry.text}. Status: ${entry.status}. Press Enter to view details.`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCycleStatus?.(entry.phaseKey, entry.index);
          }}
          className="shrink-0 cursor-pointer bg-transparent border-0 p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Status: ${entry.status}. Click to change.`}
          disabled={entry.isSaving}
        >
          {entry.isSaving ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : entry.status === "completed" ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : entry.status === "in-progress" ? (
            <Clock className="h-4 w-4 text-teal-400" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TypeIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {TYPE_META[entry.type].label}
            </span>
          </div>
          <p
            className={`text-sm leading-snug ${
              isCompleted ? "text-slate-500 line-through" : "text-slate-200"
            }`}
          >
            {entry.text}
          </p>
          <span
            className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full border ${PHASE_BADGE[entry.phaseColor]}`}
          >
            {entry.phaseLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapKanban({
  phases,
  progress,
  saving,
  onCycleStatus,
  onSelectMilestone,
}: RoadmapKanbanProps) {
  const entries: MilestoneEntry[] = [];
  for (const phase of phases) {
    for (let i = 0; i < phase.milestones.length; i++) {
      const key = pKey(phase.key, i);
      const item = progress?.get(key);
      entries.push({
        text: phase.milestones[i],
        phaseKey: phase.key,
        phaseLabel: phase.label,
        phaseColor: phase.color,
        index: i,
        status: deriveStatus(item),
        isSaving: saving === key,
        type: classifyMilestone(phase.milestones[i]),
      });
    }
  }

  const columns = COLUMNS.map((col) => ({
    ...col,
    items: entries.filter((e) => e.status === col.key),
  }));

  const columnContent = (col: (typeof columns)[number]) => (
    <>
      {col.items.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-8">{col.emptyText}</p>
      ) : (
        col.items.map((entry) => (
          <KanbanCard
            key={`${entry.phaseKey}:${entry.index}`}
            entry={entry}
            onCycleStatus={onCycleStatus}
            onSelect={() =>
              onSelectMilestone?.(entry.text, entry.phaseKey, entry.index)
            }
          />
        ))
      )}
    </>
  );

  return (
    <>
      {/* Mobile: vertical Accordion */}
      <Accordion
        type="single"
        collapsible
        defaultValue="not-started"
        className="md:hidden"
      >
        {columns.map((col) => {
          const completedCount = col.items.filter((e) => e.status === "completed").length;
          const totalCount = col.items.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          return (
            <AccordionItem key={col.key} value={col.key}>
              <AccordionTrigger className="min-h-[44px]">
                <div className="flex items-center gap-2 flex-1">
                  <span>{col.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                  {totalCount > 0 && (
                    <span className="text-[10px] text-slate-500 ml-auto mr-2">
                      {pct}%
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">{columnContent(col)}</div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Desktop: horizontal kanban columns */}
      <div
        className="hidden md:flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1"
        role="region"
        aria-label="Milestone board"
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex-1 min-w-[280px] snap-center"
            role="group"
            aria-label={`${col.label} — ${col.items.length} milestones`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.label}
              </h3>
              <span className="text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded-full">
                {col.items.length}
              </span>
            </div>
            <div className="bg-card/50 rounded-xl p-2 space-y-2 min-h-[200px]">
              {columnContent(col)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
