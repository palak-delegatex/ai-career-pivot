"use client";

// ReadinessAssessment — the interactive 5-question readiness flow (AIC-1233,
// design AIC-1200 §1.3). Pure client-side scoring (no API round-trip → instant
// results, Doherty Threshold). Free top-of-funnel discovery: NO email gate,
// login, or paywall anywhere in this flow (funnel frozen, AIC-1124).
//
// A shared result URL (`?r=<token>`) skips the questions and renders the result
// directly (spec §1.7) — the token is the 4 privacy-safe dimension scores.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  QUESTIONS,
  emptyAnswers,
  scoreDimensions,
  overallScore,
  tierFor,
  decodeResult,
  type Answers,
  type Dimensions,
} from "@/lib/readiness";
import {
  trackReadinessStarted,
  trackReadinessStep,
  trackReadinessCompleted,
} from "@/lib/tracking";
import ReadinessResult from "@/components/ReadinessResult";

function isAnswered(a: Answers, id: string): boolean {
  if (id === "drivers") return a.drivers.length > 0;
  return Boolean(a[id as keyof Answers]);
}

export default function ReadinessAssessment() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [dir, setDir] = useState(1); // slide direction: 1 forward, -1 back
  const startedFired = useRef(false);
  const completedFired = useRef(false);
  const sourceRef = useRef<string>("direct");

  // Shared-result deep link (?r=) + traffic source (?source=). Read post-mount so
  // the base page stays statically renderable (no useSearchParams Suspense need).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    sourceRef.current = params.get("source") || "direct";
    const token = params.get("r");
    if (token) {
      const decoded = decodeResult(token);
      // Deliberate post-mount setState: the shared-result token lives in the URL,
      // which is unavailable during SSR, so reading it in a lazy initializer would
      // cause a hydration mismatch. This runs once on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (decoded) setDimensions(decoded);
    }
  }, []);

  // Fire completion once whenever a result is shown (finished flow OR ?r= link).
  useEffect(() => {
    if (dimensions && !completedFired.current) {
      completedFired.current = true;
      const score = overallScore(dimensions);
      trackReadinessCompleted({
        score,
        tier: tierFor(score).slug,
        dimensions: { ...dimensions },
      });
    }
  }, [dimensions]);

  const question = QUESTIONS[step];
  const answered = isAnswered(answers, question.id);
  const progress = Math.round(((step + (answered ? 1 : 0)) / QUESTIONS.length) * 100);

  function recordFirstTouch() {
    if (!startedFired.current) {
      startedFired.current = true;
      trackReadinessStarted({ source: sourceRef.current });
    }
  }

  function selectSingle(value: string) {
    recordFirstTouch();
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    trackReadinessStep({ step: step + 1, question_id: question.id, answer_value: value });
  }

  function toggleMulti(value: string) {
    recordFirstTouch();
    setAnswers((prev) => {
      const has = prev.drivers.includes(value);
      let next = has ? prev.drivers.filter((v) => v !== value) : [...prev.drivers, value];
      const max = question.maxSelect ?? next.length;
      if (!has && next.length > max) next = next.slice(next.length - max); // keep most recent
      return { ...prev, drivers: next };
    });
    trackReadinessStep({ step: step + 1, question_id: question.id, answer_value: value });
  }

  function isSelected(optionId: string): boolean {
    if (question.type === "multi") return answers.drivers.includes(optionId);
    return answers[question.id as keyof Answers] === optionId;
  }

  function next() {
    if (!answered) return;
    if (step < QUESTIONS.length - 1) {
      setDir(1);
      setStep((s) => s + 1);
    } else {
      setDimensions(scoreDimensions(answers));
    }
  }

  function back() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function reset() {
    completedFired.current = false;
    setDimensions(null);
    setAnswers(emptyAnswers());
    setStep(0);
    // Strip any ?r= from the URL so a retake starts clean.
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  if (dimensions) {
    return <ReadinessResult dimensions={dimensions} onReset={reset} />;
  }

  const slide = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: dir * 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: dir * -40 },
        transition: { duration: 0.3, ease: "easeOut" as const },
      };

  const optionBase =
    "w-full text-left p-4 rounded-xl border transition-colors min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500";
  const optionOn = "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/30 text-white";
  const optionOff =
    "border-slate-700 bg-slate-800 text-slate-200 hover:border-teal-500/60 hover:bg-slate-800/80";

  return (
    <div className="bg-card border border-slate-700 rounded-2xl p-6 sm:p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            Step {step + 1} of {QUESTIONS.length}
          </span>
          <span className="text-xs tabular-nums text-slate-500">{progress}%</span>
        </div>
        <div
          className="h-1 rounded-full bg-slate-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Assessment progress"
        >
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={question.id} {...slide}>
          <div
            role={question.type === "single" ? "radiogroup" : "group"}
            aria-labelledby={`q-${question.id}-title`}
          >
            <h2 id={`q-${question.id}-title`} className="text-xl font-semibold text-white mb-1">
              {question.title}
            </h2>
            {question.help && <p className="text-sm text-slate-400 mb-4">{question.help}</p>}
            {!question.help && <div className="mb-4" />}

            <div className="space-y-3">
              {question.options.map((opt) => {
                const on = isSelected(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role={question.type === "single" ? "radio" : "checkbox"}
                    aria-checked={on}
                    onClick={() =>
                      question.type === "single" ? selectSingle(opt.id) : toggleMulti(opt.id)
                    }
                    className={`${optionBase} ${on ? optionOn : optionOff}`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center ${
                          question.type === "single" ? "rounded-full" : "rounded-md"
                        } ${on ? "border-teal-400 bg-teal-500/20" : "border-slate-600"}`}
                      >
                        {on && <span className="w-2 h-2 rounded-full bg-teal-400" />}
                      </span>
                      <span className="text-sm sm:text-base">{opt.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 mt-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="px-4 py-2 text-sm text-slate-400 rounded-lg transition-colors hover:text-slate-200 disabled:opacity-0 disabled:cursor-default min-h-[44px]"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!answered}
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {step < QUESTIONS.length - 1 ? "Continue →" : "See my results →"}
        </button>
      </div>
    </div>
  );
}
