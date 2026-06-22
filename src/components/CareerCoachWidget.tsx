"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  X,
  Maximize2,
  Sparkles,
  MessageSquare,
  FileText,
  Users,
  Target,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCareerCoach } from "@/components/CareerCoachContext";
import type { SkillGap } from "@/lib/intake";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface Suggestion {
  id: string;
  title: string;
  prompt: string;
}

interface CareerCoachWidgetProps {
  reportId: string;
  planIndex: number;
  targetRole: string;
  completionPercent: number;
  completedMilestones: number;
  totalMilestones: number;
  currentPhaseLabel: string;
  skillGaps?: SkillGap[];
  nextMilestone?: string;
}

const NUDGE_KEY = (id: string) => `coach:nudge:${id}:dismissed`;
const PULSE_KEY = "coach:fab:pulse:shown";

function isNudgeDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NUDGE_KEY(id)) === "true";
}

function dismissNudgeStorage(id: string) {
  if (typeof window !== "undefined")
    localStorage.setItem(NUDGE_KEY(id), "true");
}

// --- Markdown renderer (matches existing FollowUpChat pattern) ---

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
      parts.push(
        <strong key={i++} className="font-semibold text-white">
          {boldMatch[2]}
        </strong>
      );
      rest = boldMatch[3];
    } else if (codeMatch && nextCode < nextBold) {
      if (codeMatch[1]) parts.push(<span key={i++}>{codeMatch[1]}</span>);
      parts.push(
        <code
          key={i++}
          className="bg-slate-700/60 text-teal-300 px-1 rounded text-xs font-mono"
        >
          {codeMatch[2]}
        </code>
      );
      rest = codeMatch[3];
    } else {
      parts.push(<span key={i++}>{rest}</span>);
      break;
    }
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      nodes.push(
        <p key={key++} className="font-semibold text-white text-sm mt-2 mb-0.5">
          {inlineFormat(line.slice(4))}
        </p>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <p key={key++} className="font-bold text-white text-sm mt-2 mb-1">
          {inlineFormat(line.slice(3))}
        </p>
      );
    } else if (line.match(/^[-*] /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(
          <li key={i} className="leading-snug">
            {inlineFormat(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1 text-slate-200">
          {items}
        </ul>
      );
      continue;
    } else if (line.match(/^\d+\. /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(
          <li key={i} className="leading-snug">
            {inlineFormat(lines[i].replace(/^\d+\. /, ""))}
          </li>
        );
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-decimal list-inside space-y-0.5 my-1 text-slate-200">
          {items}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      if (nodes.length > 0) nodes.push(<div key={key++} className="h-1.5" />);
    } else {
      nodes.push(
        <p key={key++} className="leading-relaxed">
          {inlineFormat(line)}
        </p>
      );
    }
    i++;
  }
  return nodes;
}

// --- Progress Ring SVG ---

function ProgressRing({
  percent,
  size = 40,
  strokeWidth = 3,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-teal-400 transition-all duration-500"
      />
    </svg>
  );
}

// --- Inline Action Cards ---

interface ActionCardData {
  icon: React.ReactNode;
  title: string;
  href: string;
  label: string;
}

function detectActionCards(content: string): ActionCardData[] {
  const cards: ActionCardData[] = [];
  const lower = content.toLowerCase();

  if (lower.includes("resume") || lower.includes(" cv ")) {
    cards.push({
      icon: <FileText className="h-3.5 w-3.5" />,
      title: "Resume Generator",
      href: "/resume-generator",
      label: "Open",
    });
  }
  if (lower.includes("interview") || lower.includes("practice")) {
    cards.push({
      icon: <Users className="h-3.5 w-3.5" />,
      title: "Mock Interview",
      href: "/mock-interview",
      label: "Start",
    });
  }
  if (lower.includes("skill gap") || lower.includes("learning")) {
    cards.push({
      icon: <Target className="h-3.5 w-3.5" />,
      title: "Gap Analysis",
      href: "/dashboard?tab=gap-analysis",
      label: "View",
    });
  }
  if (lower.includes("networking") || lower.includes("connections")) {
    cards.push({
      icon: <Users className="h-3.5 w-3.5" />,
      title: "Networking CRM",
      href: "/dashboard?tab=network",
      label: "Open",
    });
  }

  return cards.slice(0, 2);
}

// --- Proactive suggestion computation ---

function computeSuggestions(
  completionPercent: number,
  skillGaps: SkillGap[] | undefined,
  nextMilestone: string | undefined,
  lastSessionTime: number | null
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const thresholds = [
    { pct: 25, id: "milestone-25", title: "25% complete! Let's plan your next moves" },
    { pct: 50, id: "milestone-50", title: "Halfway there! Time for a progress review" },
    { pct: 75, id: "milestone-75", title: "75% done! Let's prepare for the home stretch" },
    { pct: 100, id: "milestone-100", title: "All milestones complete!" },
  ];

  for (const t of thresholds) {
    if (completionPercent >= t.pct && !isNudgeDismissed(t.id)) {
      suggestions.push({
        id: t.id,
        title: t.title,
        prompt: `I've reached ${t.pct}% completion on my career transition roadmap. Can you help me review my progress and plan next steps?`,
      });
      break;
    }
  }

  if (lastSessionTime) {
    const daysSince =
      (Date.now() - lastSessionTime) / (1000 * 60 * 60 * 24);
    if (daysSince >= 5 && !isNudgeDismissed("stale-session")) {
      suggestions.push({
        id: "stale-session",
        title: "It's been a while — let's catch up!",
        prompt:
          "I haven't chatted in a few days. Can you help me get back on track with my career transition?",
      });
    }
  }

  const highGaps = skillGaps?.filter((g) => g.priority === "high") ?? [];
  if (highGaps.length > 0 && !isNudgeDismissed("skill-gap")) {
    suggestions.push({
      id: "skill-gap",
      title: `Close your ${highGaps[0].skill} gap`,
      prompt: `I need help closing my skill gaps, especially in ${highGaps
        .slice(0, 3)
        .map((g) => g.skill)
        .join(", ")}. What resources and steps do you recommend?`,
    });
  }

  return suggestions;
}

// --- Quick action chip definitions ---

const QUICK_ACTIONS = [
  { label: "Resume", icon: FileText, prompt: "Help me improve my resume for my target role." },
  { label: "Networking", icon: Users, prompt: "Give me networking strategies to build connections in my target industry." },
  { label: "Interview Prep", icon: MessageSquare, prompt: "Help me prepare for interviews for my target role." },
  { label: "Skill Gaps", icon: Target, prompt: "What are the most important skill gaps I should close first?" },
];

// --- Chat message with action cards ---

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const actionCards =
    !isUser && msg.content.length > 100 ? detectActionCards(msg.content) : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div className="shrink-0 mt-1 h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center ring-2 ring-teal-400/30">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div className="max-w-[85%] space-y-2">
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "bg-teal-600 text-white"
              : "bg-slate-800/80 text-slate-200"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
          )}
          {msg.timestamp && (
            <p className="text-[10px] opacity-40 mt-1 text-right">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        {actionCards.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {actionCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 transition-colors"
              >
                {card.icon}
                <span>{card.title}</span>
                <span className="text-teal-400 font-medium">{card.label} &rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Typing indicator ---

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="shrink-0 mt-1 h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center ring-2 ring-teal-400/30">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="bg-slate-800/80 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.15s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      </div>
    </div>
  );
}

// ===========================
// Main Component
// ===========================

export default function CareerCoachWidget({
  reportId,
  planIndex,
  targetRole,
  completionPercent,
  completedMilestones,
  totalMilestones,
  currentPhaseLabel,
  skillGaps,
  nextMilestone,
}: CareerCoachWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeNudge, setActiveNudge] = useState<Suggestion | null>(null);
  const [fabPulse, setFabPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { setWidgetActive } = useCareerCoach();

  // Register widget in context so HelpFAB repositions
  useEffect(() => {
    setWidgetActive(true);
    return () => setWidgetActive(false);
  }, [setWidgetActive]);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // FAB pulse on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(PULSE_KEY) !== "true") {
      setFabPulse(true);
      const timer = setTimeout(() => {
        localStorage.setItem(PULSE_KEY, "true");
        setFabPulse(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Keyboard shortcuts: Ctrl+/ to toggle, Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable;

      if (e.key === "/" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (e.key === "Escape" && open && !isInput) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Return focus to FAB on close
  useEffect(() => {
    if (!open && fabRef.current) {
      fabRef.current.focus();
    }
  }, [open]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load/create session when panel opens
  useEffect(() => {
    if (open && !sessionId && !loadingSession) {
      loadOrCreateSession();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute proactive suggestions
  useEffect(() => {
    async function compute() {
      let lastSessionTime: number | null = null;
      try {
        const res = await fetch(
          `/api/sessions?reportId=${reportId}&planIndex=${planIndex}`
        );
        const data = await res.json();
        if (data.sessions?.[0]?.updated_at) {
          lastSessionTime = new Date(data.sessions[0].updated_at).getTime();
        }
      } catch {
        // best-effort
      }

      const computed = computeSuggestions(
        completionPercent,
        skillGaps,
        nextMilestone,
        lastSessionTime
      );
      setSuggestions(computed);
      if (computed.length > 0 && !open) {
        setActiveNudge(computed[0]);
      }
    }
    compute();
  }, [completionPercent, skillGaps, nextMilestone, reportId, planIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss nudge after 15s
  useEffect(() => {
    if (!activeNudge) return;
    const timer = setTimeout(() => setActiveNudge(null), 15000);
    return () => clearTimeout(timer);
  }, [activeNudge]);

  async function loadOrCreateSession() {
    setLoadingSession(true);
    try {
      const res = await fetch(
        `/api/sessions?reportId=${reportId}&planIndex=${planIndex}`
      );
      const data = await res.json();

      if (data.sessions?.length > 0) {
        const session = data.sessions[0];
        setSessionId(session.id);
        if (session.messages?.length > 0) {
          setMessages(session.messages);
          return;
        }
      }

      const createRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, planIndex }),
      });
      const createData = await createRes.json();
      setSessionId(createData.sessionId);
    } catch {
      // best-effort
    } finally {
      setLoadingSession(false);
    }
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
      // best-effort
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMessage: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          planIndex,
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

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: ts },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: assistantContent,
            timestamp: ts,
          };
          return next;
        });
      }

      const finalMessages = [
        ...updatedMessages,
        { role: "assistant" as const, content: assistantContent, timestamp: ts },
      ];
      setMessages(finalMessages);
      saveMessages(finalMessages, sessionId);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""),
        {
          role: "assistant",
          content:
            "Sorry, I had trouble responding. Please try again in a moment.",
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

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  function handleNudgeAction(suggestion: Suggestion) {
    setActiveNudge(null);
    dismissNudgeStorage(suggestion.id);
    setOpen(true);
    setTimeout(() => handleSend(suggestion.prompt), 300);
  }

  function handleDismissNudge(suggestion: Suggestion) {
    setActiveNudge(null);
    dismissNudgeStorage(suggestion.id);
  }

  // --- Conversation starters ---

  const starters = [
    {
      icon: <Zap className="h-4 w-4 text-teal-400" />,
      label: "Review my progress",
      description: `${completionPercent}% complete in ${currentPhaseLabel} phase`,
      prompt: `I'm at ${completionPercent}% completion in the ${currentPhaseLabel} phase. Can you review my progress and suggest what to focus on next?`,
    },
    {
      icon: <FileText className="h-4 w-4 text-teal-400" />,
      label: "Help with my resume",
      description: `Tailored for ${targetRole}`,
      prompt: `Help me improve my resume for the ${targetRole} role. What should I emphasize based on my skills and experience?`,
    },
    ...(skillGaps && skillGaps.length > 0
      ? [
          {
            icon: <Target className="h-4 w-4 text-teal-400" />,
            label: "Close my skill gaps",
            description: skillGaps
              .slice(0, 2)
              .map((g) => g.skill)
              .join(", "),
            prompt: `Help me close my skill gaps. My top gaps are: ${skillGaps
              .slice(0, 5)
              .map((g) => `${g.skill} (${g.priority} priority)`)
              .join(", ")}. What's the best learning path?`,
          },
        ]
      : []),
    {
      icon: <MessageSquare className="h-4 w-4 text-teal-400" />,
      label: "Analyze a job posting",
      prompt: `Help me analyze a job posting for a ${targetRole} role. I'll paste the description and you can tell me how well I match and what to emphasize.`,
    },
  ];

  // --- Shared content blocks ---

  const progressStrip = (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/40">
      <ProgressRing percent={completionPercent} size={36} strokeWidth={3} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {completedMilestones}/{totalMilestones} milestones
        </p>
        <p className="text-[11px] text-slate-400 truncate">
          {currentPhaseLabel} phase
        </p>
      </div>
      <span className="text-xs font-semibold text-teal-400">
        {completionPercent}%
      </span>
    </div>
  );

  const mobileProgressBar = (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-700/50 bg-slate-800/40">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-400 rounded-full transition-all duration-500"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-300 shrink-0">
        {completedMilestones}/{totalMilestones}
      </span>
    </div>
  );

  const quickActionChips = (mobile = false) => (
    <div
      className={`flex gap-2 px-3 py-2 border-t border-slate-700/50 ${
        mobile ? "overflow-x-auto" : "flex-wrap"
      }`}
    >
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => handleSend(action.prompt)}
          disabled={streaming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
        >
          <action.icon className="h-3 w-3 text-teal-400" />
          {action.label}
        </button>
      ))}
    </div>
  );

  const chatInput = (mobile = false) => (
    <div className="border-t border-slate-700 p-3">
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask your career coach..."
          rows={1}
          style={{
            minHeight: "44px",
            maxHeight: "120px",
            fontSize: mobile ? "16px" : "13px",
          }}
          className="flex-1 bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none transition-colors overflow-y-auto"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || streaming}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-xl transition-colors shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5 text-center">
        {mobile ? "Tap to send" : "Enter to send · Shift+Enter for new line"}
      </p>
    </div>
  );

  const messagesContent = (
    <>
      {messages.length === 0 && !loadingSession && (
        <div className="p-4 space-y-3">
          <div className="text-center mb-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 ring-2 ring-teal-400/30 mb-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm text-slate-300">
              Hi! I&apos;m your career coach. How can I help today?
            </p>
          </div>
          {starters.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSend(s.prompt)}
              className="flex items-start gap-3 w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors text-left"
            >
              <div className="mt-0.5">{s.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{s.label}</p>
                {s.description && (
                  <p className="text-xs text-slate-400 truncate">
                    {s.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {loadingSession && messages.length === 0 && (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-xs">Loading your session...</p>
        </div>
      )}

      <div className="p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        {streaming &&
          messages.length > 0 &&
          messages[messages.length - 1].content === "" && <TypingIndicator />}
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes coach-panel-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes coach-nudge-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes coach-fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.5); }
          50% { box-shadow: 0 0 0 12px rgba(20, 184, 166, 0); }
        }
      `}</style>

      {/* FAB */}
      {!open && (
        <button
          ref={fabRef}
          onClick={() => {
            setOpen(true);
            setActiveNudge(null);
          }}
          aria-label="Open career coach"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-900/30 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          style={fabPulse ? { animation: "coach-fab-pulse 1.5s ease-in-out 3" } : undefined}
        >
          <Sparkles className="h-6 w-6" />
          {suggestions.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              {suggestions.length}
            </span>
          )}
        </button>
      )}

      {/* Nudge card */}
      {!open && activeNudge && (
        <div
          className="fixed bottom-[5.5rem] right-6 z-50 w-72 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl shadow-black/30 p-4"
          style={{
            animation: "coach-nudge-enter 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-slate-800 border-b border-r border-slate-700 rotate-45" />
          <p className="text-sm font-medium text-white mb-2">
            {activeNudge.title}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleNudgeAction(activeNudge)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors"
            >
              Let&apos;s go
            </button>
            <button
              onClick={() => handleDismissNudge(activeNudge)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Desktop panel */}
      {open && !isMobile && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Career coach"
          aria-modal="false"
          className="fixed bottom-24 right-6 z-50 w-[400px] flex flex-col rounded-[20px] bg-slate-900 border border-slate-700 shadow-2xl shadow-black/40 overflow-hidden"
          style={{
            maxHeight: "min(560px, 80vh)",
            animation: "coach-panel-enter 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800/60">
            <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center ring-2 ring-teal-400/30 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">Career Coach</h3>
              <p className="text-[11px] text-slate-400 truncate">
                {targetRole}
              </p>
            </div>
            <Link
              href="/chat"
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              aria-label="Open full chat view"
            >
              <Maximize2 className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              aria-label="Close career coach"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress strip */}
          {progressStrip}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            aria-live="polite"
          >
            {messagesContent}
          </div>

          {/* Quick action chips */}
          {quickActionChips()}

          {/* Input */}
          {chatInput()}
        </div>
      )}

      {/* Mobile sheet */}
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="h-[100dvh] flex flex-col p-0 rounded-t-[20px]"
          >
            <SheetHeader className="border-b border-slate-700 bg-slate-800/60 px-4 py-3 flex-row items-center gap-3">
              <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center ring-2 ring-teal-400/30 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-sm text-white">
                  Career Coach
                </SheetTitle>
                <p className="text-[11px] text-slate-400 truncate">
                  {targetRole}
                </p>
              </div>
              <Link
                href="/chat"
                className="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Open full chat view"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Close career coach"
              >
                <X className="h-4 w-4" />
              </button>
            </SheetHeader>

            {/* Mobile progress bar */}
            {mobileProgressBar}

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
              aria-live="polite"
            >
              {messagesContent}
            </div>

            {/* Quick action chips (horizontal scroll) */}
            {quickActionChips(true)}

            {/* Input (16px font to prevent iOS zoom) */}
            {chatInput(true)}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
