"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ArrowLeft, Mic2, RotateCcw } from "lucide-react";
import Link from "next/link";

type InterviewType = "behavioral" | "technical" | "situational";
type Phase = "setup" | "interview" | "done";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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

export default function MockInterviewClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showEndOption, setShowEndOption] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
          messages: [{ role: "user", content: "Start the interview." }],
          questionCount: 0,
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

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const role = targetRole === "custom" ? customRole.trim() : targetRole;
    const isEndRequest = content.toLowerCase().includes("end interview") || content === "__end__";
    const nextQuestionCount = questionCount + 1;

    const userMessage: Message = { role: "user", content: isEndRequest ? "Please give me my interview feedback and scorecard." : content, timestamp: Date.now() };
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
          targetRole: role,
          interviewType,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          questionCount: willEnd ? 6 : nextQuestionCount,
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
            <div className="grid grid-cols-2 gap-2 mb-3">
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
            <div className="grid grid-cols-3 gap-2">
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

          <button
            onClick={startInterview}
            disabled={!targetRole || (targetRole === "custom" && !customRole.trim())}
            className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Mock Interview →
          </button>

          <p className="text-slate-500 text-xs text-center">
            5 questions · ~10 minutes · Feedback scorecard at the end
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
              <p className="text-xs text-slate-400">{displayRole} · {interviewType}</p>
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
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetInterview}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors"
                >
                  Practice Again
                </button>
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
            </div>
            <p className="text-[10px] text-slate-600 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </main>
  );
}
