import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import type { ExtractedKeywords } from "@/lib/job-tracker";

interface KeywordFrequency {
  keyword: string;
  count: number;
  category: "required" | "preferred" | "tech_stack" | "keyword";
  jobCount: number;
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const resumeSkills = req.nextUrl.searchParams.get("resumeSkills");
  const userSkills = resumeSkills
    ? resumeSkills.split(",").map((s) => s.trim().toLowerCase())
    : [];

  const supabase = getSupabaseClient();
  const { data: jobs, error } = await supabase
    .from("tracked_jobs")
    .select("id, role, extracted_keywords")
    .eq("user_email", email)
    .not("extracted_keywords", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const freqMap = new Map<string, { count: number; category: string }>();
  const totalJobs = jobs?.length ?? 0;

  for (const job of jobs ?? []) {
    const kw = job.extracted_keywords as ExtractedKeywords | null;
    if (!kw) continue;

    const addKeywords = (items: string[] | undefined, category: string) => {
      for (const item of items ?? []) {
        const normalized = item.toLowerCase().trim();
        if (!normalized) continue;
        const existing = freqMap.get(normalized);
        if (existing) {
          existing.count++;
        } else {
          freqMap.set(normalized, { count: 1, category });
        }
      }
    };

    addKeywords(kw.required, "required");
    addKeywords(kw.preferred, "preferred");
    addKeywords(kw.tech_stack, "tech_stack");
    addKeywords(kw.keywords, "keyword");
  }

  const trends: KeywordFrequency[] = Array.from(freqMap.entries())
    .map(([keyword, { count, category }]) => ({
      keyword,
      count,
      category: category as KeywordFrequency["category"],
      jobCount: totalJobs,
    }))
    .sort((a, b) => b.count - a.count);

  const missingFromResume = userSkills.length > 0
    ? trends.filter(
        (t) => !userSkills.some((s) => t.keyword.includes(s) || s.includes(t.keyword)),
      )
    : [];

  const onResume = userSkills.length > 0
    ? trends.filter(
        (t) => userSkills.some((s) => t.keyword.includes(s) || s.includes(t.keyword)),
      )
    : [];

  return NextResponse.json({
    trends: trends.slice(0, 50),
    missingFromResume: missingFromResume.slice(0, 30),
    onResume: onResume.slice(0, 30),
    totalJobsAnalyzed: totalJobs,
  });
}
