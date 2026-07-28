import { describe, it, expect } from "vitest";
import { computeDeliveryScore, parseJdFitScore, type AggregateSpeechMetrics } from "./mock-interview-score";

function metrics(partial: Partial<AggregateSpeechMetrics>): AggregateSpeechMetrics {
  return {
    totalAnswers: 5,
    totalDurationSeconds: 300,
    totalWords: 600,
    averageWordsPerMinute: 140,
    totalFillerWords: 0,
    fillerWordPercentage: 0,
    topFillers: [],
    ...partial,
  };
}

describe("computeDeliveryScore", () => {
  it("returns null when there is no speech data (text mode)", () => {
    expect(computeDeliveryScore(undefined)).toBeNull();
    expect(computeDeliveryScore(null)).toBeNull();
    expect(computeDeliveryScore(metrics({ totalWords: 0 }))).toBeNull();
  });

  it("scores near-perfect delivery in the conversational band with no fillers", () => {
    expect(computeDeliveryScore(metrics({ averageWordsPerMinute: 140, fillerWordPercentage: 0 }))).toBe(100);
  });

  it("penalizes fillers linearly (8 pts per percent, split 50/50)", () => {
    // pace 100, filler score 100 - 4*8 = 68 → 0.5*100 + 0.5*68 = 84
    expect(computeDeliveryScore(metrics({ averageWordsPerMinute: 140, fillerWordPercentage: 4 }))).toBe(84);
  });

  it("penalizes pace outside the band but floors the pace component at 40", () => {
    // wpm 220 → pace 100-60=40; filler 0 → 100 → 0.5*40 + 0.5*100 = 70
    expect(computeDeliveryScore(metrics({ averageWordsPerMinute: 220, fillerWordPercentage: 0 }))).toBe(70);
  });

  it("keeps the overall score within 0-100", () => {
    const s = computeDeliveryScore(metrics({ averageWordsPerMinute: 400, fillerWordPercentage: 50 }));
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThanOrEqual(0);
    expect(s!).toBeLessThanOrEqual(100);
  });
});

describe("parseJdFitScore", () => {
  it("extracts the score from the bolded debrief line", () => {
    expect(parseJdFitScore("**JD Fit Score**: 7/10")).toBe(7);
  });

  it("tolerates phrasing and spacing variation", () => {
    expect(parseJdFitScore("JD Fit Score is 9 / 10 for this role")).toBe(9);
    expect(parseJdFitScore("Your JD Fit Score: 10/10 — excellent")).toBe(10);
  });

  it("returns null when absent or malformed", () => {
    expect(parseJdFitScore(null)).toBeNull();
    expect(parseJdFitScore("Overall a strong candidate.")).toBeNull();
    expect(parseJdFitScore("")).toBeNull();
  });
});
