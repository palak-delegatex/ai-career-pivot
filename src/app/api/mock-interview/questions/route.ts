import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const GeneratedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      type: z.enum(["behavioral", "technical"]),
      category: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      skillTargeted: z.string(),
      whyThisQuestion: z.string(),
      starHint: z.string(),
    })
  ),
});

export type GeneratedQuestions = z.infer<typeof GeneratedQuestionsSchema>;

export async function POST(req: NextRequest) {
  const {
    targetRole,
    currentRole,
    skillGaps,
    skills,
    count = 5,
  }: {
    targetRole: string;
    currentRole?: string;
    skillGaps?: { skill: string; currentLevel: string; requiredLevel: string; priority: string }[];
    skills?: string[];
    count?: number;
  } = await req.json();

  if (!targetRole) {
    return NextResponse.json({ error: "targetRole required" }, { status: 400 });
  }

  const gapSection = skillGaps?.length
    ? `\nSKILL GAPS (from gap analysis — focus questions here):\n${skillGaps
        .map((g) => `- ${g.skill}: current=${g.currentLevel}, required=${g.requiredLevel}, priority=${g.priority}`)
        .join("\n")}`
    : "";

  const skillsSection = skills?.length
    ? `\nEXISTING SKILLS: ${skills.join(", ")}`
    : "";

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: GeneratedQuestionsSchema }),
      prompt: `Generate ${count} interview questions for a candidate transitioning to a ${targetRole} role.${currentRole ? ` They are currently a ${currentRole}.` : ""}
${gapSection}${skillsSection}

REQUIREMENTS:
- Mix of behavioral (60%) and technical (40%) questions.
- If skill gaps are provided, generate questions that specifically probe those weak areas — e.g., if they listed Python as a new skill, ask a behavioral question about learning Python or a technical question that tests Python knowledge relevant to ${targetRole}.
- Questions should escalate in difficulty: start with 1-2 easy, then 2-3 medium, then 1 hard.
- Each question must include a starHint with guidance for structuring a STAR answer.
- whyThisQuestion should explain why this specific question targets their gap or transition.
- Make questions specific to the ${targetRole} role, not generic.`,
    });

    if (!output) {
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    return NextResponse.json(output);
  } catch {
    return NextResponse.json({ error: "Question generation failed" }, { status: 500 });
  }
}
