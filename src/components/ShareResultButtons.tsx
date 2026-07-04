"use client";

import { useState, useCallback } from "react";
import { trackAssessmentShared, trackContentShareClicked } from "@/lib/tracking";

type Channel = "linkedin" | "x" | "copy";

/**
 * Assessment share loop (AIC-688). Renders LinkedIn / X / copy buttons that
 * share the current report URL with UTM tags back to the assessment, and fires
 * PostHog share events so the CMO can measure the viral coefficient. The shared
 * link's OG image (report/[id]/opengraph-image) shows the match score only — no
 * PII — so sharing is privacy-safe by construction.
 */
export default function ShareResultButtons({
  score,
}: {
  score?: number;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useCallback((channel: Channel) => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    // Strip any existing UTM/query so we tag a clean canonical report link.
    url.search = "";
    url.searchParams.set("utm_source", channel === "x" ? "twitter" : channel);
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", "assessment_share");
    return url.toString();
  }, []);

  const onShare = useCallback(
    (channel: Channel) => {
      const link = shareUrl(channel);
      trackContentShareClicked({ channel, content_type: "assessment" });
      trackAssessmentShared({ channel, score });

      if (channel === "copy") {
        navigator.clipboard?.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        return;
      }

      const text =
        score != null
          ? `I'm a ${Math.round(score)}% match for my next career move — mapped by AI.`
          : "I mapped my career pivot with AI.";
      const intent =
        channel === "linkedin"
          ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
      window.open(intent, "_blank", "noopener,noreferrer,width=600,height=600");
    },
    [shareUrl, score],
  );

  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 not-prose">
      <span className="text-slate-400 text-sm">Share your result:</span>
      <button
        onClick={() => onShare("linkedin")}
        className={`${base} bg-[#0a66c2] hover:bg-[#0955a5] text-white`}
        aria-label="Share on LinkedIn"
      >
        in LinkedIn
      </button>
      <button
        onClick={() => onShare("x")}
        className={`${base} bg-black hover:bg-slate-800 text-white`}
        aria-label="Share on X"
      >
        𝕏 Post
      </button>
      <button
        onClick={() => onShare("copy")}
        className={`${base} bg-slate-700 hover:bg-slate-600 text-white`}
        aria-label="Copy share link"
      >
        {copied ? "✓ Copied" : "Copy link"}
      </button>
    </div>
  );
}
