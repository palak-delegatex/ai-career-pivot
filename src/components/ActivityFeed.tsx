"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  FileText,
  Target,
  Award,
  ArrowRight,
  Loader2,
  Send,
} from "lucide-react";

interface FeedEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  link?: string;
}

const EVENT_ICONS: Record<string, { icon: typeof Briefcase; color: string }> = {
  job_saved: { icon: Briefcase, color: "text-teal-400 bg-teal-400/10" },
  job_applied: { icon: Send, color: "text-emerald-400 bg-emerald-400/10" },
  job_stage_change: { icon: ArrowRight, color: "text-cyan-400 bg-cyan-400/10" },
  resume_created: { icon: FileText, color: "text-amber-400 bg-amber-400/10" },
  resume_updated: { icon: FileText, color: "text-amber-400 bg-amber-400/10" },
  milestone_completed: { icon: Target, color: "text-emerald-400 bg-emerald-400/10" },
  badge_earned: { icon: Award, color: "text-purple-400 bg-purple-400/10" },
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityFeed({ email }: { email: string }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadEvents = useCallback(async (nextCursor?: string) => {
    const isMore = !!nextCursor;
    if (isMore) setLoadingMore(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ email, limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await fetch(`/api/activity/feed?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      setEvents((prev) => isMore ? [...prev, ...data.events] : data.events);
      setCursor(data.nextCursor);
    } finally {
      if (isMore) setLoadingMore(false); else setLoading(false);
    }
  }, [email]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
        <p className="text-sm text-slate-500 text-center py-6">
          No activity yet. Save a job or complete a milestone to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-700" />
        <ul className="space-y-4">
          {events.map((event) => {
            const config = EVENT_ICONS[event.type] ?? EVENT_ICONS.job_saved;
            const Icon = config.icon;
            return (
              <li key={event.id} className="relative flex gap-3 pl-0">
                <div className={`relative z-10 flex-shrink-0 w-[31px] h-[31px] rounded-full flex items-center justify-center ${config.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  {event.link ? (
                    <a href={event.link} className="text-sm text-slate-200 hover:text-teal-300 transition-colors">
                      {event.description}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-200">{event.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{relativeTime(event.timestamp)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {cursor && (
        <button
          onClick={() => loadEvents(cursor)}
          disabled={loadingMore}
          className="mt-4 w-full py-2 text-sm text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50"
        >
          {loadingMore ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
            </span>
          ) : "Load more"}
        </button>
      )}
    </div>
  );
}
