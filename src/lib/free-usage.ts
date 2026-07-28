/**
 * Free-tier usage metering (AIC-844 / design AIC-840).
 *
 * Visible metered scarcity — "X of Y free {noun} left this month" — converts
 * better than vague gating (Jobscan "5 scans/mo", Huntr "2 AI resumes lifetime").
 * The free tools are anonymous (no auth), so the counter is stored in a single
 * signed-scope httpOnly cookie rather than a DB row. Production DDL is human-only
 * here, and these limits are a soft conversion nudge — not a hard security gate —
 * so a per-browser cookie is the right level: transparent, resettable, no migration.
 *
 * This module is pure (no `next/headers`) so the period/rollover math is unit
 * testable; the route handler in app/api/free-usage owns the cookie I/O.
 */

export type UsagePeriod = "month" | "day";

export interface ToolLimit {
  /** Free allowance per period. */
  limit: number;
  /** Reset cadence. */
  period: UsagePeriod;
  /** Singular unit shown in the meter copy, e.g. "scan", "letter". */
  noun: string;
}

/**
 * Per-tool free allowances from the AIC-840 design spec. Keys are the tool
 * slugs (matching the route segment / `tool` prop used across tracking).
 */
export const FREE_TOOL_LIMITS = {
  "ats-score": { limit: 3, period: "month", noun: "scan" },
  "cover-letter": { limit: 2, period: "month", noun: "letter" },
  "linkedin-optimizer": { limit: 2, period: "month", noun: "optimization" },
  "resume-generator": { limit: 1, period: "month", noun: "resume" },
  "mock-interview": { limit: 2, period: "month", noun: "session" },
  "gap-analysis": { limit: 1, period: "month", noun: "analysis" },
  "career-coach": { limit: 5, period: "day", noun: "message" },
} as const satisfies Record<string, ToolLimit>;

export type FreeToolSlug = keyof typeof FREE_TOOL_LIMITS;

export function isFreeToolSlug(slug: string): slug is FreeToolSlug {
  return Object.prototype.hasOwnProperty.call(FREE_TOOL_LIMITS, slug);
}

/** Cookie holding the per-tool counters. httpOnly — read only server-side. */
export const FREE_USAGE_COOKIE = "aic_free_usage";

/** Cookie lifetime. Period keys handle resets; this is just a GC backstop. */
export const FREE_USAGE_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 90; // ~90 days

/** Current cookie schema version, so the shape can evolve without misreads. */
const COOKIE_VERSION = 1;

interface ToolCounter {
  /** Uses consumed in the current period. */
  n: number;
  /** Period key the count belongs to (see `periodKey`); stale key ⇒ reset. */
  p: string;
}

interface UsageCookie {
  v: number;
  tools: Record<string, ToolCounter>;
}

/**
 * Stable key identifying the period a count belongs to. When the live key no
 * longer matches the stored one, the allowance has rolled over. UTC so the
 * server and the (display-only) client agree regardless of viewer timezone.
 */
export function periodKey(period: UsagePeriod, now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  if (period === "month") return `${y}-${m}`;
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** ISO timestamp when the current period's allowance resets. */
export function resetsAt(period: UsagePeriod, now: Date): string {
  if (period === "month") {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    ).toISOString();
  }
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  ).toISOString();
}

export interface UsageState {
  tool: FreeToolSlug;
  used: number;
  limit: number;
  remaining: number;
  period: UsagePeriod;
  noun: string;
  resetsAt: string;
}

function emptyCookie(): UsageCookie {
  return { v: COOKIE_VERSION, tools: {} };
}

/** Parse the raw cookie value defensively; malformed input resets to empty. */
export function parseUsageCookie(raw: string | undefined): UsageCookie {
  if (!raw) return emptyCookie();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as UsageCookie).v !== COOKIE_VERSION ||
      typeof (parsed as UsageCookie).tools !== "object"
    ) {
      return emptyCookie();
    }
    return parsed as UsageCookie;
  } catch {
    return emptyCookie();
  }
}

/** Count for a tool in the current period (0 if absent or rolled over). */
function currentCount(
  cookie: UsageCookie,
  tool: FreeToolSlug,
  now: Date,
): number {
  const counter = cookie.tools[tool];
  if (!counter) return 0;
  const { period } = FREE_TOOL_LIMITS[tool];
  return counter.p === periodKey(period, now) ? Math.max(0, counter.n) : 0;
}

function toState(tool: FreeToolSlug, used: number, now: Date): UsageState {
  const { limit, period, noun } = FREE_TOOL_LIMITS[tool];
  const cappedUsed = Math.min(used, limit);
  return {
    tool,
    used: cappedUsed,
    limit,
    remaining: Math.max(0, limit - used),
    period,
    noun,
    resetsAt: resetsAt(period, now),
  };
}

/** Read-only view of a tool's current usage. */
export function readUsage(
  raw: string | undefined,
  tool: FreeToolSlug,
  now: Date,
): UsageState {
  const cookie = parseUsageCookie(raw);
  return toState(tool, currentCount(cookie, tool, now), now);
}

/**
 * Increment a tool's counter for the current period and return the next state
 * plus the serialized cookie value to persist. Never exceeds the limit in the
 * stored count so a depleted meter can't run negative.
 */
export function consumeUsage(
  raw: string | undefined,
  tool: FreeToolSlug,
  now: Date,
): { state: UsageState; cookieValue: string } {
  const cookie = parseUsageCookie(raw);
  const { period, limit } = FREE_TOOL_LIMITS[tool];
  const key = periodKey(period, now);
  const used = currentCount(cookie, tool, now);
  const next = Math.min(used + 1, limit);
  cookie.tools[tool] = { n: next, p: key };
  return {
    state: toState(tool, next, now),
    cookieValue: JSON.stringify(cookie),
  };
}
