"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  trackAtsQuickcheckStarted,
  trackAtsQuickcheckCompleted,
  trackAtsQuickcheckToUpload,
} from "@/lib/tracking";
import type { AtsQuickCheck as QuickCheckResult } from "@/app/api/ats-quickcheck/route";

// Priority label colors — differentiated by TEXT as well as color so they stay
// colorblind-safe (design a11y checklist).
const IMPORTANCE_STYLES: Record<QuickCheckResult["topSkills"][number]["importance"], string> = {
  Critical: "text-red-400",
  High: "text-amber-400",
  Medium: "text-slate-400",
};

/**
 * Path A — anonymous zero-upload ATS quick-check (AIC-830 / AIC-825).
 *
 * The logged-out "taste": paste a job posting → role + top-5 skill bars + an
 * industry-average readiness estimate, with the PERSONALIZED match score left
 * locked behind a resume upload. The unfinished "your match: ?" is deliberate
 * (Goal-Gradient / Zeigarnik) — the upload CTA resolves it by handing off into
 * the existing free-snapshot flow with the JD carried along.
 */
export default function AtsQuickCheck({
  source,
  onUploadResume,
}: {
  source: "free_page" | "landing";
  onUploadResume: (jobDescription: string, role: string) => void;
}) {
  const locale = useLocale();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuickCheckResult | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!jd.trim() || loading) return;

    // Top of the new activation entry path — fired at intent, before the network
    // round-trip, so it counts everyone who committed to a quick-check.
    trackAtsQuickcheckStarted({ source });

    setLoading(true);
    setError("");
    setResult(null);

    const startedAt = Date.now();
    try {
      const res = await fetch("/api/ats-quickcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't analyze that posting. Please try again.");
      }
      const quick = data as QuickCheckResult;
      setResult(quick);
      trackAtsQuickcheckCompleted({
        role_extracted: quick.role,
        skill_count: quick.topSkills?.length ?? 0,
        ms_to_result: Date.now() - startedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4 font-mono">
          Free · No signup needed
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight font-serif">
          Check any job posting in 5 seconds
        </h1>
        <p className="text-slate-400 leading-relaxed">
          See what skills matter — before you apply. Paste a job description, no resume needed.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <label className="block">
          <span className="sr-only">Paste a job description or URL</span>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={5}
            placeholder="Paste a job description or a job posting URL…"
            className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y min-h-32"
          />
        </label>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!jd.trim() || loading}
          className="w-full px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              Analyzing this job…
            </span>
          ) : (
            "Analyze This Job →"
          )}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl bg-slate-900/50 border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-teal-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-bold text-white">
              {result.role}
              {result.industry ? <span className="text-slate-400 font-normal"> — {result.industry}</span> : null}
            </h2>
          </div>

          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">
            Top {result.topSkills.length} skills this role demands
          </div>
          <ul className="space-y-3 mb-6">
            {result.topSkills.map((s) => (
              <li key={s.skill}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm text-slate-200">{s.skill}</span>
                  <span className={`text-xs font-medium ${IMPORTANCE_STYLES[s.importance]}`}>{s.importance}</span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-slate-700 overflow-hidden"
                  role="meter"
                  aria-valuenow={Math.round(s.weight)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.skill}: ${s.importance}, ${Math.round(s.weight)}%`}
                >
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.max(6, Math.min(100, s.weight))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-teal-950/40 border border-teal-700/40 px-4 py-4 text-center">
            <div className="text-xs uppercase tracking-wide text-teal-400 font-semibold mb-1">
              Your match score
            </div>
            <div className="text-2xl font-bold text-teal-400 mb-1 motion-safe:animate-pulse" aria-label="Your match score is locked">
              ?
            </div>
            <p className="text-sm text-slate-300 mb-4">{result.readinessNote}</p>
            <button
              type="button"
              onClick={() => {
                trackAtsQuickcheckToUpload({ role: result.role });
                onUploadResume(jd, result.role);
              }}
              className="w-full px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold transition-colors"
            >
              Upload your resume to see YOUR match →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
