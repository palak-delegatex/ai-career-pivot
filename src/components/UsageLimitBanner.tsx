"use client";

import { AlertTriangle } from "lucide-react";
import type { Feature } from "@/lib/usage-gating";
import { trackUpgradePromptViewed, trackUpgradePromptClicked } from "@/lib/tracking";
import { useEffect } from "react";

const FEATURE_LABELS: Record<Feature, string> = {
  gap_analysis: "Skill Gap Analysis",
  resume_generator: "Resume Generator",
  cover_letter: "Cover Letter",
  learning_resources: "Learning Resources",
  resume_pdf: "PDF Export",
  ats_score: "ATS Score",
  job_tracker: "Job Tracker",
  mock_interview: "Mock Interview",
  skills_assessment: "Skills Assessment",
};

interface UsageLimitBannerProps {
  feature: Feature;
  resetDays: number;
  onUpgrade: () => void;
}

export default function UsageLimitBanner({ feature, resetDays, onUpgrade }: UsageLimitBannerProps) {
  useEffect(() => {
    trackUpgradePromptViewed({ feature, location: "usage_limit_banner" });
  }, [feature]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
        borderRadius: "12px",
      }}
    >
      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-amber-200 font-medium">
          {FEATURE_LABELS[feature]} limit reached
        </p>
        <p className="text-xs text-amber-300/60 mt-0.5">
          Resets in {resetDays} {resetDays === 1 ? "day" : "days"}
        </p>
      </div>
      <button
        onClick={() => {
          trackUpgradePromptClicked({ feature, location: "usage_limit_banner", destination: "/pricing" });
          onUpgrade();
        }}
        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
      >
        Upgrade
      </button>
    </div>
  );
}
