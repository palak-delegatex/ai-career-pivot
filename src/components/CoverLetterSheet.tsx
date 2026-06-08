"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSignature, Download, Copy, RefreshCw, CheckCircle2 } from "lucide-react";
import type { EnrichedJob } from "@/lib/job-match";
import type { UserProfile, PivotPlan } from "@/lib/intake";
import { saveDocument } from "@/lib/document-store";

type Tone = "professional" | "conversational" | "bold";

const TONES: { key: Tone; name: string; desc: string }[] = [
  { key: "professional", name: "Professional", desc: "Formal and polished" },
  { key: "conversational", name: "Conversational", desc: "Warm and personable" },
  { key: "bold", name: "Bold", desc: "Confident and assertive" },
];

interface CoverLetterSheetProps {
  job: EnrichedJob;
  profile: UserProfile;
  plan: PivotPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CoverLetterSheet({
  job,
  profile,
  plan,
  open,
  onOpenChange,
}: CoverLetterSheetProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [keyPoints, setKeyPoints] = useState<string[]>(() => {
    const prefill = job.matchedSkills.slice(0, 3);
    while (prefill.length < 3) prefill.push("");
    return prefill;
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    try {
      const jd = [
        job.title,
        job.company_name,
        job.description_snippet,
        job.tags?.join(", "),
        job.salary,
        job.location,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/resume-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cover-letter",
          targetRole: job.title,
          jobDescription: jd,
          tone,
          profile: {
            name: profile.name,
            email: profile.email,
            currentTitle: profile.currentTitle,
            skills: [...profile.skills, ...keyPoints.filter(Boolean)],
            transferableSkills: profile.transferableSkills,
            experience: profile.experience,
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
        type: "cover-letter",
        title: `Cover Letter for ${job.title}`,
        targetRole: job.title,
        company: job.company_name,
        content: text,
      });
    } catch {
      setResult("Failed to generate cover letter. Please try again.");
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
          targetRole: job.title,
          name: profile.name,
          type: "cover-letter",
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CoverLetter_${job.company_name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      handleCopy();
    }
  }

  const missingSkills = (plan.skillGaps ?? [])
    .filter((g) => g.priority === "high")
    .map((g) => g.skill)
    .slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[540px] md:w-[640px] max-w-full md:max-w-[640px] bg-slate-900 border-slate-700 p-0 flex flex-col h-screen md:h-full"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-teal-400" />
            <SheetTitle className="text-white">
              Cover Letter for {job.title}
            </SheetTitle>
          </div>
          <SheetDescription>
            <span className="text-slate-400">{job.company_name}</span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-6">
            {!result ? (
              <>
                {/* Job Requirements */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Job Requirements
                  </h4>
                  <div className="space-y-2">
                    {job.matchedSkills.length > 0 && (
                      <div>
                        <p className="text-[10px] text-emerald-400 font-medium mb-1.5">Matched Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.matchedSkills.map((s) => (
                            <Badge
                              key={s}
                              className="bg-emerald-900/30 border-emerald-700/30 text-emerald-300 text-[10px]"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {missingSkills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-amber-400 font-medium mb-1.5">Skills to Address</p>
                        <div className="flex flex-wrap gap-1.5">
                          {missingSkills.map((s) => (
                            <Badge
                              key={s}
                              className="bg-amber-900/30 border-amber-700/30 text-amber-300 text-[10px]"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tone Selector */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Tone
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTone(t.key)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          tone === t.key
                            ? "border-teal-500 bg-teal-900/20"
                            : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                        }`}
                      >
                        <p className={`text-sm font-medium ${tone === t.key ? "text-teal-300" : "text-slate-400"}`}>
                          {t.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Points */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Key Points to Emphasize
                  </h4>
                  <div className="space-y-2">
                    {keyPoints.map((point, i) => (
                      <input
                        key={i}
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const next = [...keyPoints];
                          next[i] = e.target.value;
                          setKeyPoints(next);
                        }}
                        placeholder={`Key point ${i + 1} (optional)`}
                        className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">
                    Cover Letter Generated
                  </span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                  <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
                    {result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t border-slate-700/60 shrink-0">
          {!result ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenChange(false)}
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
                onClick={() => setResult(null)}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
