"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// posthog is initialized in instrumentation-client.ts (Next.js 16+ pattern)
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
    return <>{children}</>;
  }
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
