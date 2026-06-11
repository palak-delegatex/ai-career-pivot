"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileSignature,
  Loader2,
  Copy,
  Check,
  Download,
  RotateCcw,
  Save,
  Pencil,
  LinkIcon,
  FileText,
  Sparkles,
  ChevronRight,
  Plus,
  Bold,
  Italic,
  Underline,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import { ScoreRing } from "@/components/ScoreRing";
import { Badge } from "@/components/ui/badge";
import { saveDocument } from "@/lib/document-store";

type Phase = "setup" | "generating" | "done";
type Tone = "professional" | "conversational" | "bold";
type JobSource = "url" | "paste";

interface ResumeVersion {
  id: string;
  name: string;
  target_role: string | null;
  match_score: number | null;
  status: string;
  updated_at: string;
}

interface JobPreview {
  company: string;
  role: string;
  location: string;
  requirements: { text: string; type: "matched" | "transferable" | "missing" }[];
  matchScore: number;
}

const TONES: { key: Tone; label: string; desc: string }[] = [
  { key: "professional", label: "Professional", desc: "Formal & polished" },
  { key: "conversational", label: "Conversational", desc: "Warm & personable" },
  { key: "bold", label: "Bold", desc: "Confident & direct" },
];

const GENERATION_STEPS = [
  "Analyzing job requirements",
  "Mapping your skills",
  "Crafting narrative",
  "Polishing output",
];

function extractJobPreview(
  text: string,
  userSkills: string[]
): JobPreview | null {
  if (!text.trim()) return null;

  const lines = text.split("\n").filter(Boolean);
  let company = "";
  let role = "";
  let location = "";
  const requirements: JobPreview["requirements"] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!company && (lower.includes("company") || lower.includes("about us"))) {
      company = line.replace(/^.*?:\s*/, "").trim();
    }
    if (
      !role &&
      (lower.includes("title") ||
        lower.includes("position") ||
        lower.includes("role"))
    ) {
      role = line.replace(/^.*?:\s*/, "").trim();
    }
    if (!location && (lower.includes("location") || lower.includes("remote"))) {
      location = line.replace(/^.*?:\s*/, "").trim();
    }
  }

  if (!role) {
    role = lines[0]?.slice(0, 80) || "Unknown Role";
  }

  const skillKeywords = text
    .match(
      /\b(?:python|javascript|typescript|react|node|sql|aws|gcp|azure|docker|kubernetes|java|go|rust|c\+\+|swift|kotlin|figma|sketch|tableau|power bi|excel|jira|scrum|agile|machine learning|data analysis|product management|ux|ui|css|html|next\.?js|vue|angular|tensorflow|pytorch|salesforce|hubspot|seo|marketing|communication|leadership|project management|budgeting|forecasting|strategic planning|operations|supply chain|customer success|account management)\b/gi
    )
    ?.filter((v, i, a) => a.findIndex((t) => t.toLowerCase() === v.toLowerCase()) === i) ?? [];

  const lowerSkills = userSkills.map((s) => s.toLowerCase());
  for (const kw of skillKeywords.slice(0, 12)) {
    const lower = kw.toLowerCase();
    if (lowerSkills.some((s) => s.includes(lower) || lower.includes(s))) {
      requirements.push({ text: kw, type: "matched" });
    } else {
      requirements.push({ text: kw, type: "missing" });
    }
  }

  const matchCount = requirements.filter((r) => r.type === "matched").length;
  const total = requirements.length || 1;
  const matchScore = Math.min(99, Math.round((matchCount / total) * 85) + 15);

  return { company, role, location, requirements, matchScore };
}

