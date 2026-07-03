"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
  GripVertical,
  Target,
  XCircle,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { PivotPlan, UserProfile, SkillGap } from "@/lib/intake";
import { saveDocument } from "@/lib/document-store";
import UpgradePrompt from "@/components/UpgradePrompt";
import { ScoreRing } from "@/components/ScoreRing";
import type { KeywordMatchResult, RewriteSuggestion } from "@/app/api/resume/keyword-match/route";

type Template = "professional" | "modern" | "minimal";

interface ResumeGeneratorSheetProps {
  plan: PivotPlan;
  profile: UserProfile;
  children: React.ReactNode;
}

function skillTransferCategory(gap: SkillGap): "direct" | "partial" | "new" {
  if (gap.transferCategory === "direct-transfer") return "direct";
  if (gap.transferCategory === "partial-transfer") return "partial";
  if (gap.transferCategory === "new-skill") return "new";
  const score = gap.transferabilityScore ?? 0;
  if (score >= 70) return "direct";
  if (score >= 40) return "partial";
  return "new";
}

const TRANSFER_STYLES = {
  direct: { label: "Direct Transfer", className: "bg-emerald-900/40 border-emerald-600/30 text-emerald-300" },
  partial: { label: "Partial", className: "bg-amber-900/40 border-amber-600/30 text-amber-300" },
  new: { label: "New Skill", className: "bg-red-900/30 border-red-600/30 text-red-300" },
};

const TEMPLATES: { key: Template; name: string; desc: string }[] = [
  { key: "professional", name: "Professional", desc: "Clean ATS-friendly layout" },
  { key: "modern", name: "Modern", desc: "Contemporary with subtle design" },
  { key: "minimal", name: "Minimal", desc: "Streamlined and concise" },
];

function SuggestionCard({
  suggestion,
  applied,
  onToggle,
}: {
  suggestion: RewriteSuggestion;
  applied: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-lg p-3 transition-all duration-150 ${
        applied
          ? "border-teal-600/40 bg-teal-900/10"
          : "border-slate-700/60 bg-slate-800/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge className="bg-slate-700/60 border-slate-600/40 text-slate-300 text-[9px] shrink-0">
            {suggestion.section}
          </Badge>
          <div className="flex flex-wrap gap-1">
            {suggestion.keywordsAdded.map((kw) => (
              <Badge
                key={kw}
                className="bg-teal-900/40 border-teal-700/40 text-teal-300 text-[9px]"
              >
                + {kw}
              </Badge>
            ))}
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`px-2 py-1 text-[10px] font-medium rounded border transition-all duration-150 shrink-0 ${
            applied
              ? "bg-teal-900/40 hover:bg-teal-800/50 text-teal-300 border-teal-700/40"
              : "bg-slate-700/40 hover:bg-slate-600/40 text-slate-400 border-slate-600/40"
          }`}
        >
          {applied ? "Applied" : "Apply"}
        </button>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-400 transition-colors mb-1.5"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Original
      </button>
      {expanded && (
        <div className="bg-slate-800/60 border-l-2 border-slate-600 px-3 py-2 rounded-r mb-2">
          <p className="text-[11px] text-slate-400 whitespace-pre-wrap">{suggestion.originalBullet}</p>
        </div>
      )}

      <div className="bg-slate-800/60 border-l-2 border-teal-600 px-3 py-2 rounded-r mb-2">
        <p className="text-[11px] text-slate-200 whitespace-pre-wrap">{suggestion.rewrittenBullet}</p>
      </div>

      <div className="flex items-start gap-1.5">
        <Lightbulb className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-400 italic">{suggestion.reason}</p>
      </div>
    </div>
  );
}

