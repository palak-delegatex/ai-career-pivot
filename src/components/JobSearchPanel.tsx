"use client";

import { useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Loader2,
  Plus,
  Check,
  ExternalLink,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { EnrichedJob } from "@/lib/job-match";
import { pickCompanyColor, detectSource } from "@/lib/job-tracker";
import type { TrackedJob, JobSource } from "@/lib/job-tracker";

interface JobSearchPanelProps {
  email: string;
  trackedJobs: TrackedJob[];
  onJobAdded: (job: TrackedJob) => void;
}

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

function MatchBadge({ score }: { score: number }) {
  if (score === 0) return null;
  const color =
    score >= 70
      ? "bg-emerald-900/50 border-emerald-600/40 text-emerald-300"
      : score >= 40
        ? "bg-amber-900/40 border-amber-600/30 text-amber-300"
        : "bg-slate-700/50 border-slate-600/40 text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}
    >
      <TrendingUp className="h-2.5 w-2.5" />
      {score}% match
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  jsearch: "JSearch",
  remotive: "Remotive",
  adzuna: "Adzuna",
};

export default function JobSearchPanel({
  email,
  trackedJobs,
  onJobAdded,
}: JobSearchPanelProps) {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasMatchScores, setHasMatchScores] = useState(false);
  const [source, setSource] = useState("");
  const [addingIds, setAddingIds] = useState<Set<string | number>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string | number>>(new Set());

  const trackedUrls = new Set(
    trackedJobs.map((j) => j.url).filter(Boolean)
  );

  const handleSearch = useCallback(async () => {
    if (!role.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ role: role.trim() });
      if (location.trim()) params.set("location", location.trim());
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setHasMatchScores(data.hasMatchScores ?? false);
      setSource(data.source ?? "");
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [role, location]);

  const handleAddToTracker = useCallback(
    async (job: EnrichedJob) => {
      setAddingIds((prev) => new Set(prev).add(job.id));
      try {
        const jobSource: JobSource = detectSource(job.url);
        const res = await fetch("/api/job-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            role: job.title,
            company: job.company_name,
            company_color: pickCompanyColor(job.company_name),
            url: job.url,
            source: jobSource,
            stage: "exploring",
            match_score: job.matchScore,
            notes: [
              job.salary && `Salary: ${job.salary}`,
              job.location && `Location: ${job.location}`,
              job.job_type && `Type: ${job.job_type}`,
            ]
              .filter(Boolean)
              .join(" · "),
          }),
        });
        if (res.ok) {
          const { job: trackedJob } = await res.json();
          setAddedIds((prev) => new Set(prev).add(job.id));
          onJobAdded(trackedJob);
        }
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
      }
    },
    [email, onJobAdded]
  );

  const isTracked = (job: EnrichedJob) =>
    addedIds.has(job.id) || trackedUrls.has(job.url);

  const highMatchCount = jobs.filter((j) => j.matchScore >= 60).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search form */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-bold text-teal-400">
            Search Job Listings
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Target role (e.g. Product Manager)"
              className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-slate-700 rounded-xl text-sm text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:w-48 relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Location"
              className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-slate-700 rounded-xl text-sm text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!role.trim() || loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Aggregates listings from LinkedIn, Indeed, Glassdoor, Adzuna and more.
          Add jobs to your tracker with one click.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            Searching across job boards...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && jobs.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">
            No listings found for &quot;{role}&quot;
          </p>
          <p className="text-xs text-slate-500">
            Try a different role or broader search term.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !searched && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-teal-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-50 mb-1">
            Find your next opportunity
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Search by target role and location to discover jobs from multiple
            boards. Add them to your tracker with one click.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && jobs.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Results header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-50">
                {jobs.length} listing{jobs.length !== 1 ? "s" : ""} found
              </span>
              {source && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/40 text-slate-400">
                  via {source}
                </span>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              aria-label="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Match summary */}
          {hasMatchScores && highMatchCount > 0 && (
            <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-b border-emerald-800/20 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">
                {highMatchCount} job{highMatchCount > 1 ? "s" : ""} strongly
                match your profile
              </span>
            </div>
          )}

          {/* Job cards */}
          <div className="divide-y divide-slate-700/40">
            {jobs.map((job) => {
              const tracked = isTracked(job);
              const adding = addingIds.has(job.id);

              return (
                <div
                  key={job.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-700/20 transition-colors group"
                >
                  {/* Company avatar */}
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pickCompanyColor(job.company_name)} flex items-center justify-center text-sm font-bold text-white shrink-0`}
                  >
                    {job.company_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-white hover:text-teal-300 transition-colors line-clamp-1"
                        >
                          {job.title}
                          <ExternalLink className="h-3 w-3 inline ml-1.5 opacity-0 group-hover:opacity-60" />
                        </a>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {job.company_name}
                        </p>
                      </div>

                      {/* Add to tracker button */}
                      <button
                        onClick={() => !tracked && !adding && handleAddToTracker(job)}
                        disabled={tracked || adding}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          tracked
                            ? "bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 cursor-default"
                            : adding
                              ? "bg-slate-700/50 border border-slate-600/40 text-slate-400 cursor-wait"
                              : "bg-teal-600/15 border border-teal-600/30 text-teal-300 hover:bg-teal-600/25 hover:border-teal-500/50"
                        }`}
                      >
                        {tracked ? (
                          <>
                            <Check className="h-3 w-3" />
                            Tracked
                          </>
                        ) : adding ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Add to Tracker
                          </>
                        )}
                      </button>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      {hasMatchScores && <MatchBadge score={job.matchScore} />}
                      {job.location && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MapPin className="h-2.5 w-2.5" />
                          {job.location}
                        </span>
                      )}
                      {job.job_type && (
                        <span className="text-[10px] text-slate-500">
                          {job.job_type}
                        </span>
                      )}
                      {job.salary && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {job.salary}
                        </span>
                      )}
                      {job.source && (
                        <span className="text-[10px] text-slate-600">
                          {SOURCE_LABELS[job.source] ?? job.source}
                        </span>
                      )}
                      {job.publication_date && (
                        <span className="text-[10px] text-slate-600 ml-auto">
                          {timeAgo(job.publication_date)}
                        </span>
                      )}
                    </div>

                    {/* Tags / matched skills */}
                    {hasMatchScores && job.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.matchedSkills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] bg-teal-900/30 border border-teal-700/30 text-teal-400 px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {(!hasMatchScores || job.matchedSkills.length === 0) &&
                      (job.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.tags!.slice(0, 5).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-slate-700/50 border border-slate-600/40 text-slate-400 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Description snippet */}
                    {job.description_snippet && (
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {job.description_snippet}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
