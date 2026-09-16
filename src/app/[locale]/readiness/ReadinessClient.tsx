"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import {
  trackReadinessStarted,
  trackReadinessCompleted,
  trackReadinessShared,
} from "@/lib/tracking";

/**
 * /readiness — AI Career Pivot Readiness assessment (AIC-1233 / AIC-1200 spec).
 *
 * A third zero-signup "taste" alongside /quiz (AIC-833). Where the quiz matches
 * you to a role, this scores how READY you are to make the move: 5 questions →
 * an honest 0–100 readiness score, a tier, and 3 concrete next steps. The whole
 * thing runs client-side — there is no API call, no email gate, and no upsell on
 * the result. Per AIC-1124 the conversion funnel is FROZEN, so this is pure
 * discovery/GEO: a shareable score card is the only "action". Do not add a gate
 * or a pricing CTA to the result view without unfreezing the funnel first.
 *
 * Scoring: each of the 5 questions offers 4 options worth 0 / 6 / 13 / 20
 * points, so the total lands in [0, 100]. Tiers bucket the total. The weights
 * and next-steps are intentionally transparent (see the FAQ + the "how it's
 * scored" note) — no hidden model, nothing to unlock.
 */

const STEPS = ["AI tools", "Skills", "Proof", "Time", "Runway"];

type Option = { label: string; points: number };
type Question = { id: string; prompt: string; help?: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: "ai_tools",
    prompt: "How comfortable are you with AI tools today?",
    options: [
      { label: "I've never really used them", points: 0 },
      { label: "I've tried ChatGPT a few times", points: 6 },
      { label: "I use AI tools most weeks", points: 13 },
      { label: "I build or automate with AI regularly", points: 20 },
    ],
  },
  {
    id: "skills",
    prompt: "How much of your current work involves data, systems, or structured problem-solving?",
    options: [
      { label: "Almost none", points: 0 },
      { label: "A little — occasionally", points: 6 },
      { label: "A meaningful part of my role", points: 13 },
      { label: "It's the core of what I do", points: 20 },
    ],
  },
  {
    id: "proof",
    prompt: "Do you have shareable proof of AI-adjacent work?",
    help: "A project, a portfolio, a write-up, a certificate — anything public.",
    options: [
      { label: "Nothing yet", points: 0 },
      { label: "One small thing I could show", points: 6 },
      { label: "A few projects or a certificate", points: 13 },
      { label: "A public portfolio or shipped work", points: 20 },
    ],
  },
  {
    id: "time",
    prompt: "How many hours a week can you invest in the pivot right now?",
    options: [
      { label: "Under 2 hours", points: 0 },
      { label: "2–5 hours", points: 6 },
      { label: "5–10 hours", points: 13 },
      { label: "10+ hours", points: 20 },
    ],
  },
  {
    id: "runway",
    prompt: "How's your financial runway and support network for a transition?",
    help: "Savings, a stable income while you learn, or people already in AI-adjacent roles.",
    options: [
      { label: "Very tight — I can't take risks", points: 0 },
      { label: "Some cushion, no real network", points: 6 },
      { label: "Comfortable runway or a few contacts", points: 13 },
      { label: "Strong runway and a warm network", points: 20 },
    ],
  },
];

const MAX_SCORE = QUESTIONS.length * 20; // 100

type Tier = {
  id: string;
  name: string;
  min: number;
  tagline: string;
  ring: string; // stroke color for the score ring
  steps: string[];
};

// Tiers are ordered high→low so `tierFor` returns the first match.
const TIERS: Tier[] = [
  {
    id: "pivot_ready",
    name: "Pivot-ready",
    min: 70,
    tagline:
      "You have the tools, the time, and the runway. The gap now is momentum, not readiness — start shipping proof.",
    ring: "#34d399",
    steps: [
      "Pick one AI-adjacent target role and reverse-engineer 3 real job posts for it.",
      "Ship one small public project that mirrors that role this month.",
      "Reach out to 3 people already in the role for a 15-minute reality check.",
    ],
  },
  {
    id: "building_momentum",
    name: "Building momentum",
    min: 40,
    tagline:
      "You've got real foundations. Close one or two gaps — usually proof or dedicated time — and you're ready to move.",
    ring: "#2dd4bf",
    steps: [
      "Block a recurring 3–5 hours a week and protect it like a meeting.",
      "Turn something you already do into one shareable AI-assisted project.",
      "Map your current skills against a target role to see the real gap.",
    ],
  },
  {
    id: "early_explorer",
    name: "Early explorer",
    min: 0,
    tagline:
      "You're at the start — and that's fine. Build fluency and a little runway first, then the pivot gets much easier.",
    ring: "#38bdf8",
    steps: [
      "Spend 20 minutes a day using an AI tool on real tasks to build fluency.",
      "Take one free foundational AI or data course to anchor the basics.",
      "Explore which AI-adjacent roles actually fit your background before committing.",
    ],
  },
];

