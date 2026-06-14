"use client";

import { useState } from "react";

interface ShareableProgressCardProps {
  currentRole: string;
  targetRole: string;
  completionPercent: number;
  completedMilestones: number;
  totalMilestones: number;
  streakDays: number;
  earnedBadgeCount: number;
  reportId: string;
}

export default function ShareableProgressCard({
  currentRole,
  targetRole,
  completionPercent,
  completedMilestones,
  totalMilestones,
  streakDays,
  earnedBadgeCount,
  reportId,
}: ShareableProgressCardProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `I'm ${completionPercent}% through my career pivot from ${currentRole} to ${targetRole}! ${completedMilestones}/${totalMilestones} milestones done. Building my future one step at a time.`;

  const ogUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/og/progress?role=${encodeURIComponent(currentRole)}&targetRole=${encodeURIComponent(targetRole)}&progress=${completionPercent}&milestones=${completedMilestones}&totalMilestones=${totalMilestones}&streak=${streakDays}&badges=${earnedBadgeCount}`
      : "";

  async function handleShare() {
    const shareData = {
      title: `Career Pivot Progress: ${currentRole} → ${targetRole}`,
      text: shareText,
      url: ogUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${ogUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 border border-teal-800/30 p-6">
      {/* Teal accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />

      <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-4">
        My Career Pivot
      </p>

      {/* Role transition */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-medium text-slate-300 truncate">{currentRole}</span>
        <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span className="text-sm font-bold text-white truncate">{targetRole}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400">Overall Progress</span>
          <span className="text-sm font-bold text-teal-400">{completionPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{completedMilestones}/{totalMilestones}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Milestones</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{streakDays}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Day Streak</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{earnedBadgeCount}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Badges</p>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        {copied ? "Link Copied!" : "Share to LinkedIn"}
      </button>
    </div>
  );
}
