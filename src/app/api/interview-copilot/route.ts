import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export async function POST(req: NextRequest) {
  const {
    question,
    targetRole,
    jobDescription,
    resumeHighlights,
    conversationHistory,
    mode,
  }: {
    question: string;
    targetRole?: string;
    jobDescription?: string;
    resumeHighlights?: string;
    conversationHistory?: { role: "user" | "assistant"; content: string }[];
    mode: "answer" | "debrief";
  } = await req.json();

  if (!question) {
    return new Response(JSON.stringify({ error: "question is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt =
    mode === "debrief"
      ? buildDebriefPrompt(targetRole, jobDescription)
      : buildCopilotPrompt(targetRole, jobDescription, resumeHighlights);

  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...(conversationHistory ?? []),
    { role: "user", content: question },
  ];

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

function buildCopilotPrompt(
  targetRole?: string,
  jobDescription?: string,
  resumeHighlights?: string
): string {
  const roleContext = targetRole
    ? `The candidate is interviewing for a **${targetRole}** position.`
    : "The candidate is in a job interview.";

  const jdContext = jobDescription
    ? `\n\nJOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 4000)}\n"""\nConnect answers to specific JD requirements.`
    : "";

  const resumeContext = resumeHighlights
    ? `\n\nCANDIDATE'S KEY EXPERIENCE:\n"""\n${resumeHighlights.slice(0, 3000)}\n"""\nWeave these real experiences into suggested answers.`
    : "";

  return `You are a real-time interview copilot. The candidate is in a LIVE interview right now. You hear the interviewer's question and must generate helpful response suggestions FAST.

${roleContext}${jdContext}${resumeContext}

YOUR RESPONSE FORMAT — keep it scannable, the candidate is reading while talking:

**Key Point**: One-sentence direct answer to open with.

**Talking Points** (3-4 bullets):
- Concise bullet the candidate can glance at and expand on naturally
- Each bullet = one idea, under 15 words
- Include a specific metric or example where possible

**STAR Example** (if behavioral question):
- **S**: [Situation in 1 sentence]
- **T**: [Task in 1 sentence]
- **A**: [Action — the meat, 2-3 sentences max]
- **R**: [Result with metric if possible]

**Closing Line**: A strong sentence to wrap the answer.

RULES:
- Speed over perfection — the candidate needs this NOW.
- Never say "I" — write in second person ("You led…", "Your team…").
- Keep total response under 200 words.
- If the question is small talk or introductory, give a brief natural response suggestion, not a full STAR answer.
- If you detect a technical question, give the technical answer directly — no STAR needed.
- If the question is unclear, give your best interpretation and a brief alternative.`;
}

function buildDebriefPrompt(targetRole?: string, jobDescription?: string): string {
  const jdContext = jobDescription
    ? `\n\nJOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 4000)}\n"""`
    : "";

  return `You are an interview coach generating a post-interview debrief. The candidate just finished a live interview${targetRole ? ` for a ${targetRole} position` : ""}.${jdContext}

Based on the conversation transcript, generate:

## Interview Performance Summary

**Overall Assessment** (2-3 sentences)

**Questions Asked** (numbered list with brief assessment of each answer):
For each question-answer pair, rate: Strong / Adequate / Needs Work

**Strengths** (3 bullets with specific examples from their answers)

**Areas to Improve** (3 bullets with concrete suggestions)

**Follow-Up Email Draft**:
Write a brief, professional thank-you/follow-up email the candidate can send. Reference 1-2 specific topics discussed. Keep it under 150 words.

**Preparation Notes for Next Round** (if applicable):
- Topics likely to come up again
- Areas to strengthen before the next interview

Be honest, constructive, and specific. Reference actual content from the conversation.`;
}
