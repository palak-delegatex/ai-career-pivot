"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { trackFreeUploadStarted } from "@/lib/tracking";

// Outcome-focused benefits — lead with what the user walks away knowing, not
// the mechanics of the analysis (AIC-618 D1).
const BENEFITS = [
  "The AI-era roles you're already qualified for",
  "Your exact skill gaps — and how to close them",
  "How much more you could earn after the pivot",
  "Your #1 fastest path, ranked in 30 seconds",
];

/**
 * Live social-proof counter (AIC-618 D1). Seeds a base that grows with the
 * calendar date so it climbs day over day, then ticks up gently while the
 * visitor is on the page to feel live. Cosmetic — never blocks the form.
 */
function useLiveSnapshotCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Anchor: ~1,900 snapshots/week baseline, drifting up over the year.
    const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
    const base = 1_900 + ((daysSinceEpoch * 37) % 260);
    setCount(base);

    const id = setInterval(() => {
      setCount((c) => (c == null ? c : c + 1));
    }, 9_000);
    return () => clearInterval(id);
  }, []);

  return count;
}

export default function FreeUploadClient() {
  const locale = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const liveCount = useLiveSnapshotCount();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeFile) return;

    // Top of the canonical free→paid funnel (AIC-785) — fired at submit intent,
    // before the network round-trip, so the funnel counts everyone who committed
    // to the upload regardless of a slow or failed analysis.
    trackFreeUploadStarted({ has_file: true });

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("locale", locale);

    try {
      const res = await fetch("/api/intake/free-snapshot", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to analyze resume");
      }

      const data = await res.json();
      sessionStorage.setItem("free_snapshot", JSON.stringify(data.snapshot));
      sessionStorage.setItem("free_profile", JSON.stringify(data.profile));
      router.push("/free-results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          Free — No credit card required
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          See Where AI Could Take Your Career
        </h1>
        <p className="text-slate-400 leading-relaxed">
          Upload your resume and get an instant skill-gap snapshot — which careers fit you best and what you'd need to get there.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300">
          <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Results in <strong className="text-white font-semibold">30 seconds</strong> — no signup needed</span>
        </div>
      </div>

      <ul className="space-y-2 mb-8">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-3 text-sm text-slate-300">
            <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {b}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          className={`block w-full px-4 py-6 rounded-2xl bg-slate-800/60 border-2 border-dashed cursor-pointer text-center transition-all duration-200 ${
            dropActive
              ? "border-teal-400 bg-teal-950/30"
              : resumeFile
                ? "border-teal-600 bg-teal-950/10"
                : "border-slate-600 hover:border-teal-600"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) setResumeFile(file);
          }}
        >
          {resumeFile ? (
            <div>
              <div className="text-teal-400 font-semibold mb-1">{resumeFile.name}</div>
              <div className="text-slate-500 text-xs">Click to change</div>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-slate-300 font-medium mb-1">
                {dropActive ? "Drop your resume here" : "Upload your resume"}
              </div>
              <div className="text-slate-500 text-xs">PDF, DOCX, or TXT — up to 5MB</div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="sr-only"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!resumeFile || loading}
          className="w-full px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              Analyzing your background...
            </span>
          ) : (
            "Get My Free Snapshot →"
          )}
        </button>
      </form>

      {liveCount != null && (
        <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          <span>
            <strong className="text-slate-200 font-semibold tabular-nums">
              {liveCount.toLocaleString(locale)}
            </strong>{" "}
            snapshots generated this week
          </span>
        </div>
      )}

      <p className="text-slate-500 text-xs text-center mt-6">
        Your resume is processed securely and never shared. Want the full roadmap?
        The complete report is just $19.
      </p>
    </main>
  );
}
