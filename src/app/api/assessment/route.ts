import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, assessment } = await req.json();

  if (!email || !assessment) {
    return NextResponse.json({ error: "email and assessment required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({ values_assessment: assessment })
    .eq("email", email);

  if (error) {
    console.error("Assessment save error:", error);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
