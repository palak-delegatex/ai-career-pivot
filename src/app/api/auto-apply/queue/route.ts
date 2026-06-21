import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const VALID_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
  "applied",
  "skipped",
];

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const status = req.nextUrl.searchParams.get("status");

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from("auto_apply_queue")
    .select("*")
    .eq("user_email", email)
    .order("match_score", { ascending: false });

  if (status && VALID_STATUSES.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
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
    .from("auto_apply_queue")
    .delete()
    .eq("id", id)
    .eq("user_email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
