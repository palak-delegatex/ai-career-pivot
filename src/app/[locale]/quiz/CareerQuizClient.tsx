"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { StepIndicator } from "@/components/StepIndicator";
import {
  trackCareerQuizStarted,
  trackCareerQuizCompleted,
  trackCareerQuizToFree,
} from "@/lib/tracking";
import type { CareerQuizResult } from "@/app/api/career-quiz/route";

/**
 * Path B — 30-second anonymous career quiz (AIC-833 / AIC-825).
 *
 * The second zero-signup "taste": 4 quick questions (role / experience /
 * interests / timeline) → an instant AI-adjacent role match with a 1-sentence
 * rationale and a public-data salary range. Like Path A, the PERSONALIZED match
 * score is left LOCKED behind a resume upload (the "?" is deliberate —
 * Zeigarnik / Goal-Gradient), and the CTA bridges into the existing free-upload
 * (or pricing) flow.
 */

const STEPS = ["Role", "Experience", "Interests", "Timeline"];

const ROLE_OPTIONS = [
  "Marketing",
  "Sales",
  "Operations",
  "Customer Support",
  "Software Engineering",
  "Data / Analytics",
  "Design",
  "Product",
  "Finance / Accounting",
  "Teaching / Education",
  "Project / Program Management",
  "Consulting",
  "Healthcare",
  "Recruiting / HR",
  "Writing / Content",
  "Student",
  "Other",
];

const YEARS_CHOICES: { id: string; label: string }[] = [
  { id: "0-2", label: "0–2 years" },
  { id: "3-5", label: "3–5 years" },
  { id: "6-10", label: "6–10 years" },
  { id: "10+", label: "10+ years" },
];

const INTEREST_CHOICES: { id: string; label: string; emoji: string }[] = [
  { id: "build", label: "Building & coding", emoji: "🛠️" },
  { id: "data", label: "Data & analytics", emoji: "📊" },
  { id: "product", label: "Product & strategy", emoji: "🧭" },
  { id: "design", label: "Design & UX", emoji: "🎨" },
  { id: "writing", label: "Writing & content", emoji: "✍️" },
  { id: "customers", label: "Working with people", emoji: "🤝" },
  { id: "ops", label: "Operations & process", emoji: "⚙️" },
  { id: "research", label: "Research & experiments", emoji: "🔬" },
];

const TIMELINE_CHOICES: { id: string; label: string }[] = [
  { id: "asap", label: "ASAP" },
  { id: "3-6mo", label: "3–6 months" },
  { id: "6-12mo", label: "6–12 months" },
  { id: "exploring", label: "Just exploring" },
];

// Locked teaser ring — reuses the /free-results score-ring visual language, but
// the value is a pulsing "?" (the score unlocks after a resume upload).
function LockedScoreRing() {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  // Decorative ~62% teal arc so the ring reads as "almost there" without
  // implying an actual computed score.
  const offset = circumference - 0.62 * circumference;
  return (
    <div className="relative w-20 h-20 flex-shrink-0" aria-label="Your match score is locked" role="img">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} stroke="#334155" strokeWidth="6" fill="none" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke="#2dd4bf"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.55}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-teal-400 motion-safe:animate-pulse">?</span>
      </div>
    </div>
  );
}

