// Only bounded, non-personal journey metadata belongs in analytics.
export function safeAnalyticsId(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(value) ? value : undefined;
}

export function safeAnalyticsUrl(value: string): string {
  try {
    const url = new URL(value, "https://ai-career-pivot.com");
    const allowed = new URLSearchParams();
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const v = url.searchParams.get(key);
      if (v && /^[a-zA-Z0-9_ .-]{1,100}$/.test(v)) allowed.set(key, v);
    }
    url.search = allowed.toString();
    url.hash = "";
    return url.toString();
  } catch { return "https://ai-career-pivot.com"; }
}

export function sanitizeAnalyticsProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const privateKeys = /^(email|name|session_id|access_token|refresh_token|code|error_description|current_title|current_industry|current_role|target_role|target_industry|profile|resume|rawSummary)$/i;
  for (const [key, value] of Object.entries(properties)) {
    if (privateKeys.test(key)) continue;
    if (key === "error" && typeof value === "string") result[key] = "request_failed";
    else if (/url|referrer/i.test(key) && typeof value === "string") result[key] = safeAnalyticsUrl(value);
    else if (Array.isArray(value)) result[key] = value.map(item => item && typeof item === "object" ? sanitizeAnalyticsProperties({ item }).item : item);
    else if (value && typeof value === "object") result[key] = sanitizeAnalyticsProperties(value as Record<string, unknown>);
    else result[key] = value;
  }
  return result;
}
