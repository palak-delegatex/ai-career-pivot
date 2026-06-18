"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FreeSnapshotResults from "@/components/FreeSnapshotResults";
import ValueComparisonCard from "@/components/ValueComparisonCard";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import {
  trackFreeSnapshotStarted,
  trackFreeSnapshotCompleted,
  trackFreeSnapshotEmailCaptured,
  trackFreeSnapshotUpgradeClicked,
} from "@/lib/tracking";

function normalizeLinkedinUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    const u = new URL(url);
    const clean = `https://www.linkedin.com${u.pathname}`.replace(/\/+$/, "");
    if (/linkedin\.com\/(in|pub)\/[^/]+/i.test(clean)) return clean;
  } catch {
    // Fall through
  }
  return url;
}

function linkedinUrlStatus(url: string): "empty" | "valid" | "invalid" {
  if (!url) return "empty";
  return /linkedin\.com\/(in|pub)\/[^/]+/i.test(url) ? "valid" : "invalid";
}

function extractLinkedinUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/(?:in|pub)\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]).replace(/-/g, " ") : null;
}

function validateResumeFile(file: File): string {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  if (![".pdf", ".docx", ".doc", ".txt"].includes(ext)) return "Please upload a PDF, DOCX, or TXT file";
  if (file.size > 10 * 1024 * 1024) return "File must be under 10 MB";
  return "";
}

type PageState = "input" | "analyzing" | "results" | "error";

const ANALYSIS_MESSAGES = [
  "Parsing your professional background...",
  "Mapping skills to career opportunities...",
  "Identifying your strongest pivot angles...",
  "Generating personalized career paths...",
] as const;

