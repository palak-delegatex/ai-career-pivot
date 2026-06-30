"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, ArrowLeft, Mic2, RotateCcw, FileText, ChevronDown, ChevronUp,
  BookOpen, Target, BarChart3, Sparkles, CheckCircle2, AlertTriangle,
  Clock, Filter, Trophy, ChevronRight, Loader2, X,
} from "lucide-react";
import Link from "next/link";
import {
  getArchetypes, getQuestionsForRole, getGeneralBehavioral,
  type InterviewQuestion, type PivotArchetype,
} from "@/lib/interview-questions";
import type { ScoreResult } from "@/app/api/mock-interview/score/route";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InterviewType = "behavioral" | "technical" | "situational";
type Phase = "setup" | "interview" | "done";
type Mode = "live" | "star-practice" | "question-bank" | "history";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface StarAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface PracticeSession {
  id: string;
  questionId: string;
  question: string;
  answer: StarAnswer;
  score: ScoreResult;
  targetRole: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVIEW_TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: "behavioral", label: "Behavioral", desc: "Tell me about a time…" },
  { value: "situational", label: "Situational", desc: "What would you do if…" },
  { value: "technical", label: "Technical", desc: "Role-specific knowledge" },
];

const POPULAR_ROLES = [
  "Product Manager", "Data Analyst", "UX Designer", "Software Engineer",
  "Marketing Manager", "Operations Manager", "Sales Manager", "Data Scientist",
];

const STAR_GUIDANCE = {
  situation: { label: "Situation", hint: "Set the scene. When and where did this happen? (2-3 sentences)", target: "40-60 words" },
  task: { label: "Task", hint: "What was your specific responsibility or goal? (1-2 sentences)", target: "20-40 words" },
  action: { label: "Action", hint: "What exactly did YOU do? Be specific about your steps. This should be the longest section. (4-6 sentences)", target: "80-120 words" },
  result: { label: "Result", hint: "What was the outcome? Quantify with numbers where possible. (2-3 sentences)", target: "40-60 words" },
};

