"use client";

import { useState } from "react";
import SuccessStoryGrid from "@/components/SuccessStoryGrid";
import CareerTransitionStats from "@/components/infographics/CareerTransitionStats";
import ToolComparisonMatrix from "@/components/infographics/ToolComparisonMatrix";
import TimelineRoadmap from "@/components/infographics/TimelineRoadmap";
import {
  successStories,
  careerTransitionStats,
  toolComparisonData,
  sampleRoadmap,
} from "@/lib/success-stories";
import SiteNav from "@/components/SiteNav";
import { Footer } from "@/components/Footer";

export default function SuccessStoriesClient() {
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
            Social Proof
          </p>
          <h1
            className={`text-4xl sm:text-5xl font-extrabold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Career pivots that{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              actually worked
            </span>
          </h1>
          <p
            className={`text-lg max-w-2xl mx-auto mb-8 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Real stories, real data, real outcomes. See how professionals like
            you made the leap.
          </p>

          {/* Theme toggle */}
          <div className="flex items-center justify-center gap-2">
            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Theme:
            </span>
            <button
              onClick={() => setThemeVariant("dark")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? "bg-teal-950/60 text-teal-400 border border-teal-800/50"
                  : "text-slate-500 hover:bg-slate-200"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setThemeVariant("light")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !isDark
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-slate-500 hover:bg-slate-800"
              }`}
            >
              Light
            </button>
          </div>
        </div>

        {/* Success Story Cards - Grid */}
        <SuccessStoryGrid
          stories={successStories}
          variant={themeVariant}
          layout="grid"
        />

        {/* Success Story Cards - Carousel */}
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <h2
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Carousel Layout
          </h2>
          <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Swipeable on mobile, navigable with arrows on desktop.
          </p>
        </div>
        <SuccessStoryGrid
          stories={successStories}
          variant={themeVariant}
          layout="carousel"
          showHeader={false}
        />

        {/* Infographic Templates */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p
                className={`text-sm font-semibold tracking-widest uppercase mb-3 ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              >
                Data-Driven Content
              </p>
              <h2
                className={`text-3xl sm:text-4xl font-extrabold mb-4 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Infographic Templates
              </h2>
              <p
                className={`text-base max-w-2xl mx-auto ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Branded, embeddable templates optimized for social sharing and
                backlink generation.
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
