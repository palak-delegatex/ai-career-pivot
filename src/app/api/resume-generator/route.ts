import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export async function POST(req: NextRequest) {
  const {
    mode,
    targetRole,
    jobDescription,
    template,
    tone,
    profile,
    plan,
  }: {
    mode: "resume" | "cover-letter";
    targetRole: string;
    jobDescription?: string;
    template?: "professional" | "modern" | "minimal";
    tone?: "professional" | "conversational" | "bold";
    profile: {
      name?: string;
      email?: string;
      currentTitle?: string;
      skills: string[];
      transferableSkills?: string[];
      experience?: { title: string; company: string; startYear: number; endYear: number | null; description: string }[];
      education?: { degree: string; field: string; institution: string; year: number | null }[];
      certifications?: string[];
    };
    plan?: {
      targetRole: string;
      targetIndustry: string;
      skillGaps?: { skill: string; currentLevel: string; requiredLevel: string }[];
    };
  } = await req.json();

  if (!targetRole || !profile?.skills?.length) {
    return new Response(
      JSON.stringify({ error: "targetRole and profile with skills are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const profileSection = [
    profile.name && `Name: ${profile.name}`,
    profile.email && `Email: ${profile.email}`,
    profile.currentTitle && `Current title: ${profile.currentTitle}`,
    `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length && `Transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Work experience:\n${profile.experience
        .map((e) => `- ${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "Present"}): ${e.description}`)
        .join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education.map((e) => `- ${e.degree} in ${e.field}, ${e.institution}${e.year ? ` (${e.year})` : ""}`).join("\n")}`,
    profile.certifications?.length && `Certifications: ${profile.certifications.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const jdSection = jobDescription?.trim()
    ? `\n\nTARGET JOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 4000)}\n"""\n\nCRITICAL: Tailor every bullet point, skill mention, and achievement to match this specific job description. Mirror its language, prioritize its stated requirements, and weave in its keywords naturally.`
    : "";

  const systemPrompt =
    mode === "resume"
      ? buildResumePrompt(targetRole, profileSection, jdSection, template)
      : buildCoverLetterPrompt(targetRole, profileSection, jdSection, profile.name, tone);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          mode === "resume"
            ? "Generate my optimized resume now."
            : "Generate my tailored cover letter now.",
      },
    ],
  });

  return result.toTextStreamResponse();
}

function buildResumePrompt(
  targetRole: string,
  profile: string,
  jdSection: string,
  template?: "professional" | "modern" | "minimal"
): string {
  const templateInstructions = {
    professional: "Use a traditional, corporate-friendly format with clear section dividers. Formal language, conservative structure.",
    modern: "Use a contemporary layout with subtle stylistic touches. Slightly more personality in language while staying professional.",
    minimal: "Use an ultra-clean, streamlined format. Short bullet points, no filler, maximum information density.",
  };
  const styleGuide = templateInstructions[template ?? "professional"];

  return `You are a professional resume writer who specializes in career pivots and ATS optimization. Generate a complete, ATS-optimized resume for this candidate targeting a ${targetRole} position.

STYLE: ${styleGuide}

CANDIDATE PROFILE:
${profile}${jdSection}

RESUME REQUIREMENTS:
- Use clean, ATS-friendly formatting with clear section headers
- Output in Markdown format with proper structure
- Include sections: PROFESSIONAL SUMMARY, SKILLS, WORK EXPERIENCE, EDUCATION, CERTIFICATIONS (if applicable)
- Professional summary: 3-4 lines positioning the candidate for the target role, highlighting transferable skills
- Skills section: organized by category (Technical Skills, Domain Skills, Soft Skills), prioritize skills matching the target role
- Work experience: reframe each role's achievements to emphasize relevance to ${targetRole}
- Use strong action verbs (Led, Developed, Implemented, Optimized, etc.)
- Include quantifiable metrics wherever possible (%, $, time saved, team size, etc.)
- If metrics aren't provided, create realistic placeholders marked with [X] for the user to fill in
- Education: include relevant coursework or projects if helpful for the pivot
- Keep to 1-2 pages equivalent content

ATS OPTIMIZATION:
- Use standard section headings that ATS systems recognize
- Include relevant keywords naturally throughout
- Avoid tables, columns, graphics, or special characters
- Use reverse chronological order for experience
- Spell out acronyms on first use`;
}

function buildCoverLetterPrompt(
  targetRole: string,
  profile: string,
  jdSection: string,
  name?: string,
  tone?: "professional" | "conversational" | "bold"
): string {
  const toneInstructions = {
    professional: "Professional tone — confident but not arrogant. Formal language, polished structure.",
    conversational: "Conversational tone — warm, personable, and approachable. Write as if speaking to a colleague, while maintaining professionalism.",
    bold: "Bold tone — confident, assertive, and direct. Lead with strong claims backed by evidence. Show conviction about the value you bring.",
  };
  const toneGuide = toneInstructions[tone ?? "professional"];

  return `You are a professional cover letter writer who specializes in career pivots. Generate a compelling, tailored cover letter for ${name || "the candidate"} targeting a ${targetRole} position.

CANDIDATE PROFILE:
${profile}${jdSection}

COVER LETTER REQUIREMENTS:
- Output in Markdown format
- ${toneGuide}
- 3-4 paragraphs, approximately 300-400 words
- Opening: Hook that connects the candidate's background to the target role. No generic "I'm writing to apply" openings.
- Body paragraph 1: Highlight the most relevant transferable skills and achievements with specific examples. If a JD is provided, directly address its top 2-3 requirements.
- Body paragraph 2: Address the career pivot directly — frame it as a strength (unique perspective, diverse experience, fresh approach). Show awareness of the industry.
- Closing: Specific call to action, express enthusiasm for the specific company/role if JD is provided.
- Use specific achievements and metrics from their experience
- Mirror the language and priorities from the job description if provided
- Address any obvious gaps proactively (reframe as advantages)

Do NOT use placeholders like [Company Name] — if the JD mentions a company, use it. If not, write a generic version that works without a company name.`;
}
