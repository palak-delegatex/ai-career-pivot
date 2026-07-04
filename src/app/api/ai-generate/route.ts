import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { localeSystemPrompt } from "@/lib/locale";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserProfile(email: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("users")
    .select("name, current_title, skills, experience, education, certifications")
    .eq("email", email)
    .single();
  return data;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    type,
    jobDescription,
    jobTitle,
    company,
    question,
    email,
    tone,
    locale,
  }: {
    type: "cover-letter" | "answer";
    jobDescription?: string;
    jobTitle?: string;
    company?: string;
    question?: string;
    email: string;
    tone?: "professional" | "conversational" | "bold";
    locale?: string;
  } = await req.json();

  if (!type || !email) {
    return NextResponse.json(
      { error: "type and email are required" },
      { status: 400 }
    );
  }

  if (type === "answer" && !question) {
    return NextResponse.json(
      { error: "question is required for answer generation" },
      { status: 400 }
    );
  }

  const profile = await getUserProfile(email);
  const profileContext = profile
    ? [
        profile.name && `Name: ${profile.name}`,
        profile.current_title && `Current role: ${profile.current_title}`,
        profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
        profile.experience?.length &&
          `Experience:\n${profile.experience
            .map(
              (e: { title: string; company: string; start_year: number; end_year: number | null; description: string }) =>
                `- ${e.title} at ${e.company} (${e.start_year}–${e.end_year ?? "Present"}): ${e.description}`
            )
            .join("\n")}`,
        profile.education?.length &&
          `Education:\n${profile.education
            .map(
              (e: { degree: string; field: string; institution: string; year: number | null }) =>
                `- ${e.degree} in ${e.field}, ${e.institution}${e.year ? ` (${e.year})` : ""}`
            )
            .join("\n")}`,
        profile.certifications?.length &&
          `Certifications: ${profile.certifications.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n\n")
    : "No profile data available.";

  const jdContext =
    jobDescription?.trim()
      ? `\nJOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 4000)}\n"""`
      : "";

  const roleContext = [
    jobTitle && `Job title: ${jobTitle}`,
    company && `Company: ${company}`,
  ]
    .filter(Boolean)
    .join("\n");

  let systemPrompt: string;

  if (type === "cover-letter") {
    const toneInstructions: Record<string, string> = {
      professional:
        "Professional tone — confident but not arrogant. Formal language, polished structure.",
      conversational:
        "Conversational tone — warm, personable, approachable while maintaining professionalism.",
      bold: "Bold tone — confident, assertive, direct. Lead with strong claims backed by evidence.",
    };

    systemPrompt = `You are a cover letter writer specializing in career pivots. Generate a compelling cover letter for the candidate.

CANDIDATE:
${profileContext}

${roleContext}${jdContext}

REQUIREMENTS:
- ${toneInstructions[tone ?? "professional"]}
- 3-4 paragraphs, 300-400 words
- Opening: Hook connecting background to the target role. No generic "I'm writing to apply" openings.
- Body: Highlight transferable skills with specific examples. Address the career pivot as a strength.
- Closing: Express enthusiasm, specific call to action.
- Use achievements and metrics from their experience
- Mirror language from the job description if provided
- Output plain text only, no markdown headers or formatting markers
- Do NOT use placeholders like [Company Name] — use the company name if known, otherwise write generically`;
  } else {
    systemPrompt = `You are a career coach helping a job applicant answer an open-ended application question. Write a strong, authentic answer.

CANDIDATE:
${profileContext}

${roleContext}${jdContext}

THE QUESTION: "${question}"

REQUIREMENTS:
- Write a direct, compelling answer in 100-250 words
- Draw from the candidate's actual experience and skills
- Be specific — use real details from their background
- Match the question's scope (short question = concise answer)
- Sound authentic, not formulaic
- If the question asks about the company, reference details from the job description
- Output plain text only, no markdown formatting`;
  }

  systemPrompt += localeSystemPrompt(locale);

  try {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            type === "cover-letter"
              ? "Generate my cover letter now."
              : `Answer this application question: "${question}"`,
        },
      ],
    });

    return NextResponse.json({ text: result.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
