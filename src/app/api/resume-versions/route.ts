import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const supabase = getServiceClient();

  let query = supabase
    .from("resume_versions")
    .select("*")
    .eq("email", email)
    .order("updated_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, target_role, target_company, job_description, template, content, enabled_skills, enabled_experience_indices, sections, generated_text, match_score } = body;

  if (!email || !name) {
    return NextResponse.json({ error: "email and name required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resume_versions")
    .insert({
      email,
      name,
      target_role: target_role || null,
      target_company: target_company || null,
      job_description: job_description || null,
      template: template || "professional",
      content: content || {},
      enabled_skills: enabled_skills || [],
      enabled_experience_indices: enabled_experience_indices || [],
      sections: sections || {},
      generated_text: generated_text || null,
      match_score: match_score ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, email, ...updates } = body;

  if (!id || !email) {
    return NextResponse.json({ error: "id and email required" }, { status: 400 });
  }

  const allowedFields = [
    "name", "target_role", "target_company", "job_description",
    "template", "status", "content", "enabled_skills",
    "enabled_experience_indices", "sections", "generated_text", "match_score",
  ];

  const filtered: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) filtered[key] = updates[key];
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("resume_versions")
    .update(filtered)
    .eq("id", id)
    .eq("email", email)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id, email } = body;

  if (!id || !email) {
    return NextResponse.json({ error: "id and email required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("resume_versions")
    .delete()
    .eq("id", id)
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
