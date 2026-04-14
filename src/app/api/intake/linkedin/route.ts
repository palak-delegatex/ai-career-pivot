import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const ProfileSchema = z.object({
  currentTitle: z.string().optional(),
  currentIndustry: z.string().optional(),
  yearsExperience: z.number().optional(),
  skills: z.array(z.string()),
  transferableSkills: z.array(z.string()),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    startYear: z.number(),
    endYear: z.number().nullable(),
    description: z.string(),
  })),
  education: z.array(z.object({
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    year: z.number().nullable(),
  })),
  certifications: z.array(z.string()),
  interests: z.array(z.string()),
  rawSummary: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { linkedinUrl, email } = await req.json();

  if (!linkedinUrl || !email) {
    return NextResponse.json({ error: "linkedinUrl and email required" }, { status: 400 });
  }

  const proxycurlKey = process.env.PROXYCURL_API_KEY;
  if (!proxycurlKey) {
    return NextResponse.json(
      { error: "LinkedIn parsing is not yet configured. Please upload your resume instead." },
      { status: 503 }
    );
  }

  // Fetch LinkedIn profile via Proxycurl
  const proxycurlRes = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&fallback_to_cache=on-error&use_cache=if-recent`,
    { headers: { Authorization: `Bearer ${proxycurlKey}` } }
  );

  if (!proxycurlRes.ok) {
    return NextResponse.json(
      { error: "Could not fetch LinkedIn profile. Check that your profile is public." },
      { status: 502 }
    );
  }

  const raw = await proxycurlRes.json();

  // Use Claude to extract structured profile from Proxycurl JSON
  const { output: profile } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: ProfileSchema }),
    prompt: `Extract a structured career profile from this LinkedIn data. Identify transferable skills that would be valuable in a career change context.

LinkedIn data:
${JSON.stringify(raw, null, 2)}`,
  });

  return NextResponse.json({ profile, linkedinUrl });
}
