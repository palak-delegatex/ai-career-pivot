"use client";

/**
 * FeedbackConsentPrompt (AIC-893 — consent-capture pipeline).
 *
 * Shown at a natural moment (post-assessment / post-onboarding). Asks whether we
 * may share the user's feedback and, if so, how it may be attributed:
 *   - "named"     → with first name + role
 *   - "anonymous" → only as "beta user"
 *   - "declined"  → never used
 *
 * Persists the choice via /api/feedback-consent and emits the opt-in metric
 * (CEO target ≥30%). Named/role attribution is captured ONLY on explicit
 * "named" consent — the same guardrail the backend enforces.
 *
 * This asks permission for *future* real feedback; it never fabricates or
 * displays a quote. It self-dismisses (localStorage) once answered so it shows
 * at most once per browser.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { trackConsentPromptShown, trackConsentSubmitted } from "@/lib/tracking";

type Choice = "named" | "anonymous" | "declined";

function storageKey(source: string) {
  return `feedback_consent_v1:${source}`;
}

/** Reads prior consent for this source (client-only; safe during SSR). */
function alreadyAnswered(source: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(storageKey(source));
  } catch {
    return false;
  }
}

export default function FeedbackConsentPrompt({
  email,
  source,
  className = "",
}: {
  /** The user's email, used as the upsert key. If absent, the prompt is skipped. */
  email?: string;
  /** Where the prompt appears, e.g. "post_assessment" | "post_onboarding". */
  source: string;
  className?: string;
}) {
  // Answered = already responded on this browser (lazy from localStorage) OR
  // answered this session. Kept out of an effect so we never setState-in-effect.
  const [answered, setAnswered] = useState<boolean>(() => alreadyAnswered(source));
  const [expandNamed, setExpandNamed] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");
  const [done, setDone] = useState(false);
  const key = useMemo(() => storageKey(source), [source]);
  const shownTracked = useRef(false);

  const visible = !!email && !answered;

  // Fire the "shown" metric once, when the prompt actually becomes visible.
  // Side-effect only (no setState) so it doesn't trigger cascading renders.
  useEffect(() => {
    if (visible && !shownTracked.current) {
      shownTracked.current = true;
      trackConsentPromptShown({ source });
    }
  }, [visible, source]);

  if (!visible) return null;

  async function submit(choice: Choice) {
    trackConsentSubmitted({ source, choice });
    try {
      localStorage.setItem(key, choice);
    } catch {
      /* ignore */
    }
    // Fire-and-forget persistence; UX doesn't block on it.
    void fetch("/api/feedback-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        consent: choice,
        firstName: choice === "named" ? firstName : undefined,
        role: choice === "named" ? role : undefined,
        source,
      }),
    }).catch(() => {});
    setDone(true);
    // Briefly show a thank-you, then remove.
    setTimeout(() => setAnswered(true), 2500);
  }

  if (done) {
    return (
      <div className={`rounded-2xl border border-teal-700/40 bg-teal-950/20 p-5 text-center ${className}`}>
        <p className="text-sm font-medium text-teal-300">Thanks — noted. 🙌</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      <p className="text-sm font-semibold text-white">Can we share your feedback?</p>
      <p className="mt-1 text-xs text-slate-400">
        As we grow, we&rsquo;d love to feature honest feedback from early users. You choose whether
        and how you&rsquo;re credited. We never share anything without your say-so.
      </p>

      {!expandNamed ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setExpandNamed(true)}
            className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
          >
            Yes — with my first name &amp; role
          </button>
          <button
            type="button"
            onClick={() => submit("anonymous")}
            className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500"
          >
            Yes — anonymously as &ldquo;beta user&rdquo;
          </button>
          <button
            type="button"
            onClick={() => submit("declined")}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-300"
          >
            No thanks
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g. Marketing Manager)"
              className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!firstName.trim()}
              onClick={() => submit("named")}
              className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save consent
            </button>
            <button
              type="button"
              onClick={() => setExpandNamed(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-300"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
