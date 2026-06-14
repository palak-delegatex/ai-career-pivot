import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const VALID_TYPES = [
  "meeting",
  "email",
  "message",
  "call",
  "event",
  "note",
] as const;

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const contactId = req.nextUrl.searchParams.get("contactId");

  if (!email || !contactId) {
    return NextResponse.json(
      { error: "email and contactId required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contact_interactions")
    .select("*")
    .eq("contact_id", contactId)
    .eq("user_email", email)
    .order("occurred_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, contactId, type, description, occurred_at } = body;

  if (!email || !contactId || !type) {
    return NextResponse.json(
      { error: "email, contactId, and type required" },
      { status: 400 }
    );
  }

  if (!(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_email", email)
    .single();

  if (!contact) {
    return NextResponse.json({ error: "contact not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("contact_interactions")
    .insert({
      contact_id: contactId,
      user_email: email,
      type,
      description: description ?? "",
      occurred_at: occurred_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interaction: data }, { status: 201 });
}