export default function ResumeGeneratorSheet({ plan, profile, children }: ResumeGeneratorSheetProps) {
  const allSkills = [
    ...profile.transferableSkills.map((s) => ({ skill: s, category: "direct" as const })),
    ...(plan.skillGaps ?? []).map((g) => ({ skill: g.skill, category: skillTransferCategory(g) })),
  ];
  const uniqueSkills = allSkills.filter(
    (s, i, arr) => arr.findIndex((x) => x.skill.toLowerCase() === s.skill.toLowerCase()) === i
  );

  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    () => new Set(uniqueSkills.filter((s) => s.category !== "new").map((s) => s.skill))
  );
  const [includedExperience, setIncludedExperience] = useState<Set<number>>(
    () => new Set(profile.experience.map((_, i) => i))
  );
  const [template, setTemplate] = useState<Template>("professional");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [upgradeNeeded, setUpgradeNeeded] = useState<{ message: string; url: string } | null>(null);

  // Job description keyword matching state
  const [jobDescription, setJobDescription] = useState("");
  const [keywordResult, setKeywordResult] = useState<KeywordMatchResult | null>(null);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<boolean[]>([]);
  const [showKeywordPanel, setShowKeywordPanel] = useState(true);
  const [scoreAnimated, setScoreAnimated] = useState(false);

  useEffect(() => {
    if (keywordResult) {
      const timer = setTimeout(() => setScoreAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [keywordResult]);

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }, []);

  const toggleExperience = useCallback((index: number) => {
    setIncludedExperience((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleSuggestion = useCallback((index: number) => {
    setAppliedSuggestions((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  async function runKeywordMatch(resumeContent: string) {
    if (!jobDescription.trim() || jobDescription.length < 50) return;

    setKeywordLoading(true);
    setKeywordResult(null);
    setScoreAnimated(false);

    try {
      const res = await fetch("/api/resume/keyword-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContent,
          jobDescription: jobDescription.slice(0, 6000),
        }),
      });

      if (res.ok) {
        const data: KeywordMatchResult = await res.json();
        setKeywordResult(data);
        setAppliedSuggestions(new Array(data.suggestions.length).fill(false));
      }
    } catch {
      // Keyword matching is optional — don't block the resume flow
    } finally {
      setKeywordLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    setKeywordResult(null);
    setScoreAnimated(false);
    try {
      const res = await fetch("/api/resume-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "resume",
          targetRole: plan.targetRole,
          template,
          jobDescription: jobDescription.trim() || undefined,
          profile: {
            name: profile.name,
            email: profile.email,
            currentTitle: profile.currentTitle,
            skills: [...selectedSkills],
            transferableSkills: profile.transferableSkills.filter((s) => selectedSkills.has(s)),
            experience: profile.experience.filter((_, i) => includedExperience.has(i)),
            education: profile.education,
            certifications: profile.certifications,
          },
          plan: {
            targetRole: plan.targetRole,
            targetIndustry: plan.targetIndustry,
            skillGaps: plan.skillGaps,
          },
        }),
      });

      if (res.status === 401 || res.status === 402) {
        const data = await res.json().catch(() => ({}));
        setUpgradeNeeded({ message: data.error ?? "Upgrade required", url: data.upgradeUrl ?? "/pricing" });
        setGenerating(false);
        return;
      }

      if (!res.ok) throw new Error("Generation failed");

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

      saveDocument({
        type: "resume",
        title: `Resume for ${plan.targetRole}`,
        targetRole: plan.targetRole,
        content: text,
      });

      // Auto-run keyword matching if JD was provided
      if (jobDescription.trim() && jobDescription.length >= 50) {
        runKeywordMatch(text);
      }
    } catch {
      setResult("Failed to generate resume. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;
    try {
      const res = await fetch("/api/resume/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result,
          targetRole: plan.targetRole,
          name: profile.name,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resume_${plan.targetRole.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      handleCopy();
    }
  }

  function handleReset() {
    setResult(null);
    setKeywordResult(null);
    setKeywordLoading(false);
    setAppliedSuggestions([]);
    setScoreAnimated(false);
  }

  const grouped = {
    direct: uniqueSkills.filter((s) => s.category === "direct"),
    partial: uniqueSkills.filter((s) => s.category === "partial"),
    new: uniqueSkills.filter((s) => s.category === "new"),
  };

  const appliedCount = appliedSuggestions.filter(Boolean).length;
  const hasJD = jobDescription.trim().length >= 50;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<>{children}</>} />
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-w-full bg-slate-900 border-slate-700 p-0 flex flex-col max-h-[90vh] rounded-t-2xl"
            : "w-[540px] md:w-[640px] max-w-full md:max-w-[640px] bg-slate-900 border-slate-700 p-0 flex flex-col h-screen md:h-full"
        }
      >
        {isMobile && <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2 mb-1 shrink-0" />}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <SheetTitle className="text-white">Resume for {plan.targetRole}</SheetTitle>
          </div>
          <SheetDescription>
            <Badge className="bg-teal-900/40 border-teal-700/40 text-teal-300 text-[10px]">
              {profile.currentTitle ?? "Career"} &rarr; {plan.targetRole}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            {!result ? (
              <Accordion type="multiple" defaultValue={["skills", "experience", "style", "job-description"]}>
                {/* Job Description Section */}
                <AccordionItem value="job-description">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-teal-400" />
                      Tailor to Job Posting
                    </div>
                    {hasJD && (
                      <Badge className="ml-auto mr-2 bg-teal-900/40 border-teal-700/40 text-teal-300 text-[9px]">
                        Active
                      </Badge>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-slate-400 mb-3">
                      Paste a job description to get keyword matching, ATS scoring, and tailored rewrite suggestions.
                    </p>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste job description here..."
                      rows={5}
                      maxLength={6000}
                      className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[10px] ${jobDescription.length >= 50 ? "text-slate-500" : "text-slate-600"}`}>
                        {jobDescription.length}/6000
                      </span>
                      {jobDescription.length > 0 && jobDescription.length < 50 && (
                        <span className="text-[10px] text-amber-400">Minimum 50 characters</span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Skills Section */}
                <AccordionItem value="skills">
                  <AccordionTrigger>
                    Included Skills
                    <span className="ml-auto mr-2 text-xs text-slate-500 font-normal">
                      {selectedSkills.size}/{uniqueSkills.length}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {(["direct", "partial", "new"] as const).map((cat) => {
                      const items = grouped[cat];
                      if (items.length === 0) return null;
                      const style = TRANSFER_STYLES[cat];
                      return (
                        <div key={cat} className="mb-3">
                          <p className="text-xs font-medium text-slate-500 mb-2">{style.label}</p>
                          <div className="space-y-2">
                            {items.map((s) => (
                              <label
                                key={s.skill}
                                className="flex items-center gap-2.5 cursor-pointer group"
                              >
                                <Checkbox
                                  checked={selectedSkills.has(s.skill)}
                                  onCheckedChange={() => toggleSkill(s.skill)}
                                />
                                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                  {s.skill}
                                </span>
                                <Badge className={`ml-auto text-[9px] border ${style.className}`}>
                                  {style.label}
                                </Badge>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>

                {/* Experience Section */}
                <AccordionItem value="experience">
                  <AccordionTrigger>
                    Experience Highlights
                    <span className="ml-auto mr-2 text-xs text-slate-500 font-normal">
                      {includedExperience.size}/{profile.experience.length}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {profile.experience.map((exp, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                          <Checkbox
                            checked={includedExperience.has(i)}
                            onCheckedChange={() => toggleExperience(i)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                              <p className="text-sm text-slate-300 font-medium truncate">
                                {exp.title}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 ml-5.5">
                              {exp.company} &middot; {exp.startYear}&ndash;{exp.endYear ?? "Present"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Style Section */}
                <AccordionItem value="style">
                  <AccordionTrigger>Style &amp; Format</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-3">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setTemplate(t.key)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            template === t.key
                              ? "border-teal-500 bg-teal-900/20"
                              : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                          }`}
                        >
                          <div className="w-full aspect-[3/4] rounded bg-slate-700/50 mb-2 flex items-center justify-center">
                            <FileText className={`h-6 w-6 ${template === t.key ? "text-teal-400" : "text-slate-500"}`} />
                          </div>
                          <p className={`text-xs font-medium ${template === t.key ? "text-teal-300" : "text-slate-400"}`}>
                            {t.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Resume Generated</span>
                </div>

                {/* Keyword Match Results */}
                {keywordLoading && (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                      <span className="text-sm text-slate-300">Analyzing keyword match against job posting...</span>
                    </div>
                  </div>
                )}

                {keywordResult && (
                  <div className="space-y-4">
                    {/* Score + Toggle */}
                    <button
                      onClick={() => setShowKeywordPanel(!showKeywordPanel)}
                      className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-left hover:border-slate-600/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ScoreRing
                            score={keywordResult.matchScore}
                            animated={scoreAnimated}
                            label="JD Match"
                            size={64}
                          />
                          <div>
                            <p className="text-sm font-medium text-white">
                              Keyword Match: {keywordResult.matchScore}%
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {keywordResult.matchedKeywords.length} matched · {keywordResult.missingKeywords.length} missing · {keywordResult.breakdown.requiredHit}/{keywordResult.breakdown.requiredTotal} required
                            </p>
                            {keywordResult.suggestions.length > 0 && keywordResult.projectedScore > keywordResult.matchScore && (
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-emerald-400" />
                                <span className="text-[11px] text-emerald-300">
                                  {keywordResult.suggestions.length} suggestions can improve to ~{keywordResult.projectedScore}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {showKeywordPanel ? (
                          <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                        )}
                      </div>
                    </button>

                    {showKeywordPanel && (
                      <div className="space-y-4">
                        {/* Matched Keywords */}
                        {keywordResult.matchedKeywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Matched Keywords
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {keywordResult.matchedKeywords.map((kw) => (
                                <Badge
                                  key={kw}
                                  className="bg-emerald-900/40 border-emerald-600/30 text-emerald-300 text-[10px]"
                                >
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Keywords */}
                        {keywordResult.missingKeywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Missing Keywords
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {keywordResult.missingKeywords.map((kw) => (
                                <Badge
                                  key={kw}
                                  className="bg-red-900/30 border-red-700/30 text-red-300 text-[10px]"
                                >
                                  <XCircle className="h-2.5 w-2.5 mr-1" />
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rewrite Suggestions */}
                        {keywordResult.suggestions.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                Suggested Rewrites
                              </p>
                              <span className="text-[10px] text-slate-500">
                                {appliedCount}/{keywordResult.suggestions.length} applied
                              </span>
                            </div>
                            <div className="space-y-2.5">
                              {keywordResult.suggestions.map((suggestion, i) => (
                                <SuggestionCard
                                  key={i}
                                  suggestion={suggestion}
                                  applied={appliedSuggestions[i] ?? false}
                                  onToggle={() => toggleSuggestion(i)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Resume Content */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
                    {result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {upgradeNeeded && (
          <div className="px-6 pb-4">
            <UpgradePrompt feature="resume builder" message={upgradeNeeded.message} upgradeUrl={upgradeNeeded.url} />
          </div>
        )}

        <SheetFooter className="px-6 py-4 border-t border-slate-700/60 shrink-0">
          {!result ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleGenerate}
                disabled={generating || selectedSkills.size === 0}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    {hasJD ? "Generate & Match Keywords" : "Generate Resume"}
                  </>
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleDownloadPdf}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Edit
              </button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
