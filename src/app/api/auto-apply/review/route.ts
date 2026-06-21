import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const VALID_ACTIONS = ["approved", "rejected", "skipped", "irrelevant"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, id, action, reason } = body;

  if (!email || !id || !action) {
    return NextResponse.json(
      { error: "email, id, action required" },
      { status: 400 }
    );
  }

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data: item } = await supabase
    .from("auto_apply_queue")
    .select("*")
    .eq("id", id)
    .eq("user_email", email)
    .single();

  if (!item) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }

  const newStatus = action === "irrelevant" ? "rejected" : action;

  const { error: updateError } = await supabase
    .from("auto_apply_queue")
    .update({
      status: newStatus,
      feedback: reason ?? "",
      reviewed_at: now,
    })
    .eq("id", id)
    .eq("user_email", email);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: feedbackError } = await supabase
    .from("auto_apply_feedback")
    .insert({
      user_email: email,
      queue_item_id: id,
      action,
      reason: reason ?? "",
      job_title: item.job_title,
      company: item.company,
      match_score: item.match_score,
    });

  if (feedbackError) {
    console.error("Failed to log feedback:", feedbackError.message);
  }

  if (action === "approved") {
    const { error: trackerError } = await supabase
      .from("tracked_jobs")
      .upsert(
        {
          user_email: email,
          role: item.job_title,
          company: item.company,
          url: item.url,
          source: item.source === "jsearch" || item.source === "adzuna" || item.source === "remotive" ? "other" : item.source,
          stage: "saved",
          match_score: item.match_score,
          salary_range: item.salary,
          location: item.location,
          notes: "Added via Smart Auto-Apply",
        },
        { onConflict: "user_email,url", ignoreDuplicates: true }
      );

    if (trackerError) {
      console.error("Failed to add to tracker:", trackerError.message);
    }
  }

  return NextResponse.json({ ok: true, status: newStatus });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { email, ids, action, reason } = body;

  if (!email || !Array.isArray(ids) || ids.length === 0 || !action) {
    return NextResponse.json(
      { error: "email, ids[], action required" },
      { status: 400 }
    );
  }

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const newStatus = action === "irrelevant" ? "rejected" : action;

  const { data: items } = await supabase
    .from("auto_apply_queue")
    .select("*")
    .in("id", ids)
    .eq("user_email", email);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "no items found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("auto_apply_queue")
    .update({
      status: newStatus,
      feedback: reason ?? "",
      reviewed_at: now,
    })
    .in("id", ids)
    .eq("user_email", email);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const feedbackInserts = items.map((item) => ({
    user_email: email,
    queue_item_id: item.id,
    action,
    reason: reason ?? "",
    job_title: item.job_title,
    company: item.company,
    match_score: item.match_score,
  }));

  await supabase.from("auto_apply_feedback").insert(feedbackInserts);

  if (action === "approved") {
    const trackerInserts = items.map((item) => ({
      user_email: email,
      role: item.job_title,
      company: item.company,
      url: item.url,
      source: ["jsearch", "adzuna", "remotive"].includes(item.source) ? "other" : item.source,
      stage: "saved",
      match_score: item.match_score,
      salary_range: item.salary,
      location: item.location,
      notes: "Added via Smart Auto-Apply",
    }));

    await supabase
      .from("tracked_jobs")
      .upsert(trackerInserts, { onConflict: "user_email,url", ignoreDuplicates: true });
  }

  return NextResponse.json({ ok: true, count: items.length, status: newStatus });
}
