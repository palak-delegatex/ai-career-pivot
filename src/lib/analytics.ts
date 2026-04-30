import posthog from "posthog-js";

export function trackFormStarted() {
  posthog.capture("form_started");
}

export function trackFormCompleted(properties?: Record<string, unknown>) {
  posthog.capture("form_completed", properties);
}

export function trackCheckoutStarted(properties?: Record<string, unknown>) {
  posthog.capture("checkout_started", properties);
}

export function trackPurchaseCompleted(properties?: Record<string, unknown>) {
  posthog.capture("purchase_completed", properties);
}
