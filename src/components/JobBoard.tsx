"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExternalLink, Briefcase, RefreshCw, MapPin, TrendingUp, Sparkles, FileSignature, Target, Wand2, Plus, Check, Filter } from "lucide-react";
import type { EnrichedJob } from "@/lib/job-match";
import { computePlanRelevance } from "@/lib/job-match";
import type { UserProfile, PivotPlan } from "@/lib/intake";
import { pickCompanyColor, detectSource } from "@/lib/job-tracker";
import CoverLetterSheet from "@/components/CoverLetterSheet";
import GapAnalysisSheet from "@/components/GapAnalysisSheet";
import ResumeTailorSheet from "@/components/ResumeTailorSheet";

interface JobBoardProps {
  targetRole: string;
  location?: string;
  userSkills?: string[];
  profile?: UserProfile;
  plan?: PivotPlan;
}

const JOB_BOARD_LINKS = [
  { name: "LinkedIn", color: "text-blue-400", url: (role: string) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}` },
  { name: "Indeed", color: "text-indigo-400", url: (role: string) => `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}` },
  { name: "Glassdoor", color: "text-green-400", url: (role: string) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(role)}` },
  { name: "ZipRecruiter", color: "text-orange-400", url: (role: string) => `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(role)}` },
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

function MatchBadge({ score }: { score: number }) {
  if (score === 0) return null;
  const color =
    score >= 70
      ? "bg-emerald-900/50 border-emerald-600/40 text-emerald-300"
      : score >= 40
        ? "bg-amber-900/40 border-amber-600/30 text-amber-300"
        : "bg-slate-700/50 border-slate-600/40 text-slate-400";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <TrendingUp className="h-2.5 w-2.5" />
      {score}% match
    </span>
  );
}

