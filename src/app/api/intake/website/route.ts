import { NextRequest, NextResponse } from "next/server";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { z } from "zod";

const WebsiteContextSchema = z.object({
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  projects: z.array(z.string()),
  additionalContext: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { websiteUrl, email } = await req.json();

  if (!websiteUrl || !email) {
    return NextResponse.json({ error: "websiteUrl and email required" }, { status: 400 });
  }

  let pageText: string;
  try {
    const res = await fetch(websiteUrl, {
      headers: { "User-Agent": "AICareerPivot-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    // Strip HTML tags to get readable text
    pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit to avoid token overflow
  } catch {
    return NextResponse.json(
      { error: "Could not fetch that URL. Make sure it is publicly accessible." },
      { status: 502 }
    );
  }

  const { output: context } = await generateText({
    model: gateway("anthropic/claude-haiku-4.5"),
    output: Output.object({ schema: WebsiteContextSchema }),
    prompt: `Extract career-relevant context from this personal website or portfolio page. Focus on skills demonstrated, projects built, interests shown, and anything that reveals professional expertise or passions.

Page content:
${pageText}`,
  });

  return NextResponse.json({ context });
}
