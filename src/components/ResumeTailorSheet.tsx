"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  Circle,
  FileText,
  AlertTriangle,
  Download,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import type { EnrichedJob } from "@/lib/job-match";
import type { UserProfile, PivotPlan } from "@/lib/intake";
import { downloadPdf } from "@/lib/pdf-download";
import type { TailorResponse } from "@/app/api/resume/tailor/route";

type Phase = "input" | "processing" | "results";

interface Change {
  section: string;
  changeType: "rewrite" | "reorder" | "add" | "keyword";
  original: string;
  tailored: string;
  reason: string;
}

interface ResumeTailorSheetProps {
  job?: EnrichedJob | null;
  jobDescription?: string;
  profile: UserProfile;
  plan: PivotPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildResumeFromProfile(profile: UserProfile, plan: PivotPlan): string {
  const lines: string[] = [];

  if (profile.name) lines.push(`# ${profile.name}`);
  const contactParts = [profile.email, profile.location?.city, profile.location?.country].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(" | "));
  lines.push("");

  if (profile.currentTitle) {
    lines.push("## Professional Summary");
    lines.push(
      `${profile.currentTitle} with ${profile.yearsExperience || "several"} years of experience` +
      (profile.currentIndustry ? ` in ${profile.currentIndustry}` : "") +
      `. Transitioning to ${plan.targetRole}` +
      (plan.targetIndustry ? ` in ${plan.targetIndustry}` : "") + "."
    );
    lines.push("");
  }

  if (profile.skills?.length) {
    lines.push("## Skills");
    lines.push(profile.skills.join(", "));
    if (profile.transferableSkills?.length) {
      lines.push("Transferable: " + profile.transferableSkills.join(", "));
    }
    lines.push("");
  }

  if (profile.experience?.length) {
    lines.push("## Experience");
    for (const exp of profile.experience) {
      lines.push(
        `### ${exp.title} at ${exp.company} (${exp.startYear}–${exp.endYear ?? "Present"})`
      );
      lines.push(exp.description);
      lines.push("");
    }
  }

  if (profile.education?.length) {
    lines.push("## Education");
    for (const edu of profile.education) {
      lines.push(
        `- ${edu.degree} in ${edu.field}, ${edu.institution}${edu.year ? ` (${edu.year})` : ""}`
      );
    }
    lines.push("");
  }

  if (profile.certifications?.length) {
    lines.push("## Certifications");
    lines.push(profile.certifications.join(", "));
  }

  return lines.join("\n");
}

const CHANGE_TYPE_STYLES: Record<Change["changeType"], { bg: string; label: string }> = {
  rewrite: { bg: "bg-amber-900/40 border-amber-600/30 text-amber-300", label: "Rewrite" },
  reorder: { bg: "bg-blue-900/40 border-blue-600/30 text-blue-300", label: "Reorder" },
  add: { bg: "bg-emerald-900/40 border-emerald-600/30 text-emerald-300", label: "Added" },
  keyword: { bg: "bg-teal-900/40 border-teal-600/30 text-teal-300", label: "Keyword" },
};

const STEP_LABELS = [
  "Parsing job description",
  "Scoring your current resume",
  "Tailoring content",
  "Calculating improvement",
];

const STEP_TIMINGS = [2000, 5000, 10000, 14000];

