import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import {
  enforceFeatureAccess,
  isGateResponse,
  trackUsage,
} from "@/lib/usage-gating";

export async function POST(req: NextRequest) {
  const gate = await enforceFeatureAccess("mock_interview");
  if (isGateResponse(gate)) return gate;

  const {
    targetRole,
    interviewType = "behavioral",
    jobDescription,
    messages,
    questionCount = 0,
    skillGaps,
    previousAnswerQuality,
  }: {
    targetRole: string;
    interviewType?: "behavioral" | "technical" | "situational";
    jobDescription?: string;
    messages: { role: "user" | "assistant"; content: string }[];
    questionCount?: number;
    skillGaps?: { skill: string; priority: string }[];
    previousAnswerQuality?: "strong" | "adequate" | "weak" | "off-topic";
  } = await req.json();

  if (!targetRole || !messages) {
    return NextResponse.json(
      { error: "targetRole and messages required" },
      { status: 400 }
    );
  }

  const isEndOfInterview = questionCount >= 5;
  const isFirst = questionCount === 0;

  if (isFirst) {
    await trackUsage(gate.email, "mock_interview");
  }

  const jd = jobDescription?.trim() || undefined;
  const systemPrompt = isEndOfInterview
    ? buildFeedbackPrompt(targetRole, jd, skillGaps)
    : buildInterviewerPrompt(
        targetRole,
        interviewType,
        questionCount,
        jd,
        skillGaps,
        previousAnswerQuality
      );

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
  jobDescription?: string,
  skillGaps?: { skill: string; priority: string }[],
  previousAnswerQuality?: string
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

  const gapSection = skillGaps?.length
    ? `\n\nCANDIDATE SKILL GAPS (from their assessment — probe these areas):
${skillGaps.map((g) => `- ${g.skill} (${g.priority} priority)`).join("\n")}
Use these gaps to design questions that test whether the candidate can bridge these areas. For transferable skills, ask how they'd apply adjacent experience. For new skills, ask about their learning approach.`
    : "";

  const adaptiveSection = previousAnswerQuality
    ? `\n\nADAPTIVE PROBING — Previous answer quality: ${previousAnswerQuality}
${
  previousAnswerQuality === "weak" || previousAnswerQuality === "off-topic"
    ? `The candidate's last answer was ${previousAnswerQuality}. Before moving to the next question:
1. Acknowledge what they said (don't dismiss it).
2. Probe DEEPER with a targeted follow-up: "Can you walk me through a specific example?" or "What was the measurable outcome?"
3. If they gave a vague answer, ask for concrete details: numbers, timelines, team size, specific tools used.
4. If off-topic, gently redirect: "That's interesting — but I'm specifically looking for how you handled [X]. Can you think of a time when…?"
5. Then proceed to the next planned question.`
    : previousAnswerQuality === "adequate"
      ? `The candidate gave an adequate answer. To push them further:
1. Give brief positive feedback on what was good.
2. Ask ONE follow-up that raises the bar: "What would you do differently now?" or "How did that impact the broader team/org?"
3. Then move to the next question.`
      : `The candidate gave a strong answer. Briefly acknowledge the strength (1 sentence) and escalate difficulty for the next question.`
}`
    : "";

  return `You are a senior hiring manager conducting a ${interviewType} interview for a ${targetRole} position at a top company.

YOUR BEHAVIOR:
- Ask ONE question at a time — never multiple questions at once.
- After the candidate answers, give brief 1-2 sentence feedback on what was strong and what was missing, then ask the next question.
- Questions should escalate in depth. Start with easier situational questions, move to challenging behavioral ones.
- For behavioral questions, expect STAR format (Situation, Task, Action, Result). Prompt them if they miss it.
- Keep your tone professional but encouraging — like a real interviewer who wants the candidate to succeed.
- Do NOT give long lectures. Be concise after each answer.
- When an answer is vague or generic, ALWAYS probe deeper before moving on. Real interviewers dig into specifics.

INTERVIEW STRUCTURE:
- Questions 1-2: Warm-up (motivation, background fit for ${targetRole})
- Questions 3-4: Core competency (role-specific behavioral/situational)
- Question 5: Challenging scenario (complex problem or conflict)

${isFirst ? `This is the START of the interview. Briefly introduce yourself as a hiring manager (1 sentence), state this is a ${interviewType} interview for ${targetRole}, and immediately ask Question 1. Do not explain the format — just start.` : `Continue the interview naturally. Give brief feedback on their last answer, then ask the next question.`}${jdSection}${gapSection}${adaptiveSection}`;
}

function buildFeedbackPrompt(
  targetRole: string,
  jobDescription?: string,
  skillGaps?: { skill: string; priority: string }[]
): string {
  const jdSection = jobDescription
    ? `\n\nJOB DESCRIPTION THE CANDIDATE IS TARGETING:
"""
${jobDescription.slice(0, 4000)}
"""

CRITICAL: Score the candidate against the SPECIFIC requirements in this job description. In your debrief:
- Map their demonstrated skills to the JD's listed requirements.
- Call out which JD requirements they addressed well and which they missed.
- In "Areas to Improve", focus on gaps relative to this specific JD.
- In "JD Fit Score", rate how well their answers demonstrate readiness for THIS specific role.`
    : "";

  const gapSection = skillGaps?.length
    ? `\n\nKNOWN SKILL GAPS (from their assessment):
${skillGaps.map((g) => `- ${g.skill} (${g.priority} priority)`).join("\n")}
In your debrief, specifically note:
- Which gaps were visible in their interview answers.
- Which gaps they successfully compensated for with adjacent experience.
- 1-2 gaps they should prioritize addressing before a real interview.`
    : "";

  return `You are a senior hiring manager who just completed a mock interview for a ${targetRole} candidate.

Generate a structured interview debrief with:

**Overall Impression** (2-3 sentences on their overall performance)

**Strengths** (3 bullet points with specific examples from their answers)

**Areas to Improve** (3 bullet points with concrete advice)
${jobDescription ? `\n**JD Fit Score**: X/10 — How well do their answers match the specific job requirements? List 2-3 JD requirements they demonstrated and 2-3 they should prepare for.\n` : ""}
${skillGaps?.length ? `**Gap Assessment**: Which of their known skill gaps showed in the interview? What compensating strengths did they demonstrate?\n` : ""}
**Answer Quality Breakdown**:
- Specificity: X/10 — Did they use concrete examples with numbers, timelines, team sizes?
- Structure: X/10 — Did they follow STAR or a clear narrative arc?
- Role Relevance: X/10 — Were examples relevant to ${targetRole} responsibilities?
- Depth: X/10 — Did they go beyond surface-level descriptions into decision-making and impact?

**Recommended Practice** (2-3 specific resources, question types, or frameworks to practice)

**Hiring Recommendation**: Would you advance them? (Yes / Maybe with coaching / Not yet — with brief reason)

Be honest but constructive. Reference specific answers from the conversation. End with one sentence of encouragement.${jdSection}${gapSection}`;
}
