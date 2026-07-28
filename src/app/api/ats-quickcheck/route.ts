import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { localeSystemPrompt } from "@/lib/locale";

// Zero-upload anonymous ATS quick-check (AIC-830 / AIC-825 Path A). A logged-out
// visitor pastes a job description (or URL) and gets an instant "taste": the role
// + top-5 in-demand skills + an INDUSTRY-AVERAGE readiness estimate. It is
// deliberately NOT personalized — the personalized match score stays locked
// behind the existing resume-upload free-snapshot flow (Goal-Gradient/Zeigarnik:
// the incomplete answer motivates the upload). Haiku keeps it under ~5s.
export const maxDuration = 30;

const QuickCheckSchema = z.object({
  role: z.string().describe("The primary job title / role from the posting, e.g. 'Senior Product Manager'"),
  industry: z.string().optional().describe("The industry or domain if evident, e.g. 'Fintech'"),
  topSkills: z
    .array(
      z.object({
        skill: z.string().describe("A specific in-demand skill for this role"),
        importance: z.enum(["Critical", "High", "Medium"]),
        weight: z
          .number()
          .describe("0-100 relative importance, used for the visual bar fill. Highest skill ~90-100, lowest ~40-55."),
      })
    )
    .describe("Exactly the 5 most-demanded skills this role requires, ranked most→least important"),
  readinessEstimate: z
    .number()
    .describe(
      "0-100 industry-average readiness — how ready a TYPICAL candidate applying to this role tends to be. NOT personalized to any resume."
    ),
  readinessNote: z
    .string()
    .describe("1 short sentence framing the industry-average readiness and why a personalized match matters"),
});

export type AtsQuickCheck = z.infer<typeof QuickCheckSchema>;

// Best-effort extraction of visible text from a fetched job-posting URL. Kept
// intentionally light — we strip tags and collapse whitespace rather than run a
// full DOM parse, since the model only needs the readable JD copy.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Fetch a public job-posting URL and return its readable text. Guarded with a
// short timeout so a slow page can't stall the quick-check past its <5s promise.
async function fetchJdFromUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; AICareerPivotBot/1.0)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    return htmlToText(html);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: { jobDescription?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
  }

  const raw = (body.jobDescription ?? "").trim();
  const locale = body.locale;

  if (!raw) {
    return NextResponse.json({ error: "Paste a job description or URL to analyze." }, { status: 400 });
  }

  // Resolve URL → text when the whole input is a single link; otherwise treat the
  // input as pasted JD copy directly.
  let jobText = raw;
  if (isHttpUrl(raw) && !/\s/.test(raw)) {
    const fetched = await fetchJdFromUrl(raw);
    if (!fetched || fetched.length < 120) {
      return NextResponse.json(
        { error: "Couldn't read that link. Paste the job description text instead." },
        { status: 422 }
      );
    }
    jobText = fetched;
  }

  if (jobText.length < 40) {
    return NextResponse.json(
      { error: "That's a bit short — paste the full job description for an accurate check." },
      { status: 400 }
    );
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: QuickCheckSchema }),
      prompt: `You are an ATS and hiring-signal expert. A job seeker pasted a job posting and wants an instant read on what the role demands — BEFORE they've uploaded their own resume.

JOB POSTING:
"""
${jobText.slice(0, 6000)}
"""

Return:
1. role: the primary job title (normalize it, e.g. "Sr. PM, Payments" → "Senior Product Manager — Payments").
2. industry: the domain if evident (else omit).
3. topSkills: EXACTLY the 5 most-demanded skills for this role, ranked most→least important. For each give an importance (Critical / High / Medium) and a weight (0-100) for a visual bar — the top skill should be ~90-100, the least ~40-55. Prefer concrete, resume-relevant skills over vague traits.
4. readinessEstimate: an INDUSTRY-AVERAGE readiness score (0-100) — roughly how prepared a typical applicant to this role is. This is NOT personalized; keep it in a realistic 45-70 band so there's clear room a personalized match would fill.
5. readinessNote: ONE short sentence that frames the average and nudges toward a personalized match (e.g. "Most applicants meet about 6 of 10 requirements — upload your resume to see exactly where you stand.").

Be fast and specific. Reference actual terms from the posting.${localeSystemPrompt(locale)}`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Couldn't analyze that posting. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("ATS quick-check error:", err);
    return NextResponse.json({ error: "Failed to analyze the job posting. Please try again." }, { status: 500 });
  }
}
