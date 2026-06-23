"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Radio,
  Square,
  Eye,
  EyeOff,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Settings,
  Zap,
  MessageSquare,
  Clock,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type CopilotPhase = "setup" | "live" | "debrief";

interface DetectedQuestion {
  id: string;
  text: string;
  timestamp: number;
  aiResponse: string | null;
  streaming: boolean;
}

interface TranscriptEntry {
  speaker: "interviewer" | "you";
  text: string;
  timestamp: number;
}

function useSpeechRecognition(
  onInterimResult: (transcript: string) => void,
  onFinalResult: (transcript: string) => void
) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRec);
  }, []);

  const start = useCallback(() => {
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          onFinalResult(finalTranscript.trim());
        } else {
          interim = transcript;
        }
      }
      onInterimResult(finalTranscript + interim);
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setListening(false);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-available") {
        setListening(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onInterimResult, onFinalResult]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

function detectQuestion(text: string): boolean {
  const questionPatterns = [
    /\?$/,
    /^(tell me|describe|explain|walk me through|how (do|did|would|could)|what (is|are|was|were|would|do)|why (did|do|would)|can you|could you|where (did|do)|when (did|do)|have you|give me an example)/i,
    /^(let's talk about|i'd like to understand|share with me|talk about a time)/i,
  ];
  const trimmed = text.trim();
  return questionPatterns.some((p) => p.test(trimmed));
}

function extractLastSentence(text: string): string {
  const sentences = text.split(/(?<=[.?!])\s+/);
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (sentences[i].trim().length > 10) return sentences[i].trim();
  }
  return text.trim();
}

