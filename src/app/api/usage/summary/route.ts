import { NextResponse } from "next/server";
import { getAuthEmail, getUserPlan, checkFeatureAccess, type Feature } from "@/lib/usage-gating";

const FREE_TIER_FEATURES: { feature: Feature; label: string }[] = [
  { feature: "gap_analysis", label: "Gap Analysis" },
  { feature: "resume_generator", label: "Resumes" },
  { feature: "ats_score", label: "ATS Score" },
  { feature: "mock_interview", label: "Mock Interview" },
];

export async function GET() {
  const email = await getAuthEmail();
  if (!email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const plan = await getUserPlan(email);
  if (plan !== "free") {
    return NextResponse.json({ meters: [] });
  }

  const meters = await Promise.all(
    FREE_TIER_FEATURES.map(async ({ feature, label }) => {
      const access = await checkFeatureAccess(email, feature);
      return {
        label,
        current: access.currentUsage ?? 0,
        limit: access.limit ?? null,
      };
    })
  );

  return NextResponse.json({ meters });
}
