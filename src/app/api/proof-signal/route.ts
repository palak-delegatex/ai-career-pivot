import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getHonestProofSignal } from "@/lib/honest-proof";

// Honest, DB-sourced social-proof signal (AIC-874 secondary). Returns REAL
// plan_leads counts + a floor-gated `primary` the UI can render, or null when
// nothing clears its floor (UI then falls back to capability signals). Short
// CDN cache keeps this off the hot path — the count changes slowly.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseClient();
  const signal = await getHonestProofSignal(supabase);
  return NextResponse.json(signal, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
  });
}