function ProcessingStepper({ activeStep }: { activeStep: number }) {
  return (
    <div className="space-y-3" aria-live="polite">
      {STEP_LABELS.map((label, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        return (
          <div key={i} className="flex items-center gap-3 transition-all duration-300 ease-out">
            {done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : active ? (
              <div className="h-5 w-5 shrink-0 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Circle className="h-5 w-5 text-slate-600 shrink-0" />
            )}
            <span
              className={`text-sm transition-colors duration-300 ${
                done ? "text-emerald-300" : active ? "text-white" : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChangeCard({
  change,
  accepted,
  onToggle,
}: {
  change: Change;
  accepted: boolean;
  onToggle: () => void;
}) {
  const [showOriginal, setShowOriginal] = useState(
    change.changeType === "rewrite" || change.changeType === "add"
  );
  const style = CHANGE_TYPE_STYLES[change.changeType];

  return (
    <div
      className={`border border-slate-700/60 rounded-lg p-4 transition-all duration-150 ${
        accepted ? "opacity-100" : "opacity-50"
      }`}
      role="group"
      aria-label={`Resume change: ${change.section}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${style.bg} border text-[10px]`}>{style.label}</Badge>
          <span className="text-xs font-medium text-slate-300">{change.section}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggle}
            aria-pressed={accepted}
            className={`px-2.5 py-1 text-[10px] font-medium rounded border transition-all duration-150 ${
              accepted
                ? "bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 border-emerald-700/40"
                : "bg-slate-700/40 hover:bg-slate-600/40 text-slate-400 border-slate-600/40"
            }`}
          >
            {accepted ? "Accepted" : "Rejected"}
          </button>
        </div>
      </div>

      {change.original && (
        <div className="mb-2">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-400 transition-colors mb-1"
          >
            {showOriginal ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Original
          </button>
          {showOriginal && (
            <div className="bg-slate-800/60 border-l-2 border-slate-600 px-3 py-2 rounded-r">
              <p className={`text-xs text-slate-400 whitespace-pre-wrap ${!accepted ? "" : ""}`}>
                {change.original}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800/60 border-l-2 border-teal-600 px-3 py-2 rounded-r mb-2">
        <p className={`text-xs text-slate-200 whitespace-pre-wrap ${!accepted ? "line-through" : ""}`}>
          {change.tailored}
        </p>
      </div>

      <div className="flex items-start gap-1.5">
        <Lightbulb className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-400 italic">{change.reason}</p>
      </div>
    </div>
  );
}

export default function ResumeTailorSheet({
  job,
  jobDescription: externalJD,
  profile,
  plan,
  open,
  onOpenChange,
}: ResumeTailorSheetProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [jdInput, setJdInput] = useState("");
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [animated, setAnimated] = useState(false);
  const [acceptedChanges, setAcceptedChanges] = useState<boolean[]>([]);
  const [copied, setCopied] = useState(false);

  const jdText =
    externalJD ||
    (job
      ? [job.title, job.company_name, job.description_snippet, job.tags?.join(", "), job.salary, job.location, job.job_type]
          .filter(Boolean)
          .join("\n")
      : "");

  const effectiveJD = jdText || jdInput;

  useEffect(() => {
    if (!open) {
      setPhase("input");
      setJdInput("");
      setResult(null);
      setError(null);
      setActiveStep(0);
      setAnimated(false);
      setAcceptedChanges([]);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && jdText) {
      setJdInput(jdText);
    }
  }, [open, jdText]);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const handleTailor = useCallback(async () => {
    if (effectiveJD.length < 50) return;

    const resumeContent = buildResumeFromProfile(profile, plan);
    if (!resumeContent.trim()) {
      setError("No resume content available. Please complete your profile first.");
      return;
    }

    setPhase("processing");
    setError(null);
    setActiveStep(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    STEP_TIMINGS.forEach((ms, i) => {
      if (i > 0) {
        timers.push(setTimeout(() => setActiveStep(i), ms));
      }
    });

    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContent,
          jobDescription: effectiveJD.slice(0, 6000),
          profile: {
            name: profile.name,
            email: profile.email,
            currentTitle: profile.currentTitle,
            skills: profile.skills,
            transferableSkills: profile.transferableSkills,
            experience: profile.experience,
            education: profile.education,
            certifications: profile.certifications,
          },
        }),
      });

      timers.forEach(clearTimeout);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Tailoring failed");
      }

      const data: TailorResponse = await res.json();
      setResult(data);
      setAcceptedChanges(new Array(data.changes.length).fill(true));
      setActiveStep(4);
      setPhase("results");
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "Failed to tailor resume. Please try again.");
      setPhase("input");
    }
  }, [effectiveJD, profile, plan]);

  function toggleChange(index: number) {
    setAcceptedChanges((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function acceptAll() {
    setAcceptedChanges(new Array(result?.changes.length ?? 0).fill(true));
  }

  function rejectAll() {
    setAcceptedChanges(new Array(result?.changes.length ?? 0).fill(false));
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.tailoredContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setPhase("input");
    setResult(null);
    setError(null);
    setActiveStep(0);
    setAnimated(false);
    setAcceptedChanges([]);
  }

  async function handleDownload() {
    if (!result) return;
    try {
      await downloadPdf(
        "/api/resume/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: result.tailoredContent, targetRole: "Tailored Resume" }),
        },
        "tailored-resume.pdf",
      );
    } catch {
      navigator.clipboard.writeText(result.tailoredContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const acceptedCount = acceptedChanges.filter(Boolean).length;
  const totalChanges = result?.changes.length ?? 0;
  const hasResume = profile.skills?.length > 0;

  const scoreDelta = result ? result.tailoredScore.score - result.originalScore.score : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-slate-900 border-slate-700 p-0 flex flex-col h-screen md:h-full"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-teal-400" />
            <SheetTitle className="text-white">Tailor Your Resume</SheetTitle>
          </div>
          <SheetDescription className="text-slate-400 text-sm">
            {job
              ? `Optimize your resume for ${job.title} at ${job.company_name}`
              : "Paste a job description to optimize your resume for ATS compatibility."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-6">
            {/* No resume state */}
            {!hasResume && (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-white mb-1">Generate a resume first</p>
                <p className="text-xs text-slate-400 mb-4">
                  You need a base resume before tailoring.
                </p>
                <a
                  href="/resume-generator"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Create Resume
                </a>
              </div>
            )}

            {/* Phase 1: JD Input */}
            {hasResume && phase === "input" && (
              <>
                <div>
                  <textarea
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    placeholder="Paste job description here..."
                    rows={8}
                    maxLength={6000}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className={`text-[10px] ${
                        jdInput.length >= 50 ? "text-slate-500" : "text-slate-600"
                      }`}
                    >
                      {jdInput.length}/6000
                    </span>
                    {jdInput.length > 0 && jdInput.length < 50 && (
                      <span className="text-[10px] text-amber-400">
                        Minimum 50 characters
                      </span>
                    )}
                  </div>
                </div>

                {job && (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                    <p className="text-sm font-medium text-white">{job.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {job.company_name}
                      {job.location && ` · ${job.location}`}
                      {job.matchScore > 0 && ` · ${job.matchScore}% match`}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </>
            )}

            {/* Phase 2: Processing */}
            {phase === "processing" && (
              <>
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                  <ProcessingStepper activeStep={activeStep} />
                </div>

                {result?.jdAnalysis && (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                    <p className="text-sm font-medium text-white">
                      {result.jdAnalysis.roleTitle} · {result.jdAnalysis.seniorityLevel}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {result.jdAnalysis.industry} · {result.jdAnalysis.requiredSkills.length} required skills identified
                    </p>
                  </div>
                )}

                {/* Shimmer skeletons */}
                <div className="space-y-3 animate-pulse">
                  <div className="h-20 bg-slate-800/40 rounded-xl" />
                  <div className="h-12 bg-slate-800/30 rounded-lg" />
                  <div className="h-12 bg-slate-800/20 rounded-lg" />
                </div>
              </>
            )}

            {/* Phase 3: Results */}
            {phase === "results" && result && (
              <>
                {/* Score comparison banner */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                  <div className="flex items-center justify-center gap-4 md:gap-6">
                    <div className="text-center">
                      <ScoreRing
                        score={result.originalScore.score}
                        animated={animated}
                        label="Before"
                        size={96}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight className="h-5 w-5 text-teal-400" />
                    </div>

                    <div className="text-center">
                      <ScoreRing
                        score={result.tailoredScore.score}
                        animated={animated}
                        label="After"
                        size={96}
                      />
                    </div>
                  </div>

                  {animated && (
                    <div className="text-center mt-3 transition-all duration-300 ease-out">
                      <Badge
                        className={`text-sm font-bold px-3 py-1 ${
                          scoreDelta >= 10
                            ? "bg-emerald-900/40 border-emerald-600/30 text-emerald-300"
                            : "bg-amber-900/40 border-amber-600/30 text-amber-300"
                        }`}
                      >
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        +{scoreDelta} pts
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview">
                  <TabsList className="bg-slate-800/60 border border-slate-700/60 w-full">
                    <TabsTrigger value="overview" className="flex-1 text-xs">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="changes" className="flex-1 text-xs">
                      Changes ({totalChanges})
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1 text-xs">
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-4 space-y-5">
                    {/* Required Skills */}
                    {result.jdAnalysis.requiredSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.jdAnalysis.requiredSkills.map((skill) => {
                            const matched =
                              result.tailoredScore.keywordMatches.some(
                                (k) => k.toLowerCase() === skill.toLowerCase()
                              );
                            return (
                              <Badge
                                key={skill}
                                className={`text-[10px] ${
                                  matched
                                    ? "bg-emerald-900/40 border-emerald-600/30 text-emerald-300"
                                    : "bg-red-900/30 border-red-700/30 text-red-300"
                                }`}
                              >
                                {matched ? (
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                ) : (
                                  <XCircle className="h-2.5 w-2.5 mr-1" />
                                )}
                                {skill}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Preferred Skills */}
                    {result.jdAnalysis.preferredSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Preferred Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.jdAnalysis.preferredSkills.map((skill) => {
                            const matched =
                              result.tailoredScore.keywordMatches.some(
                                (k) => k.toLowerCase() === skill.toLowerCase()
                              );
                            return (
                              <Badge
                                key={skill}
                                className={`text-[10px] ${
                                  matched
                                    ? "bg-emerald-900/40 border-emerald-600/30 text-emerald-300"
                                    : "bg-red-900/30 border-red-700/30 text-red-300"
                                }`}
                              >
                                {matched ? (
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                ) : (
                                  <XCircle className="h-2.5 w-2.5 mr-1" />
                                )}
                                {skill}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section Scores */}
                    {result.tailoredScore.sectionScores.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Section Scores
                        </p>
                        <div className="space-y-2.5">
                          {result.tailoredScore.sectionScores.map((section) => {
                            const origSection = result.originalScore.sectionScores.find(
                              (s) => s.section === section.section
                            );
                            const origScore = origSection?.score ?? 0;
                            const improved = section.score > origScore;
                            return (
                              <div key={section.section}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-300">{section.section}</span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    {origScore} → {section.score}
                                    {improved && <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />}
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative">
                                  <div
                                    className="absolute inset-y-0 left-0 bg-slate-500 rounded-full transition-all duration-500"
                                    style={{ width: `${origScore}%` }}
                                  />
                                  <div
                                    className="absolute inset-y-0 left-0 bg-teal-500 rounded-full transition-all duration-500"
                                    style={{ width: `${section.score}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Keywords Added */}
                    {result.originalScore.missingKeywords.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Keywords Added
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.originalScore.missingKeywords
                            .filter((kw) =>
                              result.tailoredScore.keywordMatches.some(
                                (m) => m.toLowerCase() === kw.toLowerCase()
                              )
                            )
                            .map((kw) => (
                              <Badge
                                key={kw}
                                className="bg-teal-900/40 border-teal-700/40 text-teal-300 text-[10px]"
                              >
                                + {kw}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Changes Tab */}
                  <TabsContent value="changes" className="mt-4 space-y-3">
                    {/* Bulk actions bar */}
                    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border border-slate-700/60 rounded-lg px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {acceptedCount}/{totalChanges} changes accepted
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={acceptAll}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          Accept All
                        </button>
                        <span className="text-slate-600">·</span>
                        <button
                          onClick={rejectAll}
                          className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors"
                        >
                          Reject All
                        </button>
                      </div>
                    </div>

                    {result.changes.map((change, i) => (
                      <ChangeCard
                        key={i}
                        change={change}
                        accepted={acceptedChanges[i] ?? true}
                        onToggle={() => toggleChange(i)}
                      />
                    ))}
                  </TabsContent>

                  {/* Preview Tab */}
                  <TabsContent value="preview" className="mt-4">
                    <p className="text-[10px] text-slate-500 mb-3">
                      Live preview — reflects your accepted changes
                    </p>
                    <div className="bg-white/5 border border-slate-700/40 rounded-xl p-6 font-serif">
                      <div className="prose prose-sm prose-invert max-w-none text-slate-200 whitespace-pre-wrap text-xs leading-relaxed">
                        {result.tailoredContent}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-slate-700/60 shrink-0">
          {phase === "input" && hasResume && (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleTailor}
                disabled={effectiveJD.length < 50}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Analyze &amp; Tailor
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {phase === "processing" && (
            <div className="flex items-center justify-center w-full gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
              Optimizing your resume…
            </div>
          )}

          {phase === "results" && (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-slate-500 hover:text-slate-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
