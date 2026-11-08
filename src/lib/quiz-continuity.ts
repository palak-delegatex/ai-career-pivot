import type { CareerQuizResult } from "../app/api/career-quiz/route";

export const QUIZ_UPLOAD_HREF = "/free?mode=upload&source=career_quiz";

export interface QuizContext {
  matchedRole: string;
  interests: string[];
  timeline: string;
}

/** Storage is optional: private browsing must not block a quiz or upload. */
export function clearQuizContext() {
  try {
    sessionStorage.removeItem("quiz_answers");
  } catch { /* unavailable storage is non-fatal */ }
}

export function storeQuizContext(context: QuizContext) {
  try {
    sessionStorage.setItem("quiz_answers", JSON.stringify(context));
  } catch { /* unavailable storage is non-fatal */ }
}

/** Only the explicit quiz handoff can consume a saved suggestion, once. */
export function consumeQuizContext(search: string): QuizContext | null {
  try {
    const raw = sessionStorage.getItem("quiz_answers");
    sessionStorage.removeItem("quiz_answers");
    if (new URLSearchParams(search).get("source") !== "career_quiz" || !raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const context = value as Partial<QuizContext>;
    if (typeof context.matchedRole !== "string" || !context.matchedRole.trim()) return null;
    return {
      matchedRole: context.matchedRole,
      interests: Array.isArray(context.interests) ? context.interests.filter((v): v is string => typeof v === "string") : [],
      timeline: typeof context.timeline === "string" ? context.timeline : "",
    };
  } catch {
    return null;
  }
}

export function isCareerQuizResult(value: unknown): value is CareerQuizResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<CareerQuizResult>;
  return typeof result.matchedRole === "string" && result.matchedRole.trim().length > 0
    && typeof result.rationale === "string"
    && typeof result.salaryLow === "number" && Number.isFinite(result.salaryLow)
    && typeof result.salaryHigh === "number" && Number.isFinite(result.salaryHigh)
    && typeof result.salaryDisplay === "string"
    && typeof result.timelineNote === "string"
    && Array.isArray(result.adjacentRoles) && result.adjacentRoles.every((v) => typeof v === "string");
}
