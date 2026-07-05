"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  trackTourStarted,
  trackTourStepViewed,
  trackTourCompleted,
  trackTourDismissed,
} from "@/lib/tracking";

const DEFAULT_STORAGE_KEY = "tour-completed";
const DEFAULT_TOUR_ID = "onboarding";

export interface TourStep {
  title: string;
  body: string;
  targetSelector?: string;
  cta?: string;
}

const ONBOARDING_STEPS: TourStep[] = [
  {
    title: "Welcome to AICareerPivot 👋",
    body: "We'll analyze your background and create a personalized career transition roadmap in under 5 minutes. Here's how it works:",
  },
  {
    title: "Drop your resume here",
    body: "Our AI reads your resume and pulls out skills, experience, and education — no forms to fill out.",
    targetSelector: 'input[type="file"], [class*="upload"], [class*="dropzone"]',
  },
  {
    title: "Boost with LinkedIn",
    body: "Add your LinkedIn URL for richer data. We'll pull endorsements, recommendations, and connections that strengthen your pivot plan.",
    targetSelector: 'input[name*="linkedin"], input[placeholder*="linkedin"], input[id*="linkedin"]',
  },
  {
    title: "Get Your Roadmap",
    body: "Hit analyze and we'll generate 2-3 personalized career pivot paths with 6-month, 1-year, and 2-year milestones.",
    targetSelector: 'button[type="submit"], button:has(> span)',
    cta: "Got it, let's start!",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface FeatureTourProps {
  /** Ordered steps to walk the user through. Defaults to the onboarding tour. */
  steps?: TourStep[];
  /** localStorage key used to remember that this tour was completed/dismissed. */
  storageKey?: string;
  /** Stable id used in analytics events (tour_started, tour_step_viewed, ...). */
  tourId?: string;
  /** Delay before the tour appears, letting the page settle first. */
  startDelayMs?: number;
}

export function FeatureTour({
  steps = ONBOARDING_STEPS,
  storageKey = DEFAULT_STORAGE_KEY,
  tourId = DEFAULT_TOUR_ID,
  startDelayMs = 800,
}: FeatureTourProps = {}) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (steps.length === 0) return;
    if (localStorage.getItem(storageKey) === "1") return;
    const timer = setTimeout(() => {
      setActive(true);
      trackTourStarted({ tour_id: tourId, total_steps: steps.length });
    }, startDelayMs);
    return () => clearTimeout(timer);
  }, [steps.length, storageKey, tourId, startDelayMs]);

  // Fire a step_viewed event whenever a step becomes visible.
  useEffect(() => {
    if (!active) return;
    const current = steps[step];
    if (current) {
      trackTourStepViewed({ tour_id: tourId, step_index: step, step_title: current.title });
    }
  }, [active, step, steps, tourId]);

  const updateSpotlight = useCallback(() => {
    const currentStep = steps[step];
    if (!currentStep?.targetSelector) {
      setSpotlightRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;
    setSpotlightRect({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  }, [step, steps]);

  useEffect(() => {
    if (!active) return;
    // Defer measurement out of the synchronous effect body to avoid cascading renders.
    const raf = requestAnimationFrame(updateSpotlight);

    const currentStep = steps[step];
    if (currentStep?.targetSelector) {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        observerRef.current?.disconnect();
        const observer = new ResizeObserver(updateSpotlight);
        observer.observe(el);
        observerRef.current = observer;
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      observerRef.current?.disconnect();
    };
  }, [active, step, steps, updateSpotlight]);

  const finish = useCallback(
    (opts: { completed: boolean }) => {
      localStorage.setItem(storageKey, "1");
      if (opts.completed) {
        trackTourCompleted({ tour_id: tourId, total_steps: steps.length });
      } else {
        trackTourDismissed({ tour_id: tourId, step_index: step });
      }
      setActive(false);
      observerRef.current?.disconnect();
    },
    [storageKey, tourId, steps.length, step]
  );

  const next = useCallback(() => {
    if (step >= steps.length - 1) {
      finish({ completed: true });
    } else {
      setStep((s) => s + 1);
    }
  }, [step, steps.length, finish]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  useEffect(() => {
    if (!active) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") finish({ completed: false });
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, next, prev, finish]);

  if (!active) return null;

  const currentStep = steps[step];
  if (!currentStep) return null;
  const isLast = step === steps.length - 1;

  const clipPath = spotlightRect
    ? `polygon(
        0% 0%, 0% 100%,
        ${spotlightRect.left}px 100%,
        ${spotlightRect.left}px ${spotlightRect.top}px,
        ${spotlightRect.left + spotlightRect.width}px ${spotlightRect.top}px,
        ${spotlightRect.left + spotlightRect.width}px ${spotlightRect.top + spotlightRect.height}px,
        ${spotlightRect.left}px ${spotlightRect.top + spotlightRect.height}px,
        ${spotlightRect.left}px 100%,
        100% 100%, 100% 0%
      )`
    : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={clipPath ? { clipPath } : undefined}
          onClick={() => finish({ completed: false })}
        />

        {/* Spotlight glow ring */}
        {spotlightRect && (
          <div
            className="pointer-events-none absolute rounded-xl"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              boxShadow: "0 0 0 4px rgba(20, 184, 166, 0.4)",
            }}
          />
        )}

        {/* Tour card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "absolute max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl",
            spotlightRect
              ? "left-1/2 -translate-x-1/2"
              : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
          style={
            spotlightRect
              ? { top: spotlightRect.top + spotlightRect.height + 16 }
              : undefined
          }
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">
              {currentStep.title}
            </h3>
            <button
              onClick={() => finish({ completed: false })}
              aria-label="Skip tour"
              className="shrink-0 text-xs text-slate-500 hover:text-slate-300"
            >
              Skip
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {currentStep.body}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="text-sm text-slate-400 hover:text-slate-300"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Progress dots */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      i === step ? "bg-teal-400" : "bg-slate-600"
                    )}
                  />
                ))}
              </div>

              <span className="text-xs text-slate-500">
                Step {step + 1} of {steps.length}
              </span>
            </div>

            <button
              onClick={next}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium text-white",
                isLast
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-teal-600 hover:bg-teal-500"
              )}
            >
              {currentStep.cta ?? (isLast ? "Done" : "Next →")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
