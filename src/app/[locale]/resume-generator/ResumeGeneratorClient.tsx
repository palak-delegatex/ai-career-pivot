"use client";

import { useState, useEffect, useRef } from "react";
import NextStepCTA from "@/components/NextStepCTA";
import {
  FileText,
  Mail,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  Pencil,
  Save,
} from "lucide-react";
import Link from "next/link";

type Mode = "resume" | "cover-letter";
type Phase = "setup" | "generating" | "done";
type Tone = "professional" | "conversational" | "bold";

const POPULAR_ROLES = [
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "Software Engineer",
  "Marketing Manager",
  "Operations Manager",
  "Data Scientist",
  "Project Manager",
];

const TONES: { key: Tone; label: string }[] = [
  { key: "professional", label: "Professional" },
  { key: "conversational", label: "Conversational" },
  { key: "bold", label: "Bold" },
];

function renderMarkdownBasic(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} className="text-2xl font-extrabold mt-6 mb-2 text-white">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="text-lg font-bold mt-5 mb-2 text-teal-400 border-b border-slate-700/60 pb-1">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} className="text-sm font-bold mt-3 mb-1 text-slate-200">
          {line.slice(4)}
        </h3>
      );
    } else if (line.match(/^[-*] /)) {
      const formatted = line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      nodes.push(
        <li
          key={key++}
          className="ml-4 text-sm leading-relaxed list-disc text-slate-300"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={key++} className="h-2" />);
    } else {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      nodes.push(
        <p
          key={key++}
          className="text-sm leading-relaxed text-slate-300"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    }
  }
  return <>{nodes}</>;
}

