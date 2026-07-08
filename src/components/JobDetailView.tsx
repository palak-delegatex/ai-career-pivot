"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Upload,
  User,
  Users,
  Wand2,
  BookOpen,
  Target,
  HelpCircle,
  Building2,
  Code2,
  CheckCircle2,
  Lock,
  Handshake,
} from "lucide-react";
import type { TrackedJob, JobStage, JobSource, JobPriority } from "@/lib/job-tracker";
import { STAGES, JOB_PRIORITIES } from "@/lib/job-tracker";
import { useLocale } from "next-intl";
import {
  trackWarmIntroSurfaceShown,
  trackWarmIntroTeaserViewed,
  trackWarmIntroRevealClicked,
  trackWarmIntroPaywallHit,
  trackWarmIntroUnlock,
} from "@/lib/tracking";
import { WarmIntroSection } from "@/components/warm-intro";

// ─── Types ───

interface JobDetailViewProps {
  job: TrackedJob;
  email: string;
  onBack: () => void;
  onJobUpdate: (updated: TrackedJob) => void;
}

// ─── Constants ───

const STAGE_PILL_COLORS: Record<JobStage, string> = {
  exploring: "bg-slate-400/15 border-slate-400/30 text-slate-300",
  applied: "bg-teal-500/15 border-teal-500/30 text-teal-300",
  interviewing: "bg-amber-400/15 border-amber-400/30 text-amber-300",
  offer: "bg-emerald-400/15 border-emerald-400/30 text-emerald-300",
  pivoted: "bg-violet-400/15 border-violet-400/30 text-violet-300",
  passed: "bg-slate-500/15 border-slate-500/30 text-slate-400",
};

const STAGE_PILL_ACTIVE: Record<JobStage, string> = {
  exploring: "bg-slate-400/30 border-slate-400/50 text-slate-100",
  applied: "bg-teal-500/30 border-teal-500/50 text-teal-100",
  interviewing: "bg-amber-400/30 border-amber-400/50 text-amber-100",
  offer: "bg-emerald-400/30 border-emerald-400/50 text-emerald-100",
  pivoted: "bg-violet-400/30 border-violet-400/50 text-violet-100",
  passed: "bg-slate-500/30 border-slate-500/50 text-slate-200",
};

const SOURCE_LABELS: Record<JobSource, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  glassdoor: "Glassdoor",
  direct: "Direct",
  other: "Other",
};

const STRENGTH_BADGE: Record<string, string> = {
  strong: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  warm: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  new: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  cold: "bg-slate-500/15 border-slate-500/30 text-slate-400",
};

// ─── MatchScoreRing (48x48) ───

