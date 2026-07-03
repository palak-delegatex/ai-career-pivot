"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { trackUpgradePromptViewed, trackUpgradePromptClicked } from "@/lib/tracking";

interface UpgradePromptProps {
  feature: string;
  message?: string;
  upgradeUrl?: string;
  location?: string;
  compact?: boolean;
}

const VALUE_PROPS: Record<string, string[]> = {
  "full roadmap": [
    "See your complete 6-month, 1-year, and 2-year career milestones",
    "Track progress with interactive timeline, board, and checklist views",
    "Get personalized weekly action plans",
  ],
  "resume generator": [
    "Generate unlimited ATS-optimized resumes tailored to each job",
    "Keyword matching against job descriptions",
    "Export to professional PDF format",
  ],
  "gap analysis": [
    "See all skill gaps with detailed learning roadmaps",
    "Get curated course recommendations for each missing skill",
    "Weekly action plans to close gaps fast",
  ],
  "networking tools": [
    "CRM to track your professional contacts and warm intros",
    "Referral request templates that actually get responses",
    "Connection tracking with follow-up reminders",
  ],
  default: [
    "Unlimited skill gap analyses with full learning roadmaps",
    "AI resume builder and cover letter generator",
    "Mock interviews, ATS scoring, and networking CRM",
    "PDF exports, salary negotiation prep, and more",
  ],
};

function getValueProps(feature: string): string[] {
  const key = feature.toLowerCase();
  for (const [k, v] of Object.entries(VALUE_PROPS)) {
    if (key.includes(k)) return v;
  }
  return VALUE_PROPS.default;
}

export default function UpgradePrompt({
  feature,
  message,
  upgradeUrl = "/pricing",
  location = "unknown",
  compact = false,
}: UpgradePromptProps) {
  useEffect(() => {
    trackUpgradePromptViewed({ feature, location });
  }, [feature, location]);

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-amber-900/20 to-teal-900/20 border border-amber-700/30 rounded-xl p-4 text-center">
        <p className="text-sm text-amber-200 font-medium mb-2">
          {message ?? `Upgrade to unlock ${feature}`}
        </p>
        <Link
          href={upgradeUrl}
          onClick={() => trackUpgradePromptClicked({ feature, location, destination: upgradeUrl })}
          className="inline-flex items-center rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  const valueProps = getValueProps(feature);

  return (
    <Card className="border-amber-700/30 bg-gradient-to-br from-slate-800/80 to-amber-900/20">
      <CardHeader>
        <CardTitle className="text-amber-200">
          Upgrade to unlock {feature}
        </CardTitle>
        <CardDescription className="text-amber-300/70">
          {message ??
            "You've reached the limit of your free plan. Upgrade to get unlimited access to all features."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-slate-300">
          {valueProps.map((prop, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-teal-400 mt-0.5 shrink-0">&bull;</span>
              {prop}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="border-amber-700/20">
        <Link
          href={upgradeUrl}
          onClick={() => trackUpgradePromptClicked({ feature, location, destination: upgradeUrl })}
          className="inline-flex items-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-500"
        >
          View Plans
        </Link>
      </CardFooter>
    </Card>
  );
}

export async function handleGatedResponse(
  response: Response
): Promise<{ blocked: true; error: string; upgradeUrl: string } | { blocked: false }> {
  if (response.status === 402) {
    const data = await response.json();
    return {
      blocked: true,
      error: data.error ?? "Upgrade required",
      upgradeUrl: data.upgradeUrl ?? "/pricing",
    };
  }
  if (response.status === 401) {
    const data = await response.json();
    return {
      blocked: true,
      error: data.error ?? "Sign in required",
      upgradeUrl: "/auth/signin",
    };
  }
  return { blocked: false };
}
