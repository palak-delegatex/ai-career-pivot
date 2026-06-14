import { NextRequest, NextResponse } from "next/server";
import { computeMatchScore } from "@/lib/job-match";

export async function POST(req: NextRequest) {
  try {
    const { jobTitle, jobDescription, jobTags, userSkills, targetRole } = await req.json();

    if (!jobTitle || !userSkills?.length) {
      return NextResponse.json({ error: "jobTitle and userSkills are required" }, { status: 400 });
    }

    const job = {
      title: jobTitle,
      tags: jobTags || [],
      description_snippet: jobDescription || "",
    };

    const { score, matched } = computeMatchScore(job, userSkills, targetRole || "");

    return NextResponse.json({
      matchScore: score,
      matchedSkills: matched,
      totalSkills: userSkills.length,
      recommendation:
        score >= 75
          ? "Strong match — apply with confidence"
          : score >= 50
            ? "Decent match — tailor your resume to highlight gaps"
            : score >= 25
              ? "Partial match — consider if this aligns with your pivot goals"
              : "Low match — may not align with your career pivot path",
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute match score" }, { status: 500 });
  }
}
