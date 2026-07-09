import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const PostType = z.enum([
  "open-to-work",
  "career-transition",
  "thought-leadership",
  "achievement",
  "industry-insight",
  "learning-journey",
]);

const LinkedInPostSchema = z.object({
  posts: z.array(
    z.object({
      title: z.string().describe("Internal label for the post variant — not displayed in the post itself"),
      content: z.string().describe("The full LinkedIn post text, ready to copy-paste. Include line breaks, emojis where appropriate, and a call-to-action"),
      hashtags: z.array(z.string()).describe("5-8 relevant hashtags"),
      bestTimeToPost: z.string().describe("Suggested day/time to post for maximum engagement"),
      estimatedEngagement: z.enum(["high", "medium", "low"]).describe("Expected engagement level based on post type and content"),
      tips: z.array(z.string()).describe("2-3 tips for maximizing this post's impact"),
    })
  ).describe("2-3 distinct post variants"),
});

export type LinkedInPostResult = z.infer<typeof LinkedInPostSchema>;

export async function POST(req: NextRequest) {
  const {
    postType,
    targetRole,
    currentRole,
    industry,
    keySkills,
    achievement,
    topic,
    tone,
  }: {
    postType: z.infer<typeof PostType>;
    targetRole: string;
    currentRole?: string;
    industry?: string;
    keySkills?: string[];
    achievement?: string;
    topic?: string;
    tone?: "professional" | "conversational" | "inspiring";
  } = await req.json();

  if (!postType || !targetRole) {
    return NextResponse.json(
      { error: "postType and targetRole are required" },
      { status: 400 },
    );
  }

  const validTypes = PostType.safeParse(postType);
  if (!validTypes.success) {
    return NextResponse.json(
      { error: `Invalid postType. Must be one of: ${PostType.options.join(", ")}` },
      { status: 400 },
    );
  }

  const toneGuide = tone === "conversational"
    ? "Write in a warm, personal, conversational tone. Use first person, short sentences, and relatable language."
    : tone === "inspiring"
      ? "Write in an inspiring, motivational tone. Share lessons learned and encourage others on similar journeys."
      : "Write in a professional but authentic tone. Balance authority with approachability.";

  const contextParts = [
    `Post type: ${postType}`,
    `Target role: ${targetRole}`,
    currentRole ? `Current/previous role: ${currentRole}` : null,
    industry ? `Industry: ${industry}` : null,
    keySkills?.length ? `Key skills: ${keySkills.join(", ")}` : null,
    achievement ? `Achievement to highlight: ${achievement}` : null,
    topic ? `Topic/theme: ${topic}` : null,
  ].filter(Boolean).join("\n");

  const typeInstructions: Record<string, string> = {
    "open-to-work": `Generate "open to work" announcement posts. These should:
- Announce the job search without sounding desperate
- Highlight transferable skills and what makes the candidate unique
- Include a clear ask (what kind of roles, what help is needed)
- End with a call-to-action for the network
- NOT use the generic "I'm looking for my next opportunity" opening`,

    "career-transition": `Generate career transition story posts. These should:
- Tell the narrative of moving from ${currentRole || "current field"} to ${targetRole}
- Frame the transition as a strength, not a weakness
- Highlight transferable skills and new perspectives
- Share a specific insight or lesson from the journey
- Inspire others considering similar transitions`,

    "thought-leadership": `Generate thought leadership posts about ${topic || "trends in " + (industry || targetRole + " field")}. These should:
- Share a non-obvious insight or contrarian take
- Back up claims with specific examples or data points
- Position the author as knowledgeable in ${targetRole} domain
- Invite discussion and different perspectives
- Be substantive, not generic platitudes`,

    "achievement": `Generate achievement/milestone posts. Achievement: ${achievement || "a recent professional accomplishment"}. These should:
- Share the achievement without humble-bragging
- Include the journey/struggle, not just the result
- Thank specific people or communities
- Extract a lesson others can learn from
- Be authentic and specific, not vague`,

    "industry-insight": `Generate industry insight posts about ${topic || industry || targetRole + " industry trends"}. These should:
- Share a specific trend, data point, or observation
- Add original analysis or perspective
- Connect the insight to practical implications
- Position the author as someone who stays current
- Invite others to share their observations`,

    "learning-journey": `Generate learning journey posts. These should:
- Share what the author is currently learning related to ${targetRole}
- Be vulnerable about the challenges of learning something new
- Share a specific tip, resource, or breakthrough moment
- Connect the learning to career goals
- Encourage others to share their learning journeys`,
  };

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: LinkedInPostSchema }),
      messages: [
        {
          role: "user",
          content: `You are a LinkedIn content strategist specializing in career transition content. Generate 2-3 LinkedIn post variants.

${contextParts}

${toneGuide}

${typeInstructions[postType] || typeInstructions["thought-leadership"]}

CRITICAL LINKEDIN BEST PRACTICES:
- First line is the hook — it must stop the scroll. No "I'm excited to announce" or "I'm thrilled to share".
- Use line breaks generously — walls of text get scrolled past.
- Keep posts between 150-300 words (the sweet spot for engagement).
- End with a question or call-to-action to drive comments.
- Use emojis sparingly and purposefully (1-3 per post, not every line).
- Write for the LinkedIn algorithm: posts with comments get 5x the reach.
- Each variant should take a different angle or hook to give the user options.`,
        },
      ],
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate LinkedIn posts" },
        { status: 422 },
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("LinkedIn post generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate LinkedIn posts" },
      { status: 500 },
    );
  }
}
