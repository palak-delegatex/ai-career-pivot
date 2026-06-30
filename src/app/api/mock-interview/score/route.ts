import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const ScoreSchema = z.object({
  relevance: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
  }),
  starStructure: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
    sectionScores: z.object({
      situation: z.number().min(0).max(10),
      task: z.number().min(0).max(10),
      action: z.number().min(0).max(10),
      result: z.number().min(0).max(10),
    }),
  }),
  specificity: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
  }),
  overallScore: z.number().min(0).max(10),
  improvements: z.array(z.string()).min(2).max(3),
  strengths: z.array(z.string()).min(1).max(2),
  rewriteHint: z.string(),
});

export type ScoreResult = z.infer<typeof ScoreSchema>;

export async function POST(req: NextRequest) {
  const {
    question,
    answer,
    targetRole,
  }: {
    question: string;
    answer: { situation: string; task: string; action: string; result: string };
    targetRole: string;
  } = await req.json();

  if (!question || !answer || !targetRole) {
    return NextResponse.json(
      { error: "question, answer, and targetRole required" },
      { status: 400 }
    );
  }

  const fullAnswer = [
    answer.situation && `**Situation:** ${answer.situation}`,
    answer.task && `**Task:** ${answer.task}`,
    answer.action && `**Action:** ${answer.action}`,
    answer.result && `**Result:** ${answer.result}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: ScoreSchema }),
      prompt: `You are an expert interview coach scoring a candidate's STAR-format answer for a ${targetRole} position.

INTERVIEW QUESTION:
"${question}"

CANDIDATE'S ANSWER:
${fullAnswer}

Score the answer on three dimensions (0-10 each):

1. **Relevance** (0-10): How well does the answer address the specific question asked? Does it demonstrate skills relevant to the ${targetRole} role?

2. **STAR Structure** (0-10): How well does the answer follow the STAR framework?
   - Situation: Is the context clear and concise? (score 0-10)
   - Task: Is the candidate's specific responsibility clear? (score 0-10)
   - Action: Are the candidate's specific actions detailed? This is the most important section. (score 0-10)
   - Result: Are outcomes quantified with metrics where possible? (score 0-10)

3. **Specificity** (0-10): Does the answer include concrete details, numbers, metrics, timelines, and specific examples rather than vague generalities?

Scoring guide:
- 0-3: Missing or irrelevant
- 4-5: Basic but lacks depth
- 6-7: Good with room for improvement
- 8-9: Strong and well-structured
- 10: Exceptional, would impress any interviewer

Provide 2-3 specific improvement suggestions and 1-2 strengths. The rewriteHint should be a single sentence suggesting how to strengthen the weakest section.

Be honest but constructive. Score strictly — most answers should be 5-7.`,
    });

    if (!output) {
      return NextResponse.json({ error: "Failed to generate score" }, { status: 500 });
    }

    return NextResponse.json(output);
  } catch {
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
