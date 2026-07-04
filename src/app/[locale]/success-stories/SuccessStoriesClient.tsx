"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import SuccessStoryGrid from "@/components/SuccessStoryGrid";
import TransformationCard from "@/components/TransformationCard";
import PeerDirectory from "@/components/PeerDirectory";
import CareerTransitionStats from "@/components/infographics/CareerTransitionStats";
import ToolComparisonMatrix from "@/components/infographics/ToolComparisonMatrix";
import TimelineRoadmap from "@/components/infographics/TimelineRoadmap";
import {
  successStories,
  careerTransitionStats,
  toolComparisonData,
  sampleRoadmap,
} from "@/lib/success-stories";
import { sampleTransformations, samplePeers } from "@/lib/portfolio";
import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";

export default function SuccessStoriesClient() {
  const t = useTranslations('successStories');
  const [themeVariant, setThemeVariant] = useState<"dark" | "light">("dark");
  const isDark = themeVariant === "dark";

  return (
    <div className={isDark ? "" : "bg-slate-50"}>
      <div className="mesh-bg" />
      <SiteNav />

      <main className="relative z-10 pt-24 pb-16">
        {/* Page header */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-8">
          <p
            className={`text-sm font-semibold tracking-widest uppercase mb-3 ${
              isDark ? "text-teal-400" : "text-teal-600"
            }`}
          >
            {t('headerEyebrow')}
          </p>
          <h1
            className={`text-4xl sm:text-5xl font-extrabold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {t('headerTitleLead')}{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {t('headerTitleHighlight')}
            </span>
          </h1>
          <p
            className={`text-lg max-w-2xl mx-auto mb-8 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {t('headerSubtitle')}
          </p>

          {/* Theme toggle */}
          <div className="flex items-center justify-center gap-2">
            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {t('themeLabel')}
            </span>
            <button
              onClick={() => setThemeVariant("dark")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? "bg-teal-950/60 text-teal-400 border border-teal-800/50"
                  : "text-slate-500 hover:bg-slate-200"
              }`}
            >
              {t('themeDark')}
            </button>
            <button
              onClick={() => setThemeVariant("light")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !isDark
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-slate-500 hover:bg-slate-800"
              }`}
            >
              {t('themeLight')}
            </button>
          </div>
        </div>

        {/* Success Story Cards - Grid */}
        <SuccessStoryGrid
          stories={successStories}
          variant={themeVariant}
          layout="grid"
        />

        {/* Before → After Transformations */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p
                className={`text-sm font-semibold tracking-widest uppercase mb-3 ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              >
                {t('transformationsEyebrow')}
              </p>
              <h2
                className={`text-3xl sm:text-4xl font-extrabold mb-4 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t('transformationsTitle')}
              </h2>
              <p
                className={`text-base max-w-2xl mx-auto ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {t('transformationsSubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleTransformations.map((story) => (
                <TransformationCard
                  key={story.id}
                  story={story}
                  variant={themeVariant}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Peers on Similar Paths */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <PeerDirectory
              peers={samplePeers}
              variant={themeVariant}
            />
          </div>
        </section>

        {/* Infographic Templates */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p
                className={`text-sm font-semibold tracking-widest uppercase mb-3 ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              >
                {t('infographicsEyebrow')}
              </p>
              <h2
                className={`text-3xl sm:text-4xl font-extrabold mb-4 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t('infographicsTitle')}
              </h2>
              <p
                className={`text-base max-w-2xl mx-auto ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {t('infographicsSubtitle')}
              </p>
            </div>

            <div className="space-y-8">
              {/* Template 1: Career Transition Stats */}
              <CareerTransitionStats
                stats={careerTransitionStats}
                variant={themeVariant}
              />

              {/* Template 2: Tool Comparison Matrix */}
              <ToolComparisonMatrix
                tools={toolComparisonData}
                variant={themeVariant}
              />

              {/* Template 3: Timeline Roadmap */}
              <TimelineRoadmap
                phases={sampleRoadmap}
                variant={themeVariant}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
