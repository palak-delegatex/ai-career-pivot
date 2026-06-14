"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { RoadmapPhase } from "@/lib/success-stories";

interface TimelineRoadmapProps {
  phases: RoadmapPhase[];
  title?: string;
  subtitle?: string;
  variant?: "dark" | "light";
  className?: string;
}

export default function TimelineRoadmap({
  phases,
  title = "Your Career Pivot Roadmap",
  subtitle = "A proven path from current role to dream career",
  variant = "dark",
  className = "",
}: TimelineRoadmapProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const isDark = variant === "dark";

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border p-8 ${
        isDark
          ? "bg-slate-900/90 border-slate-800"
          : "bg-white border-slate-200 shadow-sm"
      } ${className}`}
    >
      {/* Brand watermark */}
      <div className="absolute top-6 right-8">
        <span
          className={`text-xs font-semibold tracking-wider uppercase ${
            isDark ? "text-slate-700" : "text-slate-300"
          }`}
        >
          AICareerPivot
        </span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <p
          className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
            isDark ? "text-teal-400" : "text-teal-600"
          }`}
        >
          Roadmap
        </p>
        <h3
          className={`text-xl sm:text-2xl font-bold mb-2 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          {subtitle}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line (mobile) / horizontal line (desktop) */}
        <div
          className={`absolute left-4 top-0 bottom-0 w-0.5 sm:hidden ${
            isDark ? "bg-slate-800" : "bg-slate-200"
          }`}
        />

        {/* Desktop horizontal connector */}
        <div
          className={`hidden sm:block absolute top-[28px] left-0 right-0 h-0.5 ${
            isDark ? "bg-slate-800" : "bg-slate-200"
          }`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.month}
              initial={{ opacity: 0, y: 20 }}
              animate={
                inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative"
            >
              {/* Phase dot */}
              <div className="flex items-start sm:flex-col sm:items-center mb-4 sm:mb-0">
                <div
                  className={`relative z-10 w-8 h-8 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg`}
                >
                  {i + 1}
                </div>
                <div className="ml-4 sm:ml-0 sm:mt-4 sm:text-center">
                  <p
                    className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                      isDark ? "text-teal-400" : "text-teal-600"
                    }`}
                  >
                    {phase.month}
                  </p>
                  <h4
                    className={`text-base font-bold mb-3 ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {phase.title}
                  </h4>
                </div>
              </div>

              {/* Milestones */}
              <div className="pl-12 sm:pl-0 space-y-2">
                {phase.milestones.map((milestone) => (
                  <div
                    key={milestone}
                    className={`flex items-start gap-2 sm:justify-center ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        isDark ? "text-teal-500/60" : "text-teal-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                    <span className="text-xs">{milestone}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? "bg-teal-950/50" : "bg-teal-50"
            }`}
          >
            <svg
              className={`w-5 h-5 ${isDark ? "text-teal-400" : "text-teal-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <p
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Get your personalized roadmap
            </p>
            <p
              className={`text-xs ${
                isDark ? "text-slate-500" : "text-slate-500"
              }`}
            >
              Tailored to your skills, finances, and timeline
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
            isDark
              ? "text-teal-400 bg-teal-950/50 border border-teal-800/40"
              : "text-teal-700 bg-teal-50 border border-teal-200"
          }`}
        >
          ai-career-pivot.com
        </span>
      </div>
    </div>
  );
}