export default function InterviewCopilotClient() {
  const [phase, setPhase] = useState<CopilotPhase>("setup");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeHighlights, setResumeHighlights] = useState("");
  const [stealthMode, setStealthMode] = useState(true);
  const [opacity, setOpacity] = useState(0.95);

  const [questions, setQuestions] = useState<DetectedQuestion[]>([]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [debriefContent, setDebriefContent] = useState("");
  const [debriefStreaming, setDebriefStreaming] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProcessedRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const questionIdCounter = useRef(0);

  const handleInterimResult = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const handleFinalResult = useCallback(
    (text: string) => {
      if (text === lastProcessedRef.current) return;

      const lastSentence = extractLastSentence(text);
      if (
        lastSentence.length > 15 &&
        detectQuestion(lastSentence) &&
        lastSentence !== lastProcessedRef.current
      ) {
        lastProcessedRef.current = lastSentence;
        const id = `q-${++questionIdCounter.current}`;
        const newQuestion: DetectedQuestion = {
          id,
          text: lastSentence,
          timestamp: Date.now(),
          aiResponse: null,
          streaming: true,
        };

        setQuestions((prev) => [...prev, newQuestion]);
        setExpandedQuestion(id);
        fetchCopilotResponse(id, lastSentence);

        setTranscript((prev) => [
          ...prev,
          { speaker: "interviewer", text: lastSentence, timestamp: Date.now() },
        ]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetRole, jobDescription, resumeHighlights]
  );

  const { listening, supported, start, stop } = useSpeechRecognition(
    handleInterimResult,
    handleFinalResult
  );

  async function fetchCopilotResponse(questionId: string, questionText: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = questions
        .filter((q) => q.aiResponse)
        .flatMap((q) => [
          { role: "user" as const, content: q.text },
          { role: "assistant" as const, content: q.aiResponse! },
        ]);

      const res = await fetch("/api/interview-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription || undefined,
          resumeHighlights: resumeHighlights || undefined,
          conversationHistory: history.length ? history : undefined,
          mode: "answer",
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, aiResponse: "Failed to generate response.", streaming: false }
              : q
          )
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, aiResponse: current, streaming: true } : q
          )
        );
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, aiResponse: accumulated, streaming: false } : q
        )
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, aiResponse: "Error generating response.", streaming: false }
              : q
          )
        );
      }
    }
  }

  function handleManualQuestion() {
    const text = manualInput.trim();
    if (!text) return;
    setManualInput("");

    const id = `q-${++questionIdCounter.current}`;
    const newQuestion: DetectedQuestion = {
      id,
      text,
      timestamp: Date.now(),
      aiResponse: null,
      streaming: true,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setExpandedQuestion(id);
    fetchCopilotResponse(id, text);

    setTranscript((prev) => [
      ...prev,
      { speaker: "interviewer", text, timestamp: Date.now() },
    ]);
  }

  function startSession() {
    if (!targetRole.trim()) return;
    setPhase("live");
    setSessionStart(Date.now());
    setQuestions([]);
    setTranscript([]);
  }

  async function endSession() {
    stop();
    setPhase("debrief");
    setDebriefStreaming(true);

    const fullTranscript = questions
      .map(
        (q) =>
          `Interviewer: ${q.text}\nSuggested response: ${q.aiResponse || "(no response)"}`
      )
      .join("\n\n");

    try {
      const res = await fetch("/api/interview-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: fullTranscript,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription || undefined,
          mode: "debrief",
        }),
      });

      if (!res.ok || !res.body) {
        setDebriefContent("Failed to generate debrief.");
        setDebriefStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setDebriefContent(accumulated);
      }

      setDebriefStreaming(false);
    } catch {
      setDebriefContent("Error generating debrief.");
      setDebriefStreaming(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatElapsed(start: number): string {
    const seconds = Math.floor((Date.now() - start) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [questions, expandedQuestion]);

  const [elapsed, setElapsed] = useState("0:00");
  useEffect(() => {
    if (!sessionStart || phase !== "live") return;
    const interval = setInterval(() => setElapsed(formatElapsed(sessionStart)), 1000);
    return () => clearInterval(interval);
  }, [sessionStart, phase]);

  // ── Setup Phase ──────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/mock-interview"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Mock Interview
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Interview Copilot</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Real-time AI assistance during live interviews. Get instant talking
            points, STAR answers, and relevant experience highlights as questions
            are asked.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Target Role <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Job Description{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description for role-specific answers..."
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Your Key Experience{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={resumeHighlights}
              onChange={(e) => setResumeHighlights(e.target.value)}
              placeholder="List key achievements, projects, and metrics the AI should weave into answers..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Settings size={14} />
              Display Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-400">
                  Stealth mode{" "}
                  <span className="text-slate-600">(reduced visibility)</span>
                </span>
                <button
                  onClick={() => setStealthMode(!stealthMode)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    stealthMode ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      stealthMode ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
              {stealthMode && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    Panel opacity: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {!supported && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-sm">
              Your browser does not support speech recognition. You can still
              type questions manually during the interview.
            </div>
          )}

          <button
            onClick={startSession}
            disabled={!targetRole.trim()}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Radio size={16} />
            Start Live Session
          </button>

          <p className="text-xs text-slate-600 text-center">
            Audio is processed locally via Web Speech API. No audio is stored or
            sent to servers — only detected question text is sent for AI
            response generation.
          </p>
        </div>
      </div>
    );
  }

  // ── Debrief Phase ────────────────────────────────────────────────────
  if (phase === "debrief") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Post-Interview Debrief</h1>
            <p className="text-sm text-slate-400">
              {targetRole} — {questions.length} question
              {questions.length !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          {debriefStreaming && !debriefContent && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="animate-pulse">●</span>
              Generating debrief...
            </div>
          )}
          {debriefContent && (
            <div className="prose prose-invert prose-sm max-w-none">
              {debriefContent.split("\n").map((line, i) => {
                if (line.startsWith("## "))
                  return (
                    <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">
                      {line.replace("## ", "")}
                    </h2>
                  );
                if (line.startsWith("**") && line.endsWith("**"))
                  return (
                    <p key={i} className="font-semibold text-slate-200 mt-3">
                      {line.replace(/\*\*/g, "")}
                    </p>
                  );
                if (line.startsWith("- "))
                  return (
                    <li key={i} className="text-slate-300 ml-4">
                      {line.replace("- ", "")}
                    </li>
                  );
                if (line.trim())
                  return (
                    <p key={i} className="text-slate-300">
                      {line}
                    </p>
                  );
                return <br key={i} />;
              })}
              {debriefStreaming && (
                <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Full Transcript ({questions.length} questions)
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={q.id} className="text-sm">
                <p className="text-slate-500 text-xs mb-0.5">
                  Q{i + 1} — {new Date(q.timestamp).toLocaleTimeString()}
                </p>
                <p className="text-slate-300 font-medium">{q.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const text = `Interview Debrief — ${targetRole}\n${new Date().toLocaleDateString()}\n\n${debriefContent}`;
              copyToClipboard(text, "debrief");
            }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            {copied === "debrief" ? <Check size={14} /> : <Copy size={14} />}
            {copied === "debrief" ? "Copied" : "Copy Debrief"}
          </button>
          <button
            onClick={() => {
              const blob = new Blob(
                [
                  `Interview Debrief — ${targetRole}\n${new Date().toLocaleDateString()}\n\n${debriefContent}\n\n---\nFull Transcript:\n\n${questions.map((q, i) => `Q${i + 1}: ${q.text}\nSuggested: ${q.aiResponse || "N/A"}`).join("\n\n")}`,
                ],
                { type: "text/plain" }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `interview-debrief-${targetRole.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={14} />
            Download
          </button>
          <Link
            href="/mock-interview"
            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-all"
          >
            Practice More
          </Link>
        </div>
      </div>
    );
  }

  // ── Live Phase ───────────────────────────────────────────────────────
  return (
    <div
      className="max-w-md mx-auto px-3 py-4 select-none"
      style={{ opacity: stealthMode ? opacity : 1 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              listening ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            }`}
          />
          <span className="text-xs font-medium text-slate-400">
            {listening ? "Listening" : "Paused"}
          </span>
          <span className="text-xs text-slate-600 flex items-center gap-1">
            <Clock size={10} />
            {elapsed}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setStealthMode(!stealthMode)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {stealthMode ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {stealthMode ? "Stealth on" : "Stealth off"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Settings size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <button
            onClick={endSession}
            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
          >
            <Square size={10} />
            End
          </button>
        </div>
      </div>

      {/* Inline settings */}
      {showSettings && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 mb-3 space-y-2">
          <div>
            <label className="text-xs text-slate-500">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Microphone control */}
      <div className="flex items-center gap-2 mb-3">
        {supported && (
          <button
            onClick={listening ? stop : start}
            className={`p-2.5 rounded-lg transition-all ${
              listening
                ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {listening ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleManualQuestion();
          }}
          className="flex-1 flex gap-1.5"
        >
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type a question manually..."
            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <MessageSquare size={14} />
          </button>
        </form>
      </div>

      {/* Live transcript preview */}
      {listening && interimText && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-slate-500 mb-0.5">Hearing...</p>
          <p className="text-sm text-slate-400 italic line-clamp-2">
            {interimText.slice(-200)}
          </p>
        </div>
      )}

      {/* Questions list */}
      <div
        ref={scrollRef}
        className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {questions.length === 0 && (
          <div className="text-center py-8">
            <Zap size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              {listening
                ? "Listening for interview questions..."
                : "Start listening or type a question to begin"}
            </p>
          </div>
        )}

        {questions.map((q, idx) => {
          const isExpanded = expandedQuestion === q.id;
          return (
            <div
              key={q.id}
              className="bg-slate-800/40 border border-slate-700/40 rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedQuestion(isExpanded ? null : q.id)
                }
                className="w-full text-left px-3 py-2 flex items-start justify-between gap-2 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-emerald-500 font-medium">
                    Q{idx + 1}
                  </span>
                  <p className="text-sm text-slate-200 line-clamp-1">
                    {q.text}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {q.streaming && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {isExpanded ? (
                    <ChevronUp size={12} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={12} className="text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded && q.aiResponse && (
                <div className="px-3 pb-3 border-t border-slate-700/30">
                  <div className="pt-2 text-sm text-slate-300 space-y-1">
                    {q.aiResponse.split("\n").map((line, i) => {
                      if (line.startsWith("**") && line.includes("**:"))
                        return (
                          <p
                            key={i}
                            className="text-emerald-400 font-medium text-xs mt-2"
                          >
                            {line.replace(/\*\*/g, "")}
                          </p>
                        );
                      if (line.startsWith("- "))
                        return (
                          <p key={i} className="text-slate-300 text-xs pl-2">
                            • {line.slice(2)}
                          </p>
                        );
                      if (line.trim())
                        return (
                          <p key={i} className="text-slate-400 text-xs">
                            {line}
                          </p>
                        );
                      return null;
                    })}
                    {q.streaming && (
                      <span className="inline-block w-1 h-3 bg-emerald-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => copyToClipboard(q.aiResponse!, q.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copied === q.id ? (
                        <Check size={10} />
                      ) : (
                        <Copy size={10} />
                      )}
                      {copied === q.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
