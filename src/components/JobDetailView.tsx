"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Link2,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  FileText,
  ExternalLink,
  Users,
  Upload,
  Briefcase,
  MessageSquare,
  ChevronDown,
  Loader2,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ScoreRing";
import type {
  TrackedJob,
  JobStage,
  StageHistoryEntry,
} from "@/lib/job-tracker";
import { STAGES } from "@/lib/job-tracker";

// ─── Types ───

interface JobDetailViewProps {
  job: TrackedJob;
  email: string;
  onJobUpdate: (updated: TrackedJob) => void;
  onBack: () => void;
}

interface Contact {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  strength_tier: string;
  email: string | null;
  linkedin_url: string | null;
}

// ─── Helpers ───

function matchTier(score: number): "high" | "mid" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

const MATCH_RING_COLORS = {
  high: "stroke-emerald-500",
  mid: "stroke-amber-500",
  low: "stroke-slate-500",
};

const MATCH_RING_TEXT = {
  high: "text-emerald-400",
  mid: "text-amber-400",
  low: "text-slate-400",
};

const MATCH_LABELS = {
  high: "Strong Match",
  mid: "Moderate Match",
  low: "Low Match",
};

const STAGE_PILL_COLORS: Record<JobStage, string> = {
  saved: "bg-slate-500/15 border-slate-500/30 text-slate-300",
  applied: "bg-teal-500/15 border-teal-500/30 text-teal-300",
  phone_screen: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  interview: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  offer: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  rejected: "bg-red-500/15 border-red-500/30 text-red-300",
};

const STAGE_PILL_ACTIVE: Record<JobStage, string> = {
  saved: "bg-slate-500/30 border-slate-400 text-slate-200",
  applied: "bg-teal-500/30 border-teal-400 text-teal-200",
  phone_screen: "bg-cyan-500/30 border-cyan-400 text-cyan-200",
  interview: "bg-amber-500/30 border-amber-400 text-amber-200",
  offer: "bg-emerald-500/30 border-emerald-400 text-emerald-200",
  rejected: "bg-red-500/30 border-red-400 text-red-200",
};

const STRENGTH_BADGE: Record<string, string> = {
  strong: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  warm: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  new: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  cold: "bg-slate-500/15 border-slate-500/30 text-slate-400",
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimelineDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stageLabel(stage: JobStage): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}

// ─── useAutoSave hook ───

function useAutoSave(
  job: TrackedJob,
  email: string,
  onJobUpdate: (updated: TrackedJob) => void
) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const persistField = useCallback(
    async (field: string, value: string) => {
      const res = await fetch("/api/job-tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, email, [field]: value }),
      });
      if (res.ok && isMountedRef.current) {
        const { job: updated } = await res.json();
        onJobUpdate(updated);
      }
    },
    [job.id, email, onJobUpdate]
  );

  const debouncedSave = useCallback(
    (field: string, value: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persistField(field, value), 800);
    },
    [persistField]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return { debouncedSave, persistField };
}

// ─── MatchScoreRing ───

