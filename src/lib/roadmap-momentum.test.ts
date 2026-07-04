import { describe, it, expect } from "vitest";
import {
  computeMomentum,
  deriveNextAction,
  weekIndex,
  momentumMessage,
  type RoadmapMilestoneRef,
} from "./roadmap-momentum";

// Fixed "now": Wednesday 2026-07-15 12:00 UTC.
const NOW = new Date("2026-07-15T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe("weekIndex", () => {
  it("increments on Mondays, holds through Sunday", () => {
    // 2026-07-13 is a Monday; 2026-07-12 (Sun) is the prior week.
    expect(weekIndex(new Date("2026-07-13T00:00:00Z"))).toBe(
      weekIndex(new Date("2026-07-19T23:59:00Z")),
    );
    expect(weekIndex(new Date("2026-07-12T23:59:00Z"))).toBe(
      weekIndex(new Date("2026-07-13T00:00:00Z")) - 1,
    );
  });
});

describe("computeMomentum", () => {
  it("returns an empty/none state with no completions", () => {
    const m = computeMomentum([], 10, NOW);
    expect(m.totalCompleted).toBe(0);
    expect(m.percentComplete).toBe(0);
    expect(m.weekStreak).toBe(0);
    expect(m.level).toBe("none");
    expect(m.lastCompletedAt).toBeNull();
    expect(m.daysSinceLastActivity).toBeNull();
  });

  it("rounds percent complete and counts recent windows", () => {
    const m = computeMomentum([daysAgo(1), daysAgo(6), daysAgo(20)], 8, NOW);
    expect(m.percentComplete).toBe(38); // 3/8 = 37.5 -> 38
    expect(m.completedLast7Days).toBe(2);
    expect(m.completedLast30Days).toBe(3);
    expect(m.daysSinceLastActivity).toBe(1);
    expect(m.level).toBe("hot");
  });

  it("counts a multi-week consecutive streak", () => {
    // Activity this week, last week, and two weeks ago -> streak 3.
    const m = computeMomentum([daysAgo(0), daysAgo(8), daysAgo(15)], 10, NOW);
    expect(m.weekStreak).toBe(3);
  });

  it("keeps the streak alive with a one-week grace period", () => {
    // Only activity was last week (8 days ago); current week empty -> streak 1.
    const m = computeMomentum([daysAgo(8)], 10, NOW);
    expect(m.weekStreak).toBe(1);
  });

  it("breaks the streak after more than one idle week", () => {
    const m = computeMomentum([daysAgo(30)], 10, NOW);
    expect(m.weekStreak).toBe(0);
    expect(m.level).toBe("idle");
  });

  it("does not double-count two completions in the same week", () => {
    const m = computeMomentum([daysAgo(0), daysAgo(2)], 10, NOW);
    expect(m.weekStreak).toBe(1);
  });
});

describe("deriveNextAction", () => {
  const ref = (
    index: number,
    status: RoadmapMilestoneRef["status"],
  ): RoadmapMilestoneRef => ({
    phaseKey: "6mo",
    phaseLabel: "6 Months",
    index,
    text: `Milestone ${index}`,
    status,
  });

  it("prefers the first in-progress milestone", () => {
    const next = deriveNextAction([
      ref(0, "completed"),
      ref(1, "in-progress"),
      ref(2, "not-started"),
    ]);
    expect(next?.index).toBe(1);
  });

  it("falls back to the first not-started milestone", () => {
    const next = deriveNextAction([ref(0, "completed"), ref(1, "not-started")]);
    expect(next?.index).toBe(1);
  });

  it("returns null when everything is complete", () => {
    expect(deriveNextAction([ref(0, "completed")])).toBeNull();
  });
});

describe("momentumMessage", () => {
  it("nudges a first-timer", () => {
    expect(momentumMessage(computeMomentum([], 5, NOW))).toMatch(/first milestone/i);
  });
  it("celebrates weekly progress", () => {
    expect(momentumMessage(computeMomentum([daysAgo(1), daysAgo(2)], 5, NOW))).toMatch(/this week/i);
  });
});
