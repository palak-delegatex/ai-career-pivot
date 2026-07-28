import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  FREE_USAGE_COOKIE,
  FREE_USAGE_COOKIE_MAX_AGE_S,
  consumeUsage,
  isFreeToolSlug,
  readUsage,
} from "@/lib/free-usage";

/**
 * Free-tier usage meter API (AIC-844).
 *
 * GET  /api/free-usage?tool=<slug>  → read the current period's usage (no mutation)
 * POST /api/free-usage { tool }     → record one use, persist the counter cookie
 *
 * Anonymous per-browser metering backed by a single httpOnly cookie (see
 * src/lib/free-usage.ts for the rationale — no DB migration needed). This is a
 * soft conversion nudge: it never blocks the underlying tool, it only surfaces
 * scarcity + a reset date to drive the upgrade decision.
 */

// Cookie writes make this request-time only; never prerender/cache.
export const dynamic = "force-dynamic";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: FREE_USAGE_COOKIE_MAX_AGE_S,
  };
}

export async function GET(req: NextRequest) {
  const tool = req.nextUrl.searchParams.get("tool") ?? "";
  if (!isFreeToolSlug(tool)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  }
  const store = await cookies();
  const raw = store.get(FREE_USAGE_COOKIE)?.value;
  const state = readUsage(raw, tool, new Date());
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  let body: { tool?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const tool = body.tool ?? "";
  if (!isFreeToolSlug(tool)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  }

  const store = await cookies();
  const raw = store.get(FREE_USAGE_COOKIE)?.value;
  const { state, cookieValue } = consumeUsage(raw, tool, new Date());
  store.set(FREE_USAGE_COOKIE, cookieValue, cookieOptions());
  return NextResponse.json(state);
}