const STORAGE_KEY = "interview_practice_sessions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      nodes.push(<p key={key++} className="font-bold text-white mt-3 mb-1">{line.slice(2, -2)}</p>);
    } else if (line.match(/^[-*] /)) {
      nodes.push(<li key={key++} className="ml-4 leading-relaxed list-disc">{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      if (nodes.length > 0) nodes.push(<div key={key++} className="h-1" />);
    } else {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      nodes.push(<p key={key++} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
    }
  }
  return <>{nodes}</>;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function loadSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: PracticeSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 8) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 6) return "bg-yellow-500/20 border-yellow-500/30";
  return "bg-red-500/20 border-red-500/30";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MockInterviewClient() {
  // Mode & setup state
  const [mode, setMode] = useState<Mode>("live");
  const [phase, setPhase] = useState<Phase>("setup");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);

  // Live interview state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showEndOption, setShowEndOption] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // STAR practice state
  const [starQuestion, setStarQuestion] = useState<InterviewQuestion | null>(null);
  const [starAnswer, setStarAnswer] = useState<StarAnswer>({ situation: "", task: "", action: "", result: "" });
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  // Question bank state
  const [bankFilter, setBankFilter] = useState<"all" | "behavioral" | "technical">("all");
  const [bankArchetype, setBankArchetype] = useState<string>("all");
  const [bankDifficulty, setBankDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");

  // Gap-analysis-powered questions
  const [gapQuestions, setGapQuestions] = useState<InterviewQuestion[]>([]);
  const [generatingGap, setGeneratingGap] = useState(false);
  const [skillGaps, setSkillGaps] = useState<{ skill: string; currentLevel: string; requiredLevel: string; priority: string }[]>([]);

  // Session history
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // Load gap analysis data from sessionStorage if available
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_result");
      if (raw) {
        const result = JSON.parse(raw);
        const plan = result?.plans?.[0];
        if (plan?.skillGaps?.length) {
          setSkillGaps(plan.skillGaps.map((g: { skill: string; currentLevel: string; requiredLevel: string; priority: string }) => ({
            skill: g.skill, currentLevel: g.currentLevel, requiredLevel: g.requiredLevel, priority: g.priority,
          })));
        }
        if (plan?.targetRole && !targetRole) setTargetRole(plan.targetRole);
      }
      const profile = sessionStorage.getItem("intake_profile");
      if (profile) {
        const p = JSON.parse(profile);
        if (p.currentTitle) setCurrentRole(p.currentTitle);
      }
    } catch { /* ignore */ }
  }, [targetRole]);

  const displayRole = targetRole === "custom" ? customRole : targetRole;

  // ---------------------------------------------------------------------------
  // Live Interview handlers (preserved from original)
  // ---------------------------------------------------------------------------

  async function startInterview() {
    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    if (!role) return;
    setPhase("interview");
    setStreaming(true);
    setMessages([]);
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role, interviewType,
          jobDescription: jobDescription.trim() || undefined,
          messages: [{ role: "user", content: "Start the interview." }],
          questionCount: 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to start");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let content = "";
      const ts = Date.now();
      setMessages([{ role: "assistant", content: "", timestamp: ts }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages([{ role: "assistant", content, timestamp: ts }]);
      }
      setMessages([{ role: "assistant", content, timestamp: ts }]);
      setQuestionCount(1);
    } catch {
      setMessages([{ role: "assistant", content: "Sorry, I had trouble starting the interview. Please try again.", timestamp: Date.now() }]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    const isEndRequest = content.toLowerCase().includes("end interview") || content === "__end__";
    const nextQuestionCount = questionCount + 1;
    const userMessage: Message = {
      role: "user",
      content: isEndRequest ? "Please give me my interview feedback and scorecard." : content,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setStreaming(true);
    setShowEndOption(false);
    const willEnd = isEndRequest || nextQuestionCount >= 5;
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role, interviewType,
          jobDescription: jobDescription.trim() || undefined,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          questionCount: willEnd ? 6 : nextQuestionCount,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let assistantContent = "";
      const ts = Date.now();
      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: ts }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantContent, timestamp: ts };
          return next;
        });
      }
      if (willEnd) setPhase("done");
      else {
        setQuestionCount(nextQuestionCount);
        if (nextQuestionCount >= 3) setShowEndOption(true);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I had trouble responding. Please try again.", timestamp: Date.now() }]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function resetInterview() {
    setPhase("setup");
    setMessages([]);
    setQuestionCount(0);
    setShowEndOption(false);
    setInput("");
    setJobDescription("");
    setShowJdInput(false);
  }

  // ---------------------------------------------------------------------------
  // STAR Practice handlers
  // ---------------------------------------------------------------------------

  function selectStarQuestion(q: InterviewQuestion) {
    setStarQuestion(q);
    setStarAnswer({ situation: "", task: "", action: "", result: "" });
    setScoreResult(null);
    setMode("star-practice");
  }

  async function submitStarAnswer() {
    if (!starQuestion) return;
    setScoring(true);
    try {
      const res = await fetch("/api/mock-interview/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: starQuestion.question,
          answer: starAnswer,
          targetRole: displayRole || "General",
        }),
      });
      if (!res.ok) throw new Error("Score failed");
      const score: ScoreResult = await res.json();
      setScoreResult(score);

      const session: PracticeSession = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        questionId: starQuestion.id,
        question: starQuestion.question,
        answer: starAnswer,
        score,
        targetRole: displayRole || "General",
        timestamp: Date.now(),
      };
      const updated = [session, ...loadSessions()].slice(0, 100);
      saveSessions(updated);
      setSessions(updated);
    } catch {
      setScoreResult(null);
    } finally {
      setScoring(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Gap-analysis question generation
  // ---------------------------------------------------------------------------

  async function generateGapQuestions() {
    if (!displayRole) return;
    setGeneratingGap(true);
    try {
      const res = await fetch("/api/mock-interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: displayRole,
          currentRole: currentRole || undefined,
          skillGaps: skillGaps.length ? skillGaps : undefined,
          count: 5,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGapQuestions(
        data.questions.map((q: { question: string; type: string; category: string; difficulty: string; starHint: string }, i: number) => ({
          id: `gap-${Date.now()}-${i}`,
          question: q.question,
          type: q.type as "behavioral" | "technical",
          category: q.category,
          difficulty: q.difficulty as "easy" | "medium" | "hard",
          starHint: q.starHint,
        }))
      );
    } catch { /* ignore */ }
    finally { setGeneratingGap(false); }
  }

  // ---------------------------------------------------------------------------
  // Question bank filtering
  // ---------------------------------------------------------------------------

  const archetypes = getArchetypes();
  const allQuestions = (() => {
    let qs: InterviewQuestion[] = [];
    if (bankArchetype === "all") {
      qs = [...getGeneralBehavioral()];
      for (const a of archetypes) {
        qs.push(...a.behavioral, ...a.technical);
      }
    } else if (bankArchetype === "general") {
      qs = getGeneralBehavioral();
    } else {
      const arch = archetypes.find((a) => a.id === bankArchetype);
      if (arch) qs = [...arch.behavioral, ...arch.technical];
    }
    if (bankFilter !== "all") qs = qs.filter((q) => q.type === bankFilter);
    if (bankDifficulty !== "all") qs = qs.filter((q) => q.difficulty === bankDifficulty);
    return qs;
  })();

  // ---------------------------------------------------------------------------
  // History stats
  // ---------------------------------------------------------------------------

  const avgScore = sessions.length
    ? (sessions.reduce((sum, s) => sum + s.score.overallScore, 0) / sessions.length).toFixed(1)
    : "—";
  const bestScore = sessions.length
    ? Math.max(...sessions.map((s) => s.score.overallScore))
    : 0;
  const practiceCount = sessions.length;

  // ---------------------------------------------------------------------------
  // Render: STAR Practice Mode
  // ---------------------------------------------------------------------------

  if (mode === "star-practice" && starQuestion) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => { setMode("live"); setStarQuestion(null); setScoreResult(null); }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Interview Prep
        </button>

        <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{starQuestion.question}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${starQuestion.type === "behavioral" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {starQuestion.type}
                </span>
                <span className="text-xs text-slate-500">{starQuestion.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  starQuestion.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                  starQuestion.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>{starQuestion.difficulty}</span>
              </div>
            </div>
          </div>
          {starQuestion.starHint && (
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3 text-sm text-purple-300">
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              {starQuestion.starHint}
            </div>
          )}
        </div>

        {/* STAR Form */}
        <div className="space-y-5">
          {(Object.entries(STAR_GUIDANCE) as [keyof StarAnswer, typeof STAR_GUIDANCE.situation][]).map(([key, { label, hint, target }]) => {
            const wc = wordCount(starAnswer[key]);
            const [minTarget] = target.split("-").map((s) => parseInt(s));
            const atTarget = wc >= minTarget;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-bold">
                      {label[0]}
                    </span>
                    {label}
                  </label>
                  <span className={`text-xs ${atTarget ? "text-emerald-400" : "text-slate-500"}`}>
                    {wc} words · target {target}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{hint}</p>
                <textarea
                  value={starAnswer[key]}
                  onChange={(e) => setStarAnswer((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={key === "action" ? 5 : 3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                  placeholder={hint}
                  disabled={scoring}
                />
              </div>
            );
          })}

          <button onClick={submitStarAnswer}
            disabled={scoring || !starAnswer.situation.trim() || !starAnswer.action.trim()}
            className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {scoring ? <><Loader2 className="w-5 h-5 animate-spin" /> Scoring your answer…</> : <><BarChart3 className="w-5 h-5" /> Get AI Score</>}
          </button>
        </div>

        {/* Score Result */}
        {scoreResult && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 text-4xl font-black ${scoreColor(scoreResult.overallScore)}`}>
                {scoreResult.overallScore}/10
              </div>
              <p className="text-sm text-slate-400 mt-1">Overall Score</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Relevance", score: scoreResult.relevance.score, feedback: scoreResult.relevance.feedback },
                { label: "STAR Structure", score: scoreResult.starStructure.score, feedback: scoreResult.starStructure.feedback },
                { label: "Specificity", score: scoreResult.specificity.score, feedback: scoreResult.specificity.feedback },
              ].map(({ label, score, feedback }) => (
                <div key={label} className={`rounded-xl border p-4 ${scoreBg(score)}`}>
                  <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}/10</div>
                  <div className="text-xs font-semibold text-white mt-1">{label}</div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feedback}</p>
                </div>
              ))}
            </div>

            {/* STAR Section Scores */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">STAR Section Breakdown</p>
              <div className="grid grid-cols-4 gap-2">
                {(["situation", "task", "action", "result"] as const).map((section) => {
                  const s = scoreResult.starStructure.sectionScores[section];
                  return (
                    <div key={section} className="text-center">
                      <div className={`text-lg font-bold ${scoreColor(s)}`}>{s}</div>
                      <div className="text-xs text-slate-500 capitalize">{section}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Improvements */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
              <p className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Improvements
              </p>
              <ul className="space-y-2">
                {scoreResult.improvements.map((imp, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span> {imp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
              <p className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
              </p>
              <ul className="space-y-2">
                {scoreResult.strengths.map((str, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {str}
                  </li>
                ))}
              </ul>
            </div>

            {/* Rewrite hint */}
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3 text-sm text-purple-300">
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" /> {scoreResult.rewriteHint}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setScoreResult(null); setStarAnswer({ situation: "", task: "", action: "", result: "" }); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                Try Again
              </button>
              <button onClick={() => { setMode("question-bank"); setStarQuestion(null); setScoreResult(null); }}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors">
                Next Question
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Question Bank Mode
  // ---------------------------------------------------------------------------

  if (mode === "question-bank") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => setMode("live")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Interview Prep
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Question Bank</h1>
          <span className="text-xs text-slate-500">{allQuestions.length} questions</span>
        </div>

        {/* Gap-analysis powered questions */}
        {(skillGaps.length > 0 || displayRole) && (
          <div className="rounded-2xl bg-purple-900/20 border border-purple-700/30 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {skillGaps.length > 0 ? "Questions Targeting Your Skill Gaps" : "AI-Generated Questions for Your Role"}
              </h2>
              <button onClick={generateGapQuestions} disabled={generatingGap || !displayRole}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {generatingGap ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</> : <><Sparkles className="w-3 h-3" /> Generate</>}
              </button>
            </div>
            {skillGaps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {skillGaps.slice(0, 6).map((g) => (
                  <span key={g.skill} className={`text-xs px-2 py-0.5 rounded-full ${
                    g.priority === "high" ? "bg-red-500/20 text-red-400" :
                    g.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-slate-700 text-slate-400"
                  }`}>{g.skill}</span>
                ))}
              </div>
            )}
            {gapQuestions.length > 0 && (
              <div className="space-y-2 mt-3">
                {gapQuestions.map((q) => (
                  <button key={q.id} onClick={() => selectStarQuestion(q)}
                    className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-purple-500/40 transition-colors group">
                    <p className="text-sm text-white group-hover:text-purple-300 transition-colors">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${q.type === "behavioral" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>{q.type}</span>
                      <span className="text-xs text-slate-500">{q.category}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-purple-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>
          <select value={bankArchetype} onChange={(e) => setBankArchetype(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white">
            <option value="all">All Archetypes</option>
            <option value="general">General Behavioral</option>
            {archetypes.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value as typeof bankFilter)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white">
            <option value="all">All Types</option>
            <option value="behavioral">Behavioral</option>
            <option value="technical">Technical</option>
          </select>
          <select value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value as typeof bankDifficulty)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white">
            <option value="all">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Question list */}
        <div className="space-y-2">
          {allQuestions.map((q) => {
            const practiced = sessions.some((s) => s.questionId === q.id);
            return (
              <button key={q.id} onClick={() => selectStarQuestion(q)}
                className="w-full text-left p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-purple-500/40 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white group-hover:text-purple-300 transition-colors">{q.question}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${q.type === "behavioral" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>{q.type}</span>
                      <span className="text-xs text-slate-500">{q.category}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        q.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                        q.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>{q.difficulty}</span>
                      {practiced && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Practiced</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: History Mode
  // ---------------------------------------------------------------------------

  if (mode === "history") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => setMode("live")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Interview Prep
        </button>

        <h1 className="text-2xl font-extrabold mb-6">Practice History</h1>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-white">{practiceCount}</div>
            <div className="text-xs text-slate-500 mt-1">Questions Practiced</div>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 text-center">
            <div className={`text-2xl font-bold ${typeof avgScore === "string" && avgScore !== "—" ? scoreColor(parseFloat(avgScore)) : "text-slate-500"}`}>
              {avgScore}
            </div>
            <div className="text-xs text-slate-500 mt-1">Avg Score</div>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 text-center">
            <div className={`text-2xl font-bold ${bestScore ? scoreColor(bestScore) : "text-slate-500"}`}>
              {bestScore || "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">Best Score</div>
          </div>
        </div>

        {/* Score over time chart (simple text-based) */}
        {sessions.length > 1 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 mb-6">
            <p className="text-xs font-semibold text-slate-300 mb-3">Score Trend (last 10)</p>
            <div className="flex items-end gap-1 h-16">
              {sessions.slice(0, 10).reverse().map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[10px] ${scoreColor(s.score.overallScore)}`}>{s.score.overallScore}</span>
                  <div
                    className={`w-full rounded-t ${s.score.overallScore >= 8 ? "bg-emerald-500" : s.score.overallScore >= 6 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ height: `${(s.score.overallScore / 10) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session list */}
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold">No practice sessions yet</p>
            <p className="text-sm mt-1">Use the Question Bank to start practicing with STAR format.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{s.question}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">{s.targetRole}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${scoreColor(s.score.overallScore)}`}>
                    {s.score.overallScore}/10
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-slate-500">
                  <span>Relevance: <span className={scoreColor(s.score.relevance.score)}>{s.score.relevance.score}</span></span>
                  <span>STAR: <span className={scoreColor(s.score.starStructure.score)}>{s.score.starStructure.score}</span></span>
                  <span>Specificity: <span className={scoreColor(s.score.specificity.score)}>{s.score.specificity.score}</span></span>
                </div>
                <button onClick={() => selectStarQuestion({
                  id: s.questionId, question: s.question, type: "behavioral",
                  category: "", difficulty: "medium",
                })}
                  className="text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors">
                  Practice again →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Setup screen (enhanced with mode tabs)
  // ---------------------------------------------------------------------------

  if (phase === "setup") {
    return (
      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-semibold mb-4">
            <Mic2 className="w-3.5 h-3.5" />
            AI Interview Prep Engine
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Ace Your Interview
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Live mock interviews, STAR framework practice with AI scoring, and a question bank tailored to your career pivot.
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-1 bg-slate-800/60 rounded-xl p-1 mb-8">
          {([
            { key: "live" as Mode, icon: Mic2, label: "Live" },
            { key: "star-practice" as Mode, icon: Target, label: "STAR" },
            { key: "question-bank" as Mode, icon: BookOpen, label: "Bank" },
            { key: "history" as Mode, icon: BarChart3, label: "History" },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key}
              onClick={() => {
                if (key === "star-practice") { setMode("question-bank"); return; }
                if (key === "history") { setMode("history"); return; }
                if (key === "question-bank") { setMode("question-bank"); return; }
                setMode(key);
              }}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                mode === key ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {key === "history" && practiceCount > 0 && (
                <span className="text-[10px] text-purple-400">{practiceCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Target Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {POPULAR_ROLES.map((role) => (
                <button key={role} onClick={() => setTargetRole(role)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    targetRole === role ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}>{role}</button>
              ))}
              <button onClick={() => setTargetRole("custom")}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  targetRole === "custom" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}>Other role…</button>
            </div>
            {targetRole === "custom" && (
              <input type="text" value={customRole} onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. DevRel Engineer, Customer Success Manager"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus />
            )}
          </div>

          {/* Interview type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Interview Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map(({ value, label, desc }) => (
                <button key={value} onClick={() => setInterviewType(value)}
                  className={`px-3 py-3 rounded-xl text-left transition-colors ${
                    interviewType === value
                      ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                      : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                  }`}>
                  <div className="text-sm font-semibold mb-0.5">{label}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Job description */}
          <div>
            <button onClick={() => setShowJdInput(!showJdInput)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              <FileText className="w-4 h-4 text-purple-400" />
              Paste a job description
              <span className="text-xs text-slate-500 font-normal">(optional)</span>
              {showJdInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showJdInput && (
              <div className="mt-3 space-y-2">
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job posting here — we'll tailor every question to what they're actually looking for…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y" />
                {jobDescription.trim() && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <FileText className="w-3 h-3" /> JD loaded — questions will be tailored to this role
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skill gaps indicator */}
          {skillGaps.length > 0 && (
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3">
              <p className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5" /> Skill gaps loaded from your analysis
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillGaps.slice(0, 5).map((g) => (
                  <span key={g.skill} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{g.skill}</span>
                ))}
                {skillGaps.length > 5 && <span className="text-xs text-slate-500">+{skillGaps.length - 5} more</span>}
              </div>
            </div>
          )}

          <button onClick={startInterview}
            disabled={!targetRole || (targetRole === "custom" && !customRole.trim())}
            className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed">
            Start Live Mock Interview →
          </button>

          <p className="text-slate-500 text-xs text-center">
            5 questions · ~10 minutes · {jobDescription.trim() ? "Tailored to your job posting" : "Feedback scorecard at the end"}
          </p>

          {/* Quick access cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => setMode("question-bank")}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/40 text-left transition-colors group">
              <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">Question Bank</p>
              <p className="text-xs text-slate-500 mt-1">100+ questions by career pivot archetype</p>
            </button>
            <button onClick={() => setMode("history")}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/40 text-left transition-colors group">
              <BarChart3 className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">Your Progress</p>
              <p className="text-xs text-slate-500 mt-1">
                {practiceCount > 0 ? `${practiceCount} practiced · avg ${avgScore}/10` : "Track scores over time"}
              </p>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Interview / done screen (preserved from original)
  // ---------------------------------------------------------------------------

  return (
    <main className="flex flex-col h-[calc(100vh-72px)] max-h-[calc(100vh-72px)]">
      <header className="shrink-0 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={resetInterview} className="text-slate-400 hover:text-white transition-colors p-1" aria-label="Back to setup">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Mic2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Mock Interview</h1>
              <p className="text-xs text-slate-400">
                {displayRole} · {interviewType}
                {jobDescription.trim() && <span className="text-purple-400"> · JD-tailored</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {phase === "interview" && <span className="text-xs text-slate-500">Q{questionCount}/5</span>}
            {phase === "done" && <span className="text-xs text-emerald-400 font-semibold">Interview Complete</span>}
            <button onClick={resetInterview}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
              <RotateCcw className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic2 className="w-3.5 h-3.5 text-purple-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user" ? "bg-purple-600 text-white" : "bg-slate-800/60 text-slate-200 border-l-[3px] border-purple-500/60"
              }`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content === "Please give me my interview feedback and scorecard." ? "End interview — give me my feedback." : msg.content}</p>
                ) : (
                  <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                )}
              </div>
            </div>
          ))}

          {streaming && messages.length > 0 && messages[messages.length - 1].content === "" && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Mic2 className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="bg-slate-800/60 border-l-[3px] border-purple-500/60 rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="rounded-2xl bg-emerald-950/30 border border-emerald-800/30 p-5 text-center">
              <p className="text-emerald-400 font-semibold mb-3">Interview Complete</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={resetInterview}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors">
                  Practice Again
                </button>
                <button onClick={() => { resetInterview(); setMode("question-bank"); }}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                  STAR Practice
                </button>
                <Link href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {phase === "interview" && (
        <div className="shrink-0 border-t border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-3xl mx-auto space-y-2">
            {showEndOption && !streaming && (
              <div className="flex justify-center">
                <button onClick={() => handleSend("__end__")}
                  className="text-xs text-slate-400 hover:text-purple-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700 hover:border-purple-600/40">
                  End interview & get feedback →
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} value={input}
                onChange={(e) => { setInput(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..." rows={1}
                style={{ minHeight: "44px", maxHeight: "120px" }}
                className="flex-1 bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-colors" />
              <button onClick={() => handleSend()} disabled={!input.trim() || streaming}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0" aria-label="Send answer">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </main>
  );
}
