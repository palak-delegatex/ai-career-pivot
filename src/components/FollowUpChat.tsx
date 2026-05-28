"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FollowUpChatProps {
  reportId: string;
  planIndex: number;
  targetRole: string;
}

export default function FollowUpChat({
  reportId,
  planIndex,
  targetRole,
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
      // Session loading is best-effort; chat still works without persistence
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
      // Best-effort persistence
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
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

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return next;
        });
      }

      const finalMessages = [
        ...updatedMessages,
        { role: "assistant" as const, content: assistantContent },
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-900/30"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Continue My Roadmap
      </button>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-800/60">
        <div>
          <h3 className="font-bold text-sm text-white">Career Advisor</h3>
          <p className="text-xs text-slate-400">
            Follow-up session for {targetRole}
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Minimize chat"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loadingSession && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">
              Pick up where you left off. Ask about your progress, get advice on
              next steps, or update your plan.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "How am I doing on my roadmap?",
                "What should I focus on next?",
                "I completed a milestone!",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {suggestion}
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
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-teal-600 text-white"
                  : "bg-slate-700/60 text-slate-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {streaming &&
          messages.length > 0 &&
          messages[messages.length - 1].content === "" && (
            <div className="flex justify-start">
              <div className="bg-slate-700/60 rounded-2xl px-4 py-2.5">
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
          )}
      </div>

      <div className="border-t border-slate-700 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your career pivot..."
            rows={1}
            className="flex-1 bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-xl transition-colors shrink-0"
            aria-label="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
