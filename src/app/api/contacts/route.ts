import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const VALID_SOURCES = ["manual", "linkedin-import", "ai-suggested"] as const;
const VALID_TIERS = ["strong", "warm", "new", "cold"] as const;

function computeTier(score: number, lastInteractionDays?: number): string {
  if (lastInteractionDays !== undefined && lastInteractionDays > 60) return "cold";
  if (score >= 75) return "strong";
  if (score >= 40) return "warm";
  return "new";
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from("contacts")
    .select("*")
    .eq("user_email", email)
    .order("updated_at", { ascending: false });

  const tier = req.nextUrl.searchParams.get("tier");
  if (tier && (VALID_TIERS as readonly string[]).includes(tier)) {
    query = query.eq("strength_tier", tier);
  }

  const tag = req.nextUrl.searchParams.get("tag");
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const search = req.nextUrl.searchParams.get("q");
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,company.ilike.%${search}%,role.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, ...fields } = body;

  if (!email || !name) {
    return NextResponse.json(
      { error: "email and name required" },
      { status: 400 }
    );
  }

  const source =
    fields.source && (VALID_SOURCES as readonly string[]).includes(fields.source)
      ? fields.source
      : "manual";
  const strengthScore =
    typeof fields.strength_score === "number"
      ? Math.max(0, Math.min(100, fields.strength_score))
      : 0;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_email: email,
      name,
      email: fields.contact_email ?? null,
      linkedin_url: fields.linkedin_url ?? null,
      company: fields.company ?? null,
      role: fields.role ?? null,
      location: fields.location ?? null,
      source,
      strength_score: strengthScore,
      strength_tier: computeTier(strengthScore),
      tags: Array.isArray(fields.tags) ? fields.tags : [],
      notes: fields.notes ?? "",
      how_connected: fields.how_connected ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data }, { status: 201 });
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
  if (typeof updates.name === "string") allowed.name = updates.name;
  if (typeof updates.contact_email === "string")
    allowed.email = updates.contact_email;
  if (typeof updates.linkedin_url === "string")
    allowed.linkedin_url = updates.linkedin_url;
  if (typeof updates.company === "string") allowed.company = updates.company;
  if (typeof updates.role === "string") allowed.role = updates.role;
  if (typeof updates.location === "string") allowed.location = updates.location;
  if (typeof updates.notes === "string") allowed.notes = updates.notes;
  if (Array.isArray(updates.tags)) allowed.tags = updates.tags;
  if (typeof updates.how_connected === "string")
    allowed.how_connected = updates.how_connected;
  if (typeof updates.strength_score === "number") {
    allowed.strength_score = Math.max(0, Math.min(100, updates.strength_score));
    allowed.strength_tier = computeTier(updates.strength_score);
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "no valid fields to update" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .update(allowed)
    .eq("id", id)
    .eq("user_email", email)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact: data });
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
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
