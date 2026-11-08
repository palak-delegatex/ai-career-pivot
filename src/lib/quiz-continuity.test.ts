// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearQuizContext, consumeQuizContext, storeQuizContext, isCareerQuizResult } from "./quiz-continuity";

const context = { matchedRole: "AI UX Designer", interests: ["design"], timeline: "exploring" };

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("quiz handoff", () => {
  it("carries an explicitly chosen suggestion once", () => {
    storeQuizContext(context);
    expect(consumeQuizContext("?mode=upload&source=career_quiz")).toEqual(context);
    expect(consumeQuizContext("?mode=upload&source=career_quiz")).toBeNull();
  });

  it("does not bias an unrelated article upload, and discards stale context", () => {
    storeQuizContext(context);
    expect(consumeQuizContext("?mode=upload")).toBeNull();
    expect(sessionStorage.getItem("quiz_answers")).toBeNull();
  });

  it("clears an earlier suggestion on a fresh attempt or retake", () => {
    storeQuizContext(context);
    clearQuizContext();
    expect(consumeQuizContext("?source=career_quiz")).toBeNull();
  });

  it("ignores invalid saved JSON and missing role", () => {
    for (const value of ["{", "null", "{}", '{"matchedRole":23}']) {
      sessionStorage.setItem("quiz_answers", value);
      expect(consumeQuizContext("?source=career_quiz")).toBeNull();
    }
  });

  it("works without access to sessionStorage", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => storeQuizContext(context)).not.toThrow();
    expect(() => clearQuizContext()).not.toThrow();
    expect(consumeQuizContext("?source=career_quiz")).toBeNull();
  });

  it("rejects an incomplete or malformed successful response", () => {
    expect(isCareerQuizResult({ matchedRole: "Role" })).toBe(false);
    expect(isCareerQuizResult(null)).toBe(false);
    expect(isCareerQuizResult({ matchedRole: "Role", rationale: "Reason", salaryLow: 1, salaryHigh: 2, salaryDisplay: "$1–2", timelineNote: "Explore", adjacentRoles: [42] })).toBe(false);
  });
});
