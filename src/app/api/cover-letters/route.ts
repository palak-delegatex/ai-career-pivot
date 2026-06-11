import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cover_letters")
    .select("id, title, target_role, target_company, tone, status, created_at, updated_at")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, title, targetRole, targetCompany, jobDescription, tone, content } = body;

  if (!email || !title || !targetRole || !content) {
    return Response.json(
      { error: "email, title, targetRole, and content are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cover_letters")
    .insert({
      email,
      title,
      target_role: targetRole,
      target_company: targetCompany || null,
      job_description: jobDescription || null,
      tone: tone || "professional",
      content,
      status: "ready",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
