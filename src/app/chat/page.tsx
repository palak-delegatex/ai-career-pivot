"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ArrowLeft, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";
import WeeklyCheckIn from "@/components/WeeklyCheckIn";
import SuggestedTopics from "@/components/SuggestedTopics";
import SessionSelector from "@/components/SessionSelector";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface SessionInfo {
  id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface PlanContext {
  reportId: string;
  planIndex: number;
  targetRole: string;
  targetIndustry: string;
  completionPercent: number;
  nextMilestone: string | null;
  totalMilestones: number;
  completedMilestones: number;
  currentPhase: string;
  incompleteMilestones: string[];
  skillGaps: { skill: string; priority: string }[];
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  function inlineFormat(str: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let rest = str;
    let i = 0;

    while (rest.length > 0) {
      const boldMatch = rest.match(/^([\s\S]*?)\*\*([\s\S]*?)\*\*([\s\S]*)$/);
      const codeMatch = rest.match(/^([\s\S]*?)`([^`]+)`([\s\S]*)$/);

      const nextBold = boldMatch ? boldMatch[1].length : Infinity;
      const nextCode = codeMatch ? codeMatch[1].length : Infinity;

      if (boldMatch && nextBold <= nextCode) {
        if (boldMatch[1]) parts.push(<span key={i++}>{boldMatch[1]}</span>);
        parts.push(<strong key={i++} className="font-semibold text-white">{boldMatch[2]}</strong>);
        rest = boldMatch[3];
      } else if (codeMatch && nextCode < nextBold) {
        if (codeMatch[1]) parts.push(<span key={i++}>{codeMatch[1]}</span>);
        parts.push(<code key={i++} className="bg-slate-700/60 text-teal-300 px-1 rounded text-xs font-mono">{codeMatch[2]}</code>);
        rest = codeMatch[3];
      } else {
        parts.push(<span key={i++}>{rest}</span>);
        break;
      }
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      nodes.push(<p key={key++} className="font-semibold text-white text-sm mt-2 mb-0.5">{inlineFormat(line.slice(4))}</p>);
    } else if (line.startsWith("## ")) {
      nodes.push(<p key={key++} className="font-bold text-white text-sm mt-2 mb-1">{inlineFormat(line.slice(3))}</p>);
    } else if (line.match(/^[-*] /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(<li key={i} className="leading-snug">{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(<ul key={key++} className="list-disc list-inside space-y-0.5 my-1 text-slate-200">{items}</ul>);
      continue;
    } else if (line.match(/^\d+\. /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(<li key={i} className="leading-snug">{inlineFormat(lines[i].replace(/^\d+\. /, ""))}</li>);
        i++;
      }
      nodes.push(<ol key={key++} className="list-decimal list-inside space-y-0.5 my-1 text-slate-200">{items}</ol>);
      continue;
    } else if (line.trim() === "") {
      if (nodes.length > 0) nodes.push(<div key={key++} className="h-1.5" />);
    } else {
      nodes.push(<p key={key++} className="leading-relaxed">{inlineFormat(line)}</p>);
    }
    i++;
  }
  return nodes;
}

function CoachAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <CoachAvatar />}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
        isUser
          ? "bg-teal-600 text-white"
          : "bg-slate-800/60 text-slate-200 border-l-[3px] border-teal-500/60"
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
        )}
        {msg.timestamp && (
          <p className="text-[10px] opacity-50 mt-1 text-right">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [planContext, setPlanContext] = useState<PlanContext | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);
  const [sessionSelectorOpen, setSessionSelectorOpen] = useState(false);
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

  useEffect(() => {
    loadDashboardContext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDashboardContext() {
    setLoading(true);
    try {
      const dashRes = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const dashData = await dashRes.json();
      if (!dashData.reports?.length) {
        setLoading(false);
        return;
      }

      const report = dashData.reports[0];
      const plan = report.plans[0];
      const planIndex = 0;

      const progressRes = await fetch(
        `/api/roadmap/progress?reportId=${report.id}&planIndex=${planIndex}`
      );
      const progressData = await progressRes.json();
      const milestoneRows = progressData.progress ?? [];

      const allMilestones = [
        ...plan.sixMonthMilestones.map((m: string, i: number) => ({ text: m, phase: "6mo", idx: i })),
        ...plan.oneYearMilestones.map((m: string, i: number) => ({ text: m, phase: "1yr", idx: i })),
        ...plan.twoYearMilestones.map((m: string, i: number) => ({ text: m, phase: "2yr", idx: i })),
      ];

      const completedSet = new Set(
        milestoneRows
          .filter((r: { completed: boolean }) => r.completed)
          .map((r: { phase: string; milestone_index: number }) => `${r.phase}:${r.milestone_index}`)
      );

      const completedCount = completedSet.size;
      const totalCount = allMilestones.length;
      const incompleteMilestones = allMilestones
        .filter((m) => !completedSet.has(`${m.phase}:${m.idx}`))
        .map((m) => m.text);

      let currentPhase = "6 Months";
      const sixDone = plan.sixMonthMilestones.every((_: string, i: number) => completedSet.has(`6mo:${i}`));
      const oneDone = plan.oneYearMilestones.every((_: string, i: number) => completedSet.has(`1yr:${i}`));
      if (sixDone && oneDone) currentPhase = "2 Years";
      else if (sixDone) currentPhase = "1 Year";

      const nextIncomplete = incompleteMilestones[0] ?? null;

      setPlanContext({
        reportId: report.id,
        planIndex,
        targetRole: plan.targetRole,
        targetIndustry: plan.targetIndustry,
        completionPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        nextMilestone: nextIncomplete,
        totalMilestones: totalCount,
        completedMilestones: completedCount,
        currentPhase,
        incompleteMilestones: incompleteMilestones.slice(0, 6),
        skillGaps: (plan.skillGaps ?? []).slice(0, 6).map((g: { skill: string; priority: string }) => ({
          skill: g.skill,
          priority: g.priority,
        })),
      });

      const sessionsRes = await fetch(
        `/api/sessions?reportId=${report.id}&planIndex=${planIndex}`
      );
      const sessionsData = await sessionsRes.json();
      const loadedSessions: SessionInfo[] = sessionsData.sessions ?? [];
      setSessions(loadedSessions);

      if (loadedSessions.length > 0) {
        const latest = loadedSessions[0];
        setSessionId(latest.id);
        if (latest.messages?.length > 0) {
          setMessages(latest.messages);
        }
        setLastSessionDate(latest.updated_at);

        const daysSince = Math.floor(
          (Date.now() - new Date(latest.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince >= 5) {
          setShowCheckIn(true);
        }
      } else {
        const createRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: report.id, planIndex }),
        });
        const createData = await createRes.json();
        setSessionId(createData.sessionId);
        setShowCheckIn(true);
      }
    } catch {
      // Best-effort
    } finally {
      setLoading(false);
    }
  }

  async function switchSession(session: SessionInfo) {
    setSessionId(session.id);
    setMessages(session.messages ?? []);
    setSessionSelectorOpen(false);
  }

  async function startNewSession() {
    if (!planContext) return;
    const createRes = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: planContext.reportId,
        planIndex: planContext.planIndex,
      }),
    });
    const createData = await createRes.json();
    setSessionId(createData.sessionId);
    setMessages([]);
    setSessions((prev) => [
      { id: createData.sessionId, messages: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ...prev,
    ]);
    setSessionSelectorOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  async function saveMessages(msgs: Message[], sid: string | null) {
    if (!sid) return;
    try {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, messages: msgs }),
      });
    } catch {
      // Best-effort
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming || !planContext) return;

    const userMessage: Message = { role: "user", content, timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setStreaming(true);
    setShowCheckIn(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: planContext.reportId,
          planIndex: planContext.planIndex,
          messages: updatedMessages,
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

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

      const finalMessages = [
        ...updatedMessages,
        { role: "assistant" as const, content: assistantContent, timestamp: ts },
      ];
      setMessages(finalMessages);
      saveMessages(finalMessages, sessionId);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: finalMessages, updated_at: new Date().toISOString() }
            : s
        )
      );
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""),
        {
          role: "assistant",
          content: "Sorry, I had trouble responding. Please try again in a moment.",
          timestamp: Date.now(),
        },
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

  function handleCheckInReview() {
    if (!planContext) return;
    const prompt = `I'd like to review my progress. I'm at ${planContext.completionPercent}% completion with ${planContext.completedMilestones} of ${planContext.totalMilestones} milestones done. I'm currently in the ${planContext.currentPhase} phase. Can you help me assess where I stand and what I should focus on next?`;
    handleSend(prompt);
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading your coaching session...</p>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  if (!planContext) {
    return (
      <AuthenticatedLayout>
        <main className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-slate-400 mb-4">No career plan found. Complete your assessment first.</p>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
    <main className="flex flex-col h-screen max-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <CoachAvatar />
            <div>
              <h1 className="text-sm font-bold text-white">Career Coach</h1>
              <p className="text-xs text-slate-400">{planContext.targetRole}</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setSessionSelectorOpen(!sessionSelectorOpen)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Previous sessions
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {sessionSelectorOpen && (
              <SessionSelector
                sessions={sessions}
                currentSessionId={sessionId}
                onSelect={switchSession}
                onNewSession={startNewSession}
                onClose={() => setSessionSelectorOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {showCheckIn && (
            <WeeklyCheckIn
              completionPercent={planContext.completionPercent}
              completedMilestones={planContext.completedMilestones}
              totalMilestones={planContext.totalMilestones}
              lastSessionDate={lastSessionDate}
              onReview={handleCheckInReview}
              onDismiss={() => setShowCheckIn(false)}
            />
          )}

          {messages.length === 0 && !showCheckIn && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
                <Sparkles className="w-6 h-6 text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Career Coach</h2>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Your AI coaching partner for the {planContext.targetRole} pivot. Ask about your progress, get advice on next steps, or work through challenges.
              </p>
            </div>
          )}

          {messages.length === 0 && (
            <SuggestedTopics
              planContext={planContext}
              onSelect={handleSend}
            />
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}

          {streaming && messages.length > 0 && messages[messages.length - 1].content === "" && (
            <div className="flex gap-2.5 justify-start">
              <CoachAvatar />
              <div className="bg-slate-800/60 border-l-[3px] border-teal-500/60 rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar — fixed at bottom */}
      <div className="shrink-0 border-t border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask your career coach..."
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
              className="flex-1 bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none transition-colors overflow-y-auto"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || streaming}
              className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-xl transition-colors shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </main>
    </AuthenticatedLayout>
  );
}
