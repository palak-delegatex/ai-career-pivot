import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import type { JobStage, JobSource, JobPriority } from "@/lib/job-tracker";

const VALID_PRIORITIES: JobPriority[] = ["hot", "warm", "cool"];

// Accepts an ISO date (yyyy-mm-dd) or null; anything else is rejected so a bad
// value can't reach the DATE column and 500 the request.
function normalizeDate(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

const VALID_STAGES: JobStage[] = [
  "exploring",
  "applied",
  "interviewing",
  "offer",
  "pivoted",
  "passed",
];

const VALID_SOURCES: JobSource[] = [
  "linkedin",
  "indeed",
  "glassdoor",
  "direct",
  "other",
];

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tracked_jobs")
    .select("*")
    .eq("user_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, role, company, company_color, url, source, stage, match_score, next_action, notes, job_description } = body;

  if (!email || !role || !company) {
    return NextResponse.json({ error: "email, role, company required" }, { status: 400 });
  }

  const validStage = VALID_STAGES.includes(stage) ? stage : "exploring";
  const validSource = VALID_SOURCES.includes(source) ? source : "other";

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("tracked_jobs")
    .insert({
      user_email: email,
      role,
      company,
      company_color: company_color ?? "",
      url: url ?? "",
      source: validSource,
      stage: validStage,
      match_score: typeof match_score === "number" ? match_score : 0,
      next_action: next_action ?? "",
      notes: notes ?? "",
      job_description: typeof job_description === "string" && job_description.trim() ? job_description : null,
      source_type: body.source_type ?? "manual",
      applied_at: validStage !== "exploring" ? now : null,
      stage_changed_at: now,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, email, ...updates } = body;

  if (!id || !email) {
    return NextResponse.json({ error: "id and email required" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  if (updates.stage && VALID_STAGES.includes(updates.stage)) {
    allowed.stage = updates.stage;
    allowed.stage_changed_at = new Date().toISOString();
    if (updates.stage === "applied" && !updates.applied_at) {
      allowed.applied_at = new Date().toISOString();
    }
  }
  if (typeof updates.role === "string") allowed.role = updates.role;
  if (typeof updates.company === "string") allowed.company = updates.company;
  if (typeof updates.url === "string") allowed.url = updates.url;
  if (typeof updates.notes === "string") allowed.notes = updates.notes;
  if (typeof updates.job_description === "string") allowed.job_description = updates.job_description;
  if (typeof updates.next_action === "string") allowed.next_action = updates.next_action;
  if (typeof updates.match_score === "number") allowed.match_score = updates.match_score;
  if (updates.source && VALID_SOURCES.includes(updates.source)) allowed.source = updates.source;
  // next_action_date / priority accept null so the user can clear them (AIC-501).
  if ("next_action_date" in updates) {
    const date = normalizeDate(updates.next_action_date);
    if (date !== undefined) allowed.next_action_date = date;
  }
  if ("priority" in updates) {
    if (updates.priority === null) allowed.priority = null;
    else if (VALID_PRIORITIES.includes(updates.priority)) allowed.priority = updates.priority;
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tracked_jobs")
    .update(allowed)
    .eq("id", id)
    .eq("user_email", email)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data });
}

export async function DELETE(req: NextRequest) {
  const { id, email } = await req.json();

  if (!id || !email) {
    return NextResponse.json({ error: "id and email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("tracked_jobs")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
