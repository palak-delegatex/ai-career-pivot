"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import JobTrackerKanban from "@/components/JobTrackerKanban";
import type { TrackedJob } from "@/lib/job-tracker";

export default function JobTrackerClient() {
  const t = useTranslations("jobTracker");
  const [email, setEmail] = useState<string | null>(null);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError(t("client.signInToUse"));
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
        setError(t("client.loadFailed"));
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
          <p className="text-sm text-slate-400">{t("client.loadingJobs")}</p>
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
    <JobTrackerKanban
      jobs={jobs}
      email={email}
      onJobsChange={handleJobsChange}
    />
  );
}
