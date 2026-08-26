"use client";

import ReactDOM from "react-dom";

// Preconnect to required third-party origins (AIC-1110, Lighthouse "Preconnect
// to required origins"). PostHog fires the entry `$pageview` beacon on first
// load (see instrumentation-client.ts), so the connection to the api host is
// used immediately — warming it early shaves the DNS+TLS handshake off that
// first cross-origin request instead of paying it inline. The assets host
// (lazy-loaded recorder/surveys modules) and Vercel Analytics script only get
// the lighter dns-prefetch hint since they may not fetch on every visit.
//
// Rendered from the root layout. Next 16's Metadata API doesn't expose resource
// hints directly; the sanctioned path is these ReactDOM methods, which React
// hoists into <head> (node_modules/next/dist/docs/.../generate-metadata.md).
export function PreloadResources() {
  const hasPostHog = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (hasPostHog) {
    // Analytics beacons are cross-origin CORS fetches (no credentials), so the
    // warmed socket is only reused when the preconnect is anonymous-CORS.
    ReactDOM.preconnect(apiHost, { crossOrigin: "anonymous" });
    ReactDOM.prefetchDNS("https://us-assets.i.posthog.com");
  }

  // @vercel/analytics loads its script from this origin (see <Analytics /> in
  // the layout). DNS resolution is the cheap, always-safe hint here.
  ReactDOM.prefetchDNS("https://va.vercel-scripts.com");

  return null;
}
