"use client";

import Link from "next/link";
import { trackFreeSnapshotUpgradeClicked } from "@/lib/tracking";

const ROWS = [
  { feature: "Career pivot paths (2-3 options)", free: true, full: true },
  { feature: "Match scores & skill gaps", free: true, full: true },
  { feature: "Transferable strengths analysis", free: true, full: true },
  { feature: "6 / 12 / 24-month milestone timeline", free: false, full: true },
  { feature: "AI certifications roadmap", free: false, full: true },
  { feature: "Financial bridge & salary trajectory", free: false, full: true },
  { feature: "Week-by-week action plan", free: false, full: true },
  { feature: "AI coaching & follow-up chat", free: false, full: true },
  { feature: "Downloadable PDF report", free: false, full: true },
];

interface ValueComparisonCardProps {
  topMatchScore?: number;
}

export default function ValueComparisonCard({ topMatchScore }: ValueComparisonCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 overflow-hidden">
      <div className="px-6 pt-6 pb-4 text-center">
        <h3 className="text-xl font-bold text-white mb-1">Ready for the Full Roadmap?</h3>
        <p className="text-slate-400 text-sm">See what the complete plan unlocks for your career pivot.</p>
      </div>

      {/* Comparison table */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-[1fr_60px_60px] gap-x-2 text-center mb-2">
          <div />
          <span className="text-xs font-medium text-slate-500">Free</span>
          <span className="text-xs font-bold text-teal-400">Full</span>
        </div>
        <div className="space-y-1">
          {ROWS.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-[1fr_60px_60px] gap-x-2 items-center py-2 px-2 rounded-lg hover:bg-slate-800/40 transition-colors"
            >
              <span className="text-sm text-slate-300">{row.feature}</span>
              <div className="flex justify-center">
                {row.free ? (
                  <svg className="w-4 h-4 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex justify-center">
                <svg className="w-4 h-4 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-4 text-center">
        <Link
          href="/pricing"
          onClick={() => trackFreeSnapshotUpgradeClicked({ cta_location: "value_comparison", top_match_score: topMatchScore })}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-lg transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] text-white"
        >
          Get Full Report — <s className="text-white/60 font-normal">$29</s> $19
        </Link>
        <p className="text-slate-500 text-xs mt-3">One-time payment. 30-day money-back guarantee.</p>
      </div>
    </div>
  );
}
