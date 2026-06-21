import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import {
  computeDetailedMatchScore,
  sortByMatch,
} from "@/lib/job-match";
import type { EnrichedJob, MatchProfile } from "@/lib/job-match";
import { computeQuickMatchBreakdown } from "@/lib/ai-job-match";
import {
  shouldIncludeJob,
  applyFeedbackBoost,
  buildMatchReasons,
  shouldAutoSubmit,
} from "@/lib/auto-apply";
import type { AutoApplyPreferences, FeedbackEntry } from "@/lib/auto-apply";

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  category?: { tag?: string; label?: string };
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  url: string;
  salary?: string;
  job_type?: string;
  tags?: string[];
  candidate_required_location?: string;
  publication_date?: string;
  description?: string;
  category?: string;
}

async function fetchAdzunaDiscovery(
  query: string,
  location?: string,
  page = 1
): Promise<EnrichedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_API_KEY;
  if (!appId || !appKey) return [];

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    results_per_page: "25",
    sort_by: "date",
    max_days_old: "3",
    "content-type": "application/json",
  });
  if (location) params.set("where", location);

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/us/search/${page}?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).map((j: AdzunaJob) => {
      const salary =
        j.salary_min && j.salary_max
          ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k/yr`
          : j.salary_min
            ? `From $${Math.round(j.salary_min / 1000)}k/yr`
            : undefined;
      const locDisplay = j.location?.display_name ?? "";
      const isRemote =
        /remote/i.test(j.title) ||
        /remote/i.test(locDisplay);

      return {
        id: `adzuna_${j.id}`,
        title: j.title,
        company_name: j.company?.display_name ?? "Unknown",
        url: j.redirect_url,
        salary,
        salary_min: j.salary_min,
        salary_max: j.salary_max,
        job_type: j.contract_type || "Full-time",
        tags: j.category?.tag ? [j.category.tag] : [],
        location: locDisplay,
        publication_date: j.created,
        description_snippet: (j.description || "").slice(0, 200),
        source: "adzuna" as const,
        matchScore: 0,
        matchedSkills: [],
        is_remote: isRemote,
        experience_level: undefined,
      };
    });
  } catch {
    return [];
  }
}

async function fetchRemotiveDiscovery(
  query: string,
  category?: string
): Promise<EnrichedJob[]> {
  try {
    const params = new URLSearchParams({ search: query, limit: "25" });
    if (category) params.set("category", category);
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { jobs: RemotiveJob[] };
    return (data.jobs ?? []).slice(0, 25).map((j) => ({
      id: `remotive_${j.id}`,
      title: j.title,
      company_name: j.company_name,
      url: j.url,
      salary: j.salary || undefined,
      job_type: j.job_type || "Remote",
      tags: (j.tags ?? []).slice(0, 5),
      location: j.candidate_required_location || "Remote",
      publication_date: j.publication_date ?? undefined,
      description_snippet: j.description
        ? j.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
        : undefined,
      source: "remotive" as const,
      matchScore: 0,
      matchedSkills: [],
      is_remote: true,
      experience_level: undefined,
    }));
  } catch {
    return [];
  }
}

function deduplicateJobs(jobs: EnrichedJob[]): EnrichedJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.title.toLowerCase().trim()}::${j.company_name.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const [profileResult, prefsResult, feedbackResult, existingResult] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select(
          "skills, transferable_skills, current_title, years_experience, preferred_locations"
        )
        .eq("email", email)
        .single(),
      supabase
        .from("auto_apply_preferences")
        .select("*")
        .eq("user_email", email)
        .single(),
      supabase
        .from("auto_apply_feedback")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("discovered_jobs")
        .select("url")
        .eq("user_email", email)
        .gte(
          "discovered_at",
          new Date(Date.now() - 7 * 86400000).toISOString()
        ),
    ]);

  const profile = profileResult.data;
  const prefs = prefsResult.data as AutoApplyPreferences | null;
  const feedback = (feedbackResult.data ?? []) as FeedbackEntry[];
  const existingUrls = new Set(
    (existingResult.data ?? []).map((r: { url: string }) => r.url)
  );

  const userSkills: string[] = [
    ...(profile?.skills ?? []),
    ...(profile?.transferable_skills ?? []),
  ];

  const targetRoles: string[] =
    prefs?.target_roles?.length
      ? prefs.target_roles
      : profile?.current_title
        ? [profile.current_title]
        : [];

  if (targetRoles.length === 0) {
    return NextResponse.json(
      { error: "No target roles configured in preferences or profile" },
      { status: 400 }
    );
  }

  const locations: string[] =
    prefs?.preferred_locations?.length ? prefs.preferred_locations : [""];

  const matchProfile: MatchProfile = {
    skills: userSkills,
    targetRole: targetRoles[0],
    preferredLocations: prefs?.preferred_locations,
    remoteOnly: prefs?.remote_only,
    salaryMin: prefs?.salary_min,
    yearsExperience: profile?.years_experience ?? undefined,
  };

  const allJobs: EnrichedJob[] = [];

  const fetchPromises: Promise<EnrichedJob[]>[] = [];
  for (const role of targetRoles.slice(0, 3)) {
    for (const loc of locations.slice(0, 2)) {
      fetchPromises.push(fetchAdzunaDiscovery(role, loc || undefined));
    }
    fetchPromises.push(fetchRemotiveDiscovery(role));
  }

  const results = await Promise.allSettled(fetchPromises);
  for (const r of results) {
    if (r.status === "fulfilled") allJobs.push(...r.value);
  }

  const unique = deduplicateJobs(allJobs).filter((j) => !existingUrls.has(j.url));

  const scored: Array<{
    job: EnrichedJob;
    adjustedScore: number;
    breakdown: { skills: number; role: number; location: number; salary: number; experience: number };
    aiBreakdown: { skills: number; experience: number; education: number; keywords: number; location: number };
    improvements: Array<{ action: string; keyword: string; estimatedImpact: number; priority: string }>;
    matchedSkills: string[];
    reasons: ReturnType<typeof buildMatchReasons>;
  }> = [];

  for (const job of unique) {
    if (prefs) {
      const filter = shouldIncludeJob(
        {
          title: job.title,
          company_name: job.company_name,
          url: job.url,
          location: job.location,
          salary: job.salary,
        },
        prefs
      );
      if (!filter.include) continue;
    }

    const result = computeDetailedMatchScore(job, matchProfile);

    const jobText = [job.title, ...(job.tags ?? []), job.description_snippet ?? ""].join(" ");
    const aiBreakdown = computeQuickMatchBreakdown(userSkills, jobText, {
      yearsExperience: profile?.years_experience ?? undefined,
      education: [],
      location: profile?.preferred_locations?.[0] ?? undefined,
      jobLocation: job.location ?? undefined,
      isRemote: job.is_remote ?? false,
      remotePreferred: prefs?.remote_only ?? false,
    });

    const feedbackBoost =
      applyFeedbackBoost(
        result.score,
        job.company_name,
        job.title,
        feedback
      ) - result.score;

    const adjustedScore = Math.max(
      0,
      Math.min(99, result.score + feedbackBoost)
    );

    const minScore = prefs?.min_match_score ?? 30;
    if (adjustedScore < minScore) continue;

    const titleTokens = new Set(job.title.toLowerCase().split(/\s+/));
    const roleTokens = new Set(targetRoles[0].toLowerCase().split(/\s+/));
    let titleOverlap = false;
    for (const t of roleTokens) {
      if (titleTokens.has(t)) {
        titleOverlap = true;
        break;
      }
    }

    const reasons = buildMatchReasons(
      result.matched,
      userSkills.length,
      titleOverlap,
      feedbackBoost
    );

    const improvements = aiBreakdown.missingFromJd.slice(0, 3).map((kw, i) => ({
      action: `Add "${kw}" to your resume`,
      keyword: kw,
      estimatedImpact: Math.max(2, 6 - i * 2),
      priority: i === 0 ? "high" : "medium",
    }));

    scored.push({
      job: { ...job, matchScore: adjustedScore, matchedSkills: result.matched },
      adjustedScore,
      breakdown: result.breakdown,
      aiBreakdown: aiBreakdown.breakdown,
      improvements,
      matchedSkills: result.matched,
      reasons,
    });
  }

  scored.sort((a, b) => b.adjustedScore - a.adjustedScore);
  const top = scored.slice(0, 50);

  const inserts = top.map(({ job, adjustedScore, breakdown, aiBreakdown, improvements, matchedSkills, reasons }) => ({
    user_email: email,
    job_title: job.title,
    company: job.company_name,
    url: job.url,
    source: job.source,
    location: job.location ?? "",
    salary: job.salary ?? "",
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    job_type: job.job_type ?? "",
    description_snippet: job.description_snippet ?? "",
    tags: job.tags ?? [],
    match_score: adjustedScore,
    matched_skills: matchedSkills,
    match_breakdown: { ...breakdown, ai: aiBreakdown, improvements },
    match_reasons: reasons,
    is_remote: job.is_remote ?? false,
    experience_level: job.experience_level ?? null,
    status: "new",
    discovered_at: new Date().toISOString(),
  }));

  if (inserts.length > 0) {
    const { error } = await supabase
      .from("discovered_jobs")
      .upsert(inserts, {
        onConflict: "user_email,url",
        ignoreDuplicates: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const queueInserts = top
    .filter(({ adjustedScore }) => adjustedScore >= (prefs?.min_match_score ?? 60))
    .slice(0, prefs?.max_daily_applications ?? 10)
    .map(({ job, adjustedScore, matchedSkills, reasons }) => ({
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
      matched_skills: matchedSkills,
      match_reasons: reasons,
      status: prefs && shouldAutoSubmit(adjustedScore, prefs) ? "approved" : "pending_review",
    }));

  if (queueInserts.length > 0) {
    await supabase
      .from("auto_apply_queue")
      .upsert(queueInserts, {
        onConflict: "user_email,url",
        ignoreDuplicates: true,
      });
  }

  return NextResponse.json({
    discovered: unique.length,
    matched: scored.length,
    saved: inserts.length,
    queued: queueInserts.length,
    sources: {
      adzuna: allJobs.filter((j) => j.source === "adzuna").length,
      remotive: allJobs.filter((j) => j.source === "remotive").length,
    },
    topMatches: top.slice(0, 10).map(({ job, adjustedScore, breakdown, aiBreakdown, improvements }) => ({
      title: job.title,
      company: job.company_name,
      score: adjustedScore,
      breakdown,
      aiBreakdown,
      improvements,
      location: job.location,
      salary: job.salary,
      source: job.source,
    })),
  });
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const minScore = parseInt(
    req.nextUrl.searchParams.get("minScore") ?? "0",
    10
  );
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10),
    100
  );

  const supabase = getSupabaseClient();

  let query = supabase
    .from("discovered_jobs")
    .select("*")
    .eq("user_email", email)
    .gte("match_score", minScore)
    .order("match_score", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data ?? [],
    total: (data ?? []).length,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status required" },
      { status: 400 }
    );
  }

  const validStatuses = ["new", "saved", "dismissed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const updates: Record<string, unknown> = { status };
  if (status === "saved") updates.saved_at = new Date().toISOString();
  if (status === "dismissed") updates.dismissed_at = new Date().toISOString();

  const { error } = await supabase
    .from("discovered_jobs")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
