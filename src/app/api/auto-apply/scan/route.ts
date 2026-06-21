import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { computeMatchScore } from "@/lib/job-match";
import {
  shouldIncludeJob,
  applyFeedbackBoost,
  buildMatchReasons,
  shouldAutoSubmit,
} from "@/lib/auto-apply";
import type { AutoApplyPreferences, FeedbackEntry } from "@/lib/auto-apply";
import type { EnrichedJob } from "@/lib/job-match";

async function fetchJobsForRole(
  role: string,
  location: string,
  skills: string[]
): Promise<EnrichedJob[]> {
  const params = new URLSearchParams({ role });
  if (location) params.set("location", location);
  if (skills.length > 0) params.set("skills", skills.slice(0, 15).join(","));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/jobs?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.jobs ?? [];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const { data: prefs } = await supabase
    .from("auto_apply_preferences")
    .select("*")
    .eq("user_email", email)
    .single();

  if (!prefs) {
    return NextResponse.json(
      { error: "Set up auto-apply preferences first" },
      { status: 400 }
    );
  }

  const preferences = prefs as AutoApplyPreferences;

  if (!preferences.enabled) {
    return NextResponse.json(
      { error: "Auto-apply is disabled" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("skills, target_role")
    .eq("email", email)
    .single();

  const userSkills: string[] = profile?.skills ?? [];
  const targetRole: string = profile?.target_role ?? "";

  const { data: feedbackRows } = await supabase
    .from("auto_apply_feedback")
    .select("*")
    .eq("user_email", email)
    .order("created_at", { ascending: false })
    .limit(100);

  const feedback = (feedbackRows ?? []) as FeedbackEntry[];

  const { data: existingUrls } = await supabase
    .from("auto_apply_queue")
    .select("url")
    .eq("user_email", email);

  const seenUrls = new Set((existingUrls ?? []).map((r: { url: string }) => r.url));

  const roles = preferences.target_roles.length > 0
    ? preferences.target_roles
    : targetRole
      ? [targetRole]
      : [];

  if (roles.length === 0) {
    return NextResponse.json(
      { error: "No target roles configured" },
      { status: 400 }
    );
  }

  const locations = preferences.preferred_locations.length > 0
    ? preferences.preferred_locations
    : [""];

  const allJobs: EnrichedJob[] = [];
  for (const role of roles.slice(0, 3)) {
    for (const loc of locations.slice(0, 2)) {
      const jobs = await fetchJobsForRole(role, loc, userSkills);
      allJobs.push(...jobs);
    }
  }

  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((j) => {
    const key = `${j.title.toLowerCase()}::${j.company_name.toLowerCase()}`;
    if (seen.has(key) || seenUrls.has(j.url)) return false;
    seen.add(key);
    return true;
  });

  const candidates: Array<{
    job: EnrichedJob;
    adjustedScore: number;
    reasons: ReturnType<typeof buildMatchReasons>;
  }> = [];

  for (const job of uniqueJobs) {
    const filterResult = shouldIncludeJob(
      {
        title: job.title,
        company_name: job.company_name,
        url: job.url,
        location: job.location,
        salary: job.salary,
      },
      preferences
    );

    if (!filterResult.include) continue;

    const { score: baseScore, matched } = computeMatchScore(
      job,
      userSkills,
      roles[0]
    );

    const feedbackBoost =
      applyFeedbackBoost(baseScore, job.company_name, job.title, feedback) -
      baseScore;

    const adjustedScore = Math.max(
      0,
      Math.min(99, baseScore + feedbackBoost)
    );

    if (adjustedScore < preferences.min_match_score) continue;

    const titleTokens = new Set(job.title.toLowerCase().split(/\s+/));
    const roleTokens = new Set(roles[0].toLowerCase().split(/\s+/));
    let titleOverlap = false;
    for (const t of roleTokens) {
      if (titleTokens.has(t)) {
        titleOverlap = true;
        break;
      }
    }

    const reasons = buildMatchReasons(
      matched,
      userSkills.length,
      titleOverlap,
      feedbackBoost
    );

    candidates.push({ job, adjustedScore, reasons });
  }

  candidates.sort((a, b) => b.adjustedScore - a.adjustedScore);
  const top = candidates.slice(0, preferences.max_daily_applications);

  let autoSubmitted = 0;

  const inserts = top.map(({ job, adjustedScore, reasons }) => {
    const autoSubmit = shouldAutoSubmit(adjustedScore, preferences);
    if (autoSubmit) autoSubmitted++;

    return {
      user_email: email,
      job_title: job.title,
      company: job.company_name,
      url: job.url,
      source: job.source,
      location: job.location ?? "",
      salary: job.salary ?? "",
      job_type: job.job_type ?? "",
      description_snippet: job.description_snippet ?? "",
      tags: job.tags ?? [],
      match_score: adjustedScore,
      matched_skills: job.matchedSkills,
      match_reasons: reasons,
      status: autoSubmit ? "approved" : "pending_review",
    };
  });

  if (inserts.length > 0) {
    const { error } = await supabase
      .from("auto_apply_queue")
      .upsert(inserts, { onConflict: "user_email,url", ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (autoSubmitted > 0) {
      const logInserts = inserts
        .filter((i) => i.status === "approved")
        .map((i) => ({
          user_email: email,
          queue_item_id: "",
          action: "auto_submitted",
          job_title: i.job_title,
          company: i.company,
          details: `Auto-submitted with ${i.match_score}% match (threshold: ${preferences.auto_submit_threshold ?? 80}%)`,
        }));

      await supabase.from("auto_apply_log").insert(logInserts);
    }
  }

  return NextResponse.json({
    scanned: uniqueJobs.length,
    matched: candidates.length,
    queued: inserts.length,
    autoSubmitted,
  });
}
