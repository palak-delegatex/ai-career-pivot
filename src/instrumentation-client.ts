import posthog from "posthog-js";
import { safeAnalyticsId, safeAnalyticsUrl, sanitizeAnalyticsProperties } from "./lib/journey-events";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    // Explicit events avoid capturing form input, profiles, callback errors or tokens.
    autocapture: false,
    capture_exceptions: false,
    disable_session_recording: true,
    before_send: event => {
      if (!event) return event;
      event.properties = sanitizeAnalyticsProperties(event.properties);
      return event;
    },
    loaded: client => {
      const id = safeAnalyticsId(client.get_distinct_id());
      if (id && typeof document !== "undefined") {
        document.cookie = "aic_analytics_id=" + encodeURIComponent(id) + "; Path=/; SameSite=Lax; Max-Age=2592000" + (location.protocol === "https:" ? "; Secure" : "");
      }
    },
  });
  if (typeof window !== "undefined") posthog.capture("$pageview", { $current_url: safeAnalyticsUrl(window.location.href) });
}
export function onRouterTransitionStart(url: string) {
  if (token) posthog.capture("$pageview", { $current_url: safeAnalyticsUrl(url) });
}
