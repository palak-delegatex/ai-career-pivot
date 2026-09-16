"use client";

// Client islands for the "State of AI Career Pivots 2026" data page
// (AIC-1233, design AIC-1234). Two small pieces:
//   • DataPageEffects — fires the page-view event once and, on a #stat-* deep
//     link, scrolls to and briefly highlights the target stat (§2.5).
//   • CitationBlock — the copyable "how to cite this page" block (§1.5).

import { useEffect, useState } from "react";
import { trackDataPageViewed, trackDataCitationCopied } from "@/lib/tracking";

export function DataPageEffects({
  sectionCount,
  statCount,
}: {
  sectionCount: number;
  statCount: number;
}) {
  useEffect(() => {
    trackDataPageViewed({
      page_url: window.location.pathname,
      section_count: sectionCount,
      stat_count: statCount,
    });

    const hash = window.location.hash;
    if (hash && hash.startsWith("#stat-")) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("stat-highlight");
        const cleanup = () => el.classList.remove("stat-highlight");
        el.addEventListener("animationend", cleanup, { once: true });
        // Fallback in case the animation is disabled (reduced motion).
        setTimeout(cleanup, 1600);
      }
    }
  }, [sectionCount, statCount]);

  return null;
}

export function CitationBlock({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard
      ?.writeText(citation)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
    trackDataCitationCopied({ citation_text: citation });
  }

  return (
    <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 sm:p-6 font-mono text-sm text-slate-300 leading-relaxed">
      <p className="pr-24">{citation}</p>
      <button
        type="button"
        onClick={copy}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 py-1.5 text-xs font-sans font-medium text-slate-300 hover:text-teal-400 hover:border-teal-500/40 transition-colors min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        aria-label="Copy citation"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
