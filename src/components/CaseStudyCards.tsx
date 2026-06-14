"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { caseStudies } from "@/lib/testimonials";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function CaseStudyCards() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3"
          >
            Success Stories
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-extrabold text-white mb-4"
          >
            Real transitions,{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              real outcomes
            </span>
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {caseStudies.map((cs) => (
            <motion.div
              key={cs.name}
              variants={fadeUp}
              className="relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 hover:border-slate-700 transition-all duration-300 overflow-hidden lg:[&:nth-child(3)]:col-span-2 lg:[&:nth-child(3)]:max-w-[calc(50%-0.75rem)]"
            >
              {/* Gradient left border */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${cs.borderGradient}`}
              />

              <div className="pl-4">
                {/* Role transition */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <span className="text-slate-400 text-sm font-medium bg-slate-800/80 px-3 py-1.5 rounded-lg">
                    {cs.beforeRole}
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
                  <span className="text-white text-sm font-semibold bg-teal-950/60 border border-teal-800/50 px-3 py-1.5 rounded-lg">
                    {cs.afterRole}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <svg
                      className="w-3.5 h-3.5 text-teal-400"
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
                    {cs.timeline}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <svg
                      className="w-3.5 h-3.5"
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
                    {cs.keyMetric}
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="text-slate-300 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{cs.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${cs.gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                  >
                    {cs.initials}
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {cs.name}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
