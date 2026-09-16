"use client";

// ReadinessResult — the shareable score card (AIC-1233, design AIC-1200 §1.5).
// Peak-End Rule: this is the emotional peak of the assessment, so it carries the
// heaviest visual investment. Reconstructable entirely from the four dimension
// scores, which is what the `?r=` share token and OG image both encode. Free
// discovery only — NO email gate / login / paywall here (funnel frozen, AIC-1124).

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  type Dimensions,
  type DimensionKey,
  DIMENSION_LABELS,
  overallScore,
  tierFor,
  quoteFor,
  insightsFor,
  encodeResult,
} from "@/lib/readiness";
import {
  trackReadinessShared,
  trackReadinessCtaClicked,
} from "@/lib/tracking";

const DIM_ORDER: DimensionKey[] = ["experience", "motivation", "commitment", "urgency"];

function bandStroke(score: number): string {
  return score >= 80
    ? "stroke-emerald-400"
    : score >= 60
      ? "stroke-teal-400"
      : score >= 40
        ? "stroke-amber-400"
        : "stroke-red-400";
}

function bandText(score: number): string {
  return score >= 80
    ? "text-emerald-400"
    : score >= 60
      ? "text-teal-400"
      : score >= 40
        ? "text-amber-400"
        : "text-red-400";
}

function bandBar(score: number): string {
  return score >= 80
    ? "bg-emerald-400"
    : score >= 60
      ? "bg-teal-400"
      : score >= 40
        ? "bg-amber-400"
        : "bg-red-400";
}

// Score ring, role="meter" (spec §1.12). Animates the arc + count on mount unless
// the visitor prefers reduced motion.
function ReadinessRing({ score, size = 128 }: { score: number; size?: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setAnimated(true);
      return;
    }
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const offset = circumference - (circumference * (animated ? score : 0)) / 100;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Readiness score: ${score} out of 100`}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" className="stroke-slate-700" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${bandStroke(score)} transition-all duration-1000 ease-out motion-reduce:transition-none`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold tabular-nums ${bandText(score)}`}>
          {animated ? score : 0}%
        </span>
        <span className="text-[11px] text-slate-400 mt-0.5">Readiness</span>
      </div>
    </div>
  );
}

export default function ReadinessResult({
  dimensions,
  onReset,
}: {
  dimensions: Dimensions;
  onReset?: () => void;
}) {
  const score = overallScore(dimensions);
  const tier = tierFor(score);
  const quote = quoteFor(dimensions);
  const insights = insightsFor(dimensions);
  const token = encodeResult(dimensions);
  const [copied, setCopied] = useState(false);
  const firedShare = useRef(false);

  function shareLink(channel: "linkedin" | "x" | "copy"): string {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("r", token);
    url.searchParams.set("utm_source", channel === "x" ? "twitter" : channel);
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", "readiness_share");
    return url.toString();
  }

  function onShare(channel: "linkedin" | "x" | "copy") {
    trackReadinessShared({ channel, score, tier: tier.slug });
    const link = shareLink(channel);
    if (channel === "copy") {
      navigator.clipboard?.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }
    const text = `I scored ${score}% on the AI Career Pivot Readiness Assessment — ${tier.name}. Find out your score:`;
    const intent =
      channel === "linkedin"
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(intent, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  const shareBtn =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[44px]";

  return (
    <div className="bg-card border border-slate-700 rounded-2xl p-6 sm:p-10">
      <p className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-6">
        Your AI Career Pivot Readiness
      </p>

      {/* Score + tier */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <ReadinessRing score={score} />
        <div className="text-center sm:text-left">
          <div className={`text-2xl font-bold ${tier.textClass}`}>{tier.name}</div>
          <div className="text-sm text-slate-400 mt-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${tier.textClass}`}
            >
              {tier.badge}
            </span>
          </div>
        </div>
      </div>

      {/* Quotable one-liner (speakable target) */}
      <blockquote
        className="readiness-quote bg-slate-900/60 border-l-4 border-l-teal-500 rounded-lg p-4 mb-8 font-serif italic text-slate-200 leading-relaxed"
        aria-label="Your readiness summary"
      >
        {quote}
      </blockquote>

      {/* Dimension breakdown */}
      <section aria-labelledby="dim-heading" className="mb-8">
        <h3
          id="dim-heading"
          className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-4"
        >
          Dimension Breakdown
        </h3>
        <div className="space-y-3">
          {DIM_ORDER.map((k) => {
            const v = dimensions[k];
            return (
              <div key={k}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm text-slate-300">{DIMENSION_LABELS[k]}</span>
                  <span className="text-sm tabular-nums text-slate-400">{v}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bandBar(v)} transition-all duration-700 ease-out motion-reduce:transition-none`}
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* What this means */}
      <section aria-labelledby="means-heading" className="mb-8">
        <h3
          id="means-heading"
          className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-4"
        >
          What This Means
        </h3>
        <ul className="space-y-2">
          {insights.map((ins, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              {ins.kind === "strength" ? (
                <span className="text-emerald-400 font-bold" aria-hidden="true">
                  ✓
                </span>
              ) : (
                <span className="text-amber-400 font-bold" aria-hidden="true">
                  △
                </span>
              )}
              <span>
                <span className="sr-only">{ins.kind === "strength" ? "Strength: " : "Build: "}</span>
                {ins.text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Share */}
      <section aria-labelledby="share-heading" className="mb-8">
        <h3
          id="share-heading"
          className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-4"
        >
          Share Your Results
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onShare("linkedin")}
            className={`${shareBtn} bg-[#0a66c2] hover:bg-[#0955a5] text-white`}
            aria-label="Share on LinkedIn"
          >
            in LinkedIn
          </button>
          <button
            type="button"
            onClick={() => onShare("x")}
            className={`${shareBtn} bg-black hover:bg-slate-800 text-white`}
            aria-label="Share on X"
          >
            𝕏 Post
          </button>
          <button
            type="button"
            onClick={() => onShare("copy")}
            className={`${shareBtn} bg-slate-700 hover:bg-slate-600 text-white`}
            aria-label="Copy share link"
          >
            {copied ? "✓ Copied" : "Copy link"}
          </button>
        </div>
      </section>

      {/* Next steps — free discovery links, no paywall */}
      <section aria-labelledby="next-heading">
        <h3
          id="next-heading"
          className="text-xs text-teal-400 uppercase tracking-widest font-semibold mb-4"
        >
          Next Steps
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/free?mode=upload&source=readiness"
            onClick={() => trackReadinessCtaClicked({ cta_target: "free", score })}
            className="block bg-slate-800 border border-slate-700 rounded-xl p-5 transition-colors hover:border-teal-500/40"
          >
            <div className="text-base font-semibold text-white mb-1">📄 Get your free AI career snapshot</div>
            <div className="text-sm text-slate-400">Upload your resume →</div>
          </Link>
          <Link
            href="/quiz?source=readiness"
            onClick={() => trackReadinessCtaClicked({ cta_target: "quiz", score })}
            className="block bg-slate-800 border border-slate-700 rounded-xl p-5 transition-colors hover:border-teal-500/40"
          >
            <div className="text-base font-semibold text-white mb-1">🎯 Find your best AI role match</div>
            <div className="text-sm text-slate-400">Take the 30-second quiz →</div>
          </Link>
        </div>
      </section>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mx-auto mt-8 block text-sm text-slate-400 hover:text-slate-200"
        >
          ↺ Retake the assessment
        </button>
      )}
    </div>
  );
}
