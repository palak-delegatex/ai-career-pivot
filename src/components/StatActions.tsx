"use client";

// StatActions — per-stat copy-quote + share affordance (AIC-1233, design
// AIC-1234 §2.3–2.4). The only client JS on the data page. Turns each stat into
// a citation + social-loop anchor: copy formats a fully-attributed quote with a
// deep link; share opens a 3-option popover (LinkedIn / X / Copy link).
//
// Inline SVG icons (not lucide) — the pinned lucide fork is missing several
// exports, so we avoid the dependency entirely.

import { useEffect, useRef, useState } from "react";
import {
  trackDataStatCopied,
  trackDataStatShared,
} from "@/lib/tracking";

const PAGE_URL = "https://ai-career-pivot.com/research/ai-career-pivots-2026";

export interface StatActionsProps {
  value: string;
  label: string;
  source?: string;
  anchor: string;
  section?: string;
  align?: "left" | "center";
}

function ClipboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" />
    </svg>
  );
}

const BTN =
  "h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-400 hover:text-teal-400 hover:border-teal-500/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500";

export default function StatActions({
  value,
  label,
  source,
  anchor,
  section,
  align = "left",
}: StatActionsProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const deepLink = `${PAGE_URL}#${anchor}`;
  const quote = `"${value} — ${label}"${source ? ` — ${source}` : ""} (via AICareerPivot: ${deepLink})`;
  const shareText = `${value} ${label}.${source ? ` Source: ${source}.` : ""} See all stats: ${PAGE_URL}`;

  // Close popover on outside click / Escape.
  useEffect(() => {
    if (!shareOpen) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShareOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShareOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  async function copyQuote() {
    try {
      await navigator.clipboard?.writeText(quote);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — non-fatal */
    }
    trackDataStatCopied({ stat_anchor: anchor, stat_value: value, stat_label: label, section });
  }

  function shareTo(channel: "linkedin" | "x" | "copy_link") {
    trackDataStatShared({ stat_anchor: anchor, stat_value: value, channel, section });
    const utm = "utm_source=" + (channel === "x" ? "twitter" : channel) +
      "&utm_medium=social&utm_campaign=data_page_stat_share";
    const linkWithUtm = `${deepLink}${deepLink.includes("?") ? "&" : "?"}${utm}`;
    if (channel === "copy_link") {
      navigator.clipboard?.writeText(deepLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setShareOpen(false);
      return;
    }
    const intent =
      channel === "linkedin"
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkWithUtm)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(linkWithUtm)}`;
    window.open(intent, "_blank", "noopener,noreferrer,width=600,height=600");
    setShareOpen(false);
  }

  return (
    <div
      ref={wrapRef}
      className={`stat-actions relative mt-4 flex items-center gap-2 ${
        align === "center" ? "justify-center" : ""
      }`}
    >
      <button
        type="button"
        onClick={copyQuote}
        className={BTN}
        aria-label={`Copy statistic: ${value} ${label}`}
      >
        {copied ? <span className="text-emerald-400"><CheckIcon /></span> : <ClipboardIcon />}
      </button>

      <button
        type="button"
        onClick={() => setShareOpen((o) => !o)}
        className={BTN}
        aria-label={`Share statistic: ${value} ${label}`}
        aria-expanded={shareOpen}
        aria-haspopup="menu"
      >
        <ShareIcon />
      </button>

      {shareOpen && (
        <div
          role="menu"
          className={`absolute bottom-full mb-2 z-10 min-w-[180px] rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl ${
            align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
          }`}
        >
          <p className="text-xs text-slate-400 mb-2">Share this stat</p>
          <button
            type="button"
            role="menuitem"
            onClick={() => shareTo("linkedin")}
            className="block w-full text-left text-sm text-slate-200 hover:text-teal-400 py-1.5 min-h-[44px] sm:min-h-0"
          >
            in&nbsp;&nbsp;LinkedIn
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => shareTo("x")}
            className="block w-full text-left text-sm text-slate-200 hover:text-teal-400 py-1.5 min-h-[44px] sm:min-h-0"
          >
            𝕏&nbsp;&nbsp;X / Twitter
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => shareTo("copy_link")}
            className="block w-full text-left text-sm text-slate-200 hover:text-teal-400 py-1.5 min-h-[44px] sm:min-h-0"
          >
            🔗&nbsp;&nbsp;Copy link
          </button>
        </div>
      )}
    </div>
  );
}
