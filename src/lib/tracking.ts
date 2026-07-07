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

// `experiment_key` is the canonical, explicitly-named segmentation property for
// A/B events (AIC-740): it mirrors the PostHog feature-flag key so viewed/
// conversion events can be split by experiment once more than one is live. We
// keep the older `flag` property too for continuity with events already ingested.
export function trackExperimentViewed(props: { flag: string; variant: string; page: string }) {
  capture("experiment_viewed", { ...props, experiment_key: props.flag });
}

export function trackExperimentConversion(props: { flag: string; variant: string; event: string; page: string }) {
  capture("experiment_conversion", { ...props, experiment_key: props.flag });
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

// Mid-funnel instrumentation (AIC-742) — the CTA-click → checkout_started leg
// was a black box: 6 cta_clicked but only 1 checkout_started in a week, with no
// events in between to locate the drop-off. These two events make that leg
// observable so the next PostHog review can see where CTA-clickers fall out.
//
// `source` records where the visitor arrived from (an internal path like "/" or
// "/onboarding/plan", or "external"/"direct") so drop-off can be attributed to a
// specific upstream CTA. All events fire client-side through the same anonymous
// distinct_id as cta_clicked / checkout_started, so the funnel stitches without
// any identify() call.
//
// Note: the pricing-page plan-engagement event is intentionally named
// `pricing_plan_selected`, NOT `plan_selected` — the latter already exists
// (trackPlanSelected) for pivot-plan picks on the free results page and carries
// a different shape (plan_index/target_role). Keeping them separate avoids
// mixing two unrelated series in one funnel step.
export function trackPricingViewed(props: { source: string }) {
  capture("pricing_viewed", props);
}

export function trackPricingPlanSelected(props: { plan: string; source: string }) {
  capture("pricing_plan_selected", props);
}

// Best-effort "where did this visitor come from" for mid-funnel events. Returns
// the internal pathname when the referrer is same-origin (which upstream CTA
// landed them here), "external" for off-site referrers, or "direct" when there
// is no referrer. Safe to call during render/effects — guards on window.
export function pageSource(): string {
  if (typeof document === "undefined") return "direct";
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    return url.origin === window.location.origin ? url.pathname : "external";
  } catch {
    return "direct";
  }
}

// Checkout funnel
export function trackCheckoutStarted(props: { plan: string; has_discount: boolean }) {
  capture("checkout_started", props);
}

export function trackCheckoutError(props: { plan: string; error: string; attempt?: number; retrying?: boolean }) {
  capture("checkout_error", props);
}

// The PostHog browser distinct id, so server-side events (the authoritative
// Stripe webhook payment_verified — see api/webhook/stripe) can be attributed to
// the same person who fired checkout_started, keeping the funnel stitched.
// Returns undefined before the SDK loads; the server falls back to email then
// the Stripe session id.
export function getPosthogDistinctId(): string | undefined {
  if (typeof window === "undefined" || !posthog.__loaded) return undefined;
  return posthog.get_distinct_id();
}

// Fired client-side on the success page. The authoritative copy is emitted
// server-side from the Stripe webhook (source: "stripe_webhook"); this one
// (source: "client_success_page") is best-effort and drops silently on adblock,
// redirect failure, or tab-close-after-pay. Filter by `source` to avoid
// double-counting; the webhook copy is the reliable revenue signal.
export function trackPaymentVerified(props: { session_id: string }) {
  capture("payment_verified", { ...props, source: "client_success_page" });
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

// AI feature showcase (pre-signup demo of plan generation / insights / PDF)
export function trackFeatureShowcaseViewed(props: { location: string }) {
  capture("feature_showcase_viewed", props);
}

export function trackFeatureShowcaseTabChanged(props: { tab: "plan" | "insights" | "pdf"; location: string }) {
  capture("feature_showcase_tab_changed", props);
}

export function trackFeatureShowcaseCtaClicked(props: { tab: "plan" | "insights" | "pdf"; location: string; destination: string }) {
  capture("feature_showcase_cta_clicked", props);
}

// Free tier conversion funnel
export function trackFreeSignup(props: { source: string }) {
  capture("free_signup", props);
}

// Guided tour / coach-marks
export function trackTourStarted(props: { tour_id: string; total_steps: number }) {
  capture("tour_started", props);
}

export function trackTourStepViewed(props: { tour_id: string; step_index: number; step_title: string }) {
  capture("tour_step_viewed", props);
}

export function trackTourCompleted(props: { tour_id: string; total_steps: number }) {
  capture("tour_completed", props);
}

export function trackTourDismissed(props: { tour_id: string; step_index: number }) {
  capture("tour_dismissed", props);
}

// Share loop (AIC-688) — measure viral coefficient + channel attribution.
// PostHog's SDK auto-attaches utm_* params to the manual $pageview events we
// fire (see instrumentation-client.ts), so landing attribution needs no extra
// event. These track the outbound share side of the loop.
export function trackContentShareClicked(props: {
  channel: "linkedin" | "x" | "copy";
  content_type: "blog" | "assessment";
  slug?: string;
}) {
  capture("content_share_clicked", props);
}

export function trackAssessmentShared(props: {
  channel: "linkedin" | "x" | "copy";
  score?: number;
}) {
  capture("assessment_shared", props);
}

// Live JD-targeted ATS match scoring (resume tailor) — AIC-735
export function trackLiveMatchScoreUpdated(props: {
  score: number;
  matched: number;
  missing: number;
}) {
  capture("live_match_score_updated", props);
}

export function trackLiveMatchSuggestionInserted(props: {
  keyword: string;
  section: "skills" | "experience" | "summary";
}) {
  capture("live_match_suggestion_inserted", props);
}
