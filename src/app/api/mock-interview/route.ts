import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

interface SpeechMetricsPayload {
  totalAnswers: number;
  totalDurationSeconds: number;
  totalWords: number;
  averageWordsPerMinute: number;
  totalFillerWords: number;
  fillerWordPercentage: number;
  topFillers: { word: string; count: number }[];
}

export async function POST(req: NextRequest) {
  const {
    targetRole,
    interviewType = "behavioral",
    jobDescription,
    messages,
    questionCount = 0,
    speechMetrics,
  }: {
    targetRole: string;
    interviewType?: "behavioral" | "technical" | "situational";
    jobDescription?: string;
    messages: { role: "user" | "assistant"; content: string }[];
    questionCount?: number;
    speechMetrics?: SpeechMetricsPayload;
  } = await req.json();

  if (!targetRole || !messages) {
    return new Response(JSON.stringify({ error: "targetRole and messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isEndOfInterview = questionCount >= 5;

  const jd = jobDescription?.trim() || undefined;
  const systemPrompt = isEndOfInterview
    ? buildFeedbackPrompt(targetRole, jd, speechMetrics)
    : buildInterviewerPrompt(targetRole, interviewType, questionCount, jd);

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
  questionCount: number,
  jobDescription?: string
): string {
  const isFirst = questionCount === 0;

  const jdSection = jobDescription
    ? `\n\nJOB DESCRIPTION PROVIDED BY THE CANDIDATE:
"""
${jobDescription.slice(0, 4000)}
"""

CRITICAL: You have the actual job description. Use it to:
- Extract the specific skills, qualifications, and responsibilities mentioned.
- Craft questions that directly test whether the candidate meets the requirements listed.
- Reference specific responsibilities from the JD in your questions (e.g. "This role mentions leading cross-functional teams — tell me about…").
- Prioritize must-have qualifications and key responsibilities over nice-to-haves.`
    : `\n\nROLE-SPECIFIC FOCUS for ${targetRole}:
- Tailor questions to the specific skills, scenarios, and challenges common in ${targetRole} roles.
- Reference real scenarios a ${targetRole} would face (stakeholder management, cross-functional decisions, metrics, etc).`;

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

${isFirst ? `This is the START of the interview. Briefly introduce yourself as a hiring manager (1 sentence), state this is a ${interviewType} interview for ${targetRole}, and immediately ask Question 1. Do not explain the format — just start.` : `Continue the interview naturally. Give brief feedback on their last answer, then ask the next question.`}${jdSection}`;
}

function buildFeedbackPrompt(targetRole: string, jobDescription?: string, speechMetrics?: SpeechMetricsPayload): string {
  const jdSection = jobDescription
    ? `\n\nJOB DESCRIPTION THE CANDIDATE IS TARGETING:
"""
${jobDescription.slice(0, 4000)}
"""

CRITICAL: Score the candidate against the SPECIFIC requirements in this job description. In your debrief:
- Map their demonstrated skills to the JD's listed requirements.
- Call out which JD requirements they addressed well and which they missed.
- In "Areas to Improve", focus on gaps relative to this specific JD.
- In "JD Fit Score", rate how well their answers match the specific job requirements? List 2-3 JD requirements they demonstrated and 2-3 they should prepare for.`
    : "";

  const speechSection = speechMetrics
    ? `\n\n**SPEECH ANALYSIS DATA** (candidate used voice mode):
- Total speaking time: ${speechMetrics.totalDurationSeconds} seconds across ${speechMetrics.totalAnswers} answers
- Average pace: ${speechMetrics.averageWordsPerMinute} words per minute (ideal: 120-160 wpm)
- Filler words: ${speechMetrics.totalFillerWords} total (${speechMetrics.fillerWordPercentage}% of words)${speechMetrics.topFillers.length > 0 ? `\n- Most common fillers: ${speechMetrics.topFillers.map((f) => `"${f.word}" (${f.count}x)`).join(", ")}` : ""}

CRITICAL: Include a **Speech & Delivery** section in the debrief that covers:
- Pacing assessment (too fast >170wpm, too slow <100wpm, or good range)
- Filler word feedback with specific reduction strategies
- Overall verbal delivery impression
- Concrete tips to improve spoken delivery (e.g. pausing instead of using fillers, practicing with a timer)`
    : "";

  return `You are a senior hiring manager who just completed a mock interview for a ${targetRole} candidate.

Generate a structured interview debrief with:

**Overall Impression** (2-3 sentences on their overall performance)

**Strengths** (3 bullet points with specific examples from their answers)

**Areas to Improve** (3 bullet points with concrete advice)
${jobDescription ? `\n**JD Fit Score**: X/10\n` : ""}${speechMetrics ? `\n**Speech & Delivery** (pacing, filler words, verbal confidence — use the speech data above)\n` : ""}
**Recommended Practice** (2-3 specific resources, question types, or frameworks to practice)

**Hiring Recommendation**: Would you advance them? (Yes / Maybe with coaching / Not yet — with brief reason)

Be honest but constructive. Reference specific answers from the conversation. End with one sentence of encouragement.${jdSection}${speechSection}`;
}
