"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { CaseStudy } from "@/lib/testimonials";

/**
 * PivotJourneyTimeline (AIC-753)
 *
 * 5-step visual pipeline (Assess → Plan → Upskill → Apply → Offer) annotated
 * with a real case study. Placed after "How it works", before FeatureShowcase.
 * Collapses to a vertical stack on mobile (< md); connector lines hidden.
 * Step labels / deliverables / phases are localized (passed via `steps`);
 * case study data comes from a CaseStudy (testimonials.ts).
 */
export interface JourneyStep {
  label: string;
  deliverable: string;
  phase: string;
}

/** Per-step visual config (icons + gradients from the token scale). */
const STEP_STYLES = [
  { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", gradient: "from-sky-500 to-cyan-500", connector: "from-cyan-500 to-teal-500" },
  { icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4", gradient: "from-teal-500 to-emerald-500", connector: "from-teal-500 to-emerald-500" },
  { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", gradient: "from-emerald-500 to-green-500", connector: "from-emerald-500 to-violet-500" },
  { icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", gradient: "from-violet-500 to-purple-400", connector: "from-violet-500 to-amber-500" },
  { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", gradient: "from-amber-500 to-orange-500", connector: "" },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function PivotJourneyTimeline({
  eyebrow,
  titleLead,
  titleAccent,
  subtitle,
  steps,
  caseHeading,
  caseStudy,
}: {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  steps: JourneyStep[];
  caseHeading: string;
  caseStudy: CaseStudy;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6" aria-label={titleLead}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">{eyebrow}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            {titleLead}{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {titleAccent}
            </span>
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">{subtitle}</p>
        </div>

        {/* Timeline */}
        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex flex-col md:flex-row gap-6 md:gap-0"
        >
          {steps.map((step, i) => {
            const style = STEP_STYLES[i] ?? STEP_STYLES[0];
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={step.label}
                variants={fadeUp}
                className="relative flex-1 text-center px-2"
              >
                {/* Connector line (desktop only) */}
                {!isLast && (
                  <div
                    className={`hidden md:block absolute top-7 left-[calc(50%+28px)] right-0 h-0.5 bg-gradient-to-r ${style.connector} z-0`}
                    aria-hidden
                  />
                )}
                <div
                  className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mx-auto mb-3 ${
                    isLast ? "shadow-lg shadow-amber-500/30" : ""
                  }`}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                  </svg>
                </div>
                <div className="text-sm font-bold text-white mb-1">{step.label}</div>
                <div className="text-xs text-slate-400 leading-relaxed mb-2 max-w-[10rem] mx-auto">{step.deliverable}</div>
                <span
                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    isLast
                      ? "bg-amber-950/40 border-amber-500/20 text-amber-400"
                      : "bg-teal-950/50 border-teal-500/20 text-teal-400"
                  }`}
                >
                  {step.phase}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Case study annotation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="max-w-2xl mx-auto mt-10 p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-4"
        >
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${caseStudy.gradient} flex items-center justify-center text-white text-[13px] font-bold shrink-0`}>
            {caseStudy.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white mb-0.5">{caseHeading}</div>
            <div className="text-xs text-slate-500 mb-1.5">{caseStudy.role}</div>
            <blockquote className="text-sm text-slate-400 italic leading-relaxed">
              &ldquo;{caseStudy.quote}&rdquo;
            </blockquote>
            <div className="flex flex-wrap gap-4 mt-2.5">
              <span className="flex items-center gap-1.5 text-xs text-teal-400">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {caseStudy.timeline}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {caseStudy.keyMetric}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
