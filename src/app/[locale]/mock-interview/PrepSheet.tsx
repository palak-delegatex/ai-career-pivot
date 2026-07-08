"use client";

import { useState } from "react";
import {
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  Building2,
  HelpCircle,
  MessageSquareText,
  Lightbulb,
} from "lucide-react";
import NextStepCTA from "@/components/NextStepCTA";
import type { InterviewPrepResult } from "@/app/api/interview-prep/route";

type PrepType = "behavioral" | "technical" | "mixed";

const POPULAR_ROLES = [
  "Product Manager", "Data Analyst", "UX Designer", "Software Engineer",
  "Marketing Manager", "Operations Manager", "Sales Manager", "Data Scientist",
];

const PREP_TYPES: { value: PrepType; label: string; desc: string }[] = [
  { value: "mixed", label: "Mixed", desc: "Balanced across all areas" },
  { value: "behavioral", label: "Behavioral", desc: "STAR stories & culture-fit" },
  { value: "technical", label: "Technical", desc: "Role-specific depth" },
];

const CATEGORY_STYLES: Record<string, string> = {
  behavioral: "bg-purple-600/20 text-purple-300 border-purple-600/30",
  technical: "bg-sky-600/20 text-sky-300 border-sky-600/30",
  situational: "bg-amber-600/20 text-amber-300 border-amber-600/30",
  "role-specific": "bg-teal-600/20 text-teal-300 border-teal-600/30",
  "culture-fit": "bg-rose-600/20 text-rose-300 border-rose-600/30",
  competency: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30",
};

export default function PrepSheet() {
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [interviewType, setInterviewType] = useState<PrepType>("mixed");
  const [jobDescription, setJobDescription] = useState("");
  const [showJd, setShowJd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InterviewPrepResult | null>(null);
  const [openCards, setOpenCards] = useState<Set<number>>(new Set([0]));

  const role = targetRole === "custom" ? customRole.trim() : targetRole;

  const toggleCard = (i: number) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const generate = async () => {
    if (!role) {
      setError("Please choose or enter a target role.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role,
          companyName: companyName.trim() || undefined,
          interviewType,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate your prep sheet. Please try again.");
      }
      const data: InterviewPrepResult = await res.json();
      setResult(data);
      setOpenCards(new Set([0]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-4 mb-8 print:mb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              {role} — Interview Prep Sheet
            </h1>
            {companyName.trim() && (
              <p className="text-slate-400 text-sm">Tailored for {companyName.trim()}</p>
            )}
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              New sheet
            </button>
          </div>
        </div>

        <section className="mb-8 p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center gap-2 text-purple-300 text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" /> What the interviewer is looking for
          </div>
          <p className="text-slate-300 leading-relaxed text-sm">{result.roleSummary}</p>
        </section>

        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          {result.questions.length} Likely Questions
        </h2>
        <div className="space-y-3 mb-10">
          {result.questions.map((q, i) => {
            const open = openCards.has(i);
            return (
              <div key={i} className="rounded-2xl bg-slate-800/50 border border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleCard(i)}
                  className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex-1">
                    <span
                      className={`inline-block mb-2 px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                        CATEGORY_STYLES[q.category] || "bg-slate-700 text-slate-300 border-slate-600"
                      }`}
                    >
                      {q.category.replace("-", " ")}
                    </span>
                    <p className="font-semibold text-white leading-snug">{q.question}</p>
                  </div>
                  {open ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                  )}
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-1 space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Why they ask</p>
                      <p className="text-slate-300 leading-relaxed">{q.whyAsked}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Model answer</p>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-line">{q.suggestedAnswer}</p>
                    </div>
                    {q.keyPoints.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Hit these points</p>
                        <ul className="space-y-1">
                          {q.keyPoints.map((pt, j) => (
                            <li key={j} className="flex gap-2 text-slate-300 leading-relaxed">
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {q.followUps.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Likely follow-ups</p>
                        <ul className="space-y-1">
                          {q.followUps.map((f, j) => (
                            <li key={j} className="flex gap-2 text-slate-400 leading-relaxed">
                              <span className="text-slate-500 mt-0.5">↳</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-10">
          <section className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 text-teal-300 text-sm font-semibold mb-3">
              <Building2 className="w-4 h-4" /> Research before you go
            </div>
            <ul className="space-y-2">
              {result.companyResearchTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
                  <Lightbulb className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold mb-3">
              <MessageSquareText className="w-4 h-4" /> Ask the interviewer
            </div>
            <ul className="space-y-3">
              {result.closingQuestions.map((cq, i) => (
                <li key={i} className="text-sm">
                  <p className="text-slate-200 font-medium leading-snug">{cq.question}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{cq.purpose}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="print:hidden">
          <NextStepCTA fromTool="mock-interview" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-semibold mb-4">
          <FileText className="w-3.5 h-3.5" />
          Interview Prep Sheet
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Walk in Ready</h1>
        <p className="text-slate-400 leading-relaxed">
          Get 10–15 likely questions with model answers, company research tips, and smart
          questions to ask — printable for last-minute review.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Target Role</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {POPULAR_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setTargetRole(r)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  targetRole === r
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setTargetRole("custom")}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                targetRole === "custom"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Other role…
            </button>
          </div>
          {targetRole === "custom" && (
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. DevRel Engineer, Customer Success Manager"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Company <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Stripe"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Focus</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PREP_TYPES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setInterviewType(value)}
                className={`px-3 py-3 rounded-xl text-left transition-colors ${
                  interviewType === value
                    ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                    : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="text-sm font-semibold mb-0.5">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowJd(!showJd)}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            Paste the job description
            <span className="text-slate-500 font-normal">(optional — sharpens questions)</span>
            {showJd ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showJd && (
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job posting here…"
              rows={5}
              className="mt-3 w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            />
          )}
        </div>

        {error && (
          <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Building your prep sheet…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Generate Prep Sheet
            </>
          )}
        </button>
      </div>
    </main>
  );
}
