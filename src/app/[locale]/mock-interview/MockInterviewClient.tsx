"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, ArrowLeft, Mic2, RotateCcw, FileText, ChevronDown, ChevronUp,
  BookOpen, Target, BarChart3, Sparkles, CheckCircle2, AlertTriangle,
  Clock, Filter, Trophy, ChevronRight, Loader2, X, MicOff, Activity,
  Gauge, Volume2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  getArchetypes, getQuestionsForRole, getGeneralBehavioral,
  type InterviewQuestion, type PivotArchetype,
} from "@/lib/interview-questions";
import type { ScoreResult, ScoreResultWithDelivery } from "@/app/api/mock-interview/score/route";
import { useSpeechAnalysis } from "@/hooks/use-speech-analysis";
import { analyzeDelivery, type DeliveryMetrics, type PauseEvent } from "@/lib/speech-analysis";

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
  delivery?: DeliveryMetrics;
  combinedScore?: number;
  targetRole: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Interview type values are sent to the backend; labels/descriptions are localized at render.
const INTERVIEW_TYPE_VALUES: InterviewType[] = ["behavioral", "situational", "technical"];

// Canonical role values (sent to the API as targetRole); display labels are localized at render.
const POPULAR_ROLES = [
  "Product Manager", "Data Analyst", "UX Designer", "Software Engineer",
  "Marketing Manager", "Operations Manager", "Sales Manager", "Data Scientist",
];

