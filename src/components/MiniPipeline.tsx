"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { STAGES, type TrackedJob, type JobStage } from "@/lib/job-tracker";

const PIPELINE_STAGES = STAGES.filter((s) => s.key !== "rejected");

const DOT_TEXT_COLORS: Record<string, string> = {
  "bg-slate-400": "text-slate-400",
  "bg-teal-500": "text-teal-500",
  "bg-cyan-400": "text-cyan-400",
  "bg-amber-400": "text-amber-400",
  "bg-emerald-400": "text-emerald-400",
};

function stageDotTextColor(dotColor: string): string {
  return DOT_TEXT_COLORS[dotColor] || "text-slate-400";
}

export default function MiniPipeline({ email }: { email: string }) {
  const [stageCounts, setStageCounts] = useState<Record<JobStage, number> | null>(null);
  const [recentJobs, setRecentJobs] = useState<TrackedJob[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: jobs } = await supabase
          .from("tracked_jobs")
          .select("*")
          .eq("user_email", email)
          .order("created_at", { ascending: false });

        if (jobs && jobs.length > 0) {
          const counts: Record<string, number> = {};
          for (const s of STAGES) counts[s.key] = 0;
          for (const j of jobs) counts[j.stage] = (counts[j.stage] || 0) + 1;
          setStageCounts(counts as Record<JobStage, number>);
          setRecentJobs(
            (jobs as TrackedJob[])
              .filter((j) => j.stage !== "rejected")
              .slice(0, 3)
          );
        }
      } catch {}
      setLoaded(true);
    }
    load();
  }, [email]);

  if (!loaded) return null;

  if (!stageCounts) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5">
        <p className="text-sm text-slate-500 mb-2">No jobs tracked yet</p>
        <Link href="/job-tracker" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
          Add your first job &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 space-y-4">
      {/* Stage funnel */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PIPELINE_STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-900/80 border border-slate-700/50 ${stageDotTextColor(s.dotColor)}`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dotColor}`} />
              {s.label}({stageCounts[s.key] ?? 0})
            </span>
            {i < PIPELINE_STAGES.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Recent jobs */}
      {recentJobs.length > 0 && (
        <div className="space-y-1.5">
          {recentJobs.map((job) => {
            const stage = STAGES.find((s) => s.key === job.stage);
            return (
              <div
                key={job.id}
                className="flex items-center gap-2 text-sm text-slate-300 py-1 px-2 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-md bg-gradient-to-br ${job.company_color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
                >
                  {job.company.charAt(0).toUpperCase()}
                </span>
                <span className="truncate flex-1">
                  {job.role} <span className="text-slate-500">at</span> {job.company}
                </span>
                {stage && (
                  <span className={`text-[10px] font-medium ${stageDotTextColor(stage.dotColor)}`}>
                    {stage.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/job-tracker"
        className="block text-xs text-teal-400 hover:text-teal-300 transition-colors"
      >
        View all in tracker &rarr;
      </Link>
    </div>
  );
}
