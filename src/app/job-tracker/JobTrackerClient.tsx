"use client";

import { useState, useEffect, useCallback } from "react";
import { Kanban, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import JobTrackerKanban from "@/components/JobTrackerKanban";
import DiscoverJobs from "@/components/DiscoverJobs";
import type { TrackedJob } from "@/lib/job-tracker";

type Tab = "pipeline" | "discover";

export default function JobTrackerClient() {
  const [email, setEmail] = useState<string | null>(null);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("pipeline");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Please sign in to use the Job Tracker.");
        setLoading(false);
        return;
      }

      setEmail(user.email);

      try {
        const res = await fetch(`/api/job-tracker?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setJobs(data.jobs ?? []);
      } catch {
        setError("Failed to load your tracked jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleJobsChange = useCallback((updated: TrackedJob[]) => {
    setJobs(updated);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your job tracker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  if (!email) return null;

  return (
    <div>
      <div className="flex justify-center gap-1 pt-4 pb-2">
        <button
          onClick={() => setTab("pipeline")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "pipeline"
              ? "bg-teal-600/20 text-teal-300 border border-teal-500/30"
              : "text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Kanban className="h-4 w-4" />
          Pipeline
        </button>
        <button
          onClick={() => setTab("discover")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "discover"
              ? "bg-teal-600/20 text-teal-300 border border-teal-500/30"
              : "text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Discover Jobs
        </button>
      </div>

      {tab === "pipeline" ? (
        <JobTrackerKanban
          jobs={jobs}
          email={email}
          onJobsChange={handleJobsChange}
        />
      ) : (
        <DiscoverJobs email={email} />
      )}
    </div>
  );
}