// Numeric word-count ranges are parsed programmatically and stay locale-independent.
const STAR_TARGETS: Record<keyof StarAnswer, string> = {
  situation: "40-60",
  task: "20-40",
  action: "80-120",
  result: "40-60",
};
const STAR_FIELDS: (keyof StarAnswer)[] = ["situation", "task", "action", "result"];

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
  const t = useTranslations("mockInterview");
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

  // Speech analysis state
  const speech = useSpeechAnalysis();
  const [deliveryMetrics, setDeliveryMetrics] = useState<DeliveryMetrics | null>(null);
  const [recordingField, setRecordingField] = useState<keyof StarAnswer | null>(null);
  const [combinedScore, setCombinedScore] = useState<number | null>(null);
  const spokenTranscriptsRef = useRef<string[]>([]);
  const spokenDurationsRef = useRef<number[]>([]);
  const spokenPausesRef = useRef<PauseEvent[]>([]);

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

  // Localized STAR guidance, preserving the { label, hint, target } shape used below.
  const starGuidance = (field: keyof StarAnswer) => ({
    label: t(`star.${field}.label`),
    hint: t(`star.${field}.hint`),
    target: t("star.wordTarget", { range: STAR_TARGETS[field] }),
  });

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
      setMessages([{ role: "assistant", content: t("errorStart"), timestamp: Date.now() }]);
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
      setMessages((prev) => [...prev, { role: "assistant", content: t("errorRespond"), timestamp: Date.now() }]);
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
    setDeliveryMetrics(null);
    setCombinedScore(null);
    speech.reset();
    setRecordingField(null);
    spokenTranscriptsRef.current = [];
    spokenDurationsRef.current = [];
    spokenPausesRef.current = [];
    setMode("star-practice");
  }

  function startSpeechForField(field: keyof StarAnswer) {
    setRecordingField(field);
    speech.reset();
    speech.startRecording();
  }

  function stopSpeechForField() {
    const metrics = speech.stopRecording();
    if (recordingField && speech.transcript) {
      setStarAnswer((prev) => ({
        ...prev,
        [recordingField]: prev[recordingField]
          ? prev[recordingField] + " " + speech.transcript
          : speech.transcript,
      }));
    }
    if (metrics) {
      spokenTranscriptsRef.current.push(speech.transcript);
      spokenDurationsRef.current.push(metrics.durationSeconds);
      spokenPausesRef.current.push(...metrics.pauses);

      const fullTranscript = spokenTranscriptsRef.current.join(" ");
      const totalDuration = spokenDurationsRef.current.reduce((a, b) => a + b, 0);
      const allPauses = spokenPausesRef.current;
      setDeliveryMetrics(analyzeDelivery(fullTranscript, totalDuration, allPauses));
    }
    setRecordingField(null);
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

      const combined = deliveryMetrics
        ? Math.round(((score.overallScore * 0.7) + (deliveryMetrics.deliveryScore * 0.3)) * 10) / 10
        : undefined;
      if (combined !== undefined) setCombinedScore(combined);

      const session: PracticeSession = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        questionId: starQuestion.id,
        question: starQuestion.question,
        answer: starAnswer,
        score,
        delivery: deliveryMetrics ?? undefined,
        combinedScore: combined,
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
          <ArrowLeft className="w-4 h-4" /> {t("backToPrep")}
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
                  {t(`type.${starQuestion.type}`)}
                </span>
                <span className="text-xs text-slate-500">{starQuestion.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  starQuestion.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                  starQuestion.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>{t(`difficulty.${starQuestion.difficulty}`)}</span>
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

        {/* Speech recording indicator */}
        {speech.isRecording && recordingField && (
          <div className="rounded-2xl bg-red-900/20 border border-red-700/40 p-4 mb-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-300">{t("recordingField", { field: starGuidance(recordingField).label })}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t("seconds", { count: speech.durationSeconds })}</span>
                <button onClick={stopSpeechForField}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <MicOff className="w-3 h-3" /> {t("stop")}
                </button>
              </div>
            </div>
            {(speech.transcript || speech.interimTranscript) && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {speech.transcript}
                {speech.interimTranscript && <span className="text-slate-600"> {speech.interimTranscript}</span>}
              </p>
            )}
          </div>
        )}

        {/* Live delivery stats while recording */}
        {deliveryMetrics && !scoreResult && (
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4 mb-6">
            <p className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> {t("deliveryAnalysis")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className={`text-lg font-bold ${deliveryMetrics.wordsPerMinute >= 130 && deliveryMetrics.wordsPerMinute <= 160 ? "text-emerald-400" : "text-yellow-400"}`}>
                  {deliveryMetrics.wordsPerMinute}
                </div>
                <div className="text-xs text-slate-500">{t("wpm")}</div>
                <div className={`text-[10px] mt-0.5 ${deliveryMetrics.wordsPerMinute >= 130 && deliveryMetrics.wordsPerMinute <= 160 ? "text-emerald-500" : "text-yellow-500"}`}>
                  {deliveryMetrics.paceLabel}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${deliveryMetrics.fillerRate < 0.02 ? "text-emerald-400" : deliveryMetrics.fillerRate < 0.05 ? "text-yellow-400" : "text-red-400"}`}>
                  {deliveryMetrics.fillerWords.reduce((s, f) => s + f.count, 0)}
                </div>
                <div className="text-xs text-slate-500">{t("fillers")}</div>
                {deliveryMetrics.fillerWords.length > 0 && (
                  <div className="text-[10px] text-slate-600 mt-0.5">{deliveryMetrics.fillerWords.slice(0, 2).map((f) => f.word).join(", ")}</div>
                )}
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${deliveryMetrics.longPauseCount <= 2 ? "text-emerald-400" : "text-yellow-400"}`}>
                  {deliveryMetrics.longPauseCount}
                </div>
                <div className="text-xs text-slate-500">{t("longPauses")}</div>
              </div>
            </div>
          </div>
        )}

        {/* STAR Form */}
        <div className="space-y-5">
          {STAR_FIELDS.map((key) => {
            const { label, hint, target } = starGuidance(key);
            const wc = wordCount(starAnswer[key]);
            const [minTarget] = STAR_TARGETS[key].split("-").map((s) => parseInt(s));
            const atTarget = wc >= minTarget;
            const isFieldRecording = speech.isRecording && recordingField === key;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 text-xs flex items-center justify-center font-bold">
                      {label[0]}
                    </span>
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${atTarget ? "text-emerald-400" : "text-slate-500"}`}>
                      {t("wordsTarget", { count: wc, target })}
                    </span>
                    {speech.isSupported && (
                      <button
                        onClick={() => isFieldRecording ? stopSpeechForField() : startSpeechForField(key)}
                        disabled={scoring || (speech.isRecording && !isFieldRecording)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFieldRecording
                            ? "bg-red-600 text-white hover:bg-red-500"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white disabled:opacity-30"
                        }`}
                        title={isFieldRecording ? t("stopRecording") : t("dictate", { field: label })}
                      >
                        {isFieldRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-2">{hint}</p>
                <textarea
                  value={starAnswer[key]}
                  onChange={(e) => setStarAnswer((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={key === "action" ? 5 : 3}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y ${
                    isFieldRecording ? "border-red-500/60" : "border-slate-700"
                  }`}
                  placeholder={hint}
                  disabled={scoring}
                />
              </div>
            );
          })}

          <button onClick={submitStarAnswer}
            disabled={scoring || !starAnswer.situation.trim() || !starAnswer.action.trim()}
            className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {scoring ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("scoringAnswer")}</> : <><BarChart3 className="w-5 h-5" /> {t("getAiScore")}</>}
          </button>
        </div>

        {/* Score Result */}
        {scoreResult && (
          <div className="mt-8 space-y-4">
            {/* Combined / Overall Score */}
            {combinedScore !== null && deliveryMetrics ? (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 text-4xl font-black ${scoreColor(combinedScore)}`}>
                  {combinedScore}/10
                </div>
                <p className="text-sm text-slate-400 mt-1">{t("combinedScore")}</p>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500">
                  <span>{t("contentLabel")} <span className={scoreColor(scoreResult.overallScore)}>{scoreResult.overallScore}</span></span>
                  <span>·</span>
                  <span>{t("deliveryLabel")} <span className={scoreColor(deliveryMetrics.deliveryScore)}>{deliveryMetrics.deliveryScore}</span></span>
                  <span>·</span>
                  <span className="text-slate-600">{t("weight7030")}</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 text-4xl font-black ${scoreColor(scoreResult.overallScore)}`}>
                  {scoreResult.overallScore}/10
                </div>
                <p className="text-sm text-slate-400 mt-1">{t("contentScore")}</p>
                {!deliveryMetrics && speech.isSupported && (
                  <p className="text-xs text-slate-600 mt-1">{t("useMicHint")}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t("relevance"), score: scoreResult.relevance.score, feedback: scoreResult.relevance.feedback },
                { label: t("starStructure"), score: scoreResult.starStructure.score, feedback: scoreResult.starStructure.feedback },
                { label: t("specificity"), score: scoreResult.specificity.score, feedback: scoreResult.specificity.feedback },
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
              <p className="text-xs font-semibold text-slate-300 mb-3">{t("starSectionBreakdown")}</p>
              <div className="grid grid-cols-4 gap-2">
                {(["situation", "task", "action", "result"] as const).map((section) => {
                  const s = scoreResult.starStructure.sectionScores[section];
                  return (
                    <div key={section} className="text-center">
                      <div className={`text-lg font-bold ${scoreColor(s)}`}>{s}</div>
                      <div className="text-xs text-slate-500">{t(`star.${section}.label`)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Analysis */}
            {deliveryMetrics && (
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
                <p className="text-xs font-semibold text-purple-300 mb-3 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" /> {t("speechDeliveryAnalysis")}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`rounded-lg border p-3 ${scoreBg(deliveryMetrics.deliveryScore)}`}>
                    <div className={`text-xl font-bold ${scoreColor(deliveryMetrics.deliveryScore)}`}>{deliveryMetrics.deliveryScore}/10</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t("deliveryScore")}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-3">
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-500" />
                      <span className={`text-xl font-bold ${deliveryMetrics.wordsPerMinute >= 130 && deliveryMetrics.wordsPerMinute <= 160 ? "text-emerald-400" : deliveryMetrics.wordsPerMinute >= 100 && deliveryMetrics.wordsPerMinute <= 190 ? "text-yellow-400" : "text-red-400"}`}>
                        {deliveryMetrics.wordsPerMinute}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{t("wpmPace", { pace: deliveryMetrics.paceLabel })}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/60 p-3">
                    <div className="text-xl font-bold text-slate-300">{t("seconds", { count: deliveryMetrics.durationSeconds })}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t("wordCount", { count: deliveryMetrics.totalWords })}</div>
                  </div>
                </div>

                {/* Filler words breakdown */}
                {deliveryMetrics.fillerWords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1.5">{t("fillerWordsDetected")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {deliveryMetrics.fillerWords.map((f) => (
                        <span key={f.word} className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                          &ldquo;{f.word}&rdquo; × {f.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                  <p><span className="text-slate-300 font-medium">{t("paceLabel")}</span> {deliveryMetrics.paceFeedback}</p>
                  <p><span className="text-slate-300 font-medium">{t("fillersLabel")}</span> {deliveryMetrics.fillerFeedback}</p>
                  <p><span className="text-slate-300 font-medium">{t("flowLabel")}</span> {deliveryMetrics.pauseFeedback}</p>
                </div>
              </div>
            )}

            {/* Improvements */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
              <p className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {t("improvements")}
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
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("strengths")}
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
              <button onClick={() => {
                setScoreResult(null);
                setStarAnswer({ situation: "", task: "", action: "", result: "" });
                setDeliveryMetrics(null);
                setCombinedScore(null);
                speech.reset();
                spokenTranscriptsRef.current = [];
                spokenDurationsRef.current = [];
                spokenPausesRef.current = [];
              }}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                {t("tryAgain")}
              </button>
              <button onClick={() => { setMode("question-bank"); setStarQuestion(null); setScoreResult(null); }}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors">
                {t("nextQuestion")}
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
          <ArrowLeft className="w-4 h-4" /> {t("backToPrep")}
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">{t("questionBankTitle")}</h1>
          <span className="text-xs text-slate-500">{t("questionsCount", { count: allQuestions.length })}</span>
        </div>

        {/* Gap-analysis powered questions */}
        {(skillGaps.length > 0 || displayRole) && (
          <div className="rounded-2xl bg-purple-900/20 border border-purple-700/30 p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {skillGaps.length > 0 ? t("gapQuestionsTitle") : t("aiQuestionsTitle")}
              </h2>
              <button onClick={generateGapQuestions} disabled={generatingGap || !displayRole}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {generatingGap ? <><Loader2 className="w-3 h-3 animate-spin" /> {t("generating")}</> : <><Sparkles className="w-3 h-3" /> {t("generate")}</>}
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
                      <span className={`text-xs px-1.5 py-0.5 rounded ${q.type === "behavioral" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>{t(`type.${q.type}`)}</span>
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
            <Filter className="w-3.5 h-3.5" /> {t("filters")}
          </div>
          <select value={bankArchetype} onChange={(e) => setBankArchetype(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white">
            <option value="all">{t("allArchetypes")}</option>
            <option value="general">{t("generalBehavioral")}</option>
            {archetypes.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value as typeof bankFilter)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white">
            <option value="all">{t("allTypes")}</option>
            <option value="behavioral">{t("type.behavioral")}</option>
            <option value="technical">{t("type.technical")}</option>
          </select>
          <select value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value as typeof bankDifficulty)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white">
            <option value="all">{t("allDifficulty")}</option>
            <option value="easy">{t("difficulty.easy")}</option>
            <option value="medium">{t("difficulty.medium")}</option>
            <option value="hard">{t("difficulty.hard")}</option>
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
                      <span className={`text-xs px-1.5 py-0.5 rounded ${q.type === "behavioral" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>{t(`type.${q.type}`)}</span>
                      <span className="text-xs text-slate-500">{q.category}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        q.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-400" :
                        q.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>{t(`difficulty.${q.difficulty}`)}</span>
                      {practiced && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("practiced")}</span>}
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
          <ArrowLeft className="w-4 h-4" /> {t("backToPrep")}
        </button>

        <h1 className="text-2xl font-extrabold mb-6">{t("practiceHistoryTitle")}</h1>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 text-center">
            <div className="text-2xl font-bold text-white">{practiceCount}</div>
            <div className="text-xs text-slate-500 mt-1">{t("questionsPracticed")}</div>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 text-center">
            <div className={`text-2xl font-bold ${typeof avgScore === "string" && avgScore !== "—" ? scoreColor(parseFloat(avgScore)) : "text-slate-500"}`}>
              {avgScore}
            </div>
            <div className="text-xs text-slate-500 mt-1">{t("avgScore")}</div>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 text-center">
            <div className={`text-2xl font-bold ${bestScore ? scoreColor(bestScore) : "text-slate-500"}`}>
              {bestScore || "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">{t("bestScore")}</div>
          </div>
        </div>

        {/* Score over time chart (simple text-based) */}
        {sessions.length > 1 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 mb-6">
            <p className="text-xs font-semibold text-slate-300 mb-3">{t("scoreTrend")}</p>
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
            <p className="font-semibold">{t("noSessions")}</p>
            <p className="text-sm mt-1">{t("noSessionsHint")}</p>
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
                  <div className={`text-lg font-bold ${scoreColor(s.combinedScore ?? s.score.overallScore)}`}>
                    {s.combinedScore ?? s.score.overallScore}/10
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                  <span>{t("relevanceShort")} <span className={scoreColor(s.score.relevance.score)}>{s.score.relevance.score}</span></span>
                  <span>{t("starShort")} <span className={scoreColor(s.score.starStructure.score)}>{s.score.starStructure.score}</span></span>
                  <span>{t("specificityShort")} <span className={scoreColor(s.score.specificity.score)}>{s.score.specificity.score}</span></span>
                  {s.delivery && (
                    <>
                      <span>{t("deliveryShort")} <span className={scoreColor(s.delivery.deliveryScore)}>{s.delivery.deliveryScore}</span></span>
                      <span className="text-slate-600">{t("wpmFillers", { wpm: s.delivery.wordsPerMinute, fillers: s.delivery.fillerWords.reduce((sum, f) => sum + f.count, 0) })}</span>
                    </>
                  )}
                </div>
                <button onClick={() => selectStarQuestion({
                  id: s.questionId, question: s.question, type: "behavioral",
                  category: "", difficulty: "medium",
                })}
                  className="text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors">
                  {t("practiceAgain")}
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
            {t("prepEngineBadge")}
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            {t("setupHeading")}
          </h1>
          <p className="text-slate-400 leading-relaxed">
            {t("setupSubtitle")}
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-1 bg-slate-800/60 rounded-xl p-1 mb-8">
          {([
            { key: "live" as Mode, icon: Mic2, label: t("tabLive") },
            { key: "star-practice" as Mode, icon: Target, label: t("tabStar") },
            { key: "question-bank" as Mode, icon: BookOpen, label: t("tabBank") },
            { key: "history" as Mode, icon: BarChart3, label: t("tabHistory") },
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
            <label className="block text-sm font-medium text-slate-300 mb-3">{t("targetRole")}</label>
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
                }`}>{t("otherRole")}</button>
            </div>
            {targetRole === "custom" && (
              <input type="text" value={customRole} onChange={(e) => setCustomRole(e.target.value)}
                placeholder={t("customRolePlaceholder")}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus />
            )}
          </div>

          {/* Interview type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">{t("interviewType")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INTERVIEW_TYPE_VALUES.map((value) => (
                <button key={value} onClick={() => setInterviewType(value)}
                  className={`px-3 py-3 rounded-xl text-left transition-colors ${
                    interviewType === value
                      ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                      : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                  }`}>
                  <div className="text-sm font-semibold mb-0.5">{t(`interviewTypes.${value}.label`)}</div>
                  <div className="text-xs text-slate-500">{t(`interviewTypes.${value}.desc`)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Job description */}
          <div>
            <button onClick={() => setShowJdInput(!showJdInput)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              <FileText className="w-4 h-4 text-purple-400" />
              {t("pasteJobDescription")}
              <span className="text-xs text-slate-500 font-normal">{t("optional")}</span>
              {showJdInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showJdInput && (
              <div className="mt-3 space-y-2">
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={t("jdPlaceholder")}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y" />
                {jobDescription.trim() && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <FileText className="w-3 h-3" /> {t("jdLoaded")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skill gaps indicator */}
          {skillGaps.length > 0 && (
            <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3">
              <p className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5" /> {t("skillGapsLoaded")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skillGaps.slice(0, 5).map((g) => (
                  <span key={g.skill} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{g.skill}</span>
                ))}
                {skillGaps.length > 5 && <span className="text-xs text-slate-500">{t("moreCount", { count: skillGaps.length - 5 })}</span>}
              </div>
            </div>
          )}

          <button onClick={startInterview}
            disabled={!targetRole || (targetRole === "custom" && !customRole.trim())}
            className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed">
            {t("startLiveInterview")}
          </button>

          <p className="text-slate-500 text-xs text-center">
            {jobDescription.trim() ? t("setupFootnoteTailored") : t("setupFootnote")}
          </p>

          {/* Quick access cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => setMode("question-bank")}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/40 text-left transition-colors group">
              <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{t("questionBankTitle")}</p>
              <p className="text-xs text-slate-500 mt-1">{t("questionBankCardDesc")}</p>
            </button>
            <button onClick={() => setMode("history")}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-purple-500/40 text-left transition-colors group">
              <BarChart3 className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{t("yourProgress")}</p>
              <p className="text-xs text-slate-500 mt-1">
                {practiceCount > 0 ? t("progressSummary", { count: practiceCount, avg: avgScore }) : t("trackScores")}
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
            <button onClick={resetInterview} className="text-slate-400 hover:text-white transition-colors p-1" aria-label={t("backToSetup")}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Mic2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{t("headerTitle")}</h1>
              <p className="text-xs text-slate-400">
                {displayRole} · {t(`interviewTypes.${interviewType}.label`)}
                {jobDescription.trim() && <span className="text-purple-400"> {t("jdTailored")}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {phase === "interview" && <span className="text-xs text-slate-500">{t("questionCounter", { current: questionCount })}</span>}
            {phase === "done" && <span className="text-xs text-emerald-400 font-semibold">{t("interviewComplete")}</span>}
            <button onClick={resetInterview}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">
              <RotateCcw className="w-3.5 h-3.5" /> {t("new")}
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
                  <p className="whitespace-pre-wrap">{msg.content === "Please give me my interview feedback and scorecard." ? t("endInterviewUserMessage") : msg.content}</p>
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
              <p className="text-emerald-400 font-semibold mb-3">{t("interviewComplete")}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={resetInterview}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors">
                  {t("practiceAgainBtn")}
                </button>
                <button onClick={() => { resetInterview(); setMode("question-bank"); }}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                  {t("starPractice")}
                </button>
                <Link href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                  {t("backToDashboard")}
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
                  {t("endInterviewFeedback")}
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} value={input}
                onChange={(e) => { setInput(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder={t("answerPlaceholder")} rows={1}
                style={{ minHeight: "44px", maxHeight: "120px" }}
                className="flex-1 bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-colors" />
              <button onClick={() => handleSend()} disabled={!input.trim() || streaming}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0" aria-label={t("sendAnswer")}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center">{t("inputHint")}</p>
          </div>
        </div>
      )}
    </main>
  );
}
