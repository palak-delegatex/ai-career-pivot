import { PostHog } from "posthog-node";
import { safeAnalyticsId } from "./journey-events";

export async function trackServerJourney(
  event: string,
  distinctId: string | undefined,
  properties: Record<string, string | number | boolean | null> = {},
  insertId?: string,
) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || !safeAnalyticsId(distinctId)) return;
  try {
    const client = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1, fetchRetryCount: 0, requestTimeout: 2000,
    });
    client.capture({ distinctId: distinctId!, event, properties: {
      ...properties, source: "server", ...(insertId ? { $insert_id: insertId } : {}),
    } });
    await client.shutdown();
  } catch {
    // Telemetry is best effort. Never log payloads or affect a customer response.
    console.warn("Journey telemetry unavailable", { event });
  }
}
