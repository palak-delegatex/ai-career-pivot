interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

const FILLER_PATTERNS = [
  /\bum+\b/i,
  /\bu+h+\b/i,
  /\blike\b/i,
  /\byou know\b/i,
  /\bbasically\b/i,
  /\bactually\b/i,
  /\bliterally\b/i,
  /\bkind of\b/i,
  /\bsort of\b/i,
  /\bi mean\b/i,
  /\bso+\b/i,
  /\bright\b/i,
];

const FILLER_LABELS: Record<string, RegExp> = {
  um: /\bum+\b/i,
  uh: /\bu+h+\b/i,
  like: /\blike\b/i,
  "you know": /\byou know\b/i,
  basically: /\bbasically\b/i,
  actually: /\bactually\b/i,
  literally: /\bliterally\b/i,
  "kind of": /\bkind of\b/i,
  "sort of": /\bsort of\b/i,
  "I mean": /\bi mean\b/i,
  so: /\bso+\b/i,
  right: /\bright\b/i,
};

export interface FillerWordResult {
  word: string;
  count: number;
}

export interface PauseEvent {
  startMs: number;
  durationMs: number;
}

export interface DeliveryMetrics {
  wordsPerMinute: number;
  totalWords: number;
  durationSeconds: number;
  fillerWords: FillerWordResult[];
  fillerRate: number;
  pauses: PauseEvent[];
  averagePauseDurationMs: number;
  longPauseCount: number;
  deliveryScore: number;
  paceLabel: string;
  paceFeedback: string;
  fillerFeedback: string;
  pauseFeedback: string;
}

export function countFillers(transcript: string): FillerWordResult[] {
  const results: FillerWordResult[] = [];
  for (const [word, pattern] of Object.entries(FILLER_LABELS)) {
    const matches = transcript.match(new RegExp(pattern.source, "gi"));
    if (matches && matches.length > 0) {
      results.push({ word, count: matches.length });
    }
  }
  return results.sort((a, b) => b.count - a.count);
}

export function countWords(transcript: string): number {
  return transcript.trim().split(/\s+/).filter(Boolean).length;
}

export function calculateWPM(wordCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((wordCount / durationSeconds) * 60);
}

function getPaceLabel(wpm: number): string {
  if (wpm < 100) return "Too slow";
  if (wpm < 130) return "Slow";
  if (wpm <= 160) return "Ideal";
  if (wpm <= 190) return "Fast";
  return "Too fast";
}

function getPaceFeedback(wpm: number): string {
  if (wpm < 100) return "You're speaking quite slowly. Try to maintain a more natural pace — aim for 130-160 WPM.";
  if (wpm < 130) return "Your pace is a bit slow. Slightly increasing your speed will sound more confident and engaging.";
  if (wpm <= 160) return "Great speaking pace. You're in the ideal range for clear, confident delivery.";
  if (wpm <= 190) return "You're speaking a bit fast. Slowing down slightly will help the interviewer follow your points.";
  return "You're speaking very fast. Take a breath and slow down — your key points may be getting lost.";
}

function getFillerFeedback(fillerRate: number, topFillers: FillerWordResult[]): string {
  if (fillerRate === 0) return "Excellent — no filler words detected. Your speech sounds polished.";
  if (fillerRate < 0.02) return "Very few filler words. Your delivery sounds natural and professional.";
  if (fillerRate < 0.05) {
    const top = topFillers[0]?.word ?? "filler words";
    return `You use "${top}" occasionally. Being conscious of this will make your delivery sharper.`;
  }
  const top = topFillers.slice(0, 2).map((f) => `"${f.word}"`).join(" and ");
  if (fillerRate < 0.08) return `Moderate use of ${top}. Practice pausing instead of filling silence — it projects confidence.`;
  return `High filler word usage (${top}). Try recording yourself and replacing fillers with brief pauses.`;
}

function getPauseFeedback(avgPauseMs: number, longPauseCount: number, durationSeconds: number): string {
  if (durationSeconds < 5) return "Answer too short to analyze pauses.";
  if (longPauseCount === 0 && avgPauseMs < 500) return "Good flow — you maintained steady delivery with natural pauses.";
  if (longPauseCount <= 2) return "A couple of longer pauses, which is natural. Brief pauses between ideas actually help the interviewer follow.";
  if (longPauseCount <= 4) return "Several long pauses detected. Consider structuring your answer before speaking to reduce hesitation.";
  return "Frequent long pauses suggest uncertainty. Practice your STAR stories out loud to build confidence and flow.";
}

function calculateDeliveryScore(wpm: number, fillerRate: number, longPauseCount: number, durationSeconds: number): number {
  let score = 10;

  // Pace scoring (0-3 points deducted)
  if (wpm < 100 || wpm > 190) score -= 3;
  else if (wpm < 130 || wpm > 160) score -= 1;

  // Filler word scoring (0-4 points deducted)
  if (fillerRate >= 0.08) score -= 4;
  else if (fillerRate >= 0.05) score -= 2.5;
  else if (fillerRate >= 0.02) score -= 1;

  // Pause scoring (0-3 points deducted)
  const pausesPerMinute = durationSeconds > 0 ? (longPauseCount / durationSeconds) * 60 : 0;
  if (pausesPerMinute > 6) score -= 3;
  else if (pausesPerMinute > 3) score -= 1.5;
  else if (pausesPerMinute > 1) score -= 0.5;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function analyzeDelivery(
  transcript: string,
  durationSeconds: number,
  pauses: PauseEvent[],
): DeliveryMetrics {
  const totalWords = countWords(transcript);
  const wpm = calculateWPM(totalWords, durationSeconds);
  const fillerWords = countFillers(transcript);
  const totalFillerCount = fillerWords.reduce((sum, f) => sum + f.count, 0);
  const fillerRate = totalWords > 0 ? totalFillerCount / totalWords : 0;
  const longPauses = pauses.filter((p) => p.durationMs >= 2000);
  const avgPauseMs = pauses.length > 0
    ? pauses.reduce((sum, p) => sum + p.durationMs, 0) / pauses.length
    : 0;
  const deliveryScore = calculateDeliveryScore(wpm, fillerRate, longPauses.length, durationSeconds);

  return {
    wordsPerMinute: wpm,
    totalWords,
    durationSeconds,
    fillerWords,
    fillerRate,
    pauses,
    averagePauseDurationMs: Math.round(avgPauseMs),
    longPauseCount: longPauses.length,
    deliveryScore,
    paceLabel: getPaceLabel(wpm),
    paceFeedback: getPaceFeedback(wpm),
    fillerFeedback: getFillerFeedback(fillerRate, fillerWords),
    pauseFeedback: getPauseFeedback(avgPauseMs, longPauses.length, durationSeconds),
  };
}

export function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const recognition: SpeechRecognitionLike = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  return recognition;
}
