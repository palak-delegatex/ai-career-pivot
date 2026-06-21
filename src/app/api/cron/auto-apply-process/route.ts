import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { SOURCE_RATE_LIMITS } from "@/lib/auto-apply";
import type { AutoApplyPreferences } from "@/lib/auto-apply";

export const maxDuration = 120;

async function generateCoverLetter(
  profile: { name?: string; skills?: string[]; current_title?: string; raw_summary?: string },
  job: { job_title: string; company: string; description_snippet: string; matched_skills: string[] }
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const res = await fetch(`${baseUrl}/api/resume-generator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "cover-letter",
      targetRole: job.job_title,
      jobDescription: job.description_snippet,
      tone: "professional",
      keyPoints: job.matched_skills.slice(0, 5),
      profile: {
        name: profile.name ?? "",
        currentTitle: profile.current_title ?? "",
        skills: profile.skills ?? [],
      },
    }),
  });

  if (!res.ok) return "";

  const text = await res.text();
  return text.slice(0, 5000);
}

async function tailorResumeKeywords(
  userSkills: string[],
  matchedSkills: string[],
  jobTitle: string,
  descriptionSnippet: string
): Promise<string[]> {
  const jobText = `${jobTitle} ${descriptionSnippet}`.toLowerCase();
  const prioritized = [
    ...matchedSkills,
    ...userSkills.filter(
      (s) => !matchedSkills.includes(s) && jobText.includes(s.toLowerCase())
    ),
  ];
  return [...new Set(prioritized)].slice(0, 15);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: users } = await supabase
    .from("auto_apply_preferences")
    .select("user_email, max_daily_applications, customize_resume, generate_cover_letter")
    .eq("enabled", true)
    .limit(100);

  if (!users?.length) {
    return NextResponse.json({ processed: 0, message: "No active users" });
  }

  let totalProcessed = 0;
  let totalCoverLetters = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { count: appliedToday } = await supabase
        .from("auto_apply_queue")
        .select("id", { count: "exact", head: true })
        .eq("user_email", user.user_email)
        .eq("status", "applied")
        .gte("applied_at", todayStart.toISOString());

      const remaining = (user.max_daily_applications ?? 5) - (appliedToday ?? 0);
      if (remaining <= 0) continue;

      const { data: approved } = await supabase
        .from("auto_apply_queue")
        .select("*")
        .eq("user_email", user.user_email)
        .eq("status", "approved")
        .order("match_score", { ascending: false })
        .limit(remaining);

      if (!approved?.length) continue;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("skills, transferable_skills, current_title, raw_summary, name")
        .eq("email", user.user_email)
        .single();

      const userSkills = [...(profile?.skills ?? []), ...(profile?.transferable_skills ?? [])];
      const sourceCount: Record<string, number> = {};

      for (const item of approved) {
        const source = item.source ?? "unknown";
        const limit = SOURCE_RATE_LIMITS[source];
        sourceCount[source] = (sourceCount[source] ?? 0) + 1;

        if (limit && sourceCount[source] > limit.maxPerHour) continue;
        if (limit?.delayMs && sourceCount[source] > 1) {
          await new Promise((r) => setTimeout(r, limit.delayMs));
        }

        let coverLetterId: string | null = null;

        if (user.generate_cover_letter !== false) {
          const coverText = await generateCoverLetter(
            { name: profile?.name, skills: userSkills, current_title: profile?.current_title, raw_summary: profile?.raw_summary },
            { job_title: item.job_title, company: item.company, description_snippet: item.description_snippet ?? "", matched_skills: item.matched_skills ?? [] }
          );

          if (coverText) {
            const { data: cl } = await supabase
              .from("cover_letters")
              .insert({
                email: user.user_email,
                title: `Cover Letter — ${item.job_title} at ${item.company}`,
                target_role: item.job_title,
                target_company: item.company,
                job_description: item.description_snippet,
                tone: "professional",
                content: coverText,
                status: "ready",
              })
              .select("id")
              .single();

            coverLetterId = cl?.id ?? null;
            if (coverLetterId) totalCoverLetters++;
          }
        }

        let tailoredKeywords: string[] = [];
        if (user.customize_resume !== false) {
          tailoredKeywords = await tailorResumeKeywords(
            userSkills,
            item.matched_skills ?? [],
            item.job_title,
            item.description_snippet ?? ""
          );
        }

        const now = new Date().toISOString();

        await supabase
          .from("auto_apply_queue")
          .update({
            status: "applied",
            applied_at: now,
            cover_letter_id: coverLetterId,
            feedback: tailoredKeywords.length > 0
              ? `Tailored keywords: ${tailoredKeywords.join(", ")}`
              : "",
          })
          .eq("id", item.id)
          .eq("user_email", user.user_email);

        await supabase
          .from("tracked_jobs")
          .upsert(
            {
              user_email: user.user_email,
              role: item.job_title,
              company: item.company,
              url: item.url,
              source: ["jsearch", "adzuna", "remotive"].includes(item.source) ? "other" : item.source,
              stage: "applied",
              match_score: item.match_score,
              salary_range: item.salary,
              location: item.location,
              notes: `Auto-applied via background engine. Match: ${item.match_score}%`,
              applied_date: now,
            },
            { onConflict: "user_email,url", ignoreDuplicates: false }
          );

        await supabase.from("auto_apply_log").insert({
          user_email: user.user_email,
          queue_item_id: item.id,
          action: "applied",
          job_title: item.job_title,
          company: item.company,
          details: `Applied with ${item.match_score}% match${coverLetterId ? ", cover letter generated" : ""}${tailoredKeywords.length > 0 ? `, ${tailoredKeywords.length} keywords tailored` : ""}`,
        });

        totalProcessed++;
      }
    } catch (err) {
      console.error(`Auto-apply process error for ${user.user_email}:`, err);
      errors++;
    }
  }

  await supabase.from("auto_apply_engine_runs").insert({
    run_type: "process",
    users_processed: users.length,
    applications_processed: totalProcessed,
    cover_letters_generated: totalCoverLetters,
    errors,
  });

  return NextResponse.json({
    users: users.length,
    processed: totalProcessed,
    coverLetters: totalCoverLetters,
    errors,
  });
}
