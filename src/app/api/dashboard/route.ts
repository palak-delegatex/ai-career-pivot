import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const auth = await getSupabaseServerClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your reports." }, { status: 401 });
    const db = getSupabaseAdmin();
    const fields = "id,email,profile,plans,created_at,auth_user_id";
    const [owned, legacy] = await Promise.all([
      db.from("reports").select(fields).eq("auth_user_id", user.id),
      user.email ? db.from("reports").select(fields).is("auth_user_id", null).eq("email", user.email.toLowerCase()) : Promise.resolve({ data: [], error: null }),
    ]);
    if (owned.error || legacy.error) throw new Error("report_read_failed");
    const reports = [...owned.data ?? [], ...legacy.data ?? []]
      .filter(r => Array.isArray(r.plans) && r.plans.length)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Reports are temporarily unavailable." }, { status: 503 }); }
}
