import { NextResponse } from "next/server";
import { getAuthEmail, getUserPlan, type Plan } from "@/lib/usage-gating";

export interface UserPlanResponse {
  plan: Plan;
  features: {
    fullRoadmap: boolean;
    unlimitedResumes: boolean;
    coverLetters: boolean;
    mockInterviews: boolean;
    atsScoring: boolean;
    networkingCrm: boolean;
    jobTracker: boolean;
    salaryNegotiation: boolean;
    learningResources: boolean;
  };
}

const FREE_FEATURES = {
  fullRoadmap: false,
  unlimitedResumes: false,
  coverLetters: false,
  mockInterviews: false,
  atsScoring: false,
  networkingCrm: false,
  jobTracker: false,
  salaryNegotiation: false,
  learningResources: false,
};

const PAID_FEATURES = {
  fullRoadmap: true,
  unlimitedResumes: true,
  coverLetters: true,
  mockInterviews: true,
  atsScoring: true,
  networkingCrm: true,
  jobTracker: true,
  salaryNegotiation: true,
  learningResources: true,
};

export async function GET() {
  const email = await getAuthEmail();
  if (!email) {
    return NextResponse.json(
      { error: "Sign in required", authRequired: true },
      { status: 401 }
    );
  }

  const plan = await getUserPlan(email);
  const features = plan === "free" ? FREE_FEATURES : PAID_FEATURES;

  return NextResponse.json({ plan, features } satisfies UserPlanResponse);
}
