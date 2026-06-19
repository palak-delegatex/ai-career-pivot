"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Sparkles,
  MapPin,
  DollarSign,
  TrendingUp,
  ExternalLink,
  BookmarkPlus,
  X,
  Loader2,
  RefreshCw,
  Filter,
  Briefcase,
  Zap,
  Globe,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from "lucide-react";

interface DiscoveredJob {
  id: string;
  user_email: string;
  job_title: string;
  company: string;
  url: string;
  source: string;
  location: string;
  salary: string;
  salary_min: number | null;
  salary_max: number | null;
  job_type: string;
  description_snippet: string;
  tags: string[];
  match_score: number;
  matched_skills: string[];
  match_breakdown: {
    skills: number;
    role: number;
    location: number;
    salary: number;
    experience: number;
  };
  match_reasons: { factor: string; detail: string; weight: number }[];
  is_remote: boolean;
  experience_level: string | null;
  status: string;
  discovered_at: string;
}

interface DiscoverJobsProps {
  email: string;
}

function matchTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

const MATCH_STYLES = {
  high: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  mid: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  low: "bg-slate-400/10 border-slate-400/20 text-slate-400",
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  adzuna: {
    label: "Adzuna",
    color: "bg-orange-500/10 border-orange-500/25 text-orange-300",
  },
  remotive: {
    label: "Remotive",
    color: "bg-violet-500/10 border-violet-500/25 text-violet-300",
  },
  jsearch: {
    label: "JSearch",
    color: "bg-blue-500/10 border-blue-500/25 text-blue-300",
  },
};

function ScoreBreakdown({
  breakdown,
}: {
  breakdown: DiscoveredJob["match_breakdown"];
}) {
  if (!breakdown) return null;
  const items = [
    { label: "Skills", value: breakdown.skills, max: 50, color: "bg-teal-500" },
    { label: "Role", value: breakdown.role, max: 20, color: "bg-blue-500" },
    {
      label: "Location",
      value: breakdown.location,
      max: 10,
      color: "bg-emerald-500",
    },
    {
      label: "Salary",
      value: breakdown.salary,
      max: 10,
      color: "bg-amber-500",
    },
    {
      label: "Experience",
      value: breakdown.experience,
      max: 10,
      color: "bg-purple-500",
    },
  ].filter((i) => i.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-400 w-16 shrink-0">{item.label}</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${item.color} rounded-full transition-all`}
              style={{ width: `${(item.value / item.max) * 100}%` }}
            />
          </div>
          <span className="text-slate-500 w-6 text-right">
            {item.value}/{item.max}
          </span>
        </div>
      ))}
    </div>
  );
}

function DiscoveredJobCard({
  job,
  onSave,
  onDismiss,
}: {
  job: DiscoveredJob;
  onSave: (job: DiscoveredJob) => void;
  onDismiss: (job: DiscoveredJob) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tier = matchTier(job.match_score);
  const source = SOURCE_CONFIG[job.source] ?? {
    label: job.source,
    color: "bg-slate-400/10 border-slate-400/25 text-slate-400",
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-700 rounded-xl p-4 transition-all hover:border-teal-500/40 ${
        job.status === "dismissed" ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${MATCH_STYLES[tier]}`}
            >
              <TrendingUp className="h-2.5 w-2.5" />
              {job.match_score}%
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${source.color}`}
            >
              {source.label}
            </span>
            {job.is_remote && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-cyan-500/10 border-cyan-500/25 text-cyan-300">
                <Globe className="h-2.5 w-2.5 inline mr-0.5" />
                Remote
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-white truncate">
            {job.job_title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>

          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location.length > 30
                  ? job.location.slice(0, 27) + "..."
                  : job.location}
              </span>
            )}
            {job.salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {job.salary}
              </span>
            )}
            {job.job_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {job.job_type}
              </span>
            )}
          </div>

          {job.matched_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.matched_skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-700/30"
                >
                  {skill}
                </span>
              ))}
              {job.matched_skills.length > 6 && (
                <span className="text-[10px] text-slate-500">
                  +{job.matched_skills.length - 6}
                </span>
              )}
            </div>
          )}

          {expanded && (
            <div className="mt-3 space-y-2">
              {job.description_snippet && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {job.description_snippet}
                </p>
              )}
              <ScoreBreakdown breakdown={job.match_breakdown} />
              {job.match_reasons?.length > 0 && (
                <div className="space-y-1">
                  {job.match_reasons.map((r, i) => (
                    <div key={i} className="text-[10px] text-slate-500">
                      <span className="text-slate-400 font-medium">
                        {r.factor}:
                      </span>{" "}
                      {r.detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {job.status !== "saved" && job.status !== "dismissed" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(job);
              }}
              className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-colors"
              title="Save to tracker"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
            </button>
          )}
          {job.status !== "dismissed" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(job);
              }}
              className="p-1.5 rounded-lg bg-slate-700/40 border border-slate-600/30 text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-slate-700/40 border border-slate-600/30 text-slate-400 hover:bg-slate-600/40 transition-colors"
            title="View listing"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" /> Less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" /> More
          </>
        )}
      </button>
    </div>
  );
}

