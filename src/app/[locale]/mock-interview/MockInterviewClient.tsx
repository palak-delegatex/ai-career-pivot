"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ArrowLeft, Mic2, RotateCcw, FileText, ChevronDown, ChevronUp, Keyboard, Play, Pause, Square, Volume2 } from "lucide-react";
import Link from "next/link";
import NextStepCTA from "@/components/NextStepCTA";
import { useVoiceRecorder, type SpeechMetrics } from "./useVoiceRecorder";
import { useLocale } from "next-intl";

type InterviewType = "behavioral" | "technical" | "situational";
type InputMode = "text" | "voice";
type Phase = "setup" | "interview" | "done";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  audioUrl?: string | null;
  speechMetrics?: SpeechMetrics | null;
}

const INTERVIEW_TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: "behavioral", label: "Behavioral", desc: "Tell me about a time…" },
  { value: "situational", label: "Situational", desc: "What would you do if…" },
  { value: "technical", label: "Technical", desc: "Role-specific knowledge" },
];

const POPULAR_ROLES = [
  "Product Manager", "Data Analyst", "UX Designer", "Software Engineer",
  "Marketing Manager", "Operations Manager", "Sales Manager", "Data Scientist",
];

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
      nodes.push(
        <p key={key++} className="leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  }
  return <>{nodes}</>;
}

function AudioPlayback({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <span className="inline-flex items-center gap-1 ml-2">
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className="text-purple-400 hover:text-purple-300 transition-colors p-0.5"
        aria-label={playing ? "Pause recording" : "Play recording"}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <Volume2 className="w-3 h-3 text-slate-500" />
    </span>
  );
}

function SpeechMetricsDisplay({ metrics }: { metrics: SpeechMetrics }) {
  const pacingLabel =
    metrics.wordsPerMinute < 100 ? "Slow" :
    metrics.wordsPerMinute > 170 ? "Fast" : "Good";
  const pacingColor =
    metrics.wordsPerMinute < 100 ? "text-amber-400" :
    metrics.wordsPerMinute > 170 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-700/50 rounded-full px-2 py-0.5">
        <span className="text-slate-400">{metrics.durationSeconds}s</span>
      </span>
      <span className={`inline-flex items-center gap-1 text-[10px] bg-slate-700/50 rounded-full px-2 py-0.5 ${pacingColor}`}>
        {metrics.wordsPerMinute} wpm · {pacingLabel}
      </span>
      {metrics.fillerWordTotal > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-900/30 border border-amber-800/30 rounded-full px-2 py-0.5 text-amber-400">
          {metrics.fillerWordTotal} filler{metrics.fillerWordTotal !== 1 ? "s" : ""}
          ({metrics.fillerWords.map((f) => f.word).join(", ")})
        </span>
      )}
      {metrics.fillerWordTotal === 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-900/30 border border-emerald-800/30 rounded-full px-2 py-0.5 text-emerald-400">
          No fillers
        </span>
      )}
    </div>
  );
}

