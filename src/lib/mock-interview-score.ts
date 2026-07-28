// AIC-828: deterministic scoring for saved mock-interview sessions. We keep this
// out of the LLM hot loop so a session's numbers are reproducible and trendable
// across time — the debrief text stays qualitative, these numbers are stable.

export interface AggregateSpeechMetrics {
  totalAnswers: number;
  totalDurationSeconds: number;
  totalWords: number;
  averageWordsPerMinute: number;
  totalFillerWords: number;
  fillerWordPercentage: number;
  topFillers: { word: string; count: number }[];
}

// A persisted session row (mirrors the interview_sessions table).
export interface InterviewSession {
  id: string;
  target_role: string;
  interview_type: string | null;
  input_mode: "text" | "voice";
  questions_answered: number | null;
  filler_count: number | null;
  filler_pct: number | null;
  wpm: number | null;
  duration_seconds: number | null;
  overall_score: number | null;
  jd_fit_score: number | null;
  created_at: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Pace sub-score: full marks inside the 120-160 wpm "conversational" band, with
// a linear falloff on either side that bottoms out (never below 40) so a single
// rushed answer can't zero the whole delivery score.
function paceScore(wpm: number): number {
  if (wpm <= 0) return 0;
  if (wpm >= 120 && wpm <= 160) return 100;
  const distance = wpm < 120 ? 120 - wpm : wpm - 160;
  return clamp(100 - distance, 40, 100);
}

// Filler sub-score: every 1% of filler words costs 8 points. ~2% reads as
// polished, ~6%+ as noticeably distracting, which maps to a ~50 here.
function fillerScore(fillerPct: number): number {
  return clamp(100 - fillerPct * 8, 0, 100);
}

// Overall delivery score (0-100) — an even blend of pacing and filler control.
// Returns null when there's no speech data to score (text-mode interviews).
export function computeDeliveryScore(metrics: AggregateSpeechMetrics | null | undefined): number | null {
  if (!metrics || metrics.totalWords <= 0) return null;
  const score = 0.5 * paceScore(metrics.averageWordsPerMinute) + 0.5 * fillerScore(metrics.fillerWordPercentage);
  return Math.round(score);
}

// The debrief prompt emits "**JD Fit Score**: X/10" when a job description was
// provided. Pull that number back out so it can be trended; tolerant of the
// bold markers, spacing and phrasing the model varies between runs.
export function parseJdFitScore(feedbackText: string | null | undefined): number | null {
  if (!feedbackText) return null;
  const match = feedbackText.match(/JD Fit Score[^0-9]{0,20}?(\d{1,2})\s*\/\s*10/i);
  if (!match) return null;
  const score = parseInt(match[1], 10);
  return Number.isFinite(score) ? clamp(score, 0, 10) : null;
}
