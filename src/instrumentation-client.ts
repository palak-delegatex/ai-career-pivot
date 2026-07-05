import posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (token) {
  posthog.init(token, {
    api_host: host ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });

  // Capture the initial landing pageview. `onRouterTransitionStart` only fires
  // on client-side router transitions (push/replace/traverse) — NOT on the
  // first hard load — so without this the entry pageview is never sent. That
  // entry URL is the one carrying utm_* params from external links (LinkedIn /
  // Reddit / X / Google), which is how PostHog derives session channel + UTM
  // attribution. Firing it here (while window.location still has the query
  // string) is what makes the AIC-439 distribution measurable at all, and
  // ensures single-page bounces from shared links aren't invisible.
  if (typeof window !== "undefined") {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }
}

export function onRouterTransitionStart(url: string) {
  if (token) {
    posthog.capture("$pageview", { $current_url: url });
  }
}