export default function CareerQuizClient() {
  const [step, setStep] = useState(0);
  const [currentRole, setCurrentRole] = useState("");
  const [years, setYears] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [timeline, setTimeline] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CareerQuizResult | null>(null);

  // Fire the entry event once on load — counts everyone who reaches the quiz,
  // finished or not. Source comes from the deep-link (?source=…), else the page.
  useEffect(() => {
    const source =
      new URLSearchParams(window.location.search).get("source") || "quiz_page";
    trackCareerQuizStarted({ source });
  }, []);

  const canAdvance = useMemo(() => {
    if (step === 0) return currentRole !== "";
    if (step === 1) return years !== "";
    if (step === 2) return interests.length > 0;
    if (step === 3) return timeline !== "";
    return false;
  }, [step, currentRole, years, interests, timeline]);

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (loading) return;
    trackCareerQuizCompleted({ current_role: currentRole, timeline, interests });
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/career-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentRole, years, interests, timeline }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't build your match. Please try again.");
      setResult(data as CareerQuizResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setCurrentRole("");
    setYears("");
    setInterests([]);
    setTimeline("");
    setResult(null);
    setError("");
  }

  // ── Result view ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold font-mono">
            Your AI-adjacent match
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
          <div className="flex items-center gap-4 mb-4">
            <LockedScoreRing />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-0.5">
                Top match
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">{result.matchedRole}</h2>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-5">{result.rationale}</p>

          {/* Salary-range indicator — public 2026 market data, shown as a range. */}
          <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-4 mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                Typical US pay range
              </span>
              <span className="text-base font-bold text-emerald-300">{result.salaryDisplay}</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-slate-600 to-emerald-500 overflow-hidden" />
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-slate-500">${result.salaryLow}k</span>
              <span className="text-[11px] text-slate-500">public 2026 market data</span>
              <span className="text-[11px] text-slate-500">${result.salaryHigh}k</span>
            </div>
          </div>

          {result.adjacentRoles.length > 0 && (
            <div className="mb-5">
              <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
                Also a fit
              </div>
              <div className="flex flex-wrap gap-2">
                {result.adjacentRoles.map((r) => (
                  <span
                    key={r}
                    className="px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-xs text-slate-300"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-teal-950/40 border border-teal-700/40 px-4 py-4 text-center">
            <p className="text-sm text-slate-300 mb-4">{result.timelineNote}</p>
            <Link
              href="/free?mode=upload"
              onClick={() => trackCareerQuizToFree({ matched_role: result.matchedRole })}
              className="block w-full px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors min-h-[44px]"
            >
              Get your full personalized roadmap →
            </Link>
            <Link
              href="/pricing"
              onClick={() => trackCareerQuizToFree({ matched_role: result.matchedRole })}
              className="inline-block mt-3 text-sm text-teal-400 hover:text-teal-300 font-medium"
            >
              See plans & pricing
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mx-auto mt-6 block text-sm text-slate-400 hover:text-slate-200"
        >
          ↺ Retake the quiz
        </button>
      </div>
    );
  }

  // ── Quiz view ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4 font-mono">
          Free · No signup needed
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight font-serif">
          Find your AI-adjacent role in 30 seconds
        </h1>
        <p className="text-slate-400 leading-relaxed">
          Four quick questions — no resume, no email. See where your background fits in AI.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6 min-h-[16rem]">
        {step === 0 && (
          <div>
            <label className="block text-lg font-semibold text-white mb-4" htmlFor="quiz-role">
              What&apos;s your current role?
            </label>
            <select
              id="quiz-role"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 min-h-[44px]"
            >
              <option value="" disabled>
                Select your role…
              </option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="text-lg font-semibold text-white mb-4">How much experience do you have?</div>
            <div className="grid grid-cols-2 gap-3">
              {YEARS_CHOICES.map((y) => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => setYears(y.id)}
                  aria-pressed={years === y.id}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors min-h-[44px] ${
                    years === y.id
                      ? "bg-teal-600 border-teal-500 text-white"
                      : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-teal-600"
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-lg font-semibold text-white mb-1">What kind of work pulls you in?</div>
            <p className="text-sm text-slate-400 mb-4">Pick all that apply.</p>
            <div className="grid grid-cols-2 gap-3">
              {INTEREST_CHOICES.map((c) => {
                const on = interests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleInterest(c.id)}
                    aria-pressed={on}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium text-left transition-colors min-h-[44px] ${
                      on
                        ? "bg-teal-600/20 border-teal-500 text-teal-200"
                        : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-teal-600"
                    }`}
                  >
                    <span aria-hidden="true">{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-lg font-semibold text-white mb-4">When do you want to make the move?</div>
            <div className="grid grid-cols-2 gap-3">
              {TIMELINE_CHOICES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeline(t.id)}
                  aria-pressed={timeline === t.id}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors min-h-[44px] ${
                    timeline === t.id
                      ? "bg-teal-600 border-teal-500 text-white"
                      : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-teal-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
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

        {step < STEPS.length - 1 ? (
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
            disabled={!canAdvance || loading}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
                Matching…
              </span>
            ) : (
              "See my match →"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
