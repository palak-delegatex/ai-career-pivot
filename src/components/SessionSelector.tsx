"use client";

import { useRef, useEffect } from "react";
import { Plus, MessageSquare } from "lucide-react";

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

interface SessionSelectorProps {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onSelect: (session: SessionInfo) => void;
  onNewSession: () => void;
  onClose: () => void;
}

function getSessionPreview(session: SessionInfo): string {
  const firstUserMsg = session.messages?.find((m) => m.role === "user");
  if (firstUserMsg) {
    return firstUserMsg.content.length > 60
      ? firstUserMsg.content.slice(0, 60) + "..."
      : firstUserMsg.content;
  }
  return "Empty session";
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SessionSelector({
  sessions,
  currentSessionId,
  onSelect,
  onNewSession,
  onClose,
}: SessionSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div className="p-2 border-b border-slate-700/50">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New session
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No previous sessions</p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-700/30 transition-colors ${
                session.id === currentSessionId ? "bg-slate-700/40" : ""
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 truncate">{getSessionPreview(session)}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatSessionDate(session.updated_at)}
                  {session.messages?.length > 0 && ` · ${session.messages.length} messages`}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
