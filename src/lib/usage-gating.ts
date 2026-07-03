import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isBypassEmail } from "@/lib/stripe";

export type Plan = "free" | "report" | "lifetime";

export type Feature =
  | "gap_analysis"
  | "resume_generator"
  | "cover_letter"
  | "learning_resources"
  | "resume_pdf"
  | "ats_score"
  | "job_tracker"
  | "mock_interview"
  | "skills_assessment";

interface FeatureLimit {
  maxUses: number | null; // null = unlimited
  requiresPlan: Plan[];
}

const FEATURE_LIMITS: Record<Plan, Partial<Record<Feature, FeatureLimit>>> = {
  free: {
    gap_analysis: { maxUses: 1, requiresPlan: ["free", "report", "lifetime"] },
    ats_score: { maxUses: 1, requiresPlan: ["free", "report", "lifetime"] },
    resume_generator: { maxUses: 1, requiresPlan: ["free", "report", "lifetime"] },
    cover_letter: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    learning_resources: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    resume_pdf: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    job_tracker: { maxUses: 10, requiresPlan: ["free", "report", "lifetime"] },
    mock_interview: { maxUses: 1, requiresPlan: ["free", "report", "lifetime"] },
    skills_assessment: { maxUses: 1, requiresPlan: ["free", "report", "lifetime"] },
  },
  report: {
    gap_analysis: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    ats_score: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    resume_generator: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    cover_letter: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    learning_resources: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    resume_pdf: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    job_tracker: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    mock_interview: { maxUses: null, requiresPlan: ["report", "lifetime"] },
    skills_assessment: { maxUses: null, requiresPlan: ["report", "lifetime"] },
  },
  lifetime: {
    gap_analysis: { maxUses: null, requiresPlan: ["lifetime"] },
    ats_score: { maxUses: null, requiresPlan: ["lifetime"] },
    resume_generator: { maxUses: null, requiresPlan: ["lifetime"] },
    cover_letter: { maxUses: null, requiresPlan: ["lifetime"] },
    learning_resources: { maxUses: null, requiresPlan: ["lifetime"] },
    resume_pdf: { maxUses: null, requiresPlan: ["lifetime"] },
    job_tracker: { maxUses: null, requiresPlan: ["lifetime"] },
    mock_interview: { maxUses: null, requiresPlan: ["lifetime"] },
    skills_assessment: { maxUses: null, requiresPlan: ["lifetime"] },
  },
};

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
  currentUsage?: number;
  limit?: number | null;
}

export async function getUserPlan(email: string): Promise<Plan> {
  if (isBypassEmail(email)) return "lifetime";

  const supabase = getSupabaseAdmin();

  // Check user_plans table first
  const { data: planRow } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("email", email.toLowerCase())
    .single();

  if (planRow?.plan) return planRow.plan as Plan;

  // Fall back: check orders for a paid plan
  const { data: order } = await supabase
    .from("orders")
    .select("plan_type")
    .eq("email", email.toLowerCase())
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (order?.plan_type) {
    const plan = order.plan_type as Plan;
    // Backfill user_plans for faster future lookups
    await supabase.from("user_plans").upsert(
      { email: email.toLowerCase(), plan, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    return plan;
  }

  // No plan found — auto-create free plan
  await supabase.from("user_plans").upsert(
    { email: email.toLowerCase(), plan: "free", updated_at: new Date().toISOString() },
    { onConflict: "email" }
  );
  return "free";
}

export async function checkFeatureAccess(
  email: string,
  feature: Feature
): Promise<AccessResult> {
  const plan = await getUserPlan(email);
  const limits = FEATURE_LIMITS[plan]?.[feature];

  if (!limits) {
    return { allowed: false, reason: "Feature not available on your plan", upgradeUrl: "/pricing" };
  }

  if (!limits.requiresPlan.includes(plan)) {
    return {
      allowed: false,
      reason: `This feature requires a ${limits.requiresPlan[0]} plan or higher`,
      upgradeUrl: "/pricing",
    };
  }

  // Unlimited usage for this plan+feature
  if (limits.maxUses === null) {
    return { allowed: true };
  }

  // Check usage count
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("count, reset_at")
    .eq("email", email.toLowerCase())
    .eq("feature", feature)
    .single();

  if (!usage) {
    return { allowed: true, currentUsage: 0, limit: limits.maxUses };
  }

  // Reset if past the reset window
  if (new Date(usage.reset_at) <= new Date(now)) {
    await supabase
      .from("usage_tracking")
      .update({
        count: 0,
        reset_at: getNextMonthReset(),
      })
      .eq("email", email.toLowerCase())
      .eq("feature", feature);
    return { allowed: true, currentUsage: 0, limit: limits.maxUses };
  }

  if (usage.count >= limits.maxUses) {
    return {
      allowed: false,
      reason: `You've used your free ${featureLabel(feature)} (${limits.maxUses}/${limits.maxUses}). Upgrade to unlock unlimited access.`,
      upgradeUrl: "/pricing",
      currentUsage: usage.count,
      limit: limits.maxUses,
    };
  }

  return { allowed: true, currentUsage: usage.count, limit: limits.maxUses };
}

export async function trackUsage(email: string, feature: Feature): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("usage_tracking")
    .select("id, count")
    .eq("email", email.toLowerCase())
    .eq("feature", feature)
    .single();

  if (existing) {
    await supabase
      .from("usage_tracking")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_tracking").insert({
      email: email.toLowerCase(),
      feature,
      count: 1,
      reset_at: getNextMonthReset(),
    });
  }
}

function getNextMonthReset(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString();
}

function featureLabel(feature: Feature): string {
  const labels: Record<Feature, string> = {
    gap_analysis: "skill gap analysis",
    resume_generator: "resume generation",
    cover_letter: "cover letter",
    learning_resources: "learning resource recommendation",
    resume_pdf: "PDF export",
    ats_score: "ATS resume check",
    job_tracker: "tracked job",
    mock_interview: "mock interview session",
    skills_assessment: "skills assessment",
  };
  return labels[feature];
}

export async function getAuthEmail(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}

export async function enforceFeatureAccess(
  feature: Feature
): Promise<{ email: string } | NextResponse> {
  const email = await getAuthEmail();
  if (!email) {
    return NextResponse.json(
      { error: "Sign in to use this feature", authRequired: true },
      { status: 401 }
    );
  }

  const access = await checkFeatureAccess(email, feature);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: access.reason,
        upgradeUrl: access.upgradeUrl,
        currentUsage: access.currentUsage,
        limit: access.limit,
      },
      { status: 402 }
    );
  }

  return { email };
}

export function isGateResponse(
  result: { email: string } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