export default function DiscoverJobs({ email }: DiscoverJobsProps) {
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<"all" | "new" | "saved" | "dismissed">(
    "all"
  );
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [scanResult, setScanResult] = useState<{
    discovered: number;
    matched: number;
    saved: number;
    queued: number;
  } | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ email });
      if (filter !== "all") params.set("status", filter);
      if (minScore > 0) params.set("minScore", String(minScore));

      const res = await fetch(`/api/jobs/discover?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [email, filter, minScore]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const runDiscovery = useCallback(async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/jobs/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        await fetchJobs();
      }
    } catch {
      // silently fail
    } finally {
      setScanning(false);
    }
  }, [email, fetchJobs]);

  const saveJob = useCallback(
    async (job: DiscoveredJob) => {
      try {
        const res = await fetch("/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            role: job.job_title,
            company: job.company,
            url: job.url,
            source: "other",
            match_score: job.match_score,
            salary_range: job.salary || undefined,
            location: job.location || undefined,
          }),
        });
        if (res.ok) {
          const supabaseRes = await fetch("/api/jobs/discover", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: job.id, status: "saved" }),
          });
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id ? { ...j, status: "saved" } : j
            )
          );
        }
      } catch {
        // silently fail
      }
    },
    [email]
  );

  const dismissJob = useCallback(async (job: DiscoveredJob) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id ? { ...j, status: "dismissed" } : j
      )
    );
    try {
      await fetch("/api/jobs/discover", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, status: "dismissed" }),
      });
    } catch {
      // revert
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: "new" } : j
        )
      );
    }
  }, []);

  const visibleJobs =
    filter === "all"
      ? jobs.filter((j) => j.status !== "dismissed")
      : jobs;

  const newCount = jobs.filter((j) => j.status === "new").length;
  const savedCount = jobs.filter((j) => j.status === "saved").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            Discover Jobs
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            AI-matched positions from Adzuna & Remotive, scored against your
            profile
          </p>
        </div>
        <button
          onClick={runDiscovery}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {scanning ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {/* Scan result banner */}
      {scanResult && (
        <div className="mb-4 p-3 rounded-lg bg-teal-900/30 border border-teal-700/40 text-sm text-teal-300 flex items-center gap-4">
          <Zap className="h-4 w-4 shrink-0" />
          <span>
            Found <strong>{scanResult.discovered}</strong> jobs across 2
            sources &middot; <strong>{scanResult.matched}</strong> matched your
            profile &middot; <strong>{scanResult.saved}</strong> saved &middot;{" "}
            <strong>{scanResult.queued}</strong> added to auto-apply queue
          </span>
          <button
            onClick={() => setScanResult(null)}
            className="ml-auto text-teal-500 hover:text-teal-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{jobs.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Discovered</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-teal-400">{newCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">New Matches</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {savedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Saved</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(
            [
              ["all", "All"],
              ["new", "New"],
              ["saved", "Saved"],
              ["dismissed", "Dismissed"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-teal-600/20 text-teal-300 border border-teal-500/30"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-700/50 hover:text-white transition-colors"
        >
          <Filter className="h-3 w-3" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl">
          <label className="flex items-center gap-3 text-xs text-slate-400">
            <span className="shrink-0">Min Score:</span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              className="flex-1 accent-teal-500"
            />
            <span className="text-white font-medium w-8 text-right">
              {minScore}%
            </span>
          </label>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading discoveries...</p>
          </div>
        </div>
      ) : visibleJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-medium text-slate-300 mb-1">
            No jobs discovered yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Click &ldquo;Scan Now&rdquo; to search Adzuna and Remotive for jobs
            matching your profile, or set up auto-apply preferences for daily
            automated scanning.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleJobs.map((job) => (
            <DiscoveredJobCard
              key={job.id}
              job={job}
              onSave={saveJob}
              onDismiss={dismissJob}
            />
          ))}
        </div>
      )}
    </div>
  );
}
