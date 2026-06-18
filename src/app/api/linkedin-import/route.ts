import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, Output } from "ai";
import { z } from "zod";

const LinkedInProfileSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  currentTitle: z.string().optional(),
  currentIndustry: z.string().optional(),
  yearsExperience: z.number().optional(),
  skills: z.array(z.string()),
  transferableSkills: z.array(z.string()),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      startYear: z.number(),
      endYear: z.number().nullable(),
      description: z.string(),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      field: z.string(),
      institution: z.string(),
      year: z.number().nullable(),
    })
  ),
  certifications: z.array(z.string()),
  interests: z.array(z.string()),
});

type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleDataExport(req);
  }
  return handleUrlOrGenerate(req);
}

async function handleUrlOrGenerate(req: NextRequest) {
  const body = await req.json();

  if (body.action === "generate") {
    return generateResumeDraft(body.profile, body.targetRole);
  }

  return handleUrlImport(body);
}

async function handleUrlImport(body: {
  linkedinUrl?: string;
  pastedData?: string;
}) {
  const { linkedinUrl, pastedData } = body;

  if (!linkedinUrl && !pastedData) {
    return NextResponse.json(
      { error: "Provide a LinkedIn URL or paste your profile data." },
      { status: 400 }
    );
  }

  if (pastedData) {
    return parseTextProfile(pastedData);
  }

  if (!/linkedin\.com\/(in|pub)\/[^/]+/i.test(linkedinUrl!)) {
    return NextResponse.json(
      {
        error:
          "That doesn't look like a LinkedIn profile URL. It should look like linkedin.com/in/yourname.",
      },
      { status: 400 }
    );
  }

  const proxycurlKey = process.env.PROXYCURL_API_KEY;
  if (!proxycurlKey) {
    return NextResponse.json(
      {
        error:
          "LinkedIn URL import is not configured. Please paste your profile data or upload a LinkedIn data export instead.",
      },
      { status: 503 }
    );
  }

  const proxycurlRes = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl!)}&fallback_to_cache=on-error&use_cache=if-recent`,
    { headers: { Authorization: `Bearer ${proxycurlKey}` } }
  );

  if (!proxycurlRes.ok) {
    const status = proxycurlRes.status;
    if (status === 404) {
      return NextResponse.json(
        {
          error:
            "LinkedIn profile not found. Double-check the URL and make sure your profile is public.",
        },
        { status: 404 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "We're experiencing high demand. Please try again in a minute, or paste your profile data instead.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Could not fetch your LinkedIn profile. Make sure your profile is set to public, or paste your data instead.",
      },
      { status: 502 }
    );
  }

  const raw = await proxycurlRes.json();

  const { output: profile } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema: LinkedInProfileSchema }),
    prompt: `Extract a structured career profile from this LinkedIn data. Identify all skills (both listed and implied from experience), transferable skills valuable in a career change, and comprehensive work descriptions.

LinkedIn data:
${JSON.stringify(raw, null, 2)}`,
  });

  return NextResponse.json({ profile });
}

async function parseTextProfile(text: string) {
  const { output: profile } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema: LinkedInProfileSchema }),
    prompt: `Extract a structured career profile from this LinkedIn profile data. The user has pasted or uploaded their LinkedIn profile information. Extract all experience, education, skills, certifications, and other professional details. Identify transferable skills that would be valuable in a career change.

If the data is in CSV format (from LinkedIn data export), parse all columns appropriately. If it's plain text, extract what you can.

Profile data:
${text.slice(0, 15000)}`,
  });

  return NextResponse.json({ profile });
}

async function handleDataExport(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  const name = file.name.toLowerCase();
  const validExtensions = [".csv", ".json", ".zip", ".txt"];
  if (!validExtensions.some((ext) => name.endsWith(ext))) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Please upload a CSV, JSON, or ZIP file from your LinkedIn data export.",
      },
      { status: 400 }
    );
  }

  if (name.endsWith(".json")) {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const jsonStr =
        typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
      return parseTextProfile(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Could not parse JSON file." },
        { status: 400 }
      );
    }
  }

  const text = await file.text();
  return parseTextProfile(text);
}

function generateResumeDraft(
  profile: LinkedInProfile,
  targetRole?: string
) {
  const role = targetRole?.trim() || profile.currentTitle || "a new role";

  const profileSection = [
    profile.name && `Name: ${profile.name}`,
    profile.headline && `LinkedIn Headline: ${profile.headline}`,
    profile.currentTitle && `Current title: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience &&
      `Years of experience: ${profile.yearsExperience}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length &&
      `Transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Work experience:\n${profile.experience
        .map(
          (e) =>
            `- ${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "Present"}): ${e.description}`
        )
        .join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education
        .map(
          (e) =>
            `- ${e.degree} in ${e.field}, ${e.institution}${e.year ? ` (${e.year})` : ""}`
        )
        .join("\n")}`,
    profile.certifications?.length &&
      `Certifications: ${profile.certifications.join(", ")}`,
    profile.summary && `LinkedIn Summary:\n${profile.summary}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = `You are a professional resume writer who creates ATS-optimized resumes from LinkedIn profiles. Generate a complete, polished resume for this candidate${targetRole ? ` targeting a ${role} position` : ""}.

CANDIDATE PROFILE (from LinkedIn):
${profileSection}

RESUME REQUIREMENTS:
- Output in Markdown format with proper structure
- Include sections: PROFESSIONAL SUMMARY, SKILLS, WORK EXPERIENCE, EDUCATION, CERTIFICATIONS (if applicable)
- Professional summary: 3-4 lines highlighting the candidate's strongest qualifications and career trajectory
- Skills section: organized by category (Technical Skills, Domain Skills, Soft Skills)
- Work experience: reframe achievements with strong action verbs and quantifiable metrics
- Use reverse chronological order
- If metrics aren't provided, create realistic placeholders marked with [X] for the user to fill in
- Keep to 1-2 pages equivalent content
- Use standard section headings that ATS systems recognize
- Include relevant keywords naturally throughout
- Avoid tables, columns, graphics, or special characters`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: "Generate my optimized resume now.",
      },
    ],
  });

  return result.toTextStreamResponse();
}
