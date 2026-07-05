"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  trackFeatureShowcaseViewed,
  trackFeatureShowcaseTabChanged,
  trackFeatureShowcaseCtaClicked,
} from "@/lib/tracking";

/**
 * FeatureShowcase — a pre-signup, interactive demo of the three core AI
 * differentiators (plan generation, AI insights, PDF report) that PostHog
 * showed users almost never reach (AIC-532). Shows real sample output to
 * demonstrate value before asking for payment.
 *
 * Sample content mirrors the real product's data shape: 6mo/1yr/2yr
 * milestones, skill-gap match scores, and the downloadable report.
 */

const LOCATION = "landing_showcase";

type TabKey = "plan" | "insights" | "pdf";

const tabIcons: Record<TabKey, React.ReactNode> = {
  plan: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  insights: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  pdf: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const tabKeys: TabKey[] = ["plan", "insights", "pdf"];

type TabText = { label: string; sub: string };

const milestoneStyles = [
  { accent: "from-teal-500 to-emerald-500" },
  { accent: "from-cyan-500 to-teal-500" },
  { accent: "from-emerald-500 to-teal-400" },
];

type MilestoneText = { horizon: string; items: string[] };

const skillGapMatches = [82, 41, 88, 55];

type SkillGapText = { skill: string; note: string };

function TabButton({
  tabKey,
  label,
  sub,
  active,
  onClick,
}: {
  tabKey: TabKey;
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-3 min-h-[44px] rounded-xl border text-left transition-all duration-200 ${
        active
          ? "bg-slate-800/80 border-teal-500/50 shadow-lg shadow-teal-500/10"
          : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
      }`}
      aria-pressed={active}
    >
      <span className={`shrink-0 ${active ? "text-teal-400" : "text-slate-500"}`}>{tabIcons[tabKey]}</span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}>
          {label}
        </span>
        <span className="block text-xs text-slate-500 truncate">{sub}</span>
      </span>
    </button>
  );
}

function PlanPanel() {
  const t = useTranslations("featureShowcase");
  const milestoneText = t.raw("milestones") as MilestoneText[];
  const milestones = milestoneText.map((m, i) => ({ ...m, ...milestoneStyles[i] }));
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {milestones.map((m) => (
        <div key={m.horizon} className="rounded-xl bg-slate-900/70 border border-slate-800 p-5">
          <div className={`inline-flex items-center px-2.5 py-1 mb-4 rounded-full bg-gradient-to-r ${m.accent} text-white text-xs font-bold`}>
            {m.horizon}
          </div>
          <ul className="space-y-3">
            {m.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function InsightsPanel() {
  const t = useTranslations("featureShowcase");
  const skillGapText = t.raw("skillGaps") as SkillGapText[];
  const skillGaps = skillGapText.map((s, i) => ({ ...s, match: skillGapMatches[i] }));
  const insights = t.raw("insights") as string[];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Skill-gap match scores */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5">
        <h4 className="text-sm font-semibold text-white mb-4">{t("skillGapHeading")}</h4>
        <div className="space-y-4">
          {skillGaps.map((s) => (
            <div key={s.skill}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">{s.skill}</span>
                <span className={`text-xs font-bold ${s.match >= 75 ? "text-emerald-400" : s.match >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                  {s.match}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.match}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${s.match >= 75 ? "bg-emerald-500" : s.match >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{s.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Narrative insights */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5">
        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          {t("insightsHeading")}
        </h4>
        <ul className="space-y-4">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-950/80 border border-teal-800/50 text-teal-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PdfPanel() {
  const t = useTranslations("featureShowcase");
  const pdfFeatures = t.raw("pdfFeatures") as string[];
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 rounded-xl bg-slate-900/70 border border-slate-800 p-6">
      {/* Faux document preview */}
      <div className="relative shrink-0">
        <div className="w-44 h-56 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 p-4 shadow-2xl rotate-[-4deg]">
          <div className="h-2 w-3/4 rounded bg-teal-500/80 mb-2" />
          <div className="h-1.5 w-1/2 rounded bg-slate-400 mb-4" />
          <div className="space-y-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-1.5 rounded bg-slate-300" style={{ width: `${90 - i * 7}%` }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-teal-200/70" />
            ))}
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-lg">
          PDF
        </div>
      </div>

      <div className="text-center md:text-left">
        <h4 className="text-lg font-bold text-white mb-2">{t("pdfHeading")}</h4>
        <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-md">
          {t("pdfDescription")}
        </p>
        <ul className="space-y-2 text-sm text-slate-300 inline-block text-left">
          {pdfFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function FeatureShowcase() {
  const t = useTranslations("featureShowcase");
  const tabText = t.raw("tabs") as Record<TabKey, TabText>;
  const [active, setActive] = useState<TabKey>("plan");
  const viewedRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView && !viewedRef.current) {
      viewedRef.current = true;
      trackFeatureShowcaseViewed({ location: LOCATION });
    }
  }, [inView]);

  function selectTab(key: TabKey) {
    if (key === active) return;
    setActive(key);
    trackFeatureShowcaseTabChanged({ tab: key, location: LOCATION });
  }

  return (
    <section ref={sectionRef} id="see-it-work" className="py-28 px-6 border-t border-slate-800/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">{t("eyebrow")}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            {t("headingLead")}{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {t("headingAccent")}
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {tabKeys.map((key) => (
            <TabButton
              key={key}
              tabKey={key}
              label={tabText[key].label}
              sub={tabText[key].sub}
              active={active === key}
              onClick={() => selectTab(key)}
            />
          ))}
        </div>

        {/* Panel */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 sm:p-6 backdrop-blur-sm">
          {/* Sample banner */}
          <div className="flex items-center gap-2 mb-5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/40 text-amber-300 font-medium">
              {t("sampleBadge")}
            </span>
            <span>{t("sampleNote")}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {active === "plan" && <PlanPanel />}
              {active === "insights" && <InsightsPanel />}
              {active === "pdf" && <PdfPanel />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/pricing"
            onClick={() =>
              trackFeatureShowcaseCtaClicked({ tab: active, location: LOCATION, destination: "/pricing" })
            }
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] text-white"
          >
            {t("ctaPrimaryLabel")} — <s className="text-white/60 font-normal">$29</s> $19 →
          </Link>
          <Link
            href="/free"
            onClick={() =>
              trackFeatureShowcaseCtaClicked({ tab: active, location: LOCATION, destination: "/free" })
            }
            className="text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
