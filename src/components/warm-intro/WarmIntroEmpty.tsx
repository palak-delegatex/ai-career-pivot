"use client";

import { Share2 } from "lucide-react";

// Empty state — no connection found. Nudges CRM enrichment so future scans have
// more graph to work with.
export default function WarmIntroEmpty({
  company,
  onImport,
}: {
  company: string;
  onImport: () => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
        Connections at {company}
      </h3>
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
        <Share2 className="h-8 w-8 text-slate-700 mx-auto mb-3" aria-hidden />
        <p className="text-[12px] font-semibold text-slate-400 mb-1">
          No warm intros found yet
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px] mx-auto mb-3">
          Import your LinkedIn network to discover connections at {company} and
          the other companies you&apos;re tracking.
        </p>
        <button
          onClick={onImport}
          aria-label="Import LinkedIn contacts to find warm intros"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[11px] font-medium text-slate-300 border border-white/[0.06] transition-colors"
        >
          <Share2 className="h-3 w-3" />
          Import LinkedIn Contacts
        </button>
      </div>
    </div>
  );
}