function MatchScoreRing({ score }: { score: number }) {
  const size = 48;
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  const tier = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  const strokeClass =
    tier === "high"
      ? "stroke-emerald-400"
      : tier === "mid"
        ? "stroke-amber-400"
        : "stroke-slate-400";
  const textClass =
    tier === "high"
      ? "text-emerald-400"
      : tier === "mid"
        ? "text-amber-400"
        : "text-slate-400";

  if (score === 0) return null;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Match score: ${score}%`}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-slate-700"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeClass} transition-all duration-700 ease-out motion-reduce:transition-none`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[11px] font-bold ${textClass}`}>{score}%</span>
      </div>
    </div>
  );
}

// ─── StagePillSelector ───

function StagePillSelector({
  current,
  onChange,
}: {
  current: JobStage;
  onChange: (stage: JobStage) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STAGES.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all motion-reduce:transition-none ${
            current === s.key
              ? STAGE_PILL_ACTIVE[s.key]
              : `${STAGE_PILL_COLORS[s.key]} hover:opacity-80`
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── useAutoSave hook ───

function useAutoSave(
  jobId: string,
  email: string,
  onJobUpdate: (updated: TrackedJob) => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, unknown>>({});

  const flush = useCallback(async () => {
    const fields = { ...pendingRef.current };
    pendingRef.current = {};
    if (Object.keys(fields).length === 0) return;

    try {
      const res = await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, email, ...fields }),
      });
      if (res.ok) {
        const { job } = await res.json();
        onJobUpdate(job);
      }
    } catch {
      // Silently fail — user can retry
    }
  }, [jobId, email, onJobUpdate]);

  const queue = useCallback(
    (field: string, value: unknown) => {
      pendingRef.current[field] = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 800);
    },
    [flush]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { queue, flush };
}

// ─── ActivityTimeline ───

function ActivityTimeline({ job }: { job: TrackedJob }) {
  const events = useMemo(() => {
    const list: { label: string; date: string; icon: typeof Clock }[] = [];
    list.push({ label: "Added to tracker", date: job.created_at, icon: Plus });
    if (job.applied_at) {
      list.push({ label: "Applied", date: job.applied_at, icon: CheckCircle2 });
    }
    if (job.stage_changed_at && job.stage_changed_at !== job.created_at) {
      const stageLabel = STAGES.find((s) => s.key === job.stage)?.label ?? job.stage;
      list.push({
        label: `Moved to ${stageLabel}`,
        date: job.stage_changed_at,
        icon: ChevronRight,
      });
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [job]);

  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
        Activity
      </h3>
      <div className="space-y-2">
        {events.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3 w-3 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-300">{ev.label}</p>
                <p className="text-[10px] text-slate-600">
                  {new Date(ev.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WarmIntroPanel (AIC-769) ───

interface WarmIntroContact {
  id: string;
  name: string;
  role: string | null;
  linkedin_url: string | null;
  strength_tier: string;
}

interface WarmIntroData {
  connectionCount: number;
  topTier: string | null;
  paid: boolean;
  contacts: WarmIntroContact[];
}

function WarmIntroPanel({
  job,
  email,
}: {
  job: TrackedJob;
  email: string;
}) {
  const locale = useLocale();
  const company = job.company;
  const [data, setData] = useState<WarmIntroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { loading: boolean; message?: string; error?: boolean; copied?: boolean }>
  >({});

  // Fetch matches once, on first mount (tab is lazy-loaded → this is the surface impression).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/warm-intro?email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: WarmIntroData) => {
        if (cancelled) return;
        setData(d);
        trackWarmIntroSurfaceShown({
          connection_count: d.connectionCount,
          has_connections: d.connectionCount > 0,
          paid: d.paid,
        });
        if (d.connectionCount > 0) {
          trackWarmIntroTeaserViewed({
            connection_count: d.connectionCount,
            top_tier: d.topTier,
          });
          if (d.paid) {
            // Paid user sees the reveal immediately.
            trackWarmIntroUnlock({ connection_count: d.connectionCount, drafted: false });
          }
        }
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [company, email]);

  const handleUnlock = useCallback(() => {
    const count = data?.connectionCount ?? 0;
    trackWarmIntroRevealClicked({ connection_count: count });
    trackWarmIntroPaywallHit({ connection_count: count });
    window.location.href = `/${locale}/pricing?feature=warm_intro`;
  }, [data, locale]);

  const handleDraft = useCallback(
    async (contactId: string) => {
      setDrafts((prev) => ({ ...prev, [contactId]: { loading: true } }));
      try {
        const res = await fetch("/api/warm-intro/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, jobId: job.id, contactId, locale }),
        });
        if (!res.ok) throw new Error();
        const { message } = await res.json();
        setDrafts((prev) => ({ ...prev, [contactId]: { loading: false, message } }));
        trackWarmIntroUnlock({
          connection_count: data?.connectionCount ?? 0,
          drafted: true,
        });
      } catch {
        setDrafts((prev) => ({ ...prev, [contactId]: { loading: false, error: true } }));
      }
    },
    [email, job.id, locale, data]
  );

  const handleCopy = useCallback((contactId: string, message: string) => {
    navigator.clipboard.writeText(message).then(() => {
      setDrafts((prev) => ({
        ...prev,
        [contactId]: { ...prev[contactId], copied: true },
      }));
      setTimeout(
        () =>
          setDrafts((prev) => ({
            ...prev,
            [contactId]: { ...prev[contactId], copied: false },
          })),
        2000
      );
    });
  }, []);

  const header = (
    <div className="flex items-center gap-2 mb-1">
      <Handshake className="h-4 w-4 text-teal-400" />
      <h3 className="text-[14px] font-semibold text-slate-100">
        Insider Connections
      </h3>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl">
        {header}
        <div className="flex items-center gap-2 text-[12px] text-slate-500 mt-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking your network for
          connections at {company}...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl">
        {header}
        <p className="text-[12px] text-slate-500 mt-4">
          Could not load connections. Please try again.
        </p>
      </div>
    );
  }

  const { connectionCount, topTier, paid, contacts } = data;

  // No connections in the user's CRM at this company.
  if (connectionCount === 0) {
    return (
      <div className="max-w-2xl">
        {header}
        <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">
          No one in your network is at{" "}
          <span className="text-slate-200 font-medium">{company}</span> yet.
          Referred candidates get hired ~55% faster — add contacts to your network
          and we&apos;ll surface warm-intro paths automatically.
        </p>
        <a
          href={`/${locale}/networking`}
          className="inline-flex items-center gap-1.5 mt-4 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] font-medium text-slate-200 hover:bg-white/[0.08] transition-colors"
        >
          <Users className="h-3.5 w-3.5" /> Manage your network
        </a>
      </div>
    );
  }

  const plural = connectionCount === 1 ? "connection" : "connections";

  // Teaser (free) — count + strongest tier, but no identities.
  if (!paid) {
    return (
      <div className="max-w-2xl">
        {header}
        <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
          A warm intro gets a{" "}
          <span className="text-teal-300 font-medium">20–40% reply rate</span> vs
          1–3% cold, and referred candidates get hired ~55% faster.
        </p>
        <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.07] to-transparent p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-teal-400" />
            <p className="text-[14px] font-semibold text-slate-100">
              We found {connectionCount} likely {plural} at {company}
            </p>
          </div>
          {/* Locked, blurred placeholder rows */}
          <div className="space-y-2 mb-4" aria-hidden>
            {contactsPlaceholder(Math.min(connectionCount, 3))}
          </div>
          <button
            onClick={handleUnlock}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-900 text-[13px] font-semibold transition-colors"
          >
            <Lock className="h-4 w-4" /> Unlock who they are + a drafted intro ask
          </button>
          <p className="text-[11px] text-slate-500 mt-2.5">
            Paid unlocks the contact{connectionCount > 1 ? "s" : ""} and a
            personalized referral message tailored to this role.
          </p>
        </div>
      </div>
    );
  }

  // Paid — reveal contacts + on-demand drafted asks.
  return (
    <div className="max-w-2xl">
      {header}
      <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
        {connectionCount} {plural} in your network at{" "}
        <span className="text-slate-200 font-medium">{company}</span>
        {topTier ? ` · strongest tie: ${topTier}` : ""}. Draft a personalized
        referral ask for any of them.
      </p>
      <div className="space-y-3">
        {contacts.map((c) => {
          const d = drafts[c.id];
          return (
            <div
              key={c.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-slate-100 truncate">
                      {c.name}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${STRENGTH_BADGE[c.strength_tier] ?? STRENGTH_BADGE.cold}`}
                    >
                      {c.strength_tier}
                    </span>
                  </div>
                  {c.role && (
                    <p className="text-[11px] text-slate-500 truncate">{c.role}</p>
                  )}
                </div>
                {c.linkedin_url && (
                  <a
                    href={c.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                    title="Open LinkedIn profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              {!d?.message && (
                <button
                  onClick={() => handleDraft(c.id)}
                  disabled={d?.loading}
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/25 text-[12px] font-medium text-teal-300 hover:bg-teal-500/20 transition-colors disabled:opacity-60"
                >
                  {d?.loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" /> Draft referral ask
                    </>
                  )}
                </button>
              )}

              {d?.error && (
                <p className="text-[11px] text-red-400 mt-2">
                  Couldn&apos;t generate a message. Try again.
                </p>
              )}

              {d?.message && (
                <div className="mt-3">
                  <div className="rounded-lg bg-black/20 border border-white/[0.06] p-3 text-[12px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {d.message}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleCopy(c.id, d.message!)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-slate-200 hover:bg-white/[0.08] transition-colors"
                    >
                      {d.copied ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDraft(c.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Wand2 className="h-3 w-3" /> Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Blurred placeholder rows for the free teaser.
function contactsPlaceholder(n: number) {
  return Array.from({ length: n }).map((_, i) => (
    <div
      key={i}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] select-none blur-[3px]"
    >
      <div className="w-7 h-7 rounded-full bg-white/[0.08]" />
      <div className="flex-1">
        <div className="h-2.5 w-28 rounded bg-white/[0.10] mb-1.5" />
        <div className="h-2 w-20 rounded bg-white/[0.06]" />
      </div>
    </div>
  ));
}

// ─── InterviewPrepPanel ───

const PREP_CARDS = [
  {
    key: "common",
    title: "Common Questions",
    icon: HelpCircle,
    content:
      "Tell me about yourself · Why this company? · Walk me through your resume · Where do you see yourself in 5 years? · What's your biggest strength/weakness?",
  },
  {
    key: "star",
    title: "STAR Stories",
    icon: Star,
    content:
      "Prepare 3–5 stories using the STAR method (Situation, Task, Action, Result). Focus on leadership, conflict resolution, technical problem-solving, and cross-functional collaboration.",
  },
  {
    key: "company",
    title: "Company Research",
    icon: Building2,
    content:
      "Research the company's mission, recent news, products, culture, competitors, and growth trajectory. Prepare thoughtful questions to ask the interviewer.",
  },
  {
    key: "technical",
    title: "Technical Topics",
    icon: Code2,
    content:
      "Review role-specific technical skills from the job description. Practice relevant coding problems, system design scenarios, or domain-specific knowledge areas.",
  },
];

function InterviewPrepPanel({ job }: { job: TrackedJob }) {
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-400">
        Preparation materials for <span className="text-slate-200 font-medium">{job.role}</span> at{" "}
        <span className="text-slate-200 font-medium">{job.company}</span>
      </p>
      {PREP_CARDS.map((card) => {
        const Icon = card.icon;
        const isOpen = openCards.has(card.key);
        return (
          <Collapsible key={card.key} open={isOpen} onOpenChange={() => toggle(card.key)}>
            <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <span className="flex-1 text-left text-[13px] font-medium text-slate-200">
                {card.title}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3 pt-2 text-[12px] text-slate-400 leading-relaxed">
                {card.content}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

// ─── DocumentsPanel ───

function DocumentsPanel({ jobId }: { jobId: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
          <FileText className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-slate-200">Resume</p>
            <p className="text-[11px] text-slate-500">Tailored version for this role</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
          <FileText className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-slate-200">Cover Letter</p>
            <p className="text-[11px] text-slate-500">Generated for this application</p>
          </div>
        </div>
      </div>

      {/* Upload dropzone */}
      <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors">
        <Upload className="h-8 w-8 text-slate-600 mx-auto mb-3" />
        <p className="text-[13px] text-slate-400 mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-[11px] text-slate-600">
          Offer letters, assessments, portfolios
        </p>
      </div>
    </div>
  );
}

// ─── ResumeTabContent ───

function ResumeTabContent({ job }: { job: TrackedJob }) {
  const locale = useLocale();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    tailoredResume: string;
    changes: { section: string; changeType: string; original: string; tailored: string; reason: string }[];
    matchScore: number;
  } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: `${job.role} at ${job.company}`,
          jobUrl: job.url,
          locale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // Failed silently
    } finally {
      setGenerating(false);
    }
  };

  if (!result) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl bg-card border border-border text-center">
          <Wand2 className="h-8 w-8 text-teal-400 mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-slate-200 mb-2">
            Tailor Resume for This Role
          </h3>
          <p className="text-[12px] text-slate-400 mb-4 max-w-md mx-auto">
            AI will analyze the job description and optimize your resume for maximum ATS compatibility and keyword matching.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Tailoring..." : "Generate Tailored Resume"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-[13px] font-medium text-emerald-300">
            Resume tailored — {result.changes.length} changes made
          </span>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors">
            <Copy className="h-3 w-3" /> Copy
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors">
            <Download className="h-3 w-3" /> Download
          </button>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-card border border-border">
        <pre className="text-[12px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
          {result.tailoredResume}
        </pre>
      </div>
      {result.changes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
            Changes
          </h4>
          {result.changes.map((c, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase text-teal-400">
                  {c.changeType}
                </span>
                <span className="text-[11px] text-slate-500">{c.section}</span>
              </div>
              <p className="text-[11px] text-slate-400">{c.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CoverLetterTabContent ───

function CoverLetterTabContent({ job }: { job: TrackedJob }) {
  const [tone, setTone] = useState<"professional" | "conversational" | "bold">(
    "professional"
  );
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.role,
          company: job.company,
          jobUrl: job.url,
          tone,
        }),
      });
      if (res.ok) {
        const reader = res.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let text = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
            setResult(text);
          }
        } else {
          const data = await res.json();
          setResult(data.content ?? data.letter ?? "");
        }
      }
    } catch {
      // Failed silently
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tone selector */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-slate-400">Tone:</span>
        {(["professional", "conversational", "bold"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTone(t)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
              tone === t
                ? "bg-teal-500/20 border-teal-500/40 text-teal-300"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {!result && (
        <div className="p-6 rounded-xl bg-card border border-border text-center">
          <MessageSquare className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-slate-200 mb-2">
            Generate Cover Letter
          </h3>
          <p className="text-[12px] text-slate-400 mb-4 max-w-md mx-auto">
            AI will craft a personalized cover letter matching your experience to this role.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg text-[13px] font-semibold text-white transition-colors"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Writing..." : "Generate Cover Letter"}
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors">
              <Download className="h-3 w-3" /> Download
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Wand2 className="h-3 w-3" /> Regenerate
            </button>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── AtsScoreTabContent ───

function AtsScoreTabContent({ job }: { job: TrackedJob }) {
  const score = job.match_score;
  const tier = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  const tierLabel = tier === "high" ? "Strong Match" : tier === "mid" ? "Moderate Match" : "Low Match";
  const tierColor =
    tier === "high"
      ? "text-emerald-400"
      : tier === "mid"
        ? "text-amber-400"
        : "text-slate-400";

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;
  const strokeClass =
    tier === "high"
      ? "stroke-emerald-400"
      : tier === "mid"
        ? "stroke-amber-400"
        : "stroke-slate-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6">
        <div
          className="relative"
          style={{ width: 120, height: 120 }}
          aria-label={`ATS score: ${score}%`}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-slate-700"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${strokeClass} transition-all duration-1000 ease-out motion-reduce:transition-none`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold ${tierColor}`}>
              {score}%
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">ATS Score</span>
          </div>
        </div>
        <p className={`text-[14px] font-semibold mt-3 ${tierColor}`}>
          {tierLabel}
        </p>
      </div>

      {score === 0 && (
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <Target className="h-6 w-6 text-slate-600 mx-auto mb-2" />
          <p className="text-[13px] text-slate-400">
            No ATS score yet. Tailor your resume from the Resume tab to generate a match score.
          </p>
        </div>
      )}

      {score > 0 && (
        <div className="space-y-3">
          <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
            Recommendations
          </h4>
          <div className="space-y-2">
            {score < 70 && (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-400">
                  Your resume could be better matched. Use the Resume tab to generate a tailored version with optimized keywords.
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-400">
                Focus on quantifiable achievements and use industry-specific keywords from the job posting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main: JobDetailView ───

export default function JobDetailView({
  job: initialJob,
  email,
  onBack,
  onJobUpdate,
}: JobDetailViewProps) {
  const [job, setJob] = useState(initialJob);
  const [activeTab, setActiveTab] = useState("ats");
  const [tabsLoaded, setTabsLoaded] = useState<Set<string>>(new Set(["ats"]));

  const { queue, flush } = useAutoSave(job.id, email, (updated) => {
    setJob(updated);
    onJobUpdate(updated);
  });

  // Local field state for optimistic updates
  const [role, setRole] = useState(job.role);
  const [company, setCompany] = useState(job.company);
  const [url, setUrl] = useState(job.url ?? "");
  const [source, setSource] = useState<JobSource>(job.source);
  const [notes, setNotes] = useState(job.notes ?? "");
  const [nextAction, setNextAction] = useState(job.next_action ?? "");
  const [followUpDate, setFollowUpDate] = useState(job.next_action_date ?? "");
  const [priority, setPriority] = useState<JobPriority | null>(job.priority ?? null);

  const handleFollowUpDateChange = useCallback(
    (value: string) => {
      setFollowUpDate(value);
      // Empty string clears the date (sends null so the DATE column is nulled).
      queue("next_action_date", value || null);
    },
    [queue]
  );

  const handlePriorityChange = useCallback(
    (value: JobPriority) => {
      // Tapping the active pill again clears the priority.
      const next = priority === value ? null : value;
      setPriority(next);
      queue("priority", next);
    },
    [priority, queue]
  );

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      switch (field) {
        case "role":
          setRole(value);
          break;
        case "company":
          setCompany(value);
          break;
        case "url":
          setUrl(value);
          break;
        case "notes":
          setNotes(value);
          break;
        case "next_action":
          setNextAction(value);
          break;
      }
      queue(field, value);
    },
    [queue]
  );

  const handleSourceChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      setSource(value as JobSource);
      queue("source", value);
    },
    [queue]
  );

  const handleStageChange = useCallback(
    async (newStage: JobStage) => {
      const prev = job.stage;
      const optimistic = {
        ...job,
        stage: newStage,
        stage_changed_at: new Date().toISOString(),
      };
      setJob(optimistic);
      onJobUpdate(optimistic);

      try {
        const res = await fetch("/api/job-tracker", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: job.id, email, stage: newStage }),
        });
        if (res.ok) {
          const { job: saved } = await res.json();
          setJob(saved);
          onJobUpdate(saved);
        } else {
          const reverted = { ...job, stage: prev };
          setJob(reverted);
          onJobUpdate(reverted);
        }
      } catch {
        const reverted = { ...job, stage: prev };
        setJob(reverted);
        onJobUpdate(reverted);
      }
    },
    [job, email, onJobUpdate]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      setTabsLoaded((prev) => new Set([...prev, value]));
    },
    []
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* ─── Breadcrumb bar ─── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-[12px] border-b border-border px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Job Tracker
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className="text-[13px] font-medium text-slate-200 truncate">
            {job.role}
          </span>
          <span className="text-[13px] text-slate-600">at</span>
          <span className="text-[13px] font-medium text-slate-200 truncate">
            {job.company}
          </span>
        </div>
      </div>

      {/* ─── Two-column layout ─── */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0">
        {/* ─── Sidebar (360px on desktop) ─── */}
        <div className="w-full lg:w-[360px] lg:shrink-0 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto px-4 sm:px-6 py-6">
          {/* Header: Avatar + Title + MatchScoreRing */}
          <div className="flex items-start gap-3 mb-5">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-lg font-bold text-white shrink-0`}
            >
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold text-foreground leading-tight">
                {role}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {company}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 text-primary hover:text-accent transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            </div>
            <MatchScoreRing score={job.match_score} />
          </div>

          {/* Stage pills */}
          <div className="mb-6">
            <StagePillSelector
              current={job.stage}
              onChange={handleStageChange}
            />
          </div>

          {/* ─── Editable fields ─── */}
          <div className="space-y-3.5 mb-6">
            <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Application Details
            </h3>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Role
              </label>
              <input
                value={role}
                onChange={(e) => handleFieldChange("role", e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-border rounded-lg text-[13px] text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Company
              </label>
              <input
                value={company}
                onChange={(e) => handleFieldChange("company", e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-border rounded-lg text-[13px] text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Job URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => handleFieldChange("url", e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white/[0.04] border border-border rounded-lg text-[13px] text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Source
              </label>
              <Select value={source} onValueChange={handleSourceChange}>
                <SelectTrigger className="w-full h-9 bg-white/[0.04] border-border text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Action */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Next Action
              </label>
              <input
                value={nextAction}
                onChange={(e) =>
                  handleFieldChange("next_action", e.target.value)
                }
                placeholder="Follow up on Monday..."
                className="w-full px-3 py-2 bg-white/[0.04] border border-border rounded-lg text-[13px] text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Follow-up Date (AIC-501) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => handleFollowUpDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-border rounded-lg text-[13px] text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Priority (AIC-501) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {JOB_PRIORITIES.map((p) => {
                  const isActive = priority === p;
                  const activeStyle =
                    p === "hot"
                      ? "border-red-500 bg-red-500/10 text-red-300"
                      : p === "warm"
                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                        : "border-sky-500 bg-sky-500/10 text-sky-300";
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePriorityChange(p)}
                      aria-pressed={isActive}
                      className={`px-3 py-2 rounded-lg text-[12px] font-semibold capitalize border transition-colors ${
                        isActive
                          ? activeStyle
                          : "border-border bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                rows={3}
                placeholder="Referred by Sarah, culture seems great..."
                className="w-full px-3 py-2 bg-white/[0.04] border border-border rounded-lg text-[13px] text-foreground placeholder:text-slate-600 focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* ─── Warm-Intro / Insider Connections (AIC-772) ─── */}
          <div className="mb-6">
            <WarmIntroSection
              company={job.company}
              jobId={job.id}
              email={email}
            />
          </div>

          {/* ─── Activity Timeline ─── */}
          <ActivityTimeline job={job} />
        </div>

        {/* ─── Main tabbed area ─── */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start bg-card border border-border">
              <TabsTrigger value="ats" className="text-[12px]">
                <Target className="h-3.5 w-3.5 mr-1.5" />
                ATS Score
              </TabsTrigger>
              <TabsTrigger value="resume" className="text-[12px]">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Resume
              </TabsTrigger>
              <TabsTrigger value="cover-letter" className="text-[12px]">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Cover Letter
              </TabsTrigger>
              <TabsTrigger value="interview" className="text-[12px]">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Interview Prep
              </TabsTrigger>
              <TabsTrigger value="warm-intro" className="text-[12px]">
                <Handshake className="h-3.5 w-3.5 mr-1.5" />
                Warm Intro
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-[12px]">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ats">
              {tabsLoaded.has("ats") && <AtsScoreTabContent job={job} />}
            </TabsContent>

            <TabsContent value="resume">
              {tabsLoaded.has("resume") && <ResumeTabContent job={job} />}
            </TabsContent>

            <TabsContent value="cover-letter">
              {tabsLoaded.has("cover-letter") && (
                <CoverLetterTabContent job={job} />
              )}
            </TabsContent>

            <TabsContent value="interview">
              {tabsLoaded.has("interview") && (
                <InterviewPrepPanel job={job} />
              )}
            </TabsContent>

            <TabsContent value="warm-intro">
              {tabsLoaded.has("warm-intro") && (
                <WarmIntroPanel job={job} email={email} />
              )}
            </TabsContent>

            <TabsContent value="documents">
              {tabsLoaded.has("documents") && (
                <DocumentsPanel jobId={job.id} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
