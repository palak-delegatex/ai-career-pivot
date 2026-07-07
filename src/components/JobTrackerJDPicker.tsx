"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Briefcase, ChevronDown, Loader2 } from "lucide-react";
import type { TrackedJob } from "@/lib/job-tracker";

interface JobTrackerJDPickerProps {
  /** Email whose tracked jobs are loaded. */
  email?: string;
  /** Called with the selected job's stored description text. */
  onSelect: (jobDescription: string, job: TrackedJob) => void;
}

/**
 * Compact picker that loads a tracked job's stored `job_description` into the
 * resume tailor's JD input. Only jobs that actually have a saved description
 * are offered — everything else routes through the paste field as before.
 */
export function JobTrackerJDPicker({ email, onSelect }: JobTrackerJDPickerProps) {
  const [jobs, setJobs] = useState<TrackedJob[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the user's tracked jobs once, lazily on first expand.
  const load = useCallback(async () => {
    if (jobs !== null || loading || !email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/job-tracker?email=${encodeURIComponent(email)}`);
      const data = res.ok ? await res.json() : { jobs: [] };
      const withJD: TrackedJob[] = (data.jobs ?? []).filter(
        (j: TrackedJob) => typeof j.job_description === "string" && j.job_description.trim().length > 0
      );
      setJobs(withJD);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [email, jobs, loading]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) load();
  }

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!email) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-teal-500/60 hover:text-teal-200"
      >
        <Briefcase className="h-3.5 w-3.5 text-teal-400" />
        Select from job tracker
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 z-20 mt-1.5 max-h-64 w-full min-w-[18rem] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl"
        >
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tracked jobs…
            </div>
          )}

          {!loading && jobs !== null && jobs.length === 0 && (
            <p className="px-3 py-3 text-xs text-slate-500">
              No tracked jobs with a saved description yet. Add a job description in
              the job tracker to pick it here.
            </p>
          )}

          {!loading &&
            jobs?.map((job) => (
              <button
                key={job.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelect(job.job_description ?? "", job);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-800"
              >
                <span className="text-xs font-medium text-slate-200">{job.role}</span>
                <span className="text-[11px] text-slate-500">
                  {job.company}
                  {job.job_description
                    ? ` · ${job.job_description.trim().length.toLocaleString()} chars`
                    : ""}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