export default function GetStartedClient() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [pageState, setPageState] = useState<PageState>("input");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinPasting, setLinkedinPasting] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const [error, setError] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);

  const [snapshot, setSnapshot] = useState<FreeSnapshot | null>(null);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  useEffect(() => {
    if (pageState !== "analyzing") return;
    const interval = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_MESSAGES.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [pageState]);

  async function pasteLinkedinFromClipboard() {
    try {
      setLinkedinPasting(true);
      const text = await navigator.clipboard.readText();
      const normalized = normalizeLinkedinUrl(text.trim());
      if (linkedinUrlStatus(normalized) === "valid") {
        setLinkedinUrl(normalized);
      } else if (text.trim()) {
        setLinkedinUrl(text.trim());
      }
    } catch {
      // Clipboard permission denied
    } finally {
      setLinkedinPasting(false);
    }
  }

  async function handleSubmit() {
    const hasLinkedin = linkedinUrlStatus(linkedinUrl) === "valid";
    const hasResume = !!resumeFile;

    if (!hasLinkedin && !hasResume) {
      setError("Please provide your LinkedIn URL or upload a resume.");
      return;
    }

    setError("");
    setPageState("analyzing");
    setAnalysisStep(0);

    const source = hasLinkedin && hasResume ? "both" : hasLinkedin ? "linkedin" : "resume";
    trackFreeSnapshotStarted({ source });

    try {
      let profile = null;

      if (hasLinkedin) {
        const res = await fetch("/api/intake/linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl, email: "" }),
        });
        if (res.ok) {
          const data = await res.json();
          profile = data.profile;
        } else if (!hasResume) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "LinkedIn import failed. Try uploading your resume instead.");
        }
      }

      if (hasResume) {
        const fd = new FormData();
        fd.append("resume", resumeFile);
        const res = await fetch("/api/intake/resume", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          if (profile) {
            profile = {
              ...profile,
              skills: [...new Set([...profile.skills, ...(data.profile.skills ?? [])])],
              transferableSkills: [...new Set([...profile.transferableSkills, ...(data.profile.transferableSkills ?? [])])],
              experience: [...profile.experience, ...(data.profile.experience ?? [])].filter(
                (e: { title: string; company: string }, i: number, arr: { title: string; company: string }[]) =>
                  arr.findIndex(x => x.title === e.title && x.company === e.company) === i
              ),
            };
          } else {
            profile = data.profile;
          }
        } else if (!profile) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Resume parsing failed");
        }
      }

      if (!profile?.skills?.length) {
        throw new Error("Could not extract skills from your profile. Please try a different input.");
      }

      const snapshotRes = await fetch("/api/intake/free-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (!snapshotRes.ok) {
        const err = await snapshotRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Analysis failed");
      }

      const data = await snapshotRes.json();
      setSnapshot(data.snapshot);

      sessionStorage.setItem("free_snapshot", JSON.stringify(data.snapshot));
      sessionStorage.setItem("free_profile", JSON.stringify(data.profile));

      trackFreeSnapshotCompleted({
        paths_count: data.snapshot.paths?.length ?? 0,
        top_match_score: data.snapshot.paths?.[0]?.matchScore ?? 0,
        source,
      });

      setPageState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPageState("error");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    trackFreeSnapshotEmailCaptured({ has_snapshot: !!snapshot });

    sessionStorage.setItem("get_started_email", email);

    const profile = sessionStorage.getItem("free_profile");
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        parsed.email = email;
        sessionStorage.setItem("free_profile", JSON.stringify(parsed));
      } catch {
        // Non-fatal
      }
    }

    setEmailSubmitted(true);
  }

  // Analyzing state
  if (pageState === "analyzing") {
    return (
      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="mb-8">
          <svg className="w-16 h-16 mx-auto text-teal-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Analyzing your background...</h2>
        <p className="text-slate-400 text-sm mb-8">Usually done in under 60 seconds</p>

        <div className="space-y-3 text-left max-w-sm mx-auto">
          {ANALYSIS_MESSAGES.map((msg, i) => (
            <div key={msg} className="flex items-center gap-3">
              {i < analysisStep ? (
                <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
                  <path d="M6 10.5l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              ) : i === analysisStep ? (
                <span className="block w-5 h-5 rounded-full bg-teal-400 shrink-0" style={{ animation: "step-pulse 1.5s ease-in-out infinite" }} />
              ) : (
                <span className="block w-5 h-5 rounded-full border-2 border-slate-600 shrink-0" />
              )}
              <span className={i <= analysisStep ? "text-white text-sm" : "text-slate-500 text-sm"}>
                {msg}
              </span>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // Results state
  if (pageState === "results" && snapshot) {
    const username = extractLinkedinUsername(linkedinUrl);
    return (
      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
              Your Free Career Pivot Analysis
            </div>
            <h1 className="text-3xl font-extrabold mb-2">
              {username ? `${username}'s Career Pivot Paths` : "Your Career Pivot Paths"}
            </h1>
          </div>

          <FreeSnapshotResults snapshot={snapshot} />

          {/* Email capture — appears AFTER results */}
          <div className="mt-8 rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
            {emailSubmitted ? (
              <div className="text-center">
                <span className="text-teal-400 text-lg">&#10003;</span>
                <p className="text-sm text-slate-300 mt-1">
                  Results saved! We&apos;ll send tips personalized to your career pivot paths.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-200 mb-1">Save your results & get personalized tips</p>
                <p className="text-xs text-slate-400 mb-3">We&apos;ll email you actionable next steps based on your snapshot.</p>
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!email}
                    className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Value comparison */}
          <div className="mt-8">
            <ValueComparisonCard topMatchScore={snapshot.paths[0]?.matchScore} />
          </div>

          {/* Continue to full onboarding CTA */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                trackFreeSnapshotUpgradeClicked({
                  cta_location: "get_started_bottom",
                  top_match_score: snapshot.paths[0]?.matchScore,
                });
                window.location.href = "/pricing";
              }}
              className="text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
            >
              See what the full $19 report includes →
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  // Input state (default) and error state
  const linkedinStatus = linkedinUrlStatus(linkedinUrl);
  const linkedinPreview = linkedinStatus === "valid" ? extractLinkedinUsername(linkedinUrl) : null;

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          Free — No signup required
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          See Where Your Career Could Go
        </h1>
        <p className="text-slate-400 leading-relaxed text-lg">
          Paste your LinkedIn URL and get personalized career pivot paths in under 60 seconds.
        </p>
      </div>

      <div className="space-y-4">
        {/* LinkedIn URL input — primary */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            LinkedIn profile URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                onBlur={() => {
                  const normalized = normalizeLinkedinUrl(linkedinUrl);
                  if (normalized !== linkedinUrl) setLinkedinUrl(normalized);
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  const normalized = normalizeLinkedinUrl(pasted);
                  if (normalized !== pasted) {
                    e.preventDefault();
                    setLinkedinUrl(normalized);
                  }
                }}
                placeholder="linkedin.com/in/yourname"
                className={`w-full px-4 py-3 pr-10 rounded-xl bg-slate-800 border focus:outline-none text-white placeholder-slate-500 transition-colors ${
                  linkedinStatus === "valid"
                    ? "border-teal-500/70 focus:border-teal-400"
                    : linkedinStatus === "invalid"
                    ? "border-amber-500/60 focus:border-amber-400"
                    : "border-slate-600 focus:border-teal-500"
                }`}
              />
              {linkedinStatus === "valid" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-400 text-xs font-medium pointer-events-none">&#10003;</span>
              )}
            </div>
            {!linkedinUrl && (
              <button
                type="button"
                onClick={pasteLinkedinFromClipboard}
                disabled={linkedinPasting}
                className="px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 hover:border-teal-500 text-slate-300 hover:text-teal-400 transition-colors text-sm font-medium disabled:opacity-50"
                title="Paste from clipboard"
              >
                {linkedinPasting ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  "Paste"
                )}
              </button>
            )}
          </div>
          {linkedinStatus === "invalid" && (
            <p className="text-xs text-amber-400/80 mt-1.5">Should look like linkedin.com/in/yourname</p>
          )}
          {linkedinPreview && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-teal-950/30 border border-teal-800/30">
              <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-sm text-teal-300/90 capitalize">{linkedinPreview}</span>
            </div>
          )}
        </div>

        {/* Collapsed resume upload toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowResumeUpload(!showResumeUpload)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showResumeUpload ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {resumeFile ? `Resume: ${resumeFile.name}` : "Or upload a resume instead"}
          </button>

          <AnimatePresence>
            {showResumeUpload && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <label
                    className={`block w-full px-4 py-4 rounded-xl bg-slate-800 border border-dashed cursor-pointer text-center transition-all duration-200 ${
                      dropActive
                        ? "border-teal-400 bg-teal-950/30"
                        : resumeFile
                          ? "border-teal-600"
                          : "border-slate-600 hover:border-teal-500"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
                    onDragLeave={() => setDropActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const err = validateResumeFile(file);
                        if (err) { setResumeError(err); return; }
                        setResumeError("");
                        setResumeFile(file);
                      }
                    }}
                  >
                    {resumeFile ? (
                      <span className="text-teal-400 font-medium">{resumeFile.name}</span>
                    ) : (
                      <span className="text-slate-400">
                        {dropActive ? "Drop your resume here" : "Click or drag to upload (PDF, DOCX, TXT)"}
                      </span>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file) {
                          const err = validateResumeFile(file);
                          if (err) { setResumeError(err); return; }
                          setResumeError("");
                        }
                        setResumeFile(file);
                      }}
                    />
                  </label>
                  {resumeError && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>{resumeError}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error display */}
        {(error || pageState === "error") && (
          <div className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
            {error}
            {pageState === "error" && (
              <button
                type="button"
                onClick={() => { setPageState("input"); setError(""); }}
                className="block mt-2 text-xs text-red-300 underline"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={linkedinStatus !== "valid" && !resumeFile}
          className="w-full px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          See My Career Paths — Free
        </button>

        <p className="text-slate-500 text-xs text-center">
          Takes under 60 seconds. No signup, no payment. Your data is processed securely and never shared.
        </p>
      </div>
    </main>
  );
}
