"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, FileSearch, CircleUserRound, TrendingUp, TrendingDown } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { TrackedJob } from "@/lib/job-tracker";

interface PipelineStats {
  activeCount: number;
  interviewCount: number;
}

interface ATSStats {
  avgScore: number;
  previousAvg: number | null;
}

interface LinkedInStats {
  score: number;
  label: string;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Almost There";
  if (score >= 50) return "Getting There";
  return "Needs Work";
}

function DeltaIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null || previous === current) return null;
  const diff = current - previous;
  const isUp = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? "+" : ""}{diff}
    </span>
  );
}

function StatCard({
  icon,
  title,
  primary,
  secondary,
  delta,
  href,
  linkLabel,
  emptyHref,
  emptyLabel,
  isEmpty,
}: {
  icon: React.ReactNode;
  title: string;
  primary: string;
  secondary: string;
  delta?: { current: number; previous: number | null };
  href: string;
  linkLabel: string;
  emptyHref?: string;
  emptyLabel?: string;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-slate-400">{title}</span>
          <span className="text-teal-400">{icon}</span>
        </div>
        <p className="text-sm text-slate-500">No data yet</p>
        <Link href={emptyHref || href} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
          {emptyLabel || "Get started"} &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <span className="text-teal-400">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-50">{primary}</span>
        {delta && <DeltaIndicator current={delta.current} previous={delta.previous} />}
      </div>
      <p className="text-sm text-slate-400">{secondary}</p>
      <Link href={href} className="text-xs text-teal-400 hover:text-teal-300 transition-colors mt-1">
        {linkLabel} &rarr;
      </Link>
    </div>
  );
}

export default function CommandCenterHeader({ email }: { email: string }) {
  const [pipeline, setPipeline] = useState<PipelineStats | null>(null);
  const [ats, setAts] = useState<ATSStats | null>(null);
  const [linkedin, setLinkedin] = useState<LinkedInStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: jobs } = await supabase
          .from("tracked_jobs")
          .select("stage, match_score")
          .eq("user_email", email);

        if (jobs && jobs.length > 0) {
          const active = jobs.filter((j: Pick<TrackedJob, "stage">) => j.stage !== "rejected");
          const interviews = jobs.filter((j: Pick<TrackedJob, "stage">) => j.stage === "interview");
          setPipeline({ activeCount: active.length, interviewCount: interviews.length });
        }
      } catch {}

      try {
        const stored = localStorage.getItem("ats-latest-score");
        if (stored) {
          const parsed = JSON.parse(stored);
          setAts({
            avgScore: Math.round(parsed.score ?? 0),
            previousAvg: parsed.previousScore ?? null,
          });
        }
      } catch {}

      try {
        const stored = localStorage.getItem("linkedin-optimizer-results");
        if (stored) {
          const parsed = JSON.parse(stored);
          const score = parsed.overallScore ?? 0;
          setLinkedin({ score, label: getScoreLabel(score) });
        }
      } catch {}

      setLoaded(true);
    }
    load();
  }, [email]);

  if (!loaded) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={<Briefcase className="h-5 w-5" />}
        title="Pipeline"
        primary={pipeline ? `${pipeline.activeCount} active` : ""}
        secondary={pipeline ? `${pipeline.interviewCount} interview${pipeline.interviewCount !== 1 ? "s" : ""}` : ""}
        href="/job-tracker"
        linkLabel="View board"
        emptyHref="/job-tracker"
        emptyLabel="Start tracking jobs"
        isEmpty={!pipeline}
      />
      <StatCard
        icon={<FileSearch className="h-5 w-5" />}
        title="ATS Score"
        primary={ats ? `${ats.avgScore} match` : ""}
        secondary={ats ? "Latest scan result" : ""}
        delta={ats ? { current: ats.avgScore, previous: ats.previousAvg } : undefined}
        href="/ats-score"
        linkLabel="Latest scan"
        emptyHref="/ats-score"
        emptyLabel="Scan your resume"
        isEmpty={!ats}
      />
      <StatCard
        icon={<CircleUserRound className="h-5 w-5" />}
        title="LinkedIn Profile"
        primary={linkedin ? `${linkedin.score}/100` : ""}
        secondary={linkedin ? `"${linkedin.label}"` : ""}
        href="/linkedin-optimizer"
        linkLabel="Optimize"
        emptyHref="/linkedin-optimizer"
        emptyLabel="Analyze your profile"
        isEmpty={!linkedin}
      />
    </div>
  );
}