function countWords(text: string): number {
  return text
    .replace(/[#*_\->`]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function getSections(text: string): { title: string; wordCount: number }[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const labels = ["Opening Hook", "Skills & Experience", "Pivot Narrative", "Closing"];
  return paragraphs.map((p, i) => ({
    title: labels[i] || `Paragraph ${i + 1}`,
    wordCount: countWords(p),
  }));
}

export default function CoverLetterClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [jobSource, setJobSource] = useState<JobSource>("paste");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [keyPoints, setKeyPoints] = useState(["", "", ""]);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [versions, setVersions] = useState<
    { id: string; content: string; createdAt: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_result");
      if (raw) {
        const data = JSON.parse(raw);
        const p = data.profile ?? data;
        if (p.skills?.length) {
          setProfile(p);
          setProfileLoaded(true);
          fetchResumes(p.email);
        }
      }
    } catch {}
  }, []);

  async function fetchResumes(email: string) {
    try {
      const res = await fetch(
        `/api/resume-versions?email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResumes(data.versions ?? []);
      }
    } catch {}
  }

  useEffect(() => {
    if (scrollRef.current && phase === "generating") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, phase]);

  useEffect(() => {
    if (phase !== "generating") return;
    const steps = GENERATION_STEPS.length;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < steps) {
        setGenStep(step);
      } else {
        clearInterval(interval);
      }
    }, 2200);
    return () => clearInterval(interval);
  }, [phase]);

  const handleFetchUrl = useCallback(async () => {
    if (!jobUrl.trim()) return;
    setFetchingUrl(true);
    try {
      const res = await fetch(
        `/api/job-tracker/extract?url=${encodeURIComponent(jobUrl.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setJobText(data.description || data.text || "");
      }
    } catch {
      // fallback to URL as text
    } finally {
      setFetchingUrl(false);
    }
  }, [jobUrl]);

  async function generate() {
    if (!profile) return;
    const jd = jobText.trim();
    if (!jd) return;

    setPhase("generating");
    setOutput("");
    setGenStep(0);
    setEditing(false);
    setSavedId(null);

    const preview = extractJobPreview(jd, (profile.skills as string[]) || []);
    const targetRole = preview?.role || "the role";

    try {
      const res = await fetch("/api/resume-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "cover-letter",
          targetRole,
          jobDescription: jd,
          tone,
          keyPoints: keyPoints.filter(Boolean),
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

      saveDocument({
        type: "cover-letter",
        title: `Cover Letter for ${targetRole}`,
        targetRole,
        company: preview?.company,
        content,
      });

      await persistToSupabase(content, targetRole, preview?.company);
    } catch {
      setOutput("Sorry, something went wrong. Please try again.");
      setPhase("done");
    }
  }

  async function persistToSupabase(
    content: string,
    role: string,
    company?: string
  ) {
    const email = profile?.email as string | undefined;
    if (!email) return;

    setSaving(true);
    try {
      const res = await fetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          title: `Cover Letter for ${role}`,
          targetRole: role,
          targetCompany: company || null,
          jobDescription: jobText.trim() || null,
          tone,
          content,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedId(data.id);
        setVersions((prev) => [
          { id: data.id, content, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      }
    } catch {} finally {
      setSaving(false);
    }
  }

  function copyToClipboard() {
    const text = editing ? editContent : output;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPdf() {
    const content = editing ? editContent : output;
    if (!content) return;
    const preview = extractJobPreview(
      jobText,
      (profile?.skills as string[]) || []
    );
    try {
      const res = await fetch("/api/resume/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          targetRole: preview?.role || "Target Role",
          name: profile?.name as string,
          type: "cover-letter",
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CoverLetter_${(preview?.company || "Draft").replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      copyToClipboard();
    }
  }

  async function handleSaveVersion() {
    const content = editing ? editContent : output;
    if (!content || !savedId) return;
    setSaving(true);
    try {
      await fetch(`/api/cover-letters/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setVersions((prev) => [
        { id: savedId, content, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    } catch {} finally {
      setSaving(false);
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

  function reset() {
    setPhase("setup");
    setOutput("");
    setEditing(false);
    setSavedId(null);
    setGenStep(0);
  }

  function execCommand(cmd: string) {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
  }

  const jobPreview = extractJobPreview(
    jobText,
    (profile?.skills as string[]) || []
  );
  const sections = output ? getSections(output) : [];
  const totalWords = output ? countWords(output) : 0;

  const missingKeywords = jobPreview
    ? jobPreview.requirements
        .filter((r) => r.type === "missing")
        .map((r) => r.text)
    : [];
  const matchedKeywords = jobPreview
    ? jobPreview.requirements
        .filter((r) => r.type === "matched")
        .map((r) => r.text)
    : [];

  // ── Phase 2: Generating ──────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] px-4">
        <div className="max-w-lg w-full">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Generating Cover Letter
                </h2>
                <p className="text-xs text-slate-400">
                  {jobPreview?.role && `For ${jobPreview.role}`}
                  {jobPreview?.company && ` at ${jobPreview.company}`}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {GENERATION_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                      i < genStep
                        ? "bg-emerald-600 text-white"
                        : i === genStep
                          ? "bg-purple-600 text-white animate-pulse"
                          : "bg-slate-700 text-slate-500"
                    }`}
                  >
                    {i < genStep ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors ${
                      i <= genStep ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {output && (
              <div
                ref={scrollRef}
                className="max-h-48 overflow-y-auto bg-slate-900/60 rounded-xl p-4 border border-slate-700/40"
              >
                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Phase 3: Output Editor ───────────────────────────────────────────
  if (phase === "done") {
    return (
      <main className="flex flex-col h-[calc(100vh-72px)]">
        <div className="flex-1 flex min-h-0">
          {/* Left sidebar — section nav + versions */}
          <aside className="hidden lg:flex flex-col w-56 border-r border-slate-700/60 bg-slate-900/80 shrink-0">
            <div className="p-4 border-b border-slate-700/40">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Sections
              </h3>
              <div className="space-y-1.5">
                {sections.map((s, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors group"
                  >
                    <span className="text-slate-300 group-hover:text-white">
                      {s.title}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {s.wordCount} words
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Version History
              </h3>
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500">Current draft</p>
              ) : (
                <div className="space-y-1.5">
                  {versions.map((v, i) => (
                    <button
                      key={v.id + i}
                      onClick={() => {
                        setOutput(v.content);
                        setEditing(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      v{versions.length - i} ·{" "}
                      {new Date(v.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            {editing && (
              <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-700/40 bg-slate-900/60">
                <button
                  onClick={() => execCommand("bold")}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand("italic")}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand("underline")}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-700 mx-1" />
                <button
                  onClick={() => execCommand("undo")}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => execCommand("redo")}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:text-white bg-emerald-900/20 hover:bg-emerald-900/40 rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Done Editing
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {editing ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[400px] text-sm text-slate-300 font-sans leading-relaxed focus:outline-none whitespace-pre-wrap"
                    onInput={(e) =>
                      setEditContent(
                        (e.target as HTMLDivElement).innerText
                      )
                    }
                    dangerouslySetInnerHTML={{ __html: editContent.replace(/\n/g, "<br>") }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
                    {output}
                  </pre>
                )}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/40 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {totalWords} words
                </span>
                {saving && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving…
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
                {!editing && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                {savedId && (
                  <button
                    onClick={handleSaveVersion}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Version
                  </button>
                )}
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar — optimization */}
          <aside className="hidden xl:flex flex-col w-64 border-l border-slate-700/60 bg-slate-900/80 shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-700/40">
              {jobPreview && (
                <ScoreRing
                  score={jobPreview.matchScore}
                  animated={true}
                  label="Match Score"
                  size={96}
                />
              )}
            </div>
            <div className="p-4 border-b border-slate-700/40">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Quality Checklist
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Opening hook", ok: totalWords > 30 },
                  { label: "Skills highlighted", ok: matchedKeywords.length > 0 },
                  { label: "Pivot narrative", ok: totalWords > 150 },
                  { label: "Call to action", ok: totalWords > 250 },
                  { label: "Word count 300-400", ok: totalWords >= 250 && totalWords <= 450 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        item.ok
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-slate-700/50 text-slate-500"
                      }`}
                    >
                      {item.ok && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span
                      className={`text-xs ${item.ok ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-b border-slate-700/40">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Keywords Used
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-emerald-900/30 border-emerald-700/30 text-emerald-300 text-[10px]"
                  >
                    {kw}
                  </Badge>
                ))}
                {matchedKeywords.length === 0 && (
                  <span className="text-xs text-slate-500">
                    No job keywords detected
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      const updated = [...keyPoints];
                      const empty = updated.findIndex((p) => !p);
                      if (empty >= 0) updated[empty] = kw;
                      setKeyPoints(updated);
                    }}
                    className="group"
                  >
                    <Badge className="bg-amber-900/30 border-amber-700/30 text-amber-300 text-[10px] group-hover:bg-amber-900/50 cursor-pointer">
                      {kw}
                      <Plus className="w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-100" />
                    </Badge>
                  </button>
                ))}
                {missingKeywords.length === 0 && (
                  <span className="text-xs text-slate-500">
                    All keywords covered
                  </span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  // ── Phase 1: Setup ───────────────────────────────────────────────────
  return (
    <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-semibold mb-4">
          <FileSignature className="w-3.5 h-3.5" />
          AI Cover Letter Generator
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight">
          Create Your Cover Letter
        </h1>
        <p className="text-slate-400 leading-relaxed max-w-lg mx-auto">
          Tailored to the job, powered by your profile. Generate a compelling
          cover letter that highlights your pivot story.
        </p>
      </div>

      {!profileLoaded && (
        <div className="max-w-lg mx-auto bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-6 text-sm">
          <p className="text-amber-300 font-semibold mb-1">
            Profile not loaded
          </p>
          <p className="text-slate-400">
            Complete the{" "}
            <Link
              href="/onboarding"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              career assessment
            </Link>{" "}
            first to generate personalized cover letters.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel — inputs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Job Source */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Job Description
            </h2>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setJobSource("paste")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  jobSource === "paste"
                    ? "bg-purple-600/20 border border-purple-500 text-purple-300"
                    : "bg-slate-800 border border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                Paste Description
              </button>
              <button
                onClick={() => setJobSource("url")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  jobSource === "url"
                    ? "bg-purple-600/20 border border-purple-500 text-purple-300"
                    : "bg-slate-800 border border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 inline mr-1.5" />
                Job URL
              </button>
            </div>

            {jobSource === "url" ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={fetchingUrl || !jobUrl.trim()}
                  className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-2"
                >
                  {fetchingUrl ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  Extract
                </button>
              </div>
            ) : (
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the full job posting — we'll extract requirements and tailor your letter..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
              />
            )}

            {jobText.trim() && jobSource === "url" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                <Check className="w-3 h-3" />
                Job description extracted
              </div>
            )}
          </div>

          {/* Resume selector */}
          {resumes.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Resume Version
              </h2>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="">Use profile data (default)</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.target_role ? ` — ${r.target_role}` : ""}
                    {r.match_score ? ` (${r.match_score}% match)` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tone */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Tone</h2>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  className={`px-3 py-3 rounded-xl border text-center transition-all ${
                    tone === t.key
                      ? "border-purple-500 bg-purple-900/20"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${tone === t.key ? "text-purple-300" : "text-slate-400"}`}
                  >
                    {t.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Key emphasis points */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">
              Key Emphasis Points{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </h2>
            <div className="space-y-2">
              {keyPoints.map((point, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const next = [...keyPoints];
                      next[i] = e.target.value;
                      setKeyPoints(next);
                    }}
                    placeholder={
                      i === 0
                        ? "e.g. 5 years leading cross-functional teams"
                        : i === 1
                          ? "e.g. Passionate about data-driven decisions"
                          : "e.g. Built tools used by 10K+ users"
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {point && (
                    <button
                      onClick={() => {
                        const next = [...keyPoints];
                        next[i] = "";
                        setKeyPoints(next);
                      }}
                      className="px-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generate CTA */}
          <button
            onClick={generate}
            disabled={!jobText.trim() || !profileLoaded}
            className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors shadow-lg shadow-purple-900/30"
          >
            Generate Cover Letter →
          </button>
          <p className="text-slate-500 text-xs text-center">
            Streams in real time · Edit, copy, or download PDF when done
          </p>
        </div>

        {/* Right panel — preview */}
        <div className="lg:col-span-2 space-y-6">
          {jobPreview ? (
            <>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Job Preview
                </h3>
                <div className="space-y-2">
                  {jobPreview.role && (
                    <p className="text-white font-semibold">{jobPreview.role}</p>
                  )}
                  {jobPreview.company && (
                    <p className="text-sm text-slate-400">
                      {jobPreview.company}
                    </p>
                  )}
                  {jobPreview.location && (
                    <p className="text-xs text-slate-500">
                      {jobPreview.location}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {jobPreview.requirements.filter((r) => r.type === "matched")
                    .length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-400 font-medium mb-1.5">
                        Matched Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobPreview.requirements
                          .filter((r) => r.type === "matched")
                          .map((r) => (
                            <Badge
                              key={r.text}
                              className="bg-emerald-900/30 border-emerald-700/30 text-emerald-300 text-[10px]"
                            >
                              {r.text}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                  {jobPreview.requirements.filter((r) => r.type === "missing")
                    .length > 0 && (
                    <div>
                      <p className="text-[10px] text-amber-400 font-medium mb-1.5">
                        Skills to Address
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {jobPreview.requirements
                          .filter((r) => r.type === "missing")
                          .map((r) => (
                            <Badge
                              key={r.text}
                              className="bg-amber-900/30 border-amber-700/30 text-amber-300 text-[10px]"
                            >
                              {r.text}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 flex justify-center">
                <ScoreRing
                  score={jobPreview.matchScore}
                  animated={true}
                  label="Match Score"
                  size={112}
                />
              </div>
            </>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-8 text-center">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Paste a job description to see the match preview
              </p>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Related Tools
            </h3>
            <div className="space-y-2">
              <Link
                href="/resume-generator"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4" />
                Resume Generator
              </Link>
              <Link
                href="/ats-score"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                ATS Score Checker
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
