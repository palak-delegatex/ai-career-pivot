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
  variant?: "banner" | "gate" | "inline";
  price?: string;
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
  variant = "inline",
  price,
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

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-[#0f172a] to-teal-900/30 border border-[#334155] rounded-xl p-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Unlock all features{price ? ` for ${price}` : ""}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {message ?? "Get unlimited access to gap analyses, resume generation, cover letters, and more."}
          </p>
        </div>
        <Link
          href={upgradeUrl}
          onClick={() => trackUpgradePromptClicked({ feature, location, destination: upgradeUrl })}
          className="inline-flex items-center rounded-lg bg-teal-600 hover:bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors shrink-0"
        >
          Upgrade{price ? ` — ${price}` : ""}
        </Link>
      </div>
    );
  }

  if (variant === "gate") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center"
        style={{
          background: "rgba(3, 7, 18, 0.5)",
          backdropFilter: "blur(2px)",
          border: "1px solid #334155",
          borderRadius: "12px",
        }}
      >
        <p className="text-sm text-slate-300 font-medium">
          {message ?? `Upgrade to unlock ${feature}`}
        </p>
        <Link
          href={upgradeUrl}
          onClick={() => trackUpgradePromptClicked({ feature, location, destination: upgradeUrl })}
          className="inline-flex items-center rounded-lg bg-teal-600 hover:bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors"
        >
          Upgrade{price ? ` — ${price}` : ""}
        </Link>
      </div>
    );
  }

  const valueProps = getValueProps(feature);

  return (
    <Card className="border-[#334155] bg-[#0f172a]">
      <CardHeader>
        <CardTitle className="text-white">
          Upgrade to unlock {feature}
        </CardTitle>
        <CardDescription className="text-slate-400">
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
      <CardFooter className="border-slate-700/40">
        <Link
          href={upgradeUrl}
          onClick={() => trackUpgradePromptClicked({ feature, location, destination: upgradeUrl })}
          className="inline-flex items-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-500"
        >
          {price ? `Upgrade — ${price}` : "View Plans"}
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
