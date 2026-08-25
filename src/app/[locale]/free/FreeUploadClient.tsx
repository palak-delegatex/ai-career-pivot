"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  trackFreeUploadStarted,
  trackFreeSnapshotStreaming,
  markFreeLanding,
  trackFreeTimeToAha,
} from "@/lib/tracking";
import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";
import HonestProofBadge from "@/components/HonestProofBadge";
import AtsQuickCheck from "./AtsQuickCheck";
import { Button } from "@/components/ui/button";

// Two logged-out entry modes on /free (AIC-830). The zero-upload quick-check is
// the default so a visitor gets value before ever handling a file (the activation
// leak the ticket fixes); "upload" is one tap away and unchanged.
type EntryMode = "quickcheck" | "upload";

// The snapshot streams in as partial JSON, so every field is optional until the
// stream completes. Mirrors the paid plan's partial-object rendering.
type PartialSnapshot = {
  profileSummary?: string;
  estimatedSalaryUplift?: number;
  paths?: Array<{ targetRole?: string; targetIndustry?: string; matchScore?: number }>;
  topTransferableStrengths?: Array<{ skill?: string }>;
};

/**
 * Close an in-flight partial JSON string so it can be parsed mid-stream:
 * balances open braces/brackets and terminates an open string. Same approach as
 * the paid StreamingPlanGeneration reader.
 */
function tryCloseJson(text: string): string {
  let result = text.trim();
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of result) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  if (inString) result += '"';
  while (openBrackets > 0) { result += "]"; openBrackets--; }
  while (openBraces > 0) { result += "}"; openBraces--; }
  return result;
}

// Decode the base64 profile header (UTF-8 safe for accented names / CJK résumés).
function decodeProfileHeader(header: string): unknown {
  const bytes = Uint8Array.from(atob(header), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Outcome-focused benefits — lead with what the user walks away knowing, not
// the mechanics of the analysis (AIC-618 D1).
const BENEFITS = [
  "The AI-era roles you're already qualified for",
  "Your exact skill gaps — and how to close them",
  "How much more you could earn after the pivot",
  "Your #1 fastest path, ranked in 30 seconds",
];

/**
 * Fire the gamified ATS scoring (AIC-879 §2) in the background and hand the
 * result to /free-results via sessionStorage. Runs only when the visitor pasted
 * a JD in the quick-check (`quickcheck_jd`) — the sole case where we have a real
 * target to score against, so the meter is never fabricated. Fully detached from
 * React lifecycle: the fetch outlives this component's unmount on navigation.
 */
function kickGamifiedAts(file: File) {
  let jd: string | null = null;
  try {
    jd = sessionStorage.getItem("quickcheck_jd");
    // Clear any stale result from a prior run so /free-results doesn't show it.
    sessionStorage.removeItem("free_ats_gamified");
  } catch {
    return; // sessionStorage unavailable — skip Surface 2 silently.
  }
  if (!jd?.trim()) return;

  try {
    sessionStorage.setItem("free_ats_pending", "1");
  } catch {
    return;
  }

  const form = new FormData();
  form.append("resume", file);
  form.append("jobDescription", jd);

  fetch("/api/ats-gamified", { method: "POST", body: form })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((payload) => {
      try {
        sessionStorage.setItem("free_ats_gamified", JSON.stringify(payload));
      } catch {
        /* non-fatal */
      }
    })
    .catch(() => {
      /* Surface 2 simply won't render — the rest of /free-results is unaffected. */
    })
    .finally(() => {
      try {
        sessionStorage.removeItem("free_ats_pending");
      } catch {
        /* non-fatal */
      }
    });
}

/**
 * Live snapshot reveal (AIC-796). Replaces the blank "Analyzing…" spinner with a
 * staged, personalized progress view that reacts to the streamed snapshot —
 * lighting up steps and surfacing the top match as soon as the model yields it,
 * so users see value building instead of a frozen page during the wait.
 */
function GeneratingReveal({ partial }: { partial: PartialSnapshot }) {
  const topMatch = partial.paths?.[0];
  const pathCount = partial.paths?.length ?? 0;

  const stages = [
    { label: "Reading your résumé", done: Boolean(partial.profileSummary || pathCount) },
    { label: "Matching AI-era roles", done: pathCount > 0 },
    { label: "Scoring your fit", done: topMatch?.matchScore != null },
    { label: "Surfacing your hidden strengths", done: Boolean(partial.topTransferableStrengths?.length) },
  ];
  const completed = stages.filter((s) => s.done).length;
  const pct = Math.max(8, Math.round((completed / stages.length) * 100));

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
        </span>
        <h2 className="text-lg font-bold">Building your snapshot…</h2>
      </div>

      {partial.profileSummary ? (
        <p className="text-white font-semibold leading-relaxed mb-5">Analyzing {partial.profileSummary}</p>
      ) : (
        <p className="text-slate-500 text-sm mb-5">Analyzing your experience against today&apos;s AI-era roles.</p>
      )}

      <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2.5 mb-5">
        {stages.map((s) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            {s.done ? (
              <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
              </span>
            )}
            <span className={s.done ? "text-slate-200" : "text-slate-500"}>{s.label}</span>
          </li>
        ))}
      </ul>

      {topMatch?.targetRole && (
        <div className="rounded-xl bg-teal-950/40 border border-teal-700/40 px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-teal-400 font-semibold mb-0.5">
            Your top match{pathCount > 1 ? ` · ${pathCount} paths found` : ""}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-white font-semibold">{topMatch.targetRole}</span>
            {topMatch.matchScore != null && (
              <span className="text-teal-300 font-bold tabular-nums">
                {Math.round(topMatch.matchScore)}% fit
              </span>
            )}
          </div>
        </div>
      )}

      <p className="text-slate-500 text-xs text-center mt-5">
        Assembling your full snapshot — this takes a few seconds.
      </p>
      <span className="sr-only" aria-live="polite">
        {completed} of {stages.length} steps complete
        {topMatch?.targetRole ? `. Top match ${topMatch.targetRole}.` : ""}
      </span>
    </div>
  );
}

