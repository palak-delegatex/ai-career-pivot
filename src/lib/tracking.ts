import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

// A/B testing — returns the variant name for a PostHog feature flag, or the fallback if not loaded
export function getFeatureFlagVariant(flagKey: string, fallback = "control"): string {
  if (typeof window === "undefined" || !posthog.__loaded) return fallback;
  const variant = posthog.getFeatureFlag(flagKey);
  if (typeof variant === "string") return variant;
  if (variant === true) return "test";
  return fallback;
}

export function trackExperimentViewed(props: { flag: string; variant: string; page: string }) {
  capture("experiment_viewed", props);
}

export function trackExperimentConversion(props: { flag: string; variant: string; event: string; page: string }) {
  capture("experiment_conversion", props);
}

// Onboarding funnel
export function trackOnboardingStarted(props: { has_resume: boolean; has_linkedin: boolean; has_website: boolean; has_location: boolean; has_circumstances: boolean }) {
  capture("onboarding_started", props);
}

export function trackOnboardingCompleted(props: { has_resume: boolean; has_linkedin: boolean; has_website: boolean; skills_count: number }) {
  capture("onboarding_completed", props);
}

export function trackOnboardingError(props: { error: string; stage: string }) {
  capture("onboarding_error", props);
}

export function trackAiInsightsReceived(props: { insights_count: number }) {
  capture("ai_insights_received", props);
}

// Profile review
export function trackProfileReviewed() {
  capture("profile_reviewed");
}

export function trackPlanGenerationStarted(props: { current_title?: string; current_industry?: string; skills_count: number }) {
  capture("plan_generation_started", props);
}

export function trackPlanGenerationCompleted(props: { plans_count: number; has_report_id: boolean }) {
  capture("plan_generation_completed", props);
}

export function trackPlanGenerationError(props: { error: string }) {
  capture("plan_generation_error", props);
}

// Plan selection & PDF
export function trackPlanSelected(props: { plan_index: number; target_role: string; target_industry: string }) {
  capture("plan_selected", props);
}

export function trackPdfDownloadStarted(props: { source: "onboarding" | "report"; target_role?: string }) {
  capture("pdf_download_started", props);
}

export function trackPdfDownloadCompleted(props: { source: "onboarding" | "report"; target_role?: string }) {
  capture("pdf_download_completed", props);
}

export function trackPdfDownloadError(props: { source: "onboarding" | "report"; error: string }) {
  capture("pdf_download_error", props);
}

// Checkout funnel
export function trackCheckoutStarted(props: { plan: string; has_discount: boolean; cta_location?: string }) {
  capture("checkout_started", props);
}

export function trackCheckoutError(props: { plan: string; error: string; attempt?: number; retrying?: boolean }) {
  capture("checkout_error", props);
}

export function trackPaymentVerified(props: { session_id: string }) {
  capture("payment_verified", props);
}

export function trackPaymentVerificationFailed(props: { session_id: string }) {
  capture("payment_verification_failed", props);
}

// CTA clicks
export function trackCtaClicked(props: { cta_text: string; cta_location: string; destination: string }) {
  capture("cta_clicked", props);
}

// CTA hover intent
export function trackCtaHovered(props: { cta_text: string; cta_location: string }) {
  capture("cta_hovered", props);
}

// Scroll depth
export function trackScrollDepth(props: { depth_percent: number; section_visible: string }) {
  capture("scroll_depth", props);
}

// Preview flow
export function trackPreviewStarted(props: { current_role: string; target_role: string }) {
  capture("preview_started", props);
}

export function trackPreviewCompleted(props: { current_role: string; target_role: string; match_score: number }) {
  capture("preview_completed", props);
}

export function trackPreviewCtaClicked(props: { cta_location: string; destination: string }) {
  capture("preview_cta_clicked", props);
}

// Referral
export function trackReferralLinkCopied() {
  capture("referral_link_copied");
}

// Free tier conversion funnel
export function trackFreeSignup(props: { source: string }) {
  capture("free_signup", props);
}

export function trackGateHit(props: { feature: string; plan: string; gate_type: "blocked" | "limit_reached" }) {
  capture("gate_hit", props);
}

export function trackUpgradePromptViewed(props: { feature: string; location: string }) {
  capture("upgrade_prompt_viewed", props);
}

export function trackUpgradePromptClicked(props: { feature: string; location: string; destination: string }) {
  capture("upgrade_prompt_clicked", props);
}

export function trackFreeToPaidConversion(props: { plan: string; source_feature?: string }) {
  capture("free_to_paid_conversion", props);
}

export function trackFreeFeatureUsed(props: { feature: string; usage_count: number; limit: number | null }) {
  capture("free_feature_used", props);
}
