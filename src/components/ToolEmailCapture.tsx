"use client";

import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { trackToolCtaClicked, trackToolEmailCaptured } from "@/lib/tracking";

/**
 * Reusable lead-capture card for the standalone free tools (AIC-839, pairs with
 * AIC-838 design). The tools produce real value (ATS score, generated resume,
 * gap analysis…) but captured nothing — this turns that SEO traffic into a
 * measurable, nurtured lead.
 *
 * Plumbing only: it POSTs to /api/intake/tool-lead (Supabase waitlist enroll +
 * Resend welcome drip) and emits the tool→lead funnel events cta_clicked →
 * email_captured, both tagged with `tool` + `source`. Copy, placement and
 * styling are intentionally prop-driven so the AIC-838 design pass can restyle
 * and reposition per tool without touching any of the funnel wiring.
 *
 * Modeled on the EmailCaptureCard in FreeResultsClient (the /free-results
 * deferred-capture card), generalized off the snapshot dependency.
 */

const ACCENTS = {
  teal: {
    icon: "text-teal-400",
    ring: "focus:ring-teal-500",
    button: "bg-teal-600 hover:bg-teal-500",
    sentBg: "bg-teal-950/30 border-teal-800/40",
    sentIcon: "bg-teal-600/20 border-teal-600/40 text-teal-300",
    sentCheck: "text-teal-300",
  },
  blue: {
    icon: "text-blue-400",
    ring: "focus:ring-blue-500",
    button: "bg-blue-600 hover:bg-blue-500",
    sentBg: "bg-blue-950/30 border-blue-800/40",
    sentIcon: "bg-blue-600/20 border-blue-600/40 text-blue-300",
    sentCheck: "text-blue-300",
  },
} as const;

export type ToolEmailCaptureProps = {
  /** Tool slug for funnel attribution, e.g. "ats-score", "linkedin-optimizer". */
  tool: string;
  /** Placement within the tool for the funnel `source` prop. */
  source?: string;
  heading?: string;
  subheading?: string;
  buttonText?: string;
  /** Confirmation copy shown after a successful capture. */
  sentHeading?: string;
  sentSubheading?: string;
  accent?: keyof typeof ACCENTS;
  className?: string;
};

export default function ToolEmailCapture({
  tool,
  source = "results_footer",
  heading = "Email me my results",
  subheading = "Get these results plus a personalized next-step roadmap sent to your inbox.",
  buttonText = "Email it to me",
  sentHeading = "Sent — check your inbox",
  sentSubheading = "Your results are on the way. We'll only send what's useful.",
  accent = "teal",
  className = "",
}: ToolEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const a = ACCENTS[accent];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      return;
    }
    // Funnel step 1 — intent. Fires on every submit attempt with a valid-looking
    // email, before the round-trip, so it counts everyone who committed.
    trackToolCtaClicked({ tool, source, cta_location: `${tool}:${source}`, destination: "/api/intake/tool-lead" });
    setStatus("sending");
    try {
      const res = await fetch("/api/intake/tool-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: tool }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      // Funnel step 2 — captured lead.
      trackToolEmailCaptured({ tool, source });
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className={`rounded-2xl border p-5 text-center ${a.sentBg} ${className}`}>
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border mb-2 ${a.sentIcon}`}>
          <Check className={`w-5 h-5 ${a.sentCheck}`} />
        </div>
        <p className="text-sm font-semibold text-white">{sentHeading}</p>
        <p className="text-xs text-slate-400 mt-1">{sentSubheading}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Mail className={`w-4 h-4 shrink-0 ${a.icon}`} />
        <p className="text-sm font-semibold text-white">{heading}</p>
      </div>
      <p className="text-xs text-slate-400 mb-3">{subheading}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={status === "sending"}
          className={`flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 ${a.ring} focus:border-transparent transition-all disabled:opacity-60`}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${a.button}`}
        >
          {status === "sending" ? "Sending…" : buttonText}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">Please enter a valid email and try again.</p>
      )}
    </div>
  );
}
