import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const ExtractedKeywordsSchema = z.object({
  required: z.array(z.string()),
  preferred: z.array(z.string()),
  keywords: z.array(z.string()),
  responsibilities: z.array(z.string()),
  experience_years: z.string(),
  tech_stack: z.array(z.string()),
});

async function extractKeywordsInBackground(
  supabase: ReturnType<typeof getSupabaseClient>,
  jobId: string,
  userEmail: string,
  description: string,
) {
  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: ExtractedKeywordsSchema }),
      messages: [
        {
          role: "user",
          content: `Extract structured information from this job description for resume tailoring. Be thorough — extract every distinct skill, tool, qualification, and responsibility mentioned. Use the exact terms from the JD.

Categorize as:
- required: must-have skills and qualifications explicitly stated as required
- preferred: nice-to-have skills mentioned as preferred, bonus, or "a plus"
- keywords: other important ATS terms like methodologies, certifications, domain terms, soft skills
- responsibilities: key job responsibilities and duties (brief phrases)
- experience_years: required years of experience (e.g. "3-5 years", "5+ years", or "not specified")
- tech_stack: specific technologies, programming languages, frameworks, and tools

JOB DESCRIPTION:
"""
${description.slice(0, 6000)}
"""`,
        },
      ],
    });

    if (output) {
      await supabase
        .from("tracked_jobs")
        .update({ extracted_keywords: output })
        .eq("id", jobId)
        .eq("user_email", userEmail);
    }
  } catch (err) {
    console.error("Background keyword extraction failed:", err);
  }
}

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
          job_description: job.description || "",
        },
        { onConflict: "user_email,url" }
      )
      .select()
      .single();

    if (error) throw error;

    if (job.description && job.description.length >= 20 && data?.id) {
      extractKeywordsInBackground(supabase, data.id, email, job.description);
    }

    return NextResponse.json({ saved: true, job: data });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}
