// Roadmap momentum + next-action derivation (AIC-685).
//
// Pure, dependency-free logic so it can be unit-tested and reused on either the
// client or server. All signals are derived from the milestone completion
// timestamps we already persist in `milestone_progress.completed_at` — no extra
// storage or per-day visit tracking is required, so the "streak" is always
// honest to data we actually have.

const DAY_MS = 86_400_000;

/** Monday-anchored week index (1970-01-01 was a Thursday). */
export function weekIndex(d: Date): number {
  const days = Math.floor(d.getTime() / DAY_MS);
  return Math.floor((days + 3) / 7);
}

export type MomentumLevel = "hot" | "warm" | "cooling" | "idle" | "none";

export interface MomentumStats {
  totalCompleted: number;
  totalMilestones: number;
  /** 0–100, rounded. */
  percentComplete: number;
  completedLast7Days: number;
  completedLast30Days: number;
  lastCompletedAt: Date | null;
  daysSinceLastActivity: number | null;
  /** Consecutive Mon-anchored weeks with >=1 completion, ending at the current
   * or previous week. 0 once the chain lapses (>1 full week without progress). */
  weekStreak: number;
  level: MomentumLevel;
}

/**
 * Compute momentum from a list of completion timestamps.
 * `now` is injectable for deterministic tests.
 */
export function computeMomentum(
  completedAt: Array<Date | string | null | undefined>,
  totalMilestones: number,
  now: Date = new Date(),
): MomentumStats {
  const dates = completedAt
    .map((d) => (d == null ? null : d instanceof Date ? d : new Date(d)))
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()));

  const totalCompleted = dates.length;
  const percentComplete =
    totalMilestones > 0
      ? Math.round((totalCompleted / totalMilestones) * 100)
      : 0;

  if (totalCompleted === 0) {
    return {
      totalCompleted: 0,
      totalMilestones,
      percentComplete,
      completedLast7Days: 0,
      completedLast30Days: 0,
      lastCompletedAt: null,
      daysSinceLastActivity: null,
      weekStreak: 0,
      level: "none",
    };
  }

  const nowMs = now.getTime();
  const completedLast7Days = dates.filter((d) => nowMs - d.getTime() <= 7 * DAY_MS).length;
  const completedLast30Days = dates.filter((d) => nowMs - d.getTime() <= 30 * DAY_MS).length;

  const lastCompletedAt = dates.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b));
  const daysSinceLastActivity = Math.floor((nowMs - lastCompletedAt.getTime()) / DAY_MS);

  // Week streak: walk consecutive active weeks backwards from the current week.
  // A one-week grace period keeps the chain alive if the most recent activity
  // was last week (so a Monday reset doesn't instantly zero someone out).
  const activeWeeks = new Set(dates.map(weekIndex));
  const currentWeek = weekIndex(now);
  let weekStreak = 0;
  let cursor: number | null = null;
  if (activeWeeks.has(currentWeek)) cursor = currentWeek;
  else if (activeWeeks.has(currentWeek - 1)) cursor = currentWeek - 1;
  while (cursor != null && activeWeeks.has(cursor)) {
    weekStreak++;
    cursor--;
  }

  let level: MomentumLevel;
  if (daysSinceLastActivity <= 3) level = "hot";
  else if (daysSinceLastActivity <= 7) level = "warm";
  else if (daysSinceLastActivity <= 21) level = "cooling";
  else level = "idle";

  return {
    totalCompleted,
    totalMilestones,
    percentComplete,
    completedLast7Days,
    completedLast30Days,
    lastCompletedAt,
    daysSinceLastActivity,
    weekStreak,
    level,
  };
}

export type MilestoneStatus = "not-started" | "in-progress" | "completed";

export interface RoadmapMilestoneRef {
  phaseKey: string;
  phaseLabel: string;
  index: number;
  text: string;
  status: MilestoneStatus;
}

/**
 * The single "next action": the first in-progress milestone (finish what you
 * started), else the first not-started one. `null` when everything is done.
 * Input must be in roadmap order (6mo → 1yr → 2yr).
 */
export function deriveNextAction(
  ordered: RoadmapMilestoneRef[],
): RoadmapMilestoneRef | null {
  return (
    ordered.find((m) => m.status === "in-progress") ??
    ordered.find((m) => m.status === "not-started") ??
    null
  );
}

/** Short, encouraging momentum copy for the UI. */
export function momentumMessage(m: MomentumStats): string {
  if (m.level === "none") return "Check off your first milestone to start a streak";
  if (m.level === "idle") return "It's been a while — one small step restarts your momentum";
  if (m.completedLast7Days > 0) {
    return m.completedLast7Days === 1
      ? "1 milestone done this week — keep it going"
      : `${m.completedLast7Days} milestones done this week — you're on a roll`;
  }
  if (m.level === "cooling") return "Pick one milestone this week to keep your streak alive";
  return "Nice pace — line up your next milestone";
}
