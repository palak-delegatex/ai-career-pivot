"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { CareerPortfolio as CareerPortfolioType } from "@/lib/portfolio";
import { BADGE_DEFINITIONS } from "@/components/CompletionBadges";
import {
  Briefcase,
  Award,
  CheckCircle2,
  ExternalLink,
  Share2,
  Link2,
  Globe,
} from "lucide-react";

interface CareerPortfolioProps {
  portfolio: CareerPortfolioType;
  isOwner?: boolean;
}

export default function CareerPortfolio({
  portfolio,
  isOwner = false,
}: CareerPortfolioProps) {
  const t = useTranslations("portfolio");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "projects" | "certifications" | "milestones"
  >("projects");

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portfolio/${portfolio.id}`
      : "";

  async function handleShare() {
    const shareData = {
      title: t("shareTitle", { name: portfolio.displayName }),
      text: t("shareText", {
        name: portfolio.displayName,
        percent: portfolio.completionPercent,
        currentRole: portfolio.currentRole,
        targetRole: portfolio.targetRole,
      }),
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  const tabs = [
    {
      key: "projects" as const,
      label: t("tabProjects"),
      itemLabel: t("labelProjects"),
      icon: <Briefcase className="w-4 h-4" />,
      count: portfolio.projects.length,
    },
    {
      key: "certifications" as const,
      label: t("tabCertifications"),
      itemLabel: t("labelCertifications"),
      icon: <Award className="w-4 h-4" />,
      count: portfolio.certifications.length,
    },
    {
      key: "milestones" as const,
      label: t("tabMilestones"),
      itemLabel: t("labelMilestones"),
      icon: <CheckCircle2 className="w-4 h-4" />,
      count: portfolio.milestones.length,
    },
  ];

  const earnedBadges = BADGE_DEFINITIONS.filter((b) =>
    portfolio.badgeKeys.includes(b.key)
  );

  const phaseHeadings: Record<string, string> = {
    "6-month": t("phaseHeading6Month"),
    "1-year": t("phaseHeading1Year"),
    "2-year": t("phaseHeading2Year"),
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-slate-800 p-8 mb-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500" />
        <div className="absolute top-8 right-8 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg shadow-teal-900/40">
            {portfolio.initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {portfolio.displayName}
                </h1>
                {portfolio.headline && (
                  <p className="text-sm text-slate-400">{portfolio.headline}</p>
                )}
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-300 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Link2 className="w-4 h-4 text-teal-400" />
                    <span className="text-teal-400">{t("copied")}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    {t("share")}
                  </>
                )}
              </button>
            </div>

            {/* Role transition */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg">
                {portfolio.currentRole}
              </span>
              <svg
                className="w-5 h-5 text-teal-400 shrink-0"
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
              <span className="text-sm font-semibold text-white bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-800/50">
                {portfolio.targetRole}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">
                  {t("transitionProgress")}
                </span>
                <span className="text-sm font-bold text-teal-400">
                  {portfolio.completionPercent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${portfolio.completionPercent}%` }}
                />
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              {portfolio.skills.slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400"
                >
                  {skill}
                </span>
              ))}
              {portfolio.skills.length > 8 && (
                <span className="px-2.5 py-1 rounded-md text-xs text-slate-500">
                  {t("skillsMore", { count: portfolio.skills.length - 8 })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges row */}
        {earnedBadges.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/60">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("earned")}
              </span>
              <div className="flex gap-2">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.key}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-teal-800/40 flex items-center justify-center text-teal-400"
                    title={badge.label}
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md ${
                activeTab === tab.key
                  ? "bg-teal-950/60 text-teal-400"
                  : "bg-slate-800/50 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === "projects" &&
          (portfolio.projects.length > 0 ? (
            portfolio.projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("view")}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-teal-950/40 border border-teal-800/30 text-xs text-teal-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-600 ml-auto shrink-0">
                    {project.completedAt}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              label={t("labelProjects")}
              isOwner={isOwner}
            />
          ))}

        {activeTab === "certifications" &&
          (portfolio.certifications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolio.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-800/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-0.5 truncate">
                        {cert.name}
                      </h3>
                      <p className="text-xs text-slate-500">{cert.provider}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {cert.completedAt}
                      </p>
                    </div>
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {t("verifyCredential")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              label={t("labelCertifications")}
              isOwner={isOwner}
            />
          ))}

        {activeTab === "milestones" &&
          (portfolio.milestones.length > 0 ? (
            <div className="space-y-3">
              {(["6-month", "1-year", "2-year"] as const).map((phase) => {
                const phaseMilestones = portfolio.milestones.filter(
                  (m) => m.phase === phase
                );
                if (phaseMilestones.length === 0) return null;
                return (
                  <div key={phase}>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
                      {phaseHeadings[phase]}
                    </h3>
                    <div className="space-y-2">
                      {phaseMilestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-3 rounded-xl bg-slate-900/60 border border-slate-800 px-5 py-3.5"
                        >
                          <CheckCircle2 className="w-4.5 h-4.5 text-teal-400 shrink-0" />
                          <span className="text-sm text-slate-300 flex-1">
                            {milestone.title}
                          </span>
                          <span className="text-xs text-slate-600 shrink-0">
                            {milestone.completedAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              label={t("labelMilestones")}
              isOwner={isOwner}
            />
          ))}
      </div>
    </div>
  );
}

function EmptyState({
  label,
  isOwner,
}: {
  label: string;
  isOwner: boolean;
}) {
  const t = useTranslations("portfolio");
  return (
    <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 border-dashed p-12 text-center">
      <p className="text-sm text-slate-500">
        {isOwner ? t("emptyOwner", { label }) : t("emptyVisitor", { label })}
      </p>
    </div>
  );
}
