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
}

export function onRouterTransitionStart(url: string) {
  if (token) {
    posthog.capture("$pageview", { $current_url: url });
  }
}
