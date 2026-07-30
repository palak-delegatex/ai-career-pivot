import { describe, it, expect } from "vitest";
import { computeATSMatchBreakdown, type JDKeywords } from "./ats-scoring";
import { buildGamifiedAtsScore } from "./ats-gamified";

// Drive the gamified transform off a REAL breakdown (no hand-rolled fixture) so
// the contract stays coupled to the actual AIC-735 engine.
const RESUME = `
John Doe
john@example.com · 555-1234 · San Francisco, CA · linkedin.com/in/johndoe

SUMMARY
Product manager with 6 years leading cross-functional teams.

EXPERIENCE
Senior Product Manager, Acme
- Led roadmap for a payments platform, growing revenue 35%.
- Managed a team of 8 across design and engineering.

SKILLS
Product strategy, roadmapping, SQL, stakeholder management, Agile

EDUCATION
BS in Economics
`;

const JD: JDKeywords = {
  required: ["product management", "SQL", "Kubernetes"],
  preferred: ["Python", "roadmapping"],
  keywords: ["Agile", "stakeholder management"],
};

describe("buildGamifiedAtsScore", () => {
  const breakdown = computeATSMatchBreakdown(RESUME, JD);
  const gamified = buildGamifiedAtsScore(breakdown);

  it("passes the deterministic score through untouched", () => {
    expect(gamified.score).toBe(breakdown.overallScore);
    expect(gamified.earnedPoints).toBe(breakdown.overallScore);
    expect(gamified.score).toBeGreaterThanOrEqual(0);
    expect(gamified.score).toBeLessThanOrEqual(100);
  });

  it("marks matched keywords done and missing ones open with a positive delta", () => {
    const sql = gamified.items.find(i => i.id === "kw:sql");
    const kubernetes = gamified.items.find(i => i.id === "kw:kubernetes");
    expect(sql?.done).toBe(true);
    expect(kubernetes?.done).toBe(false);
    expect(kubernetes?.pointDelta).toBeGreaterThan(0);
    // Kubernetes is a REQUIRED miss → labelled critical.
    expect(kubernetes?.importance).toBe("critical");
    expect(kubernetes?.fix).toBeTruthy();
  });

  it("ranks the highest-value open item as nextBestAction", () => {
    const openDeltas = gamified.items.filter(i => !i.done).map(i => i.pointDelta);
    expect(gamified.nextBestAction).not.toBeNull();
    expect(gamified.nextBestAction!.done).toBe(false);
    expect(gamified.nextBestAction!.pointDelta).toBe(Math.max(...openDeltas));
  });

  it("orders open items before done items", () => {
    const firstDone = gamified.items.findIndex(i => i.done);
    const lastOpen = gamified.items.map(i => i.done).lastIndexOf(false);
    if (firstDone !== -1) expect(firstDone).toBeGreaterThan(lastOpen);
  });

  it("clamps headroom so score + headroom never exceeds 100", () => {
    expect(gamified.headroom).toBeGreaterThanOrEqual(0);
    expect(gamified.score + gamified.headroom).toBeLessThanOrEqual(100);
  });

  it("reports honest summary counts from the breakdown", () => {
    expect(gamified.summary.matchedKeywords).toBe(breakdown.summary.matchedKeywords);
    expect(gamified.summary.requiredTotal).toBe(3);
    expect(gamified.completedCount).toBe(gamified.items.filter(i => i.done).length);
    expect(gamified.totalCount).toBe(gamified.items.length);
  });

  it("de-dupes a keyword repeated across categories, keeping the matched instance", () => {
    // "roadmapping" is preferred (present in SKILLS) — a single deduped item.
    const roadmap = gamified.items.filter(i => i.id === "kw:roadmapping");
    expect(roadmap).toHaveLength(1);
    expect(roadmap[0].done).toBe(true);
  });

  it("handles a JD with no keywords (perfect keyword score) without throwing", () => {
    const empty = buildGamifiedAtsScore(
      computeATSMatchBreakdown(RESUME, { required: [], preferred: [], keywords: [] })
    );
    expect(empty.score).toBeGreaterThanOrEqual(0);
    expect(empty.items.every(i => i.category === "formatting")).toBe(true);
  });
});
