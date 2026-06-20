import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

interface FeedEvent {
  id: string;
  type: "job_saved" | "job_applied" | "job_stage_change" | "resume_created" | "resume_updated" | "milestone_completed" | "badge_earned";
  description: string;
  timestamp: string;
  link?: string;
  meta?: Record<string, string>;
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 20), 50);

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const cutoff = cursor || new Date(Date.now() + 86400000).toISOString();
  const events: FeedEvent[] = [];

  const [jobsResult, resumesResult, milestonesResult, badgesResult] = await Promise.all([
    supabase
      .from("tracked_jobs")
      .select("id, role, company, stage, stage_history, created_at, stage_changed_at")
      .eq("user_email", email)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(limit * 2),

    supabase
      .from("resume_versions")
      .select("id, name, target_role, created_at, updated_at")
      .eq("email", email)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(limit),

    supabase
      .from("milestone_progress")
      .select("phase, milestone_index, completed, completed_at, report_id")
      .eq("completed", true)
      .not("completed_at", "is", null)
      .lt("completed_at", cutoff)
      .order("completed_at", { ascending: false })
      .limit(limit),

    supabase
      .from("badges_earned")
      .select("badge_key, earned_at, report_id")
      .lt("earned_at", cutoff)
      .order("earned_at", { ascending: false })
      .limit(limit),
  ]);

  if (jobsResult.data) {
    for (const job of jobsResult.data) {
      events.push({
        id: `job-save-${job.id}`,
        type: job.stage === "saved" ? "job_saved" : "job_applied",
        description: job.stage === "saved"
          ? `Saved ${job.role} at ${job.company}`
          : `Applied to ${job.role} at ${job.company}`,
        timestamp: job.created_at,
        link: "/job-tracker",
        meta: { company: job.company, role: job.role },
      });

      if (Array.isArray(job.stage_history)) {
        for (const entry of job.stage_history) {
          const e = entry as { from: string; to: string; at: string };
          if (e.at < cutoff) {
            const stageLabels: Record<string, string> = {
              saved: "Saved",
              applied: "Applied",
              phone_screen: "Phone Screen",
              interview: "Interview",
              offer: "Offer",
              rejected: "Rejected",
            };
            events.push({
              id: `job-stage-${job.id}-${e.at}`,
              type: "job_stage_change",
              description: `${job.role} at ${job.company} moved to ${stageLabels[e.to] ?? e.to}`,
              timestamp: e.at,
              link: "/job-tracker",
              meta: { company: job.company, stage: e.to },
            });
          }
        }
      }
    }
  }

  if (resumesResult.data) {
    for (const rv of resumesResult.data) {
      const isUpdate = rv.updated_at && rv.updated_at !== rv.created_at &&
        new Date(rv.updated_at).getTime() - new Date(rv.created_at).getTime() > 60000;
      events.push({
        id: `resume-${rv.id}`,
        type: isUpdate ? "resume_updated" : "resume_created",
        description: isUpdate
          ? `Updated resume "${rv.name}"${rv.target_role ? ` for ${rv.target_role}` : ""}`
          : `Created resume "${rv.name}"${rv.target_role ? ` targeting ${rv.target_role}` : ""}`,
        timestamp: isUpdate ? rv.updated_at : rv.created_at,
        link: "/dashboard?tab=resumes",
      });
    }
  }

  if (milestonesResult.data) {
    const phaseLabels: Record<string, string> = {
      "6mo": "6-Month",
      "1yr": "1-Year",
      "2yr": "2-Year",
    };
    for (const m of milestonesResult.data) {
      events.push({
        id: `milestone-${m.report_id}-${m.phase}-${m.milestone_index}`,
        type: "milestone_completed",
        description: `Completed ${phaseLabels[m.phase] ?? m.phase} milestone #${m.milestone_index + 1}`,
        timestamp: m.completed_at!,
        link: "/dashboard",
      });
    }
  }

  if (badgesResult.data) {
    const badgeNames: Record<string, string> = {
      first_step: "First Step",
      phase_complete: "Phase Complete",
      streak_master: "Streak Master",
      halfway_there: "Halfway There",
      career_ready: "Career Ready",
    };
    for (const b of badgesResult.data) {
      events.push({
        id: `badge-${b.report_id}-${b.badge_key}`,
        type: "badge_earned",
        description: `Earned "${badgeNames[b.badge_key] ?? b.badge_key}" badge`,
        timestamp: b.earned_at,
        link: "/dashboard",
      });
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const grouped = groupEvents(events);
  const page = grouped.slice(0, limit);
  const nextCursor = page.length >= limit ? page[page.length - 1].timestamp : null;

  return NextResponse.json({ events: page, nextCursor });
}

function groupEvents(events: FeedEvent[]): FeedEvent[] {
  const result: FeedEvent[] = [];
  let i = 0;

  while (i < events.length) {
    const current = events[i];
    const group = [current];
    let j = i + 1;

    while (j < events.length) {
      const next = events[j];
      if (next.type !== current.type) { j++; continue; }
      const timeDiff = Math.abs(
        new Date(current.timestamp).getTime() - new Date(next.timestamp).getTime()
      );
      if (timeDiff > 3600000) break;
      group.push(next);
      j++;
    }

    if (group.length > 1 && (current.type === "job_saved" || current.type === "job_applied")) {
      const verb = current.type === "job_saved" ? "Saved" : "Applied to";
      result.push({
        ...current,
        id: `group-${current.id}`,
        description: `${verb} ${group.length} jobs`,
      });
      for (const g of group) {
        events.splice(events.indexOf(g), 1);
      }
    } else {
      result.push(current);
      events.splice(i, 1);
    }
  }

  return result;
}
