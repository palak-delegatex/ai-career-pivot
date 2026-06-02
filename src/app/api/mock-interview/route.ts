import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export async function POST(req: NextRequest) {
  const {
    targetRole,
    interviewType = "behavioral",
    messages,
    questionCount = 0,
  }: {
    targetRole: string;
    interviewType?: "behavioral" | "technical" | "situational";
    messages: { role: "user" | "assistant"; content: string }[];
    questionCount?: number;
  } = await req.json();

  if (!targetRole || !messages) {
    return new Response(JSON.stringify({ error: "targetRole and messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isEndOfInterview = questionCount >= 5;

  const systemPrompt = isEndOfInterview
    ? buildFeedbackPrompt(targetRole)
    : buildInterviewerPrompt(targetRole, interviewType, questionCount);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

function buildInterviewerPrompt(
  targetRole: string,
  interviewType: string,
  questionCount: number
): string {
  const isFirst = questionCount === 0;

  return `You are a senior hiring manager conducting a ${interviewType} interview for a ${targetRole} position at a top company.

YOUR BEHAVIOR:
- Ask ONE question at a time — never multiple questions at once.
- After the candidate answers, give brief 1-2 sentence feedback on what was strong and what was missing, then immediately ask the next question.
- Questions should escalate in depth. Start with easier situational questions, move to challenging behavioral ones.
- For behavioral questions, expect STAR format (Situation, Task, Action, Result). Prompt them if they miss it.
- Keep your tone professional but encouraging — like a real interviewer who wants the candidate to succeed.
- Do NOT give long lectures. Be concise after each answer.

INTERVIEW STRUCTURE:
- Questions 1-2: Warm-up (motivation, background fit for ${targetRole})
- Questions 3-4: Core competency (role-specific behavioral/situational)
- Question 5: Challenging scenario (complex problem or conflict)

${isFirst ? `This is the START of the interview. Briefly introduce yourself as a hiring manager (1 sentence), state this is a ${interviewType} interview for ${targetRole}, and immediately ask Question 1. Do not explain the format — just start.` : `Continue the interview naturally. Give brief feedback on their last answer, then ask the next question.`}

ROLE-SPECIFIC FOCUS for ${targetRole}:
- Tailor questions to the specific skills, scenarios, and challenges common in ${targetRole} roles.
- Reference real scenarios a ${targetRole} would face (stakeholder management, cross-functional decisions, metrics, etc).`;
}

function buildFeedbackPrompt(targetRole: string): string {
  return `You are a senior hiring manager who just completed a mock interview for a ${targetRole} candidate.

Generate a structured interview debrief with:

**Overall Impression** (2-3 sentences on their overall performance)

**Strengths** (3 bullet points with specific examples from their answers)

**Areas to Improve** (3 bullet points with concrete advice)

**Recommended Practice** (2-3 specific resources, question types, or frameworks to practice)

**Hiring Recommendation**: Would you advance them? (Yes / Maybe with coaching / Not yet — with brief reason)

Be honest but constructive. Reference specific answers from the conversation. End with one sentence of encouragement.`;
}
