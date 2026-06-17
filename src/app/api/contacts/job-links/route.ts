import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const VALID_ROLES = [
  "referrer",
  "hiring_manager",
  "recruiter",
  "interviewer",
  "insider",
] as const;

const VALID_REFERRAL_STATUSES = [
  "none",
  "requested",
  "submitted",
  "accepted",
  "declined",
] as const;

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const contactId = req.nextUrl.searchParams.get("contactId");
  const jobId = req.nextUrl.searchParams.get("jobId");

  let query = supabase
    .from("contact_job_links")
    .select("*, contacts(id, name, company, role, strength_tier), jobs(id, role, company, stage)")
    .eq("user_email", email)
    .order("created_at", { ascending: false });

  if (contactId) query = query.eq("contact_id", contactId);
  if (jobId) query = query.eq("job_id", jobId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, contactId, jobId, role, referral_status, notes } = body;

  if (!email || !contactId || !jobId || !role) {
    return NextResponse.json(
      { error: "email, contactId, jobId, and role required" },
      { status: 400 }
    );
  }

  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  const status =
    referral_status &&
    (VALID_REFERRAL_STATUSES as readonly string[]).includes(referral_status)
      ? referral_status
      : "none";

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("contact_job_links")
    .insert({
      user_email: email,
      contact_id: contactId,
      job_id: jobId,
      role,
      referral_status: status,
      notes: notes ?? "",
    })
    .select("*, contacts(id, name, company, role, strength_tier), jobs(id, role, company, stage)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, email, ...updates } = body;

  if (!id || !email) {
    return NextResponse.json(
      { error: "id and email required" },
      { status: 400 }
    );
  }

  const allowed: Record<string, unknown> = {};

  if (
    typeof updates.role === "string" &&
    (VALID_ROLES as readonly string[]).includes(updates.role)
  ) {
    allowed.role = updates.role;
  }

  if (
    typeof updates.referral_status === "string" &&
    (VALID_REFERRAL_STATUSES as readonly string[]).includes(
      updates.referral_status
    )
  ) {
    allowed.referral_status = updates.referral_status;
  }

  if (typeof updates.notes === "string") allowed.notes = updates.notes;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "no valid fields to update" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contact_job_links")
    .update(allowed)
    .eq("id", id)
    .eq("user_email", email)
    .select("*, contacts(id, name, company, role, strength_tier), jobs(id, role, company, stage)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ link: data });
}

export async function DELETE(req: NextRequest) {
  const { id, email } = await req.json();

  if (!id || !email) {
    return NextResponse.json(
      { error: "id and email required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("contact_job_links")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
