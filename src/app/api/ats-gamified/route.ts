import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  computeATSMatchBreakdown,
  type EnrichedJDKeywords,
} from "@/lib/ats-scoring";
import { buildGamifiedAtsScore } from "@/lib/ats-gamified";
import type { GamifiedAtsPayload } from "@/lib/gamified-ats-payload";

// Gamified ATS score data (AIC-879 / design AIC-873, engine AIC-874).
//
// The AIC-874 engine (`buildGamifiedAtsScore`) is a pure transform over a real
// `MatchRateBreakdown` — but that breakdown needs the resume text + the target
// JD, and neither is retained in the /free web flow (the snapshot route streams
// a fixed-schema object and discards the résumé; only quickcheck visitors have a
// JD). This thin route produces the breakdown honestly at the one moment both
// inputs exist — the quickcheck → upload hand-off — so the meter shows a REAL
// score, never a fabricated one (cf. AIC-862). It runs only when a JD is present;
// callers without one simply don't render Surface 2.
//
// It is deliberate integration of the existing engines (text extraction pattern
// from /api/ats-score, `computeATSMatchBreakdown` from AIC-735, and
// `buildGamifiedAtsScore` from AIC-874) — no new scoring logic here.

export const maxDuration = 60;

const EnrichedJDSchema = z.object({
  required: z.array(z.string()).describe("Must-have skills and qualifications from the JD"),
  preferred: z.array(z.string()).describe("Nice-to-have skills and qualifications"),
  keywords: z.array(z.string()).describe("Important ATS terms: technologies, methodologies, certifications, domain terms"),
  hardSkills: z.array(z.string()).describe("Technical/domain-specific skills"),
  softSkills: z.array(z.string()).describe("Interpersonal/behavioral skills"),
  jobTitle: z.string().describe("The primary job title from the posting"),
});

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

// Extract plain résumé text for the deterministic scorer. Mirrors the extractor
// in /api/ats-score: PDFs go through Haiku (they carry no extractable plain
// text); DOCX/TXT are decoded directly.
async function extractResumeText(fileType: string, base64: string, bytes: ArrayBuffer): Promise<string> {
  if (fileType !== "application/pdf") {
    return new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");
  }
  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: z.object({ text: z.string() }) }),
      messages: [
        {
          role: "user",
          content: [
            { type: "file", data: base64, mediaType: "application/pdf" },
            {
              type: "text",
              text: "Extract ALL text content from this PDF resume. Preserve section headings, bullet points, and line breaks. Return the complete text.",
            },
          ],
        },
      ],
    });
    return output?.text ?? "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File | null;
  const jobDescription = formData.get("jobDescription") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
  }
  if (!jobDescription?.trim()) {
    return NextResponse.json({ error: "A job description is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF, DOCX, DOC, and TXT files are supported" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const resumeText = await extractResumeText(file.type, base64, bytes);

    if (!resumeText.trim()) {
      return NextResponse.json({ error: "Could not read the resume text" }, { status: 422 });
    }

    const { output: enriched } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: EnrichedJDSchema }),
      messages: [
        {
          role: "user",
          content: `Extract structured keywords from this job description. Separate into required (must-have skills/qualifications), preferred (nice-to-have skills), keywords (important ATS terms: technologies, methodologies, certifications, domain terms), hardSkills, softSkills, and jobTitle.

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 6000)}
"""`,
        },
      ],
    });

    if (!enriched) {
      return NextResponse.json({ error: "Could not parse the job description" }, { status: 422 });
    }

    const breakdown = computeATSMatchBreakdown(resumeText, enriched as EnrichedJDKeywords, {
      fileType: file.type,
    });
    const gamified = buildGamifiedAtsScore(breakdown);

    const payload: GamifiedAtsPayload = {
      gamified,
      categories: [
        { name: "Keywords", score: breakdown.keywordScore },
        { name: "Formatting", score: breakdown.formattingScore },
      ],
      targetRole: enriched.jobTitle?.trim() || "your target role",
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Gamified ATS error:", err);
    return NextResponse.json({ error: "Failed to score resume. Please try again." }, { status: 500 });
  }
}
