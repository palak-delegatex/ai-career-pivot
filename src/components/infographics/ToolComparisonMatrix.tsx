"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { ToolFeature } from "@/lib/success-stories";

interface ToolComparisonMatrixProps {
  tools: ToolFeature[];
  title?: string;
  subtitle?: string;
  variant?: "dark" | "light";
  className?: string;
}

export default function ToolComparisonMatrix({
  tools,
  title = "Career Pivot Tool Comparison",
  subtitle = "How AICareerPivot compares to alternatives",
  variant = "dark",
  className = "",
}: ToolComparisonMatrixProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const isDark = variant === "dark";

  const features = tools.length > 0 ? Object.keys(tools[0].features) : [];

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
          Comparison
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

      {/* Comparison matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        className="overflow-x-auto"
      >
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th
                className={`text-left py-3 pr-4 font-medium ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Feature
              </th>
              {tools.map((tool, i) => (
                <th
                  key={tool.name}
                  className={`text-center py-3 px-4 font-semibold ${
                    i === 0
                      ? isDark
                        ? "text-teal-400"
                        : "text-teal-700"
                      : isDark
                        ? "text-slate-400"
                        : "text-slate-600"
                  }`}
                >
                  {tool.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr
                key={feature}
                className={`border-t ${
                  isDark ? "border-slate-800/60" : "border-slate-100"
                }`}
              >
                <td
                  className={`py-3.5 pr-4 font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {feature}
                </td>
                {tools.map((tool, i) => {
                  const value = tool.features[feature];
                  return (
                    <td key={tool.name} className="text-center py-3.5 px-4">
                      {value === true ? (
                        <div className="flex justify-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              i === 0
                                ? "bg-teal-500/20 text-teal-400"
                                : isDark
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      ) : value === false ? (
                        <div className="flex justify-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isDark
                                ? "bg-slate-800 text-slate-600"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-md ${
                            isDark
                              ? "text-amber-400 bg-amber-950/30"
                              : "text-amber-700 bg-amber-50"
                          }`}
                        >
                          {String(value)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Score summary */}
      <div
        className={`mt-6 pt-6 border-t grid grid-cols-3 gap-4 ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        {tools.map((tool, i) => {
          const trueCount = Object.values(tool.features).filter(
            (v) => v === true
          ).length;
          return (
            <div
              key={tool.name}
              className={`text-center rounded-xl py-3 ${
                i === 0
                  ? isDark
                    ? "bg-teal-950/40 border border-teal-800/40"
                    : "bg-teal-50 border border-teal-200"
                  : isDark
                    ? "bg-slate-800/40"
                    : "bg-slate-50"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  i === 0
                    ? isDark
                      ? "text-teal-400"
                      : "text-teal-700"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                }`}
              >
                {trueCount}/{features.length}
              </p>
              <p
                className={`text-[10px] uppercase tracking-wider mt-0.5 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Features
              </p>
            </div>
          );
        })}
      </div>

      {/* Source */}
      <p
        className={`text-[10px] mt-6 ${
          isDark ? "text-slate-600" : "text-slate-400"
        }`}
      >
        Feature comparison as of June 2026. AICareerPivot analysis.
      </p>
    </div>
  );
}
