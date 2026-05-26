import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
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
export function trackCheckoutStarted(props: { plan: string; has_discount: boolean }) {
  capture("checkout_started", props);
}

export function trackCheckoutError(props: { plan: string; error: string }) {
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

// Referral
export function trackReferralLinkCopied() {
  capture("referral_link_copied");
}
