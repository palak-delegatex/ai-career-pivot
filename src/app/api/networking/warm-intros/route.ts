import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase";

const WarmIntroSchema = z.object({
  connectionPaths: z.array(
    z.object({
      pathType: z.enum([
        "alumni",
        "former-colleague",
        "industry-peer",
        "community",
        "second-degree",
      ]),
      description: z.string(),
      strength: z.enum(["strong", "moderate", "speculative"]),
      actionSteps: z.array(z.string()),
      suggestedContact: z.object({
        name: z.string(),
        inferredRole: z.string(),
        company: z.string(),
        connectionReason: z.string(),
      }),
    })
  ),
  outreachTemplates: z.array(
    z.object({
      templateType: z.enum([
        "alumni-intro",
        "mutual-connection",
        "cold-warm",
        "informational-interview",
        "referral-request",
      ]),
      subject: z.string(),
      body: z.string(),
      tips: z.array(z.string()),
    })
  ),
  strategy: z.object({
    warmestPath: z.string(),
    estimatedResponseRate: z.string(),
    recommendedApproach: z.string(),
    timingAdvice: z.string(),
  }),
});

export type WarmIntroResult = z.infer<typeof WarmIntroSchema>;

export async function POST(req: NextRequest) {
  const { email, targetCompany, targetRole } = await req.json();

  if (!email || !targetCompany) {
    return NextResponse.json(
      { error: "email and targetCompany are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const [profileRes, contactsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("raw_json")
      .eq("email", email)
      .single(),
    supabase
      .from("contacts")
      .select("name, company, role, strength_tier, linkedin_url, tags")
      .eq("user_email", email)
      .order("strength_score", { ascending: false })
      .limit(50),
  ]);

  const profile = profileRes.data?.raw_json;
  const existingContacts = contactsRes.data ?? [];

  const profileContext = profile
    ? `
USER BACKGROUND:
- Current role: ${profile.currentTitle || "Not specified"}
- Industry: ${profile.currentIndustry || "Not specified"}
- Years of experience: ${profile.yearsExperience || "Not specified"}
- Skills: ${(profile.skills || []).join(", ") || "None listed"}
- Education: ${(profile.education || []).map((e: { degree: string; field: string; institution: string; year: number | null }) => `${e.degree} in ${e.field} from ${e.institution} (${e.year || "N/A"})`).join("; ") || "None listed"}
- Work history: ${(profile.experience || []).map((e: { title: string; company: string; startYear: number; endYear: number | null }) => `${e.title} at ${e.company} (${e.startYear}-${e.endYear || "present"})`).join("; ") || "None listed"}
- LinkedIn: ${profile.linkedinUrl || "Not provided"}`
    : "USER BACKGROUND: No profile data available — provide general warm intro strategies.";

  const contactsContext =
    existingContacts.length > 0
      ? `
EXISTING NETWORK (${existingContacts.length} contacts):
${existingContacts
  .filter((c) => c.company || c.role)
  .slice(0, 30)
  .map(
    (c) =>
      `- ${c.name}${c.role ? ` (${c.role})` : ""}${c.company ? ` at ${c.company}` : ""} [${c.strength_tier}]`
  )
  .join("\n")}`
      : "EXISTING NETWORK: No contacts in CRM yet.";

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: WarmIntroSchema }),
      prompt: `You are an expert career networking strategist. Analyze the user's background and existing network to find warm introduction paths to ${targetCompany}${targetRole ? ` for a ${targetRole} role` : ""}.

${profileContext}

${contactsContext}

TARGET: ${targetCompany}${targetRole ? ` — ${targetRole} role` : ""}

Generate a comprehensive warm intro strategy:

1. CONNECTION PATHS (3-5): Identify the most promising paths to get a warm introduction at ${targetCompany}. For each path:
   - Determine the type: alumni connection (shared school), former colleague (shared employer), industry peer (same field/community), community connection (shared group/event), or second-degree (through existing contacts)
   - Assess the strength: "strong" (direct shared experience), "moderate" (indirect but credible), or "speculative" (plausible but needs verification)
   - Suggest a specific contact persona (realistic name, role, and why they'd be receptive)
   - Provide concrete action steps to activate this path

   IMPORTANT: Cross-reference the user's education, work history, and existing contacts to find REAL overlap with ${targetCompany}. Alumni from the same institution who work there, former colleagues who moved there, contacts who know people there.

2. OUTREACH TEMPLATES (4-5): Generate ready-to-send email templates for different scenarios:
   - Alumni intro (leveraging shared school)
   - Mutual connection request (asking existing contact for intro)
   - Cold-warm outreach (no direct connection but shared context)
   - Informational interview request (learning about the company)
   - Referral request (asking for internal referral)

   Each template should be personalized to the user's actual background and the target company. Include subject lines. Keep emails concise (under 150 words), professional but warm, with a clear and specific ask.

3. STRATEGY: Overall recommendation for the warmest path, expected response rate, recommended approach order, and timing advice.

Make templates feel genuine, not generic. Reference specific shared experiences where possible.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate warm intro analysis" },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Warm intro analysis error:", err);
    return NextResponse.json(
      { error: "Failed to generate warm intro analysis" },
      { status: 500 }
    );
  }
}
