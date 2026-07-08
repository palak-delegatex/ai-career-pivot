"use client";

import { useState } from "react";
import {
  Loader2,
  Copy,
  Check,
  Sparkles,
  PenLine,
  Clock,
  TrendingUp,
  Lightbulb,
  Hash,
} from "lucide-react";
import NextStepCTA from "@/components/NextStepCTA";
import type { LinkedInPostResult } from "@/app/api/linkedin/generate-post/route";

type PostType =
  | "open-to-work"
  | "career-transition"
  | "thought-leadership"
  | "achievement"
  | "industry-insight"
  | "learning-journey";

type Tone = "professional" | "conversational" | "inspiring";

const POST_TYPES: { value: PostType; label: string; desc: string }[] = [
  { value: "career-transition", label: "Career Transition", desc: "Your pivot story" },
  { value: "open-to-work", label: "Open to Work", desc: "Announce your search" },
  { value: "thought-leadership", label: "Thought Leadership", desc: "A sharp take" },
  { value: "achievement", label: "Achievement", desc: "Share a win" },
  { value: "industry-insight", label: "Industry Insight", desc: "Trend + analysis" },
  { value: "learning-journey", label: "Learning Journey", desc: "What you're learning" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "conversational", label: "Conversational" },
  { value: "inspiring", label: "Inspiring" },
];

const ENGAGEMENT_STYLES: Record<string, string> = {
  high: "bg-emerald-600/20 text-emerald-300 border-emerald-600/30",
  medium: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  low: "bg-slate-700 text-slate-300 border-slate-600",
};

function PostCard({
  post,
  index,
}: {
  post: LinkedInPostResult["posts"][number];
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const full = `${post.content}\n\n${post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-700/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Variant {index + 1}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
              ENGAGEMENT_STYLES[post.estimatedEngagement] || ENGAGEMENT_STYLES.low
            }`}
          >
            {post.estimatedEngagement} engagement
          </span>
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#0954a0] text-white text-sm font-medium transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="px-5 py-4">
        <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>

        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {post.hashtags.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-sky-300 bg-sky-950/40 border border-sky-900/40 rounded-full px-2 py-0.5"
              >
                <Hash className="w-3 h-3" />
                {h.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-700/70 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-slate-300">Best time:</span> {post.bestTimeToPost}
        </div>
        {post.tips.length > 0 && (
          <ul className="space-y-1">
            {post.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PostGenerator({
  defaultTargetRole = "",
  defaultCurrentRole = "",
  defaultIndustry = "",
}: {
  defaultTargetRole?: string;
  defaultCurrentRole?: string;
  defaultIndustry?: string;
}) {
  const [postType, setPostType] = useState<PostType>("career-transition");
  const [targetRole, setTargetRole] = useState(defaultTargetRole);
  const [currentRole, setCurrentRole] = useState(defaultCurrentRole);
  const [industry, setIndustry] = useState(defaultIndustry);
  const [tone, setTone] = useState<Tone>("professional");
  const [extra, setExtra] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LinkedInPostResult | null>(null);

  // The "extra" field feeds achievement or topic depending on post type.
  const extraIsAchievement = postType === "achievement";
  const extraLabel = extraIsAchievement
    ? "Achievement to highlight"
    : "Topic or angle";
  const extraPlaceholder = extraIsAchievement
    ? "e.g. Landed my first PM role after 8 years in teaching"
    : "e.g. Why domain expertise beats tenure in AI hiring";

  const generate = async () => {
    if (!targetRole.trim()) {
      setError("Please enter your target role.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/linkedin/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postType,
          targetRole: targetRole.trim(),
          currentRole: currentRole.trim() || undefined,
          industry: industry.trim() || undefined,
          tone,
          achievement: extraIsAchievement ? extra.trim() || undefined : undefined,
          topic: !extraIsAchievement ? extra.trim() || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate posts. Please try again.");
      }
      const data: LinkedInPostResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0a66c2]/20 border border-[#0a66c2]/30 text-sky-300 text-xs font-semibold mb-4">
          <PenLine className="w-3.5 h-3.5" />
          LinkedIn Post Generator
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Post Like a Pivot Pro</h1>
        <p className="text-slate-400 leading-relaxed">
          Generate 2–3 scroll-stopping LinkedIn post variants tuned to your career transition —
          with hashtags, timing, and engagement tips.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Post Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POST_TYPES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setPostType(value)}
                className={`px-3 py-3 rounded-xl text-left transition-colors ${
                  postType === value
                    ? "bg-[#0a66c2]/20 border-2 border-[#0a66c2] text-white"
                    : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="text-sm font-semibold mb-0.5">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Product Manager"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Role <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g. High School Teacher"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Industry <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. SaaS, Healthcare, Fintech"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {extraLabel} <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={extraPlaceholder}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTone(value)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tone === value
                    ? "bg-[#0a66c2] text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#0a66c2] hover:bg-[#0954a0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Writing your posts…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Generate Posts
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#0a66c2]" />
            <h2 className="text-lg font-bold">{result.posts.length} post variants</h2>
          </div>
          <div className="space-y-4">
            {result.posts.map((post, i) => (
              <PostCard key={i} post={post} index={i} />
            ))}
          </div>
          <div className="mt-8">
            <NextStepCTA fromTool="linkedin-optimizer" />
          </div>
        </div>
      )}
    </main>
  );
}