export default function FreeUploadClient({
  initialMode = "quickcheck",
}: {
  initialMode?: EntryMode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<EntryMode>(initialMode);
  // A `?mode=upload` deep-link (hero + sticky CTA) is committed upload intent.
  // For that path we drop the entry-mode toggle and the benefits list so the
  // drop zone is the first thing under the heading — no competing choice, no
  // content pushing the first snapshot action below the fold (AIC-1097).
  const deepLinkedUpload = initialMode === "upload";
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partial, setPartial] = useState<PartialSnapshot | null>(null);
  // Quiz → snapshot carry (AIC-863 §2b). When the visitor arrived from the
  // 30-second career quiz, show a "targeting [matchedRole]" pill and pass this
  // context to the snapshot API so its #1 path aligns with the quiz's promise.
  const [quizContext, setQuizContext] = useState<{
    matchedRole?: string;
    interests?: string[];
    timeline?: string;
  } | null>(null);

  // Stamp the time-to-aha clock on first /free mount (AIC-856). First touch
  // wins, so the quick-check→upload mode switch (which never unmounts) keeps the
  // original landing time. Whichever reveal renders first fires free_time_to_aha.
  useEffect(() => {
    markFreeLanding();
    try {
      // Quiz-carry (AIC-863 §2b): parse the outcome the quiz stored so the pill
      // and the snapshot request can target the role the visitor was promised.
      const rawQuiz = sessionStorage.getItem("quiz_answers");
      if (rawQuiz) {
        const parsed = JSON.parse(rawQuiz);
        if (parsed && typeof parsed === "object" && typeof parsed.matchedRole === "string") {
          setQuizContext({
            matchedRole: parsed.matchedRole,
            interests: Array.isArray(parsed.interests) ? parsed.interests : undefined,
            timeline: typeof parsed.timeline === "string" ? parsed.timeline : undefined,
          });
        }
      }
    } catch {
      /* sessionStorage unavailable or quiz_answers malformed — non-fatal */
    }
  }, []);

  // (`?mode=upload` deep-links are now resolved on the server via `initialMode`,
  // so there is no post-hydration mode flip — the upload form is the first paint.)

  // Hand-off from the quick-check "upload your resume" CTA: carry the pasted JD
  // forward (so /free-results can reference the role the user was checking) and
  // switch to the upload mode where the personalized snapshot is generated.
  function handleQuickCheckToUpload(jobDescription: string) {
    try {
      sessionStorage.setItem("quickcheck_jd", jobDescription);
    } catch {
      /* sessionStorage may be unavailable (private mode) — non-fatal */
    }
    setMode("upload");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeFile) return;

    // Top of the canonical free→paid funnel (AIC-785) — fired at submit intent,
    // before the network round-trip, so the funnel counts everyone who committed
    // to the upload regardless of a slow or failed analysis.
    trackFreeUploadStarted({ has_file: true });

    setLoading(true);
    setError("");
    setPartial({});

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("locale", locale);
    // Bias the snapshot's top path toward the quiz match so it fulfils the pill's
    // promise (AIC-863 §2b). Only sent when the visitor came through the quiz.
    if (quizContext?.matchedRole) {
      formData.append("quizContext", JSON.stringify(quizContext));
    }

    const startedAt = Date.now();
    let firstInsightTracked = false;

    try {
      const res = await fetch("/api/intake/free-snapshot", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // Validation/parse failures respond with JSON before the stream starts.
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to analyze resume");
      }

      // Profile rides along in a header so the streamed body stays a single JSON
      // object (see the free-snapshot route). It's needed for /free-results.
      let profile: unknown = null;
      const profileHeader = res.headers.get("x-free-profile");
      if (profileHeader) {
        try { profile = decodeProfileHeader(profileHeader); } catch { /* non-fatal */ }
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        accumulated += decoder.decode(value, { stream: true });

        try {
          const snap = JSON.parse(tryCloseJson(accumulated)) as PartialSnapshot;
          setPartial(snap);

          // Fire the time-to-first-value diagnostic the moment a real insight
          // is visible (AIC-796), so the CMO can correlate perceived latency
          // with the upload→results funnel step.
          if (!firstInsightTracked && (snap.profileSummary || snap.paths?.[0]?.targetRole)) {
            firstInsightTracked = true;
            trackFreeSnapshotStreaming({ ms_to_first_insight: Date.now() - startedAt });
            // First value moment for a visitor who went straight to upload (no
            // quick-check). Self-guards, so it's a no-op if the quick-check
            // reveal already claimed the aha earlier this session (AIC-856).
            trackFreeTimeToAha({ aha_surface: "upload_snapshot" });
          }
        } catch {
          // Partial JSON not parseable yet — keep accumulating.
        }
      }

      let snapshot: FreeSnapshot;
      try {
        snapshot = JSON.parse(accumulated) as FreeSnapshot;
      } catch {
        throw new Error("The analysis stream ended unexpectedly. Please try again.");
      }
      if (!snapshot?.paths?.length) {
        throw new Error("We couldn't generate a snapshot from that resume. Please try again.");
      }

      sessionStorage.setItem("free_snapshot", JSON.stringify(snapshot));
      if (profile) sessionStorage.setItem("free_profile", JSON.stringify(profile));
      // Kick the gamified ATS score (AIC-879 §2) in the background — only when
      // the visitor pasted a JD in the quick-check, the one case where we have a
      // real target to score the résumé against. Non-blocking: it writes the
      // result to sessionStorage where /free-results picks it up (it polls while
      // `free_ats_pending` is set), so it never delays navigation to results.
      kickGamifiedAts(resumeFile);
      router.push("/free-results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
      setPartial(null);
    }
  }

  return (
    <main id="main-content" className="max-w-lg mx-auto px-6 pt-6 pb-16">
      {/* Entry-mode toggle — hidden once an upload analysis is streaming so the
          reveal owns the viewport, and hidden entirely for `?mode=upload`
          deep-links (committed upload intent — don't re-offer the other path).
          Quick-check is the default zero-upload path for organic /free landings. */}
      {!loading && !deepLinkedUpload && (
        <div className="flex p-1 mb-8 rounded-xl bg-slate-800/60 border border-slate-700 text-sm font-semibold">
          {([
            { id: "quickcheck", label: "Check a job posting" },
            { id: "upload", label: "Upload your resume" },
          ] as const).map((t) => (
            <Button
              key={t.id}
              type="button"
              variant={mode === t.id ? "default" : "ghost"}
              onClick={() => setMode(t.id)}
              aria-pressed={mode === t.id}
              className={`h-auto flex-1 rounded-lg px-3 py-2 ${
                mode === t.id ? "" : "text-slate-300 hover:text-white"
              }`}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      {mode === "quickcheck" && !loading ? (
        <AtsQuickCheck source="free_page" onUploadResume={(jd) => handleQuickCheckToUpload(jd)} />
      ) : (
      <>
      {loading ? (
        <GeneratingReveal partial={partial ?? {}} />
      ) : (
      <>
      {/* Benefits list — reinforces value for organic /free visitors, but skipped
          for committed `?mode=upload` deep-links so the drop zone sits directly
          under the heading (removes a step before the first snapshot; AIC-1097). */}
      {!deepLinkedUpload && (
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
      )}

      {/* Quiz-carry pill (AIC-863 §2b) — only shown when the visitor arrived from
          the quiz; its matchedRole is what the snapshot API is told to target. */}
      {quizContext?.matchedRole && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-950/40 border border-teal-700/40 px-4 py-2.5 text-sm text-teal-200">
          <svg className="w-4 h-4 flex-shrink-0 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8zm0-5v3m0 12v3m9-9h-3M6 12H3" />
          </svg>
          <span>
            Based on your quiz: targeting{" "}
            <strong className="font-semibold text-white">{quizContext.matchedRole}</strong> roles
          </span>
        </div>
      )}

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
            id="resume-file"
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="sr-only"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "resume-error" : undefined}
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && (
          <p
            id="resume-error"
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!resumeFile || loading}
          aria-busy={loading}
          className="h-auto w-full rounded-xl px-6 py-4 text-lg font-bold shadow-lg shadow-primary/30"
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
        </Button>
      </form>

      {/* Honest, DB-sourced momentum (AIC-879) — real plan_leads count when it
          clears the floor, else a truthful capability signal (never a fabricated
          number; replaces the old seeded ~1,900 ticker). */}
      <HonestProofBadge variant="live" className="mt-5" />
      </>
      )}

      <p className="text-slate-500 text-xs text-center mt-6">
        Your resume is processed securely and never shared. Want the full roadmap?
        The complete report is just $19.
      </p>
      </>
      )}
    </main>
  );
}