export default function JobBoard({ targetRole, location, userSkills = [], profile, plan }: JobBoardProps) {
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMatchScores, setHasMatchScores] = useState(false);
  const [coverLetterJob, setCoverLetterJob] = useState<EnrichedJob | null>(null);
  const [gapAnalysisJob, setGapAnalysisJob] = useState<EnrichedJob | null>(null);
  const [tailorJob, setTailorJob] = useState<EnrichedJob | null>(null);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [savingUrl, setSavingUrl] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState(false);

  async function fetchJobs() {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ role: targetRole });
      if (location) params.set("location", location);
      if (userSkills.length > 0) params.set("skills", userSkills.slice(0, 15).join(","));
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setHasMatchScores(data.hasMatchScores ?? false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [targetRole, location, userSkills.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToTracker = useCallback(async (job: EnrichedJob) => {
    if (!profile?.email || savedUrls.has(job.url)) return;
    setSavingUrl(job.url);
    try {
      const res = await fetch("/api/job-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          role: job.title,
          company: job.company_name,
          company_color: pickCompanyColor(job.company_name),
          url: job.url,
          source: detectSource(job.url),
          stage: "saved",
          match_score: job.matchScore,
          notes: [job.salary, job.location, job.job_type].filter(Boolean).join(" · "),
        }),
      });
      if (res.ok) {
        setSavedUrls((prev) => new Set(prev).add(job.url));
      }
    } finally {
      setSavingUrl(null);
    }
  }, [profile?.email, savedUrls]);

  const planRelevanceMap = useMemo(() => {
    if (!plan) return new Map<string | number, { relevant: boolean; planScore: number; reasons: string[] }>();
    return new Map(
      jobs.map((j) => [j.id, computePlanRelevance(j, plan)])
    );
  }, [jobs, plan]);

  const displayedJobs = useMemo(() => {
    if (!planFilter || !plan) return jobs;
    return jobs.filter((j) => planRelevanceMap.get(j.id)?.relevant);
  }, [jobs, planFilter, plan, planRelevanceMap]);

  const highMatchCount = displayedJobs.filter((j) => j.matchScore >= 60).length;
  const planMatchCount = plan ? jobs.filter((j) => planRelevanceMap.get(j.id)?.relevant).length : 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2 flex-wrap">
          <Briefcase className="h-4 w-4 text-teal-400 shrink-0" />
          <h3 className="text-sm font-bold text-teal-400">Jobs For You</h3>
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
        <div className="flex items-center gap-1.5">
          {!loading && plan && planMatchCount > 0 && (
            <button
              onClick={() => setPlanFilter((v) => !v)}
              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                planFilter
                  ? "bg-violet-900/50 border-violet-600/40 text-violet-300"
                  : "bg-slate-700/40 border-slate-600/30 text-slate-400 hover:text-slate-300"
              }`}
            >
              <Filter className="h-2.5 w-2.5" />
              Plan match ({planMatchCount})
            </button>
          )}
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
      </div>

      {/* Match summary banner */}
      {!loading && hasMatchScores && highMatchCount > 0 && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-b border-emerald-800/20 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-medium">
            {highMatchCount} job{highMatchCount > 1 ? "s" : ""} strongly match your skills
          </span>
        </div>
      )}

      {/* Job list */}
      <div className="divide-y divide-slate-700/40">
        {loading && (
          <div className="px-5 py-8 text-center">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Finding jobs that match your skills...</p>
          </div>
        )}

        {!loading && !error && displayedJobs.length === 0 && planFilter && jobs.length > 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-400 mb-1">No jobs match your transition plan right now.</p>
            <button
              onClick={() => setPlanFilter(false)}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              Show all jobs
            </button>
          </div>
        )}

        {!loading && !error && displayedJobs.length === 0 && !planFilter && jobs.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-slate-400 mb-1">No listings found for this role right now.</p>
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

        {!loading && displayedJobs.map((job) => {
          const isSaved = savedUrls.has(job.url);
          const isSaving = savingUrl === job.url;
          const planRel = planRelevanceMap.get(job.id);

          return (
            <div
              key={job.id}
              className="flex items-start gap-3 px-5 py-4 hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors line-clamp-1 hover:underline"
                      >
                        {job.title}
                      </a>
                      {job.publication_date && timeAgo(job.publication_date) === "Today" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-600/30 border border-teal-500/40 text-teal-300 uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{job.company_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {profile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); saveToTracker(job); }}
                        disabled={isSaved || isSaving}
                        className={`text-[10px] transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          isSaved
                            ? "text-emerald-400 cursor-default"
                            : isSaving
                              ? "text-slate-500 cursor-wait"
                              : "text-slate-500 hover:text-teal-400 hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100"
                        }`}
                        title={isSaved ? "Saved to tracker" : "Add to tracker"}
                      >
                        {isSaved ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        <span className="hidden sm:inline">{isSaved ? "Saved" : "Track"}</span>
                      </button>
                    )}
                    {profile && plan && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setGapAnalysisJob(job); }}
                        className="text-[10px] text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100"
                        title="Analyze Job Fit"
                      >
                        <Target className="h-3 w-3" />
                        <span className="hidden sm:inline">Analyze Fit</span>
                      </button>
                    )}
                    {profile && plan && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCoverLetterJob(job); }}
                        className="text-[10px] text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100"
                        title="Generate Cover Letter"
                      >
                        <FileSignature className="h-3 w-3" />
                        <span className="hidden sm:inline">Cover Letter</span>
                      </button>
                    )}
                    {profile && plan && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setTailorJob(job); }}
                        className="text-[10px] text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100"
                        title="Tailor Resume"
                      >
                        <Wand2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Tailor Resume</span>
                      </button>
                    )}
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 group-hover:text-slate-400 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {hasMatchScores && <MatchBadge score={job.matchScore} />}
                  {planRel && planRel.relevant && planRel.reasons.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-violet-900/40 border-violet-600/30 text-violet-300">
                      <Target className="h-2.5 w-2.5" />
                      {planRel.reasons[0]}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="h-2.5 w-2.5" />
                      {job.location}
                    </span>
                  )}
                  {job.job_type && (
                    <span className="text-[10px] text-slate-500">{job.job_type}</span>
                  )}
                  {job.salary && (
                    <span className="text-[10px] text-emerald-400 font-medium">{job.salary}</span>
                  )}
                  {job.publication_date && timeAgo(job.publication_date) !== "Today" && (
                    <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(job.publication_date)}</span>
                  )}
                </div>

                {/* Matched skills */}
                {hasMatchScores && job.matchedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.matchedSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className="text-[10px] bg-teal-900/30 border border-teal-700/30 text-teal-400 px-1.5 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                    {job.matchedSkills.length > 4 && (
                      <span className="text-[10px] text-slate-500">+{job.matchedSkills.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Tags (shown when no match skills) */}
                {(!hasMatchScores || job.matchedSkills.length === 0) && (job.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.tags!.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] bg-slate-700/50 border border-slate-600/40 text-slate-400 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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

      {profile && plan && coverLetterJob && (
        <CoverLetterSheet
          job={coverLetterJob}
          profile={profile}
          plan={plan}
          open={!!coverLetterJob}
          onOpenChange={(open) => { if (!open) setCoverLetterJob(null); }}
        />
      )}

      {profile && plan && gapAnalysisJob && (
        <GapAnalysisSheet
          job={gapAnalysisJob}
          profile={profile}
          plan={plan}
          open={!!gapAnalysisJob}
          onOpenChange={(open) => { if (!open) setGapAnalysisJob(null); }}
          onOpenCoverLetter={() => setCoverLetterJob(gapAnalysisJob)}
          onOpenTailor={() => setTailorJob(gapAnalysisJob)}
        />
      )}

      {profile && plan && tailorJob && (
        <ResumeTailorSheet
          job={tailorJob}
          profile={profile}
          plan={plan}
          open={!!tailorJob}
          onOpenChange={(open) => { if (!open) setTailorJob(null); }}
        />
      )}
    </div>
  );
}