export default function ResumeGeneratorClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("resume");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_result");
      if (raw) {
        const data = JSON.parse(raw);
        const p = data.profile ?? data;
        if (p.skills?.length) {
          setProfile(p);
          setProfileLoaded(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (scrollRef.current && phase === "generating") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, phase]);

  async function generate() {
    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    if (!role || !profile) return;

    setPhase("generating");
    setOutput("");
    setEditing(false);

    try {
      const res = await fetch("/api/resume-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          targetRole: role,
          jobDescription: jobDescription.trim() || undefined,
          tone: mode === "cover-letter" ? tone : undefined,
          profile,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setOutput(content);
      }

      setOutput(content);
      setPhase("done");

      if (mode === "cover-letter") {
        saveCoverLetterToSupabase(content, role);
      }
    } catch {
      setOutput("Sorry, something went wrong. Please try again.");
      setPhase("done");
    }
  }

  async function saveCoverLetterToSupabase(content: string, role: string) {
    const email = (profile as Record<string, unknown>)?.email as string | undefined;
    if (!email) return;

    setSaving(true);
    try {
      await fetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          title: `Cover Letter for ${role}`,
          targetRole: role,
          tone,
          content,
        }),
      });
    } catch {
      // Silent failure — localStorage backup via document-store still works
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard() {
    const text = editing ? editContent : output;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setPhase("setup");
    setOutput("");
    setEditing(false);
  }

  function switchMode() {
    const newMode = mode === "resume" ? "cover-letter" : "resume";
    setMode(newMode);
    setPhase("setup");
    setOutput("");
    setEditing(false);
  }

  async function handleDownloadPdf() {
    const content = editing ? editContent : output;
    if (!content) return;
    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    try {
      const res = await fetch("/api/resume/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          targetRole: role,
          name: (profile as Record<string, unknown>)?.name as string,
          type: mode,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix = mode === "resume" ? "Resume" : "CoverLetter";
      a.download = `${prefix}_${role.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      copyToClipboard();
    }
  }

  function startEditing() {
    setEditContent(output);
    setEditing(true);
  }

  function saveEdit() {
    setOutput(editContent);
    setEditing(false);
  }

  const displayRole = targetRole === "custom" ? customRole : targetRole;

  if (phase === "generating" || phase === "done") {
    return (
      <main className="flex flex-col h-[calc(100vh-72px)]">
        <header className="shrink-0 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mode === "resume" ? (
                <FileText className="w-5 h-5 text-teal-400" />
              ) : (
                <Mail className="w-5 h-5 text-purple-400" />
              )}
              <div>
                <h1 className="text-sm font-bold text-white">
                  {mode === "resume" ? "Resume" : "Cover Letter"} Generator
                </h1>
                <p className="text-xs text-slate-400">
                  {displayRole}
                  {jobDescription.trim() && " · JD-tailored"}
                  {mode === "cover-letter" && ` · ${tone}`}
                  {saving && " · Saving..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {phase === "done" && (
                <>
                  {!editing && (
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {editing && (
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Done
                    </button>
                  )}
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    New
                  </button>
                </>
              )}
              {phase === "generating" && (
                <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
              )}
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 min-h-[400px]">
              {editing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[500px] bg-transparent text-sm text-slate-300 font-sans leading-relaxed resize-y focus:outline-none"
                />
              ) : output ? (
                renderMarkdownBasic(output)
              ) : (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                </div>
              )}
            </div>

            {phase === "done" && !editing && (
              <div className="mt-6">
                <div className="flex justify-center mb-4">
                  <button
                    onClick={switchMode}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      mode === "resume"
                        ? "bg-purple-600 hover:bg-purple-500"
                        : "bg-teal-600 hover:bg-teal-500"
                    }`}
                  >
                    {mode === "resume"
                      ? "Now Generate Cover Letter →"
                      : "Now Generate Resume →"}
                  </button>
                </div>
                <NextStepCTA fromTool="resume-generator" />
                <div className="flex justify-center mt-4">
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Setup screen
  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          <FileText className="w-3.5 h-3.5" />
          AI Resume & Cover Letter
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          Generate Application Materials
        </h1>
        <p className="text-slate-400 leading-relaxed">
          ATS-optimized resume and tailored cover letter from your career
          profile, in seconds.
        </p>
      </div>

      {!profileLoaded && (
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-6 text-sm">
          <p className="text-amber-300 font-semibold mb-1">Profile not loaded</p>
          <p className="text-slate-400">
            Complete the{" "}
            <Link href="/onboarding" className="text-teal-400 hover:text-teal-300 underline">
              career assessment
            </Link>{" "}
            first to generate personalized materials.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Mode toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            What to Generate
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("resume")}
              className={`px-4 py-3.5 rounded-xl text-left transition-colors ${
                mode === "resume"
                  ? "bg-teal-600/20 border-2 border-teal-500 text-white"
                  : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-semibold">Resume</span>
              </div>
              <p className="text-xs text-slate-500">ATS-optimized, tailored to role</p>
            </button>
            <button
              onClick={() => setMode("cover-letter")}
              className={`px-4 py-3.5 rounded-xl text-left transition-colors ${
                mode === "cover-letter"
                  ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                  : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-semibold">Cover Letter</span>
              </div>
              <p className="text-xs text-slate-500">Compelling pivot narrative</p>
            </button>
          </div>
        </div>

        {/* Target role */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Target Role
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {POPULAR_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  targetRole === role
                    ? "bg-teal-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
            <button
              onClick={() => setTargetRole("custom")}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                targetRole === "custom"
                  ? "bg-teal-600 text-white"
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
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              autoFocus
            />
          )}
        </div>

        {/* Tone selector — cover letter mode only */}
        {mode === "cover-letter" && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Tone
            </label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium text-center transition-colors ${
                    tone === t.key
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Optional JD */}
        <div>
          <button
            onClick={() => setShowJd(!showJd)}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            Tailor to a job description
            <span className="text-xs text-slate-500 font-normal">(recommended)</span>
            {showJd ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showJd && (
            <div className="mt-3 space-y-2">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting — we'll mirror its keywords and priorities..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
              />
              {jobDescription.trim() && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <FileText className="w-3 h-3" />
                  JD loaded — output will be tailored
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={generate}
          disabled={!targetRole || (targetRole === "custom" && !customRole.trim()) || !profileLoaded}
          className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === "resume"
              ? "bg-teal-600 hover:bg-teal-500 shadow-teal-900/30"
              : "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30"
          }`}
        >
          Generate {mode === "resume" ? "Resume" : "Cover Letter"} →
        </button>

        <p className="text-slate-500 text-xs text-center">
          Streams in real time · Edit, copy, or download PDF when done
        </p>
      </div>
    </main>
  );
}
