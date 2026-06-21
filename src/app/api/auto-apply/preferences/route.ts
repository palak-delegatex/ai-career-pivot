import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("auto_apply_preferences")
    .select("*")
    .eq("user_email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: data ?? null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, ...prefs } = body;

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const row: Record<string, unknown> = { user_email: email, updated_at: new Date().toISOString() };
  if (typeof prefs.enabled === "boolean") row.enabled = prefs.enabled;
  if (Array.isArray(prefs.target_roles)) row.target_roles = prefs.target_roles;
  if (Array.isArray(prefs.preferred_locations)) row.preferred_locations = prefs.preferred_locations;
  if (typeof prefs.remote_only === "boolean") row.remote_only = prefs.remote_only;
  if (typeof prefs.min_match_score === "number") row.min_match_score = prefs.min_match_score;
  if (typeof prefs.salary_min === "number") row.salary_min = prefs.salary_min;
  if (Array.isArray(prefs.excluded_companies)) row.excluded_companies = prefs.excluded_companies;
  if (Array.isArray(prefs.excluded_keywords)) row.excluded_keywords = prefs.excluded_keywords;
  if (typeof prefs.max_daily_applications === "number") row.max_daily_applications = Math.min(prefs.max_daily_applications, 10);
  if (Array.isArray(prefs.sources)) row.sources = prefs.sources;
  if (typeof prefs.skip_2fa_sites === "boolean") row.skip_2fa_sites = prefs.skip_2fa_sites;
  if (typeof prefs.apply_mode === "string" && ["review_first", "auto_submit", "hybrid"].includes(prefs.apply_mode)) row.apply_mode = prefs.apply_mode;
  if (typeof prefs.auto_submit_threshold === "number") row.auto_submit_threshold = Math.max(50, Math.min(99, prefs.auto_submit_threshold));
  if (typeof prefs.customize_resume === "boolean") row.customize_resume = prefs.customize_resume;
  if (typeof prefs.generate_cover_letter === "boolean") row.generate_cover_letter = prefs.generate_cover_letter;

  const { data, error } = await supabase
    .from("auto_apply_preferences")
    .upsert(row, { onConflict: "user_email" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
