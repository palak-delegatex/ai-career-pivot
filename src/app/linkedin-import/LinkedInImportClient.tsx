"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Copy,
  Check,
  Upload,
  LinkIcon,
  ClipboardPaste,
  Download,
  Pencil,
  Save,
  RotateCcw,
  FileText,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Award,
  User,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { downloadPdf } from "@/lib/pdf-download";

type InputMode = "url" | "paste" | "upload";
type Phase = "input" | "parsing" | "profile-review" | "generating" | "done";

interface ParsedProfile {
  name?: string;
  headline?: string;
  summary?: string;
  currentTitle?: string;
  currentIndustry?: string;
  yearsExperience?: number;
  skills: string[];
  transferableSkills: string[];
  experience: {
    title: string;
    company: string;
    startYear: number;
    endYear: number | null;
    description: string;
  }[];
  education: {
    degree: string;
    field: string;
    institution: string;
    year: number | null;
  }[];
  certifications: string[];
  interests: string[];
}

function renderMarkdownBasic(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      nodes.push(
        <h1
          key={key++}
          className="text-2xl font-extrabold mt-6 mb-2 text-white"
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2
          key={key++}
          className="text-lg font-bold mt-5 mb-2 text-teal-400 border-b border-slate-700/60 pb-1"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <h3
          key={key++}
          className="text-sm font-bold mt-3 mb-1 text-slate-200"
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.match(/^[-*] /)) {
      const formatted = line
        .slice(2)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
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

const INPUT_TABS: { key: InputMode; label: string; icon: typeof LinkIcon }[] = [
  { key: "url", label: "LinkedIn URL", icon: LinkIcon },
  { key: "paste", label: "Paste Profile", icon: ClipboardPaste },
  { key: "upload", label: "Upload Export", icon: Upload },
];

export default function LinkedInImportClient() {
  const [phase, setPhase] = useState<Phase>("input");
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [pastedData, setPastedData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current && phase === "generating") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, phase]);

  async function handleImport() {
    setError("");
    setPhase("parsing");

    try {
      let res: Response;

      if (inputMode === "upload" && file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/linkedin-import", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/linkedin-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            inputMode === "url"
              ? { linkedinUrl: linkedinUrl.trim() }
              : { pastedData: pastedData.trim() }
          ),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      setProfile(data.profile);
      setTargetRole(data.profile?.currentTitle || "");
      setPhase("profile-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setPhase("input");
    }
  }

  async function generateResume() {
    if (!profile) return;
    setPhase("generating");
    setOutput("");
    setEditing(false);

    try {
      const res = await fetch("/api/linkedin-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          profile,
          targetRole: targetRole.trim() || undefined,
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

      try {
        const existing = sessionStorage.getItem("intake_result");
        const merged = existing ? { ...JSON.parse(existing), ...profile } : profile;
        sessionStorage.setItem("intake_result", JSON.stringify({ profile: merged }));
      } catch {}
    } catch {
      setOutput("Sorry, something went wrong generating your resume. Please try again.");
      setPhase("done");
    }
  }

  function copyToClipboard() {
    const text = editing ? editContent : output;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setPhase("input");
    setOutput("");
    setEditing(false);
    setProfile(null);
  }

  async function handleDownloadPdf() {
    const content = editing ? editContent : output;
    if (!content) return;
    try {
      await downloadPdf(
        "/api/resume/pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            targetRole: targetRole || "General",
            name: profile?.name || "Resume",
            type: "resume",
          }),
        },
        `Resume-LinkedIn-Import-${Date.now()}.pdf`
      );
    } catch {}
  }

  const canImport =
    (inputMode === "url" && linkedinUrl.trim().length > 10) ||
    (inputMode === "paste" && pastedData.trim().length > 50) ||
    (inputMode === "upload" && file !== null);

  return (
    <main
      id="main-content"
      className="max-w-4xl mx-auto px-4 py-12 sm:py-16 min-h-screen"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 text-xs font-medium text-teal-400 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          LinkedIn to Resume
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Import LinkedIn Profile
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Import your LinkedIn profile to auto-generate an ATS-optimized resume
          draft in seconds. Paste your URL, profile data, or upload your LinkedIn
          data export.
        </p>
      </div>

      {/* Phase: Input */}
      {phase === "input" && (
        <div className="space-y-6">
          {/* Tab selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/60 border border-slate-700/50 w-fit mx-auto">
            {INPUT_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setInputMode(key);
                  setError("");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  inputMode === key
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-8">
            {inputMode === "url" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                />
                <p className="text-xs text-slate-500">
                  Your profile must be set to public for URL import to work.
                </p>
              </div>
            )}

            {inputMode === "paste" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Paste Your LinkedIn Profile Data
                </label>
                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder={`Paste your LinkedIn profile sections here:\n\nExperience:\nSoftware Engineer at Google (2020-Present)\n- Led migration of monolithic...\n\nEducation:\nBS Computer Science, Stanford University\n\nSkills:\nPython, TypeScript, React...`}
                  rows={10}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-y"
                />
                <p className="text-xs text-slate-500">
                  Copy sections from your LinkedIn profile page and paste them
                  here. Include Experience, Education, Skills, and any other
                  sections.
                </p>
              </div>
            )}

            {inputMode === "upload" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">
                  Upload LinkedIn Data Export
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropped = e.dataTransfer.files[0];
                    if (dropped) setFile(dropped);
                  }}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/40 p-8 cursor-pointer hover:border-teal-500/50 hover:bg-slate-800/60 transition-all"
                >
                  <Upload className="w-8 h-8 text-slate-400" />
                  {file ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-teal-400">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-slate-300">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        CSV, JSON, or TXT from LinkedIn data export
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.json,.txt,.zip"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Go to LinkedIn Settings → Data privacy → Get a copy of your
                  data → Select &quot;Connections&quot; and &quot;Profile&quot; →
                  Download.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!canImport}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Import Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>
              Already have a resume?{" "}
              <Link
                href="/resume-generator"
                className="text-teal-400 hover:text-teal-300"
              >
                Go to Resume Generator
              </Link>
            </p>
            <p>
              Want to optimize your LinkedIn profile?{" "}
              <Link
                href="/linkedin-optimizer"
                className="text-teal-400 hover:text-teal-300"
              >
                LinkedIn Optimizer
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Phase: Parsing */}
      {phase === "parsing" && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-sm text-slate-300">
            Analyzing your LinkedIn profile...
          </p>
          <p className="text-xs text-slate-500">
            Extracting experience, skills, education, and certifications
          </p>
        </div>
      )}

      {/* Phase: Profile Review */}
      {phase === "profile-review" && profile && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Profile Imported Successfully
                </h2>
                <p className="text-sm text-slate-400">
                  Review your extracted profile data below, then generate your
                  resume.
                </p>
              </div>
            </div>

            {/* Profile summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {profile.name && (
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Name
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium">
                    {profile.name}
                  </p>
                  {profile.headline && (
                    <p className="text-xs text-slate-400 mt-1">
                      {profile.headline}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Experience
                  </span>
                </div>
                <p className="text-sm text-white font-medium">
                  {profile.experience.length} position
                  {profile.experience.length !== 1 ? "s" : ""}
                </p>
                {profile.currentTitle && (
                  <p className="text-xs text-slate-400 mt-1">
                    Current: {profile.currentTitle}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Education
                  </span>
                </div>
                <p className="text-sm text-white font-medium">
                  {profile.education.length} degree
                  {profile.education.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Skills
                  </span>
                </div>
                <p className="text-sm text-white font-medium">
                  {profile.skills.length} skill
                  {profile.skills.length !== 1 ? "s" : ""} found
                </p>
                {profile.certifications.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    + {profile.certifications.length} certification
                    {profile.certifications.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Skills preview */}
            {profile.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                  Detected Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 20).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 20 && (
                    <span className="px-2.5 py-1 text-xs text-slate-500">
                      +{profile.skills.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Experience preview */}
            {profile.experience.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                  Work Experience
                </h3>
                <div className="space-y-2">
                  {profile.experience.map((exp, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-3"
                    >
                      <p className="text-sm font-medium text-white">
                        {exp.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {exp.company} · {exp.startYear}–
                        {exp.endYear ?? "Present"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target role input */}
            <div className="border-t border-slate-700/50 pt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Target Role{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Product Manager, Data Scientist, UX Designer"
                className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
              <p className="text-xs text-slate-500">
                Leave blank to generate a general resume based on your current
                profile, or specify a role to tailor the resume for a career
                pivot.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPhase("input")}
                className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Re-import
              </button>
              <button
                onClick={generateResume}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-teal-500/25 transition-all"
              >
                <FileText className="w-4 h-4" />
                Generate Resume Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase: Generating */}
      {phase === "generating" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
            <span className="text-sm text-slate-300">
              Generating your resume draft...
            </span>
          </div>
          <div
            ref={scrollRef}
            className="rounded-2xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-8 max-h-[70vh] overflow-y-auto"
          >
            {renderMarkdownBasic(output)}
          </div>
        </div>
      )}

      {/* Phase: Done */}
      {phase === "done" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-white">
                Resume draft ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                onClick={() => {
                  if (editing) {
                    setOutput(editContent);
                    setEditing(false);
                  } else {
                    setEditContent(output);
                    setEditing(true);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {editing ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <Pencil className="w-3.5 h-3.5" />
                )}
                {editing ? "Save" : "Edit"}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Import
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
            {editing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[400px] bg-transparent text-sm text-slate-200 font-mono outline-none resize-y"
              />
            ) : (
              renderMarkdownBasic(output)
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/resume-generator"
              className="flex items-center justify-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-400 hover:bg-teal-500/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Tailor for a Specific Job
            </Link>
            <Link
              href="/linkedin-optimizer"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Optimize LinkedIn Profile
            </Link>
            <Link
              href="/ats-score"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Award className="w-4 h-4" />
              Check ATS Score
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
