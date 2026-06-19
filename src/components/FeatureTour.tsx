"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTourCompleted } from "@/lib/help-state";

// ── Types ───────────────────────────────────────────────────────────────────

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

interface FeatureTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
}

// ── Tour definitions ────────────────────────────────────────────────────────

export const TOURS: Record<string, TourStep[]> = {
  resume: [
    {
      target: "[data-tour='resume-template']",
      title: "Choose a template",
      body: "Pick from 30+ ATS-optimized templates. Each is designed for different industries and experience levels.",
    },
    {
      target: "[data-tour='resume-skills']",
      title: "Select your skills",
      body: "Check the skills that match the job you're targeting. These drive keyword optimization.",
    },
    {
      target: "[data-tour='resume-preview']",
      title: "Live preview",
      body: "See your resume update in real-time as you make changes. The ATS score panel shows your match rate.",
    },
    {
      target: "[data-tour='resume-download']",
      title: "Export your resume",
      body: "Download as PDF or copy the text. Each version is saved automatically for future editing.",
    },
  ],
  "job-tracker": [
    {
      target: "[data-tour='kanban-board']",
      title: "Your application pipeline",
      body: "Drag job cards between columns to track your progress from Saved → Applied → Interview → Offer.",
    },
    {
      target: "[data-tour='add-job']",
      title: "Add a job",
      body: "Paste a job URL or enter details manually. The system auto-extracts company, role, and requirements.",
    },
    {
      target: "[data-tour='job-filters']",
      title: "Filter & sort",
      body: "Use filters to focus on specific statuses, companies, or date ranges.",
    },
  ],
  "mock-interview": [
    {
      target: "[data-tour='interview-type']",
      title: "Choose your format",
      body: "Select behavioral, technical, or case-study interviews tailored to your target role.",
    },
    {
      target: "[data-tour='interview-start']",
      title: "Start practicing",
      body: "The AI interviewer adapts to your answers. Speak naturally — you'll get feedback after each response.",
    },
    {
      target: "[data-tour='interview-feedback']",
      title: "Review your performance",
      body: "After each session, get detailed feedback on content, delivery, and areas to improve.",
    },
  ],
  salary: [
    {
      target: "[data-tour='salary-input']",
      title: "Enter offer details",
      body: "Input your current and offered compensation. Include base, bonus, equity, and benefits for accurate analysis.",
    },
    {
      target: "[data-tour='market-data']",
      title: "Market comparison",
      body: "See how your offer compares to market rates for your role, level, and location.",
    },
    {
      target: "[data-tour='talking-points']",
      title: "Negotiation script",
      body: "Get personalized talking points backed by data. Practice them before your negotiation call.",
    },
  ],
};

// ── Spotlight position ──────────────────────────────────────────────────────

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getSpotlightRect(target: string): SpotlightRect | null {
  const el = document.querySelector(target);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const padding = 8;
  return {
    top: rect.top - padding + window.scrollY,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

// ── Component ───────────────────────────────────────────────────────────────

export function FeatureTour({
  tourId,
  steps,
  onComplete,
  onDismiss,
}: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [completed, setCompleted] = useTourCompleted(tourId);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const timer = setTimeout(() => {
        setSpotlight(getSpotlightRect(step.target));
      }, 300);
      return () => clearTimeout(timer);
    }
    setSpotlight(null);
  }, [step]);

  useEffect(() => {
    const handleResize = () => {
      if (step) setSpotlight(getSpotlightRect(step.target));
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [step]);

  const finish = useCallback(() => {
    setCompleted(true);
    onComplete?.();
  }, [setCompleted, onComplete]);

  const dismiss = useCallback(() => {
    setCompleted(true);
    onDismiss?.();
  }, [setCompleted, onDismiss]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  }, [currentStep, steps.length, finish]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Keyboard navigation + focus trap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          dismiss();
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, dismiss]);

  // Focus trap: keep focus within the tour card
  useEffect(() => {
    cardRef.current?.focus();
  }, [currentStep]);

  if (!mounted || completed) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Card position: below spotlight if room, else above
  const cardStyle: React.CSSProperties = spotlight
    ? {
        position: "absolute",
        top: spotlight.top + spotlight.height + 16,
        left: Math.max(
          16,
          Math.min(
            spotlight.left,
            (typeof window !== "undefined" ? window.innerWidth : 800) - 340
          )
        ),
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return mounted
    ? createPortal(
        <div
          className="tour-overlay fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={`Tour step ${currentStep + 1} of ${steps.length}`}
        >
          {/* Overlay with spotlight cutout via CSS */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={dismiss}
            aria-hidden="true"
            style={
              spotlight
                ? {
                    clipPath: `polygon(
                    0% 0%, 0% 100%, ${spotlight.left}px 100%, ${spotlight.left}px ${spotlight.top}px,
                    ${spotlight.left + spotlight.width}px ${spotlight.top}px,
                    ${spotlight.left + spotlight.width}px ${spotlight.top + spotlight.height}px,
                    ${spotlight.left}px ${spotlight.top + spotlight.height}px,
                    ${spotlight.left}px 100%, 100% 100%, 100% 0%
                  )`,
                  }
                : undefined
            }
          />

          {/* Spotlight border glow */}
          {spotlight && (
            <div
              className="pointer-events-none absolute rounded-lg ring-2 ring-primary/50"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }}
            />
          )}

          {/* Tour card */}
          <div
            ref={cardRef}
            tabIndex={-1}
            className="w-80 rounded-lg border border-border bg-card p-4 shadow-xl focus:outline-none"
            style={cardStyle}
          >
            {/* Progress bar */}
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h3 className="mt-1 text-sm font-medium text-foreground">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={dismiss}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Close tour"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {step.body}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="size-3.5" />
                Back
              </Button>
              <Button variant="default" size="sm" onClick={next} className="gap-1">
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && (
                  <ChevronRight className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
}
