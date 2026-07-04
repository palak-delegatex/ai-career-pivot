"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flame, Trophy, Target, Link2, Compass, BookOpen, Send, Handshake, Sparkles } from "lucide-react";

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

const STAGE_INFO = [
  { key: "explorer", icon: Compass, threshold: 0 },
  { key: "skillBuilder", icon: BookOpen, threshold: 20 },
  { key: "applicant", icon: Send, threshold: 50 },
  { key: "offerStage", icon: Handshake, threshold: 75 },
  { key: "transitioned", icon: Sparkles, threshold: 100 },
] as const;

function ProgressRing({
  percent,
  size = 80,
  stroke = 6,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-slate-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progress-gradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
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
  const t = useTranslations('shareableProgress');
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const currentStage = STAGE_INFO.reduce(
    (s, stage) => (completionPercent >= stage.threshold ? stage : s),
    STAGE_INFO[0]
  );
  const StageIcon = currentStage.icon;
  const currentStageLabel = t(`stages.${currentStage.key}`);

  const shareText = t("shareText", {
    percent: completionPercent,
    currentRole,
    targetRole,
    stage: currentStageLabel,
    completed: completedMilestones,
    total: totalMilestones,
  });

  const ogUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/og/progress?role=${encodeURIComponent(currentRole)}&targetRole=${encodeURIComponent(targetRole)}&progress=${completionPercent}&milestones=${completedMilestones}&totalMilestones=${totalMilestones}&streak=${streakDays}&badges=${earnedBadgeCount}`
      : "";

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/report/${reportId}`
      : "";

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: t("shareTitle", { currentRole, targetRole }),
          text: shareText,
          url: shareUrl,
        });
        setShareMenuOpen(false);
        return;
      } catch {
        // Fall through
      }
    }
    await handleCopyLink();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setShareMenuOpen(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  function handleLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ogUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    setShareMenuOpen(false);
  }

  function handleTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    setShareMenuOpen(false);
  }

  const milestoneRatio = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-teal-800/30 p-6">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500" />
      {/* Glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/8 rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
          {t("heading")}
        </p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
          <StageIcon className="w-3 h-3 text-teal-400" />
          <span className="text-[10px] font-semibold text-teal-400">{currentStageLabel}</span>
        </div>
      </div>

      {/* Top section: ring + role transition */}
      <div className="flex items-center gap-5 mb-6">
        <div className="relative">
          <ProgressRing percent={completionPercent} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {completionPercent}%
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-sm text-slate-400 truncate">{currentRole}</span>
            <svg
              className="w-4 h-4 text-teal-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="text-sm font-bold text-white truncate">
              {targetRole}
            </span>
          </div>

          {/* Milestone sub-bar */}
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${milestoneRatio * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {t("milestonesOf", { completed: completedMilestones, total: totalMilestones })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <Target className="w-4 h-4 text-teal-400 mx-auto mb-1" />
          <p className="text-base font-bold text-white">
            {completedMilestones}/{totalMilestones}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {t("stats.milestones")}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <p className="text-base font-bold text-white">{streakDays}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {t("stats.dayStreak")}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-base font-bold text-white">{earnedBadgeCount}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {t("stats.badges")}
          </p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="relative">
        <div className="flex gap-2">
          {/* LinkedIn primary */}
          <button
            onClick={handleLinkedIn}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            {t("shareToLinkedIn")}
          </button>

          {/* More options */}
          <button
            onClick={() => setShareMenuOpen(!shareMenuOpen)}
            className="flex items-center justify-center w-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 transition-colors"
            aria-label={t("moreSharingOptions")}
          >
            {copied ? (
              <Link2 className="w-4 h-4 text-teal-400" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Dropdown menu */}
        {shareMenuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden z-10">
            <button
              onClick={handleTwitter}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t("postOnX")}
            </button>
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {t("shareVia")}
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors border-t border-slate-700/60"
            >
              <Link2 className="w-4 h-4" />
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
