import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { getSupabaseClient } from "@/lib/supabase";
import type { PivotPlan, UserProfile } from "@/lib/intake";

interface MilestoneProgress {
  phase: string;
  milestone_index: number;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
}

interface JobStats {
  total: number;
  applied: number;
  interviewing: number;
  offered: number;
}

interface NetworkStats {
  totalContacts: number;
  strongConnections: number;
  warmConnections: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  recentInteractionCount: number;
}

function buildSystemPrompt(
  profile: UserProfile,
  plan: PivotPlan,
  progress: MilestoneProgress[],
  priorMessages: { role: string; content: string }[],
  jobStats: JobStats,
  networkStats: NetworkStats
): string {
  const completedMilestones = progress.filter((m) => m.completed);
  const totalMilestones =
    plan.sixMonthMilestones.length +
    plan.oneYearMilestones.length +
    plan.twoYearMilestones.length;
  const completionRate =
    totalMilestones > 0
      ? Math.round((completedMilestones.length / totalMilestones) * 100)
      : 0;

  const completedByPhase = {
    "6 months": completedMilestones
      .filter((m) => m.phase === "6 months")
      .map((m) => plan.sixMonthMilestones[m.milestone_index])
      .filter(Boolean),
    "1 year": completedMilestones
      .filter((m) => m.phase === "1 year")
      .map((m) => plan.oneYearMilestones[m.milestone_index])
      .filter(Boolean),
    "2 years": completedMilestones
      .filter((m) => m.phase === "2 years")
      .map((m) => plan.twoYearMilestones[m.milestone_index])
      .filter(Boolean),
  };

  let priorContext = "";
  if (priorMessages.length > 0) {
    const recent = priorMessages.slice(-10);
    priorContext = `\n\nPRIOR CONVERSATION CONTEXT (last ${recent.length} messages):\n${recent
      .map((m) => `${m.role === "user" ? "User" : "Advisor"}: ${m.content}`)
      .join("\n")}`;
  }

  return `You are the user's personal Career Coach — a supportive, specific, and actionable coaching partner. You previously created their career pivot roadmap and you're now conducting ongoing coaching sessions to help them stay on track, build momentum, and overcome obstacles.

VOICE & STYLE:
- Supportive and warm, but direct and actionable. You're a coach who cares deeply about their success.
- Always reference their specific background, milestones, skill gaps, and progress by name — never give generic advice.
- Keep responses concise (2-4 paragraphs max) unless the user asks for detail.
- When suggesting adjustments, explain the tradeoff clearly.
- Celebrate wins, no matter how small. Acknowledge setbacks without judgment.
- Ask follow-up questions to deepen the conversation — don't just give advice and stop.
- Connect advice back to their specific plan milestones and timeline.

USER PROFILE:
- Name: ${profile.name ?? "Not specified"}
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Top skills: ${profile.skills.slice(0, 8).join(", ")}
- Transferable skills: ${profile.transferableSkills.slice(0, 6).join(", ")}
${profile.circumstances?.timeline ? `- Desired timeline: ${profile.circumstances.timeline}` : ""}
${profile.circumstances?.riskTolerance ? `- Risk tolerance: ${profile.circumstances.riskTolerance}` : ""}

ACTIVE CAREER PLAN:
- Target Role: ${plan.targetRole}
- Target Industry: ${plan.targetIndustry}
- Rationale: ${plan.rationale}
- Estimated transition: ${plan.estimatedTimeToTransition}
- Match score: ${plan.matchScore}/100

MILESTONE PROGRESS (${completionRate}% complete, ${completedMilestones.length}/${totalMilestones}):
${
  completedByPhase["6 months"].length > 0
    ? `Completed (6 months): ${completedByPhase["6 months"].join("; ")}`
    : "6-month milestones: none completed yet"
}
${
  completedByPhase["1 year"].length > 0
    ? `Completed (1 year): ${completedByPhase["1 year"].join("; ")}`
    : ""
}
${
  completedByPhase["2 years"].length > 0
    ? `Completed (2 years): ${completedByPhase["2 years"].join("; ")}`
    : ""
}

Upcoming milestones:
- 6 months: ${plan.sixMonthMilestones.join("; ")}
- 1 year: ${plan.oneYearMilestones.join("; ")}
- 2 years: ${plan.twoYearMilestones.join("; ")}

${
  (plan.skillGaps ?? []).length > 0
    ? `SKILL GAPS TO CLOSE:\n${plan.skillGaps!.map((g) => `- ${g.skill}: ${g.currentLevel} → ${g.requiredLevel} (${g.priority} priority)`).join("\n")}`
    : ""
}
${priorContext}

## Job Search Activity
${jobStats.total > 0 ? `The user is tracking ${jobStats.total} job applications: ${jobStats.applied} applied, ${jobStats.interviewing} in interview stage, ${jobStats.offered} with offers.` : "The user hasn't started tracking job applications yet. Encourage them to use the Job Tracker."}

## Networking Progress
${networkStats.totalContacts > 0 ? `The user has ${networkStats.totalContacts} contacts in their network (${networkStats.strongConnections} strong, ${networkStats.warmConnections} warm). They have ${networkStats.pendingFollowUps} pending follow-ups${networkStats.overdueFollowUps > 0 ? ` (${networkStats.overdueFollowUps} overdue!)` : ""}.` : "The user hasn't added any networking contacts yet. Career pivots are relationship-driven — encourage them to start building their network."}
${networkStats.recentInteractionCount > 0 ? `They've logged ${networkStats.recentInteractionCount} recent networking interactions — acknowledge their effort.` : ""}

INSTRUCTIONS:
1. If this is the first follow-up, greet them by name, acknowledge their progress (${completionRate}% complete), and ask what they'd like to focus on.
2. If they report progress, celebrate it and suggest the next logical milestone.
3. If they're stuck, help them break the obstacle into smaller steps. Suggest specific AI tools or resources from their plan.
4. If their circumstances changed (new job, different timeline, etc.), help adjust the plan accordingly.
5. When the user seems stuck or asks what to do next, check their job tracker and networking stats to give specific advice like "You have 3 overdue follow-ups — reaching out to your warm contacts could unlock referrals" or "You've applied to 5 jobs but haven't started networking — informational interviews could triple your response rate."
6. Always end with a clear, actionable next step.`;
}

export async function POST(req: NextRequest) {
  const { reportId, planIndex, messages, sessionId } = await req.json();

  if (!reportId || !messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabaseClient();

  const { data: report } = await supabase
    .from("reports")
    .select("profile, plans")
    .eq("id", reportId)
    .single();

  if (!report) {
    return new Response(JSON.stringify({ error: "Report not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const profile = report.profile as UserProfile;
  const plans = report.plans as PivotPlan[];
  const plan = plans[planIndex ?? 0];

  if (!plan) {
    return new Response(JSON.stringify({ error: "Plan not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = profile.email ?? "";

  // Fetch all context data in parallel
  const [
    { data: progressData },
    sessionResult,
    jobTrackerRes,
    contactsRes,
    remindersRes,
    interactionsRes,
  ] = await Promise.all([
    supabase
      .from("milestone_progress")
      .select("phase, milestone_index, completed, notes, completed_at")
      .eq("report_id", reportId)
      .eq("plan_index", planIndex ?? 0),
    sessionId
      ? supabase
          .from("conversation_sessions")
          .select("messages")
          .eq("id", sessionId)
          .single()
      : Promise.resolve({ data: null }),
    // Job tracker stats
    supabase
      .from("tracked_jobs")
      .select("id, status, company, role")
      .eq("user_email", email),
    // Networking stats
    supabase
      .from("contacts")
      .select("id, strength_tier")
      .eq("user_email", email),
    supabase
      .from("follow_up_reminders")
      .select("id, due_date, status")
      .eq("user_email", email)
      .eq("status", "pending"),
    // Recent interactions
    supabase
      .from("contact_interactions")
      .select("id, type, occurred_at")
      .eq("user_email", email)
      .order("occurred_at", { ascending: false })
      .limit(10),
  ]);

  const priorMessages = (sessionResult?.data as { messages?: { role: string; content: string }[] } | null)?.messages ?? [];

  const trackedJobs = jobTrackerRes.data ?? [];
  const contacts = contactsRes.data ?? [];
  const pendingReminders = remindersRes.data ?? [];
  const recentInteractions = interactionsRes.data ?? [];

  const jobStats: JobStats = {
    total: trackedJobs.length,
    applied: trackedJobs.filter((j) => j.status === "applied").length,
    interviewing: trackedJobs.filter((j) => j.status === "interviewing").length,
    offered: trackedJobs.filter((j) => j.status === "offered").length,
  };

  const networkStats: NetworkStats = {
    totalContacts: contacts.length,
    strongConnections: contacts.filter((c) => c.strength_tier === "strong").length,
    warmConnections: contacts.filter((c) => c.strength_tier === "warm").length,
    pendingFollowUps: pendingReminders.length,
    overdueFollowUps: pendingReminders.filter(
      (r) => new Date(r.due_date) < new Date()
    ).length,
    recentInteractionCount: recentInteractions.length,
  };

  const systemPrompt = buildSystemPrompt(
    profile,
    plan,
    (progressData ?? []) as MilestoneProgress[],
    priorMessages,
    jobStats,
    networkStats
  );

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  return result.toTextStreamResponse();
}
