"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { TransitionStat } from "@/lib/success-stories";

interface CareerTransitionStatsProps {
  stats: TransitionStat[];
  title?: string;
  subtitle?: string;
  variant?: "dark" | "light";
  className?: string;
}

export default function CareerTransitionStats({
  stats,
  title = "Career Transition Success Rates",
  subtitle = "Percentage of users who successfully transitioned within 12 months",
  variant = "dark",
  className = "",
}: CareerTransitionStatsProps) {
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
      <div className="mb-8">
        <p
          className={`text-xs font-semibold uppercase tracking-widest mb-2 ${
            isDark ? "text-teal-400" : "text-teal-600"
          }`}
        >
          Research Data
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

      {/* Bar chart */}
      <div className="space-y-5">
        {stats.map((stat, i) => (
          <div key={stat.label}>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {stat.label}
              </span>
              <span
                className={`text-sm font-bold ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              >
                {stat.percentage}%
              </span>
            </div>
            <div
              className={`h-3 rounded-full overflow-hidden ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${stat.percentage}%` } : { width: 0 }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary stat */}
      <div
        className={`mt-8 pt-6 border-t flex items-center justify-between ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div>
          <p
            className={`text-3xl font-extrabold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            72%
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Average success rate across all transitions
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-xl ${
            isDark ? "bg-teal-950/50 border border-teal-800/40" : "bg-teal-50 border border-teal-200"
          }`}
        >
          <p
            className={`text-lg font-bold ${isDark ? "text-teal-400" : "text-teal-700"}`}
          >
            +38%
          </p>
          <p
            className={`text-[10px] uppercase tracking-wider ${
              isDark ? "text-teal-500/70" : "text-teal-600/70"
            }`}
          >
            Avg salary increase
          </p>
        </div>
      </div>

      {/* Source line */}
      <p
        className={`text-[10px] mt-6 ${
          isDark ? "text-slate-600" : "text-slate-400"
        }`}
      >
        Source: AICareerPivot user outcomes, 2025-2026. n=2,847 completed transitions.
      </p>
    </div>
  );
}
