import { NextRequest, NextResponse } from "next/server";
import { hasPaidAccess } from "@/lib/entitlement";
import { buildReportTeaser } from "@/lib/report-teaser";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";

// Locked paid-report teaser (AIC-874 §1, parent AIC-871).
//
// Returns the PII-free teaser payload (section titles/counts + personalized
// salary & timeline) that the free-snapshot surface renders as blurred/locked
// cards, plus `unlocked` from the server-side entitlement check (orders.status
// = 'paid'), mirroring the warm-intro paywall (AIC-769/772). The teaser is
// metadata only — it carries NO report body — so paid content cannot leak to the
// client regardless of `unlocked`; the flag only tells the UI whether to render
// the locked (blur) affordance or a "view your report" one. The full report
// itself stays gated at generation time by /api/intake/plan's Stripe check.

export async function POST(req: NextRequest) {
  let body: { snapshot?: FreeSnapshot; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
  }

  const snapshot = body?.snapshot;
  if (!snapshot || !Array.isArray(snapshot.paths) || snapshot.paths.length === 0) {
    return NextResponse.json({ error: "snapshot with at least one path is required" }, { status: 400 });
  }

  const email = body?.email?.trim();
  // Only paid callers get the unlocked affordance. Absent/empty email = free.
  const unlocked = email ? await hasPaidAccess(email) : false;

  return NextResponse.json({
    unlocked,
    teaser: buildReportTeaser(snapshot),
  });
}
