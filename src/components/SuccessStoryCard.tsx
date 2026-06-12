"use client";

import { useState } from "react";
import type { SuccessStory } from "@/lib/success-stories";

interface SuccessStoryCardProps {
  story: SuccessStory;
  variant?: "dark" | "light";
  className?: string;
}

export default function SuccessStoryCard({
  story,
  variant = "dark",
  className = "",
}: SuccessStoryCardProps) {
  const [copied, setCopied] = useState(false);

  const isDark = variant === "dark";

  const shareText = `${story.firstName} went from ${story.beforeRole} to ${story.afterRole} in ${story.timeline} (${story.keyMetric}). Read more career pivot stories on AICareerPivot.`;

  async function handleShare() {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/success-stories#${story.id}`
        : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${story.beforeRole} → ${story.afterRole} | AICareerPivot`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div
      id={story.id}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${
        isDark
          ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
      } ${className}`}
      style={{ minHeight: "280px" }}
    >
      {/* Gradient accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${story.gradient}`}
      />

      <div className="p-6 flex flex-col h-full">
        {/* Role transition header */}
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          <span
            className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
              isDark
                ? "text-slate-400 bg-slate-800/80"
                : "text-slate-600 bg-slate-100"
            }`}
          >
            {story.beforeRole}
          </span>
          <svg
            className={`w-5 h-5 shrink-0 ${isDark ? "text-teal-400" : "text-teal-600"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <span
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${
              isDark
                ? "text-white bg-teal-950/60 border border-teal-800/50"
                : "text-teal-800 bg-teal-50 border border-teal-200"
            }`}
          >
            {story.afterRole}
          </span>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <svg
              className={`w-3.5 h-3.5 ${isDark ? "text-teal-400" : "text-teal-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span
              className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {story.timeline}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span
              className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
            >
              {story.keyMetric}
            </span>
          </div>
        </div>

        {/* Quote */}
        <blockquote
          className={`text-sm leading-relaxed italic mb-5 flex-1 ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
        >
          &ldquo;{story.quote}&rdquo;
        </blockquote>

        {/* Author + share */}
        <div
          className={`flex items-center justify-between pt-4 border-t ${
            isDark ? "border-slate-800/60" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}
            >
              {story.initials}
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {story.firstName}
              </p>
              <p
                className={`text-[10px] uppercase tracking-wider ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {story.industry}
              </p>
            </div>
          </div>
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? "text-slate-400 hover:text-teal-400 hover:bg-slate-800"
                : "text-slate-500 hover:text-teal-600 hover:bg-slate-100"
            }`}
            aria-label="Share this story"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
