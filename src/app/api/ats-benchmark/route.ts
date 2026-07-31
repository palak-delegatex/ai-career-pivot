import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getAtsBenchmark } from "@/lib/ats-benchmark";

// Honest, DB-sourced ATS-score benchmark (AIC-884 §4). Returns the REAL mean /
// median over the recent `ats_score_samples` window plus a floor-gated
// `primary` anchor the UI can render ("the average user scores X"), or null
// when too few real samples exist (UI then shows no anchor). The distribution
// moves slowly, so a short CDN cache keeps this off the hot path.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseClient();
  const benchmark = await getAtsBenchmark(supabase);
  return NextResponse.json(benchmark, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
  });
}
