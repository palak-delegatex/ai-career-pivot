"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Minus } from "lucide-react";
import { MessageSquare } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface FollowUpChatProps {
  reportId: string;
  planIndex: number;
  targetRole: string;
  completionPercent?: number;
  nextMilestone?: string;
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

      let nextBold = boldMatch ? boldMatch[1].length : Infinity;
      let nextCode = codeMatch ? codeMatch[1].length : Infinity;

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

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
        isUser ? "bg-teal-600 text-white" : "bg-slate-700/60 text-slate-200"
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

export default function FollowUpChat({
  reportId,
  planIndex,
  targetRole,
  completionPercent,
  nextMilestone,
}: FollowUpChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
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
    if (open && !sessionId && !loadingSession) {
      loadOrCreateSession();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-grow textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

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
      // Session loading is best-effort
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
      // Best-effort
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMessage: Message = { role: "user", content, timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
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

  // Context-aware suggestion chips
  const suggestions = [
    nextMilestone
      ? `How do I complete: "${nextMilestone.slice(0, 40)}${nextMilestone.length > 40 ? "…" : ""}"?`
      : "What should I focus on next?",
    completionPercent !== undefined && completionPercent > 0
      ? `I'm at ${completionPercent}% — am I on track?`
      : "How am I doing on my roadmap?",
    `What skills are most important for ${targetRole}?`,
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-900/30"
      >
        <MessageSquare className="h-5 w-5" />
        Continue My Roadmap
      </button>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-800/60">
        <div>
          <h3 className="font-bold text-sm text-white">Career Advisor</h3>
          <p className="text-xs text-slate-400">Follow-up session for {targetRole}</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Minimize chat"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loadingSession && (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm mb-4">
              Pick up where you left off. Ask about your progress, get advice on next steps, or update your plan.
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingSession && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">Loading your session...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}

        {streaming &&
          messages.length > 0 &&
          messages[messages.length - 1].content === "" && (
            <div className="flex justify-start">
              <div className="bg-slate-700/60 rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="border-t border-slate-700 p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your career pivot..."
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
            className="flex-1 bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none transition-colors overflow-y-auto"
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
  );
}
