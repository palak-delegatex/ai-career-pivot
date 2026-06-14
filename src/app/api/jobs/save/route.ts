import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { email, job } = await req.json();

    if (!email || !job?.title) {
      return NextResponse.json({ error: "email and job.title required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tracked_jobs")
      .upsert(
        {
          user_email: email,
          title: job.title,
          company: job.company || "Unknown",
          url: job.url || "",
          location: job.location || "",
          salary: job.salary || null,
          status: "saved",
          source: job.source || "chrome-extension",
          match_score: job.matchScore || null,
          notes: job.notes || "",
        },
        { onConflict: "user_email,url" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ saved: true, job: data });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}
