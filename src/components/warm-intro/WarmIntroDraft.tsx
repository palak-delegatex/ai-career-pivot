"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Mail, Copy, Check, ExternalLink } from "lucide-react";

// Editable drafted-intro message. contentEditable body with an 800ms debounced
// save (same cadence as JobDetailView's note fields) surfaced via onEdit. The
// parent owns persistence; this component owns edit UX + the send/copy actions.
export default function WarmIntroDraft({
  message,
  onEdit,
  contactName,
  channel,
  linkedinUrl,
  email,
  onCopy,
  onSend,
}: {
  message: string;
  onEdit: (msg: string) => void;
  contactName: string;
  channel: "linkedin" | "email";
  linkedinUrl?: string | null;
  email?: string | null;
  onCopy?: () => void;
  onSend?: (channel: "linkedin" | "email") => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Track the latest edited text so send/copy use edits, not the initial draft.
  const [current, setCurrent] = useState(message);

  useEffect(() => {
    setCurrent(message);
  }, [message]);

  // Debounced persist — fires 800ms after the user stops typing.
  const handleInput = useCallback(() => {
    const text = bodyRef.current?.innerText ?? "";
    setCurrent(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onEdit(text), 800);
  }, [onEdit]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toggleEdit = useCallback(() => {
    setEditing((e) => {
      const next = !e;
      if (next) {
        // Focus at end on entering edit mode.
        requestAnimationFrame(() => bodyRef.current?.focus());
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(current).then(() => {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    });
  }, [current, onCopy]);

  const handleLinkedIn = useCallback(() => {
    onSend?.("linkedin");
    // Best effort: LinkedIn compose can't be reliably prefilled, so we copy the
    // message and open the contact's profile / messaging.
    navigator.clipboard?.writeText(current).catch(() => {});
    const url = linkedinUrl || "https://www.linkedin.com/messaging/";
    window.open(url, "_blank", "noopener,noreferrer");
  }, [current, linkedinUrl, onSend]);

  const handleEmail = useCallback(() => {
    onSend?.("email");
    const subject = encodeURIComponent(`Quick question about a role`);
    const body = encodeURIComponent(current);
    const to = email || "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
  }, [current, email, onSend]);

  return (
    <div
      data-preferred-channel={channel}
      className="rounded-lg border border-slate-700/50 bg-slate-900/60 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <Mail className="h-3 w-3" />
          Drafted intro to {contactName.split(" ")[0]}
        </span>
        <button
          onClick={toggleEdit}
          className="text-[10px] text-teal-400 hover:text-teal-300"
          aria-label={editing ? "Finish editing message" : "Edit message"}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <div
        ref={bodyRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Drafted intro message"
        contentEditable={editing}
        suppressContentEditableWarning
        onInput={handleInput}
        className={`px-3 py-3 text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap ${
          editing ? "outline-none ring-1 ring-teal-500/30 bg-white/[0.02]" : ""
        }`}
      >
        {message}
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
        <button
          onClick={handleCopy}
          aria-label="Copy message to clipboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-[11px] font-medium text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleLinkedIn}
          aria-label="Send via LinkedIn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A66C2] hover:bg-[#004182] text-[11px] font-medium text-white transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          LinkedIn
        </button>
        <button
          onClick={handleEmail}
          aria-label="Send via email"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[11px] font-medium text-slate-300 transition-colors border border-white/[0.06]"
        >
          <Mail className="h-3 w-3" />
          Email
        </button>
      </div>
      <span aria-live="polite" className="sr-only">
        {copied ? "Message copied to clipboard" : ""}
      </span>
    </div>
  );
}
