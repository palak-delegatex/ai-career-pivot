import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const PrepQuestionSchema = z.object({
  category: z.enum([
    "behavioral",
    "technical",
    "situational",
    "role-specific",
    "culture-fit",
    "competency",
  ]),
  question: z.string(),
  whyAsked: z.string().describe("Why an interviewer would ask this for this specific role"),
  suggestedAnswer: z.string().describe("A strong model answer using the STAR method where applicable, tailored to the candidate's background"),
  keyPoints: z.array(z.string()).describe("3-5 bullet points the answer should hit"),
  followUps: z.array(z.string()).describe("1-2 likely follow-up questions"),
});

const InterviewPrepSchema = z.object({
  roleSummary: z.string().describe("One-paragraph summary of what the interviewer is looking for"),
  questions: z.array(PrepQuestionSchema).describe("10-15 interview questions covering a mix of categories"),
  companyResearchTips: z.array(z.string()).describe("3-5 specific things to research about the company before the interview"),
  closingQuestions: z.array(
    z.object({
      question: z.string().describe("A thoughtful question to ask the interviewer"),
      purpose: z.string().describe("What this question reveals about the role/company"),
    })
  ).describe("5-7 strong questions the candidate should ask the interviewer"),
});

export type InterviewPrepResult = z.infer<typeof InterviewPrepSchema>;

export async function POST(req: NextRequest) {
  const {
    targetRole,
    jobDescription,
    resumeText,
    companyName,
    interviewType,
  }: {
    targetRole: string;
    jobDescription?: string;
    resumeText?: string;
    companyName?: string;
    interviewType?: "behavioral" | "technical" | "mixed";
  } = await req.json();

  if (!targetRole) {
    return NextResponse.json(
      { error: "targetRole is required" },
      { status: 400 },
    );
  }

  const jdSection = jobDescription
    ? `\n\nJOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 5000)}\n"""`
    : "";

  const resumeSection = resumeText
    ? `\n\nCANDIDATE'S RESUME:\n"""\n${resumeText.slice(0, 4000)}\n"""`
    : "";

  const companySection = companyName
    ? `\nCompany: ${companyName}`
    : "";

  const typePreference = interviewType === "technical"
    ? "Focus heavily on technical questions (60% technical, 20% behavioral, 20% situational)."
    : interviewType === "behavioral"
      ? "Focus on behavioral and situational questions (60% behavioral/situational, 20% competency, 20% culture-fit)."
      : "Provide a balanced mix across all categories.";

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: InterviewPrepSchema }),
      messages: [
        {
          role: "user",
          content: `You are a senior interview coach preparing a candidate for a ${targetRole} interview.${companySection}${jdSection}${resumeSection}

Generate a comprehensive interview prep sheet with 10-15 likely interview questions and strong model answers.

${typePreference}

For each question:
- Explain WHY an interviewer asks this (what they're evaluating)
- Write a strong model answer that ${resumeText ? "references the candidate's actual experience from their resume" : "uses realistic examples a " + targetRole + " candidate would have"}
- Use STAR method (Situation, Task, Action, Result) for behavioral answers
- Include key points the answer must hit
- Add 1-2 likely follow-up questions

Also provide:
- A role summary of what the interviewer is looking for
- Company research tips${companyName ? " specific to " + companyName : ""}
- 5-7 thoughtful questions the candidate should ask the interviewer (not generic ones — questions that show genuine interest and research)

Make the prep sheet practical and immediately usable — this is what the candidate will review right before their interview.`,
        },
      ],
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate interview prep" },
        { status: 422 },
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Interview prep error:", err);
    return NextResponse.json(
      { error: "Failed to generate interview prep" },
      { status: 500 },
    );
  }
}
