// Honest, DB-sourced ATS-score benchmark (AIC-884 §4, parent AIC-881).
//
// The Designer's live-score surface wants a real target-anchor — "the average
// user scores X" — so a visitor sees where they stand and has something to beat.
// The one hard rule (the exact defect AIC-862 fixed): NEVER a hardcoded or
// invented number. This reads the REAL distribution of scores stored in
// `ats_score_samples` (written best-effort by /api/ats-gamified) through the
// `get_ats_score_benchmark` aggregate, and only surfaces an anchor once enough
// real samples exist. Below the floor, a small sample would be noisy and
// possibly misleading, so we surface nothing and the UI shows no anchor — a
// missing anchor is always safer than a fabricated one.

import type { SupabaseClient } from "@supabase/supabase-js";

// Below this many real samples the mean is too noisy to anchor against, so we
// withhold it. Tuned conservatively — one atypical résumé shouldn't move a
// number we present as "the average user".
const SAMPLE_FLOOR = 30;

// Must match the aggregate function's default window. Kept explicit so the
// window we advertise ("recent users") is the window we actually query.
const WINDOW_DAYS = 90;

export interface AtsBenchmark {
  /** Real number of samples in the window backing this benchmark. */
  sampleCount: number;
  /** Real mean score (0-100), or null when below the sample floor. */
  averageScore: number | null;
  /** Real median score (0-100), or null when below the sample floor. */
  medianScore: number | null;
  /**
   * The anchor the UI should render, or null when the sample floor isn't met
   * (UI then shows no benchmark). Uses the mean — the intuitive "average user".
   */
  primary: { value: number; label: string; kind: "average" } | null;
}

const EMPTY: AtsBenchmark = {
  sampleCount: 0,
  averageScore: null,
  medianScore: null,
  primary: null,
};

/**
 * Compute the honest ATS-score benchmark from the live `ats_score_samples`
 * distribution via the `get_ats_score_benchmark` aggregate.
 *
 * On any query error we degrade to the empty/null benchmark rather than
 * surfacing a wrong number — a missing anchor is always safer than a fabricated
 * one (cf. AIC-860/862). `windowDays` is injectable for tests/tuning.
 */
export async function getAtsBenchmark(
  supabase: SupabaseClient,
  windowDays: number = WINDOW_DAYS
): Promise<AtsBenchmark> {
  let row: { sample_count: number; avg_score: number | null; median_score: number | null } | undefined;
  try {
    const { data, error } = await supabase.rpc("get_ats_score_benchmark", {
      window_days: windowDays,
    });
    if (error) throw new Error(error.message);
    // The set-returning function comes back as a single-row array.
    row = Array.isArray(data) ? data[0] : data;
  } catch {
    return EMPTY;
  }

  if (!row) return EMPTY;

  const sampleCount = Number(row.sample_count ?? 0);
  const averageScore =
    row.avg_score == null ? null : Math.round(Number(row.avg_score));
  const medianScore =
    row.median_score == null ? null : Math.round(Number(row.median_score));

  const primary =
    sampleCount >= SAMPLE_FLOOR && averageScore != null
      ? {
          value: averageScore,
          label: "the average score for recent résumés we've checked",
          kind: "average" as const,
        }
      : null;

  return { sampleCount, averageScore, medianScore, primary };
}

/**
 * Best-effort persist of one score sample. Fire-and-forget from the scoring
 * route: it must NEVER block or fail the user's scoring response, so all errors
 * are swallowed. A dropped sample only means the benchmark converges slightly
 * slower — never a wrong number. Scores outside 0-100 are ignored defensively
 * (the column also CHECK-constrains them).
 */
export async function recordAtsScoreSample(
  supabase: SupabaseClient,
  score: number
): Promise<void> {
  const rounded = Math.round(score);
  if (!Number.isFinite(rounded) || rounded < 0 || rounded > 100) return;
  try {
    await supabase.from("ats_score_samples").insert({ score: rounded });
  } catch {
    // Intentionally swallowed — see doc comment.
  }
}
