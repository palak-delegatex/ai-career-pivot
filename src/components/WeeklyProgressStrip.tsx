"use client";

interface MilestoneProgress {
  phase: string;
  milestone_index: number;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

interface WeeklyProgressStripProps {
  milestones: string[];
  progress: Map<string, MilestoneProgress>;
  phaseKey: string;
}

export default function WeeklyProgressStrip({
  milestones,
  progress,
  phaseKey,
}: WeeklyProgressStripProps) {
  const completed = milestones.filter((_, i) => {
    const entry = progress.get(`${phaseKey}:${i}`);
    return entry?.completed;
  }).length;

  if (milestones.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 mb-4">
      {milestones.map((_, i) => {
        const entry = progress.get(`${phaseKey}:${i}`);
        const done = entry?.completed ?? false;
        return (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              done
                ? "bg-emerald-500"
                : "bg-zinc-700"
            }`}
          />
        );
      })}
      <span className="text-xs text-zinc-400 ml-2 whitespace-nowrap">
        {completed}/{milestones.length}
      </span>
    </div>
  );
}
