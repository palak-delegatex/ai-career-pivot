"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Briefcase, RefreshCw, MapPin } from "lucide-react";
import type { JobListing } from "@/app/api/jobs/route";

interface JobBoardProps {
  targetRole: string;
  location?: string;
}

const JOB_BOARD_LINKS = [
  { name: "LinkedIn", color: "text-blue-400", url: (role: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}` },
  { name: "Indeed", color: "text-indigo-400", url: (role: string) => `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}` },
  { name: "Glassdoor", color: "text-green-400", url: (role: string) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(role)}` },
];

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobBoard({ targetRole, location }: JobBoardProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchJobs() {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ role: targetRole });
      if (location) params.set("location", location);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [targetRole, location]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2 flex-wrap">
          <Briefcase className="h-4 w-4 text-teal-400 shrink-0" />
          <h3 className="text-sm font-bold text-teal-400">Remote Jobs</h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-900/40 border border-teal-700/40 text-teal-300">
            {targetRole}
          </span>
          {location && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/40 text-slate-300">
              <MapPin className="h-2.5 w-2.5" />
              {location}
            </span>
          )}
        </div>
        {!loading && (
          <button
            onClick={fetchJobs}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            aria-label="Refresh jobs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Job list */}
      <div className="divide-y divide-slate-700/40">
        {loading && (
          <div className="px-5 py-8 text-center">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Searching remote opportunities...</p>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-400 mb-1">No remote listings found for this role right now.</p>
            <p className="text-xs text-slate-500">Try the job boards below for more options.</p>
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-400 mb-3">Couldn&apos;t load job listings.</p>
            <button
              onClick={fetchJobs}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && jobs.map((job) => (
          <a
            key={job.id}
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-5 py-4 hover:bg-slate-700/30 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                  {job.title}
                </p>
                <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{job.company_name}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                {job.candidate_required_location && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <MapPin className="h-2.5 w-2.5" />
                    {job.candidate_required_location}
                  </span>
                )}
                {job.job_type && (
                  <span className="text-[10px] text-slate-500">{job.job_type}</span>
                )}
                {job.salary && (
                  <span className="text-[10px] text-emerald-400 font-medium">{job.salary}</span>
                )}
                {job.publication_date && (
                  <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(job.publication_date)}</span>
                )}
              </div>
              {(job.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.tags!.map((tag) => (
                    <span key={tag} className="text-[10px] bg-slate-700/50 border border-slate-600/40 text-slate-400 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Footer: direct job board links */}
      <div className="px-5 py-3 border-t border-slate-700/60 bg-slate-900/20">
        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Search more on</p>
        <div className="flex gap-3 flex-wrap">
          {JOB_BOARD_LINKS.map((board) => (
            <a
              key={board.name}
              href={board.url(targetRole)}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-medium ${board.color} hover:opacity-80 transition-opacity flex items-center gap-1`}
            >
              {board.name}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
