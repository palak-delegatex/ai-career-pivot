import { describe, it, expect } from "vitest";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import {
  buildReportTeaser,
  estimateSalaryRange,
  estimatePivotTimeline,
} from "./report-teaser";

const SNAPSHOT: FreeSnapshot = {
  profileSummary: "A data-savvy marketer positioned for product roles.",
  estimatedSalaryUplift: 20,
  paths: [
    {
      targetRole: "Product Manager",
      targetIndustry: "SaaS",
      matchScore: 72,
      rationale: "Strong cross-functional background.",
      topSkillGaps: [
        { skill: "SQL", priority: "high", transferabilityScore: 40 },
        { skill: "Roadmapping", priority: "medium", transferabilityScore: 60 },
        { skill: "SQL", priority: "high", transferabilityScore: 40 }, // dup
      ],
    },
    {
      targetRole: "AI Product Manager",
      targetIndustry: "AI",
      matchScore: 66,
      rationale: "Adjacent skills transfer well.",
      topSkillGaps: [{ skill: "LLM prompting", priority: "high", transferabilityScore: 30 }],
    },
  ],
  topTransferableStrengths: [
    { skill: "Data storytelling", confidence: 80, aiBoostExplanation: "..." },
  ],
};

describe("buildReportTeaser", () => {
  const teaser = buildReportTeaser(SNAPSHOT);

  it("surfaces the real $19 price and never leaks report content", () => {
    expect(teaser.priceUsd).toBe(19);
    const json = JSON.stringify(teaser);
    // Teaser is metadata only — titles/blurbs/counts, no plan body.
    expect(json).not.toContain("mitigationSteps");
    expect(json).not.toContain("weekOneActions");
  });

  it("derives honest counts only where the snapshot supplies a basis", () => {
    const pathAnalysis = teaser.sections.find(s => s.id === "path-analysis");
    const skillPlan = teaser.sections.find(s => s.id === "skill-plan");
    const weekOne = teaser.sections.find(s => s.id === "week-one");
    expect(pathAnalysis?.count).toBe(2); // 2 paths
    expect(skillPlan?.count).toBe(3); // SQL, Roadmapping, LLM prompting (deduped)
    expect(weekOne?.count).toBeNull(); // size unknown pre-generation → no fake number
  });

  it("lists only sections the real $19 report produces (no over-promise)", () => {
    const ids = teaser.sections.map(s => s.id);
    // "job match scores" is the extension's Live Match (AIC-735), NOT this report.
    expect(ids).not.toContain("job-match");
    expect(ids).not.toContain("job-match-scores");
  });

  it("includes the personalized salary + timeline specifics", () => {
    expect(teaser.salary.display).toMatch(/^\+\$\d+K–\$\d+K\/yr$/);
    expect(teaser.timeline.display).toMatch(/^~\d+–\d+ weeks$/);
  });
});

describe("estimateSalaryRange", () => {
  it("brackets the snapshot uplift as a conservative range", () => {
    const r = estimateSalaryRange(SNAPSHOT);
    expect(r.upliftLowK).toBeLessThanOrEqual(20);
    expect(r.upliftHighK).toBeGreaterThanOrEqual(20);
    expect(r.upliftLowK).toBeLessThan(r.upliftHighK);
  });

  it("falls back to a conservative floor when uplift is absent", () => {
    const r = estimateSalaryRange({ ...SNAPSHOT, estimatedSalaryUplift: undefined });
    expect(r.upliftLowK).toBeGreaterThanOrEqual(6);
    expect(r.upliftHighK).toBeGreaterThan(r.upliftLowK);
  });
});

describe("estimatePivotTimeline", () => {
  it("scales weeks with the top path's gap effort and returns a valid range", () => {
    const t = estimatePivotTimeline(SNAPSHOT);
    expect(t.weeksLow).toBeGreaterThanOrEqual(4);
    expect(t.weeksLow).toBeLessThanOrEqual(t.weeksHigh);
    expect(t.weeksHigh).toBeLessThanOrEqual(60);
  });

  it("more/harder gaps produce a longer estimate than fewer/easier ones", () => {
    const hard = estimatePivotTimeline({
      ...SNAPSHOT,
      paths: [{ ...SNAPSHOT.paths[0], topSkillGaps: [
        { skill: "a", priority: "high", transferabilityScore: 0 },
        { skill: "b", priority: "high", transferabilityScore: 0 },
        { skill: "c", priority: "high", transferabilityScore: 0 },
      ] }],
    });
    const easy = estimatePivotTimeline({
      ...SNAPSHOT,
      paths: [{ ...SNAPSHOT.paths[0], topSkillGaps: [
        { skill: "a", priority: "low", transferabilityScore: 90 },
      ] }],
    });
    expect(hard.weeksHigh).toBeGreaterThan(easy.weeksHigh);
  });

  it("handles an empty snapshot path list without throwing", () => {
    const t = estimatePivotTimeline({ ...SNAPSHOT, paths: [] });
    expect(t.weeksLow).toBeGreaterThanOrEqual(4);
  });
});
