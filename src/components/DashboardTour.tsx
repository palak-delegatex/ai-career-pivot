"use client";

import { FeatureTour, type TourStep } from "@/components/ui/feature-tour";

const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to your dashboard 🎯",
    body: "This is your home base. Everything the AI builds for your career pivot lives here. Let's take 20 seconds to point out the three things worth trying first.",
  },
  {
    title: "Your AI-generated roadmap",
    body: "This is the personalized pivot plan our AI created from your background — milestones for 6 months, 1 year, and 2 years. Check off milestones to track progress and build a streak.",
    targetSelector: '[data-tour="dashboard-roadmap"]',
  },
  {
    title: "AI tools for every step",
    body: "Tailor your resume, score it against a job (ATS), analyze skill gaps, and practice interviews — each tool is powered by AI and tuned to your target role.",
    targetSelector: '[data-tour="dashboard-tools"]',
  },
  {
    title: "Download your plan as a PDF",
    body: "Export your full roadmap and documents as a polished PDF to keep, print, or share. Your reports are saved permanently — come back anytime.",
    targetSelector: '[data-tour="dashboard-pdf"]',
    cta: "Got it — let's go!",
  },
];

/**
 * First-run guided tour for the authenticated dashboard. Highlights the core
 * AI touchpoints (roadmap, AI tools, PDF export) so signed-in users actually
 * invoke them. Fires tour_started / tour_step_viewed / tour_completed events.
 * Shows once per browser (localStorage key "dashboard-tour-completed").
 */
export default function DashboardTour() {
  return (
    <FeatureTour
      steps={DASHBOARD_TOUR_STEPS}
      storageKey="dashboard-tour-completed"
      tourId="dashboard"
      startDelayMs={1000}
    />
  );
}
