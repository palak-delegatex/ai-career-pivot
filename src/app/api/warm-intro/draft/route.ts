import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { getSupabaseClient } from "@/lib/supabase";
import { hasPaidAccess } from "@/lib/entitlement";
import { localeSystemPrompt } from "@/lib/locale";

// Warm-Intro drafted ask (AIC-769) — the paid deliverable. Generates a short,
// personalized referral-request message the user can send to a known contact at
// a target company. Reuses the same LLM tailoring stack as resume/cover-letter.

export async function POST(req: NextRequest) {
  const { email, jobId, contactId, locale } = await req.json();
  if (!email || !jobId || !contactId) {
    return NextResponse.json(
      { error: "email, jobId and contactId required" },
      { status: 400 }
    );
  }

  // Paywall: the drafted ask is the conversion mechanism.
  if (!(await hasPaidAccess(email))) {
    return NextResponse.json(
      { error: "payment required", code: "paywall" },
      { status: 402 }
    );
  }

  const supabase = getSupabaseClient();
  const [{ data: job }, { data: contact }] = await Promise.all([
    supabase
      .from("tracked_jobs")
      .select("role, company, job_description")
      .eq("id", jobId)
      .eq("user_email", email)
      .single(),
    supabase
      .from("contacts")
      .select("name, role, company, strength_tier")
      .eq("id", contactId)
      .eq("user_email", email)
      .single(),
  ]);

  if (!job || !contact) {
    return NextResponse.json(
      { error: "job or contact not found" },
      { status: 404 }
    );
  }

  // Personalize with the user's own background from their latest report, if any.
  const { data: reports } = await supabase
    .from("reports")
    .select("profile")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  const profile = (reports?.[0]?.profile ?? {}) as {
    name?: string;
    currentTitle?: string;
    targetRole?: string;
    skills?: string[];
  };

  const background = [
    profile.name && `Name: ${profile.name}`,
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.targetRole && `Target role: ${profile.targetRole}`,
    profile.skills?.length &&
      `Key skills: ${profile.skills.slice(0, 12).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const jd = (job.job_description ?? "").slice(0, 2500);

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      prompt: `You are a career-networking coach helping a job seeker write a SHORT, warm referral-request message to someone they already know at a target company.

THE SENDER (job seeker):
${background || "(background not provided — keep the ask role-focused, specific, and humble)"}

THE RECIPIENT (an existing contact at the company):
Name: ${contact.name}
Role: ${contact.role || "unknown"}
Company: ${contact.company}
Relationship strength: ${contact.strength_tier}

THE OPPORTUNITY:
Role: ${job.role} at ${job.company}
${jd ? `Job description (excerpt):\n"""\n${jd}\n"""` : ""}

Write the message the sender will send to ${contact.name} (LinkedIn DM or email). Requirements:
- 90-150 words. Friendly, genuine, specific — NOT a cold template.
- Open by reconnecting naturally for a "${contact.strength_tier}" tie: warmer and more casual for strong ties; a brief reintroduction with context for weaker ("new"/"cold") ties.
- Reference the specific role and 1-2 real reasons the sender is a fit, drawn ONLY from the background and JD above.
- Make ONE clear, low-friction ask: a referral, or a quick chat / insider read on the team.
- Respect their time and give them an easy out.
- No placeholders like [Name] — use the real names. Plain text, no markdown headings. Do not invent facts about the sender.${localeSystemPrompt(locale)}`,
    });

    return NextResponse.json({ message: text.trim() });
  } catch (err) {
    console.error("Warm intro draft error:", err);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