function MatchScoreRing({ score }: { score: number }) {
  const tier = matchTier(score);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="relative w-12 h-12 shrink-0" aria-label={`Match score: ${score}%`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-slate-800"
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
          className={`${MATCH_RING_COLORS[tier]} transition-all duration-700 ease-out motion-reduce:transition-none`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[11px] font-bold ${MATCH_RING_TEXT[tier]}`}>
          {score}%
        </span>
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
    <div className="mb-5">
      <div className="text-[12px] font-semibold text-slate-400 mb-2">Stage</div>
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
              current === s.key
                ? STAGE_PILL_ACTIVE[s.key]
                : STAGE_PILL_COLORS[s.key] + " hover:opacity-80"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ActivityTimeline ───

function ActivityTimeline({
  history,
  createdAt,
}: {
  history: StageHistoryEntry[];
  createdAt: string;
}) {
  const entries = useMemo(
    () =>
      [...history]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [history]
  );

  return (
    <div>
      <div className="text-[12px] font-semibold text-slate-400 mb-3">
        Activity Timeline
      </div>
      <div className="relative pl-4 border-l border-slate-800">
        {entries.map((entry, i) => (
          <div key={i} className="relative mb-4 last:mb-0">
            <div className="absolute -left-[calc(1rem+4px)] top-1 w-2 h-2 rounded-full bg-teal-500" />
            <div className="flex items-center gap-1.5 text-[12px] text-gray-50">
              <span className="font-medium">{stageLabel(entry.from)}</span>
              <ArrowRight className="h-3 w-3 text-slate-600" />
              <span className="font-medium">{stageLabel(entry.to)}</span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {formatTimelineDate(entry.at)}
            </div>
          </div>
        ))}
        <div className="relative mb-0">
          <div className="absolute -left-[calc(1rem+4px)] top-1 w-2 h-2 rounded-full bg-slate-600" />
          <div className="text-[12px] text-gray-50">Job added</div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            {formatTimelineDate(createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── JobContactsList ───

function JobContactsList({ company, email }: { company: string; email: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/contacts?email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setContacts(data.contacts ?? []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [company, email]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-500 text-[12px]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading contacts...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="py-4 text-center">
        <Users className="h-5 w-5 text-slate-700 mx-auto mb-1.5" />
        <p className="text-[12px] text-slate-500">No contacts at {company}</p>
        <a
          href="/networking"
          className="text-[11px] text-teal-400 hover:text-teal-300 mt-1 inline-block"
        >
          Add from Networking CRM
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] border border-slate-800 rounded-lg"
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-gray-50 truncate">
              {c.name}
            </div>
            {c.role && (
              <div className="text-[10px] text-slate-500 truncate">{c.role}</div>
            )}
          </div>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${
              STRENGTH_BADGE[c.strength_tier] ?? STRENGTH_BADGE.cold
            }`}
          >
            {c.strength_tier}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── AtsScoreTabContent ───

function AtsScoreTabContent({ job }: { job: TrackedJob }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const tier = matchTier(job.match_score);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 py-6">
        <ScoreRing
          score={job.match_score}
          animated={animated}
          label="Job Fit"
          size={128}
        />
        <Badge
          className={`text-sm font-semibold px-3 py-1 ${
            tier === "high"
              ? "bg-emerald-900/40 border-emerald-600/30 text-emerald-300"
              : tier === "mid"
                ? "bg-amber-900/40 border-amber-600/30 text-amber-300"
                : "bg-slate-700/40 border-slate-600/30 text-slate-400"
          }`}
        >
          {MATCH_LABELS[tier]}
        </Badge>
      </div>
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
        <p className="text-[12px] font-semibold text-slate-400 mb-2">
          Recommendations
        </p>
        <ul className="space-y-2 text-[12px] text-slate-300">
          {tier === "low" && (
            <>
              <li className="flex gap-2">
                <span className="text-amber-400 shrink-0">1.</span>
                Tailor your resume to match key skills in the job description
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400 shrink-0">2.</span>
                Use the Resume tab to auto-optimize for this role
              </li>
            </>
          )}
          {tier === "mid" && (
            <>
              <li className="flex gap-2">
                <span className="text-teal-400 shrink-0">1.</span>
                Good foundation — tailor your resume to close remaining gaps
              </li>
              <li className="flex gap-2">
                <span className="text-teal-400 shrink-0">2.</span>
                Highlight transferable skills in your cover letter
              </li>
            </>
          )}
          {tier === "high" && (
            <>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">1.</span>
                Strong match — focus on interview preparation
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">2.</span>
                Use the Interview Prep tab for company-specific practice
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

// ─── ResumeTabContent ───

function ResumeTabContent({ job }: { job: TrackedJob }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);

  async function handleTailor() {
    setStatus("loading");
    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContent: "",
          jobDescription: [job.role, job.company, job.notes].filter(Boolean).join("\n"),
          profile: {},
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data.tailoredContent ?? "Resume tailored successfully.");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      {status === "idle" && (
        <div className="text-center py-8">
          <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-300 mb-1">Tailor your resume for this role</p>
          <p className="text-[12px] text-slate-500 mb-4">
            AI will optimize your resume to match {job.role} at {job.company}
          </p>
          <button
            onClick={handleTailor}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <FileText className="h-4 w-4" />
            Tailor Resume
          </button>
        </div>
      )}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
          <p className="text-sm text-slate-400">Tailoring your resume...</p>
        </div>
      )}
      {status === "done" && result && (
        <div className="bg-white/5 border border-slate-700/40 rounded-xl p-5">
          <pre className="whitespace-pre-wrap text-[12px] text-slate-300 font-sans leading-relaxed">
            {result}
          </pre>
        </div>
      )}
      {status === "error" && (
        <div className="text-center py-8">
          <p className="text-sm text-red-300 mb-3">Failed to tailor resume</p>
          <button
            onClick={() => { setStatus("idle"); setResult(null); }}
            className="text-sm text-teal-400 hover:text-teal-300"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CoverLetterTabContent ───

function CoverLetterTabContent({ job }: { job: TrackedJob }) {
  const [tone, setTone] = useState<"professional" | "conversational" | "bold">("professional");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setStatus("loading");
    setResult(null);
    try {
      const jd = [job.role, job.company, job.notes].filter(Boolean).join("\n");
      const res = await fetch("/api/resume-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cover-letter",
          targetRole: job.role,
          jobDescription: jd,
          tone,
          profile: {},
          plan: { targetRole: job.role },
        }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      let text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResult(text);
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const TONES = [
    { key: "professional" as const, label: "Professional" },
    { key: "conversational" as const, label: "Conversational" },
    { key: "bold" as const, label: "Bold" },
  ];

  return (
    <div className="space-y-4">
      {(status === "idle" || status === "error") && (
        <>
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-2">Tone</p>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                    tone === t.key
                      ? "border-teal-500 bg-teal-900/20 text-teal-300"
                      : "border-slate-700 text-slate-500 hover:border-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {status === "error" && (
            <p className="text-[12px] text-red-300">Generation failed. Try again.</p>
          )}
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Generate Cover Letter
          </button>
        </>
      )}
      {status === "loading" && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <pre className="whitespace-pre-wrap text-[12px] text-slate-300 font-sans leading-relaxed min-h-[100px]">
            {result || "Generating..."}
          </pre>
          <div className="flex items-center gap-2 mt-3 text-slate-500 text-[11px]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Streaming...
          </div>
        </div>
      )}
      {status === "done" && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Generated</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <pre className="whitespace-pre-wrap text-[12px] text-slate-300 font-sans leading-relaxed">
              {result}
            </pre>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-[12px] text-slate-300 hover:text-white transition-colors"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => { setStatus("idle"); setResult(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── InterviewPrepPanel ───

function InterviewPrepPanel({ job }: { job: TrackedJob }) {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="common-questions">
        <AccordionTrigger>Common Questions</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-[12px]">
            <li>Tell me about yourself and why you&apos;re interested in {job.role}.</li>
            <li>What experience do you have that&apos;s relevant to this position?</li>
            <li>Why do you want to work at {job.company}?</li>
            <li>Where do you see yourself in 5 years?</li>
            <li>What&apos;s your biggest professional challenge and how did you overcome it?</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="star-stories">
        <AccordionTrigger>STAR Stories</AccordionTrigger>
        <AccordionContent>
          <p className="text-[12px] mb-3">
            Prepare 3-5 STAR stories (Situation, Task, Action, Result) that demonstrate relevant skills.
          </p>
          <div className="space-y-2">
            {["Leadership", "Problem Solving", "Collaboration", "Initiative"].map((theme) => (
              <div key={theme} className="px-3 py-2 bg-white/[0.03] border border-slate-800 rounded-lg text-[12px] text-slate-300">
                {theme}: <span className="text-slate-500 italic">Add your story...</span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="company-research">
        <AccordionTrigger>Company Research</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-[12px]">
            <p>Research {job.company} before your interview:</p>
            <ul className="space-y-1.5 pl-4 list-disc text-slate-400">
              <li>Mission, values, and recent news</li>
              <li>Products/services and target market</li>
              <li>Company culture and team structure</li>
              <li>Recent funding, acquisitions, or milestones</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="technical-topics">
        <AccordionTrigger>Technical Topics</AccordionTrigger>
        <AccordionContent>
          <p className="text-[12px] mb-2">
            Review technical areas likely to come up for {job.role}:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["System Design", "Data Structures", "Algorithms", "Domain Knowledge", "Tools & Frameworks"].map((topic) => (
              <span key={topic} className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {topic}
              </span>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// ─── DocumentsPanel ───

function DocumentsPanel() {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {["Resume", "Cover Letter", "Portfolio", "References"].map((doc) => (
          <div
            key={doc}
            className="bg-white/[0.03] border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-slate-700 transition-colors"
          >
            <FileText className="h-6 w-6 text-slate-600" />
            <span className="text-[12px] text-slate-400">{doc}</span>
            <span className="text-[10px] text-slate-600">No file</span>
          </div>
        ))}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragging
            ? "border-teal-500/50 bg-teal-500/[0.05]"
            : "border-slate-800 hover:border-slate-700"
        }`}
      >
        <Upload className="h-6 w-6 text-slate-600 mx-auto mb-2" />
        <p className="text-[12px] text-slate-400">Drop files here or click to upload</p>
        <p className="text-[10px] text-slate-600 mt-1">PDF, DOCX, or TXT</p>
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function JobDetailView({
  job,
  email,
  onJobUpdate,
  onBack,
}: JobDetailViewProps) {
  const [notes, setNotes] = useState(job.notes ?? "");
  const [nextAction, setNextAction] = useState(job.next_action ?? "");
  const [salaryRange, setSalaryRange] = useState(job.salary_range ?? "");
  const [location, setLocation] = useState(job.location ?? "");
  const [url, setUrl] = useState(job.url ?? "");
  const [currentStage, setCurrentStage] = useState(job.stage);
  const [activatedTabs, setActivatedTabs] = useState<Set<string>>(new Set(["ats"]));

  const { debouncedSave } = useAutoSave(job, email, onJobUpdate);

  useEffect(() => {
    setNotes(job.notes ?? "");
    setNextAction(job.next_action ?? "");
    setSalaryRange(job.salary_range ?? "");
    setLocation(job.location ?? "");
    setUrl(job.url ?? "");
    setCurrentStage(job.stage);
  }, [job]);

  const handleStageChange = useCallback(
    async (newStage: JobStage) => {
      if (currentStage === newStage) return;
      const prevStage = currentStage;
      setCurrentStage(newStage);
      try {
        const res = await fetch("/api/job-tracker", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: job.id, email, stage: newStage }),
        });
        if (res.ok) {
          const { job: updated } = await res.json();
          onJobUpdate(updated);
        } else {
          setCurrentStage(prevStage);
        }
      } catch {
        setCurrentStage(prevStage);
      }
    },
    [job.id, email, currentStage, onJobUpdate]
  );

  const handleTabChange = useCallback((value: string) => {
    setActivatedTabs((prev) => {
      if (prev.has(value)) return prev;
      const next = new Set(prev);
      next.add(value);
      return next;
    });
  }, []);

  const stageHistory: StageHistoryEntry[] = Array.isArray(job.stage_history)
    ? job.stage_history
    : [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Breadcrumb bar */}
      <div className="sticky top-0 z-30 backdrop-blur-[12px] bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Job Tracker
          </button>
          <span className="text-slate-700">/</span>
          <span className="text-[13px] text-gray-50 font-medium truncate">
            {job.role}
          </span>
          <span className="text-[13px] text-slate-500 hidden sm:inline">
            at {job.company}
          </span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-[360px] shrink-0 space-y-6">
            {/* Header card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${job.company_color || "from-slate-600 to-slate-800"} flex items-center justify-center text-[15px] font-bold text-white shrink-0`}
                >
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-[15px] font-bold text-gray-50 leading-tight">
                    {job.role}
                  </h1>
                  <p className="text-[13px] text-slate-400 mt-0.5">{job.company}</p>
                </div>
                {job.match_score > 0 && <MatchScoreRing score={job.match_score} />}
              </div>

              <StagePillSelector
                current={currentStage}
                onChange={handleStageChange}
              />
            </div>

            {/* Editable fields */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Application Details
              </h2>

              {/* Job URL */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Job URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); debouncedSave("url", e.target.value); }}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
                  />
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-teal-300 hover:border-teal-500/30 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Applied Date */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Applied Date
                </label>
                <div className="px-3 py-2 bg-white/[0.03] border border-slate-800/60 rounded-lg text-[13px] text-slate-300">
                  {formatDate(job.applied_at)}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Salary Range
                </label>
                <input
                  value={salaryRange}
                  onChange={(e) => { setSalaryRange(e.target.value); debouncedSave("salary_range", e.target.value); }}
                  placeholder="e.g. $120k - $160k"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </label>
                <input
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); debouncedSave("location", e.target.value); }}
                  placeholder="e.g. San Francisco, CA / Remote"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                  <FileText className="h-3.5 w-3.5" /> Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); debouncedSave("notes", e.target.value); }}
                  rows={3}
                  placeholder="Interview prep notes, key requirements..."
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Next Action */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mb-1.5">
                  <Clock className="h-3.5 w-3.5" /> Next Action
                </label>
                <input
                  value={nextAction}
                  onChange={(e) => { setNextAction(e.target.value); debouncedSave("next_action", e.target.value); }}
                  placeholder="e.g. Follow up with recruiter on Monday"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-slate-800 rounded-lg text-[13px] text-gray-50 placeholder:text-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Contacts at {job.company}
              </h2>
              <JobContactsList company={job.company} email={email} />
            </div>

            {/* Activity Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <ActivityTimeline history={stageHistory} createdAt={job.created_at} />
            </div>
          </aside>

          {/* ── Main tabbed area ── */}
          <main className="flex-1 min-w-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Tabs defaultValue="ats" onValueChange={handleTabChange}>
                <TabsList className="bg-slate-800/60 border border-slate-700/60 w-full mb-4">
                  <TabsTrigger value="ats" className="flex-1 text-xs">
                    ATS Score
                  </TabsTrigger>
                  <TabsTrigger value="resume" className="flex-1 text-xs">
                    Resume
                  </TabsTrigger>
                  <TabsTrigger value="cover-letter" className="flex-1 text-xs">
                    Cover Letter
                  </TabsTrigger>
                  <TabsTrigger value="interview" className="flex-1 text-xs">
                    Interview Prep
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex-1 text-xs">
                    Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ats">
                  {activatedTabs.has("ats") && <AtsScoreTabContent job={job} />}
                </TabsContent>

                <TabsContent value="resume">
                  {activatedTabs.has("resume") && <ResumeTabContent job={job} />}
                </TabsContent>

                <TabsContent value="cover-letter">
                  {activatedTabs.has("cover-letter") && <CoverLetterTabContent job={job} />}
                </TabsContent>

                <TabsContent value="interview">
                  {activatedTabs.has("interview") && <InterviewPrepPanel job={job} />}
                </TabsContent>

                <TabsContent value="documents">
                  {activatedTabs.has("documents") && <DocumentsPanel />}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
