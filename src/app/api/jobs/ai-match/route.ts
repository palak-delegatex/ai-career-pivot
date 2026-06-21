import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import {
  computeHybridMatchScore,
  computeQuickMatchBreakdown,
} from "@/lib/ai-job-match";
import type { AIMatchResult } from "@/lib/ai-job-match";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      jobDescription,
      jobTitle,
      jobLocation,
      isRemote,
      deepAnalysis,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    if (!jobDescription && !jobTitle) {
      return NextResponse.json(
        { error: "jobDescription or jobTitle required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select(
        "skills, transferable_skills, current_title, years_experience, education, raw_summary, preferred_locations"
      )
      .eq("email", email)
      .single();

    const userSkills: string[] = [
      ...(profile?.skills ?? []),
      ...(profile?.transferable_skills ?? []),
    ];

    if (userSkills.length === 0) {
      return NextResponse.json(
        { error: "No skills found in profile. Complete your profile first." },
        { status: 400 }
      );
    }

    const jobText = [jobTitle ?? "", jobDescription ?? ""].join("\n");

    const education = Array.isArray(profile?.education)
      ? profile.education.map(
          (e: { degree?: string; field?: string }) => ({
            degree: e.degree ?? "",
            field: e.field ?? "",
          })
        )
      : [];

    const userLocation =
      profile?.preferred_locations?.[0] ?? undefined;

    if (deepAnalysis && jobDescription) {
      const result: AIMatchResult = await computeHybridMatchScore(
        jobDescription,
        {
          skills: userSkills,
          resumeText: profile?.raw_summary ?? undefined,
          yearsExperience: profile?.years_experience ?? undefined,
          education,
          currentTitle: profile?.current_title ?? undefined,
          location: userLocation,
          jobLocation: jobLocation ?? undefined,
          isRemote: isRemote ?? false,
          remotePreferred: profile?.preferred_locations?.some(
            (l: string) => /remote/i.test(l)
          ),
        },
        { deepAnalysis: true }
      );

      return NextResponse.json(result);
    }

    const quick = computeQuickMatchBreakdown(userSkills, jobText, {
      yearsExperience: profile?.years_experience ?? undefined,
      education,
      location: userLocation,
      jobLocation: jobLocation ?? undefined,
      isRemote: isRemote ?? false,
      remotePreferred: profile?.preferred_locations?.some(
        (l: string) => /remote/i.test(l)
      ),
    });

    const improvements = quick.missingFromJd.slice(0, 5).map((kw, i) => ({
      action: `Add "${kw}" to your skills or experience section`,
      keyword: kw,
      estimatedImpact: Math.max(2, 8 - i * 2),
      category: "keywords" as const,
      priority: (i < 2 ? "high" : i < 4 ? "medium" : "low") as
        | "high"
        | "medium"
        | "low",
    }));

    const recommendation =
      quick.score >= 80
        ? "strong-match"
        : quick.score >= 60
          ? "good-match"
          : quick.score >= 40
            ? "partial-match"
            : "weak-match";

    return NextResponse.json({
      score: quick.score,
      breakdown: quick.breakdown,
      matchedSkills: quick.matchedSkills,
      missingSkills: quick.missingFromJd,
      improvements,
      recommendation,
      summary:
        quick.score >= 70
          ? `Strong alignment with ${quick.matchedSkills.length} matching skills.`
          : `${quick.matchedSkills.length} skills match. Consider adding ${quick.missingFromJd.slice(0, 2).join(" and ")} to improve fit.`,
    });
  } catch (err) {
    console.error("AI match scoring error:", err);
    return NextResponse.json(
      { error: "Failed to compute match score" },
      { status: 500 }
    );
  }
}