function tierFor(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / MAX_SCORE));
  const offset = circumference - pct * circumference;
  return (
    <div className="relative w-40 h-40 flex-shrink-0" role="img" aria-label={`Readiness score ${score} out of 100`}>
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} stroke="#334155" strokeWidth="10" fill="none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white leading-none">{score}</span>
        <span className="text-xs uppercase tracking-wide text-slate-400 mt-1">/ 100</span>
      </div>
    </div>
  );
}

export default function ReadinessClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    const source =
      new URLSearchParams(window.location.search).get("source") || "readiness_page";
    trackReadinessStarted({ source });
  }, []);

  const currentQ = QUESTIONS[step];
  const canAdvance = currentQ ? answers[currentQ.id] !== undefined : false;

  const score = useMemo(
    () => QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0),
    [answers]
  );
  const tier = tierFor(score);

  function choose(qid: string, points: number) {
    setAnswers((prev) => ({ ...prev, [qid]: points }));
  }

  function handleSubmit() {
    const finalScore = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const finalTier = tierFor(finalScore);
    trackReadinessCompleted({ score: finalScore, tier: finalTier.id });
    setSubmitted(true);
  }

  async function handleShare() {
    const t = tierFor(score);
    const shareText = `I scored ${score}/100 — "${t.name}" — on the AI Career Pivot Readiness check. See where you land:`;
    const shareUrl = "https://ai-career-pivot.com/readiness";
    // Prefer the native share sheet (mobile); fall back to copying the link.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AI Career Pivot Readiness", text: shareText, url: shareUrl });
        trackReadinessShared({ score, tier: t.id, method: "web_share" });
        return;
      } catch {
        /* user dismissed the share sheet — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setShareNote("Copied — paste it anywhere.");
      trackReadinessShared({ score, tier: t.id, method: "copy_link" });
    } catch {
      setShareNote("Copy this link: ai-career-pivot.com/readiness");
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setSubmitted(false);
    setShareNote("");
  }

  // ── Result view ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        {/* The shareable score card. `id` targets are the speakable selectors. */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 sm:p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold font-mono mb-6">
            AI Career Pivot Readiness
          </div>

          <div className="flex justify-center mb-6">
            <ScoreRing score={score} color={tier.ring} />
          </div>

          <h2 id="readiness-tier" className="text-2xl font-bold text-white mb-3">
            {tier.name}
          </h2>
          <p id="readiness-summary" className="text-slate-300 leading-relaxed mb-6">
            {tier.tagline}
          </p>

          <div className="text-left rounded-xl bg-slate-900/50 border border-slate-700 p-5 mb-6">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">
              Your next 3 moves
            </div>
            <ol className="space-y-3">
              {tier.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600/20 border border-teal-600/40 text-teal-300 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="block w-full px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors min-h-[44px]"
          >
            Share my score
          </button>
          {shareNote && (
            <p className="mt-3 text-sm text-teal-300" role="status">
              {shareNote}
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Scored transparently: 5 questions, 0–20 points each. No login, no email — this is a
            free self-check, not a verdict.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={reset}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ↺ Retake
          </button>
          <Link href="/quiz" className="text-sm text-teal-400 hover:text-teal-300 font-medium">
            Not sure which role? Take the 30-sec quiz →
          </Link>
        </div>
      </div>
    );
  }

  // ── Assessment view ────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4 font-mono">
          Free · No signup needed
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight font-serif">
          How ready are you to pivot into AI?
        </h1>
        <p className="text-slate-400 leading-relaxed">
          Five quick questions — no resume, no email. Get an honest readiness score and your next
          three moves.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6 min-h-[18rem]">
        <div className="text-lg font-semibold text-white mb-1">{currentQ.prompt}</div>
        {currentQ.help && <p className="text-sm text-slate-400 mb-4">{currentQ.help}</p>}
        <div className={`grid gap-3 ${currentQ.help ? "mt-2" : "mt-4"}`}>
          {currentQ.options.map((o) => {
            const on = answers[currentQ.id] === o.points;
            return (
              <button
                key={o.label}
                type="button"
                onClick={() => choose(currentQ.id, o.points)}
                aria-pressed={on}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors min-h-[44px] ${
                  on
                    ? "bg-teal-600/20 border-teal-500 text-teal-200"
                    : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-teal-600"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium transition-colors hover:border-slate-500 disabled:opacity-0 disabled:cursor-default min-h-[44px]"
        >
          ← Back
        </button>

        {step < QUESTIONS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canAdvance}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            See my score →
          </button>
        )}
      </div>
    </div>
  );
}
