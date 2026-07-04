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
} from "lucide-react";
import type { TrackedJob, JobStage, JobSource } from "@/lib/job-tracker";
import { STAGES } from "@/lib/job-tracker";

// ─── Types ───

interface JobDetailViewProps {
  job: TrackedJob;
  email: string;
  onBack: () => void;
  onJobUpdate: (updated: TrackedJob) => void;
}

interface Contact {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  strength_tier: string;
  strength_score: number;
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

// ─── JobContactsList ───

function JobContactsList({ company, email }: { company: string; email: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched) return;
    setLoading(true);
    setFetched(true);
    fetch(`/api/contacts?search=${encodeURIComponent(company)}`)
      .then((r) => (r.ok ? r.json() : { contacts: [] }))
      .then((data) => {
        const filtered = (data.contacts ?? []).filter(
          (c: Contact) =>
            c.company?.toLowerCase() === company.toLowerCase()
        );
        setContacts(filtered);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [company, email, fetched]);

  return (
    <div className="space-y-3">
      <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Users className="h-3.5 w-3.5" />
        Contacts at {company}
      </h3>
      {loading && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading...
        </div>
      )}
      {!loading && contacts.length === 0 && (
        <p className="text-[11px] text-slate-600 italic">
          No contacts at {company} yet
        </p>
      )}
      {contacts.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
        >
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-slate-200 truncate">
              {c.name}
            </p>
            {c.role && (
              <p className="text-[10px] text-slate-500 truncate">{c.role}</p>
            )}
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${STRENGTH_BADGE[c.strength_tier] ?? STRENGTH_BADGE.cold}`}
          >
            {c.strength_tier}
          </span>
        </div>
      ))}
    </div>
  );
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

          {/* ─── Contacts ─── */}
          <div className="mb-6">
            <JobContactsList company={job.company} email={email} />
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
