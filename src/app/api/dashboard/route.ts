import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { email }: { email?: string } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const serverSupabase = await getSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  let query = supabase
    .from("reports")
    .select("id, email, profile, plans, created_at, auth_user_id")
    .order("created_at", { ascending: false });

  if (user) {
    query = query.or(`auth_user_id.eq.${user.id},email.eq.${email.toLowerCase().trim()}`);
  } else {
    query = query.eq("email", email.toLowerCase().trim());
  }

  const { data: reports, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }

  return NextResponse.json({ reports: reports ?? [] });
}