export default function MockInterviewClient() {
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>("setup");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showEndOption, setShowEndOption] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceRecorder();
  const allMetricsRef = useRef<SpeechMetrics[]>([]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load target role from user's plan if available
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("intake_profile");
      if (raw) {
        const profile = JSON.parse(raw);
        if (!targetRole && profile.currentTitle) {
          // Don't auto-fill — let them choose their TARGET role
        }
      }
    } catch {}
  }, [targetRole]);

  async function startInterview() {
    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    if (!role) return;

    setPhase("interview");
    setStreaming(true);

    const initialMessages: Message[] = [];
    setMessages(initialMessages);

    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role,
          interviewType,
          jobDescription: jobDescription.trim() || undefined,
          messages: [{ role: "user", content: "Start the interview." }],
          questionCount: 0,
          locale,
        }),
      });

      if (!res.ok) throw new Error("Failed to start interview");

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
      setMessages([{
        role: "assistant",
        content: "Sorry, I had trouble starting the interview. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleSend(text?: string, voiceAudioUrl?: string | null, voiceMetrics?: SpeechMetrics | null) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    const isEndRequest = content.toLowerCase().includes("end interview") || content === "__end__";
    const nextQuestionCount = questionCount + 1;

    if (voiceMetrics) {
      allMetricsRef.current.push(voiceMetrics);
    }

    const userMessage: Message = {
      role: "user",
      content: isEndRequest ? "Please give me my interview feedback and scorecard." : content,
      timestamp: Date.now(),
      audioUrl: voiceAudioUrl,
      speechMetrics: voiceMetrics,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setStreaming(true);
    setShowEndOption(false);

    const willEnd = isEndRequest || nextQuestionCount >= 5;

    const aggregatedMetrics = willEnd ? aggregateSpeechMetrics(allMetricsRef.current) : undefined;

    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role,
          interviewType,
          jobDescription: jobDescription.trim() || undefined,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          questionCount: willEnd ? 6 : nextQuestionCount,
          speechMetrics: aggregatedMetrics,
          locale,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

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

      if (willEnd) {
        setPhase("done");
      } else {
        setQuestionCount(nextQuestionCount);
        if (nextQuestionCount >= 3) setShowEndOption(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble responding. Please try again.", timestamp: Date.now() },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleVoiceSend() {
    const result = voice.stopRecording();
    if (!result) {
      voice.clearRecording();
      return;
    }
    handleSend(result.transcript, voice.audioUrl, result.metrics);
    voice.clearRecording();
  }

  function aggregateSpeechMetrics(all: SpeechMetrics[]): object | undefined {
    if (all.length === 0) return undefined;
    const totalDuration = all.reduce((s, m) => s + m.durationSeconds, 0);
    const totalWords = all.reduce((s, m) => s + m.wordCount, 0);
    const avgWpm = totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60) : 0;
    const fillerMap = new Map<string, number>();
    for (const m of all) {
      for (const f of m.fillerWords) {
        fillerMap.set(f.word, (fillerMap.get(f.word) ?? 0) + f.count);
      }
    }
    const totalFillers = [...fillerMap.values()].reduce((s, c) => s + c, 0);
    return {
      totalAnswers: all.length,
      totalDurationSeconds: totalDuration,
      totalWords,
      averageWordsPerMinute: avgWpm,
      totalFillerWords: totalFillers,
      fillerWordPercentage: totalWords > 0 ? Math.round((totalFillers / totalWords) * 100) : 0,
      topFillers: [...fillerMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count })),
    };
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function resetInterview() {
    setPhase("setup");
    setMessages([]);
    setQuestionCount(0);
    setShowEndOption(false);
    setInput("");
    setJobDescription("");
    setShowJdInput(false);
    voice.clearRecording();
    allMetricsRef.current = [];
  }

  const displayRole = targetRole === "custom" ? customRole : targetRole;

  // Setup screen
  if (phase === "setup") {
    return (
      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-600/30 text-purple-400 text-xs font-semibold mb-4">
            <Mic2 className="w-3.5 h-3.5" />
            AI Mock Interviews
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Practice Your Interview
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Get role-specific questions, real-time feedback, and a performance scorecard.
          </p>
        </div>

        <div className="space-y-6">
          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Target Role</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {POPULAR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setTargetRole(role)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    targetRole === role
                      ? "bg-purple-600 text-white"
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

          {/* Interview type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Interview Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map(({ value, label, desc }) => (
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

          {/* Job description (optional) */}
          <div>
            <button
              onClick={() => setShowJdInput(!showJdInput)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              Paste a job description
              <span className="text-xs text-slate-500 font-normal">(optional)</span>
              {showJdInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showJdInput && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job posting here — we'll tailor every question to what they're actually looking for…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                />
                {jobDescription.trim() && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <FileText className="w-3 h-3" />
                    JD loaded — questions will be tailored to this role
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input mode selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Answer Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setInputMode("text")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-colors ${
                  inputMode === "text"
                    ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                    : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                }`}
              >
                <Keyboard className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Type</div>
                  <div className="text-xs text-slate-500">Text answers</div>
                </div>
              </button>
              <button
                onClick={() => setInputMode("voice")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-colors ${
                  inputMode === "voice"
                    ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                    : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                }`}
              >
                <Mic2 className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Speak</div>
                  <div className="text-xs text-slate-500">Voice + analysis</div>
                </div>
              </button>
            </div>
            {inputMode === "voice" && !voice.supported && (
              <p className="text-amber-400 text-xs mt-2">
                Voice input requires Chrome or Edge. You can switch to text mode.
              </p>
            )}
          </div>

          <button
            onClick={startInterview}
            disabled={!targetRole || (targetRole === "custom" && !customRole.trim())}
            className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Mock Interview →
          </button>

          <p className="text-slate-500 text-xs text-center">
            5 questions · ~10 minutes · {inputMode === "voice" ? "Voice analysis & feedback" : jobDescription.trim() ? "Tailored to your job posting" : "Feedback scorecard at the end"}
          </p>
        </div>
      </main>
    );
  }

  // Interview / done screen
  return (
    <main className="flex flex-col h-[calc(100vh-72px)] max-h-[calc(100vh-72px)]">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={resetInterview}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Back to setup"
            >
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
            {phase === "interview" && (
              <span className="text-xs text-slate-500">Q{questionCount}/5</span>
            )}
            {phase === "done" && (
              <span className="text-xs text-emerald-400 font-semibold">Interview Complete</span>
            )}
            <button
              onClick={resetInterview}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
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
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800/60 text-slate-200 border-l-[3px] border-purple-500/60"
              }`}>
                {msg.role === "user" ? (
                  <div>
                    <p className="whitespace-pre-wrap">
                      {msg.content === "Please give me my interview feedback and scorecard."
                        ? "End interview — give me my feedback."
                        : msg.content}
                      {msg.audioUrl && <AudioPlayback url={msg.audioUrl} />}
                    </p>
                    {msg.speechMetrics && <SpeechMetricsDisplay metrics={msg.speechMetrics} />}
                  </div>
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
            <div className="rounded-2xl bg-emerald-950/30 border border-emerald-800/30 p-5">
              <p className="text-emerald-400 font-semibold mb-3 text-center">Interview Complete</p>
              <div className="flex gap-3 justify-center mb-4">
                <button
                  onClick={resetInterview}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors"
                >
                  Practice Again
                </button>
              </div>
              <NextStepCTA fromTool="mock-interview" />
              <div className="flex justify-center mt-4">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      {phase === "interview" && (
        <div className="shrink-0 border-t border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-3xl mx-auto space-y-2">
            {showEndOption && !streaming && (
              <div className="flex justify-center">
                <button
                  onClick={() => handleSend("__end__")}
                  className="text-xs text-slate-400 hover:text-purple-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700 hover:border-purple-600/40"
                >
                  End interview & get feedback →
                </button>
              </div>
            )}

            {inputMode === "voice" ? (
              <div className="space-y-2">
                {voice.error && (
                  <p className="text-amber-400 text-xs text-center">{voice.error}</p>
                )}

                {voice.isRecording ? (
                  <div className="space-y-3">
                    <div className="bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3 min-h-[60px]">
                      <p className="text-sm text-white whitespace-pre-wrap">
                        {voice.transcript}
                        {voice.interimTranscript && (
                          <span className="text-slate-400">{voice.interimTranscript}</span>
                        )}
                        {!voice.transcript && !voice.interimTranscript && (
                          <span className="text-slate-500 italic">Listening... speak your answer</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Recording
                      </div>
                      <button
                        onClick={handleVoiceSend}
                        disabled={streaming}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Square className="w-3.5 h-3.5" />
                        Stop & Send
                      </button>
                      <button
                        onClick={() => { voice.stopRecording(); voice.clearRecording(); }}
                        className="px-3 py-2 text-slate-400 hover:text-white rounded-xl transition-colors text-xs hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={voice.startRecording}
                      disabled={streaming}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800/60 border border-slate-600 hover:border-purple-500 rounded-xl text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                    >
                      <Mic2 className="w-4 h-4 text-purple-400" />
                      Tap to speak your answer
                    </button>
                    <button
                      onClick={() => setInputMode("text")}
                      className="p-2.5 text-slate-400 hover:text-white rounded-xl transition-colors hover:bg-slate-800"
                      aria-label="Switch to text input"
                    >
                      <Keyboard className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-600 text-center">
                  {voice.isRecording ? "Speak naturally — click Stop & Send when done" : "Uses browser speech recognition · Works best in Chrome"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.currentTarget.style.height = "auto";
                      e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer..."
                    rows={1}
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                    className="flex-1 bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-colors"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || streaming}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                    aria-label="Send answer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  {voice.supported && (
                    <button
                      onClick={() => setInputMode("voice")}
                      className="p-2.5 text-slate-400 hover:text-purple-400 rounded-xl transition-colors shrink-0 hover:bg-slate-800"
                      aria-label="Switch to voice input"
                    >
                      <Mic2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 text-center">Enter to send · Shift+Enter for new line</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
