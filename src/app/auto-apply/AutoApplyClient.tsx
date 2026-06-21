"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Settings2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  SkipForward,
  ExternalLink,
  MapPin,
  TrendingUp,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  Brain,
  Mail,
  Activity,
  Cpu,
  FileText,
  Clock,
} from "lucide-react";
import type { QueueItem, AutoApplyPreferences, QueueStatus, EngineStatus, ApplyMode } from "@/lib/auto-apply";
import { QUEUE_STATUS_CONFIG } from "@/lib/auto-apply";

function useEmail() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const stored = localStorage.getItem("user_email") ?? "";
    setEmail(stored);
  }, []);
  return email;
}

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-900/50 border-emerald-600/40 text-emerald-300"
      : score >= 50
        ? "bg-amber-900/40 border-amber-600/30 text-amber-300"
        : "bg-slate-700/50 border-slate-600/40 text-slate-400";

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
      <TrendingUp className="h-3 w-3" />
      {score}%
    </span>
  );
}

function StatusBadge({ status }: { status: QueueStatus }) {
  const config = QUEUE_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}

function DigestCard({
  counts,
  approvalRate,
  totalFeedback,
}: {
  counts: Record<string, number>;
  approvalRate: number;
  totalFeedback: number;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-bold text-teal-400">Activity Summary</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Pending", value: counts.pending_review ?? 0, color: "text-amber-300" },
          { label: "Approved", value: counts.approved ?? 0, color: "text-emerald-300" },
          { label: "Applied", value: counts.applied ?? 0, color: "text-teal-300" },
          { label: "Rejected", value: counts.rejected ?? 0, color: "text-red-300" },
          { label: "Skipped", value: counts.skipped ?? 0, color: "text-slate-400" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
      {totalFeedback > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs text-slate-400">
            Learning from {totalFeedback} decisions — {approvalRate}% approval rate
          </span>
        </div>
      )}
    </div>
  );
}

function EngineStatusCard({ status }: { status: EngineStatus | null }) {
  if (!status) return null;

  function timeAgo(iso: string | null): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const modeLabels: Record<ApplyMode, string> = {
    review_first: "Review First",
    auto_submit: "Auto Submit",
    hybrid: "Hybrid",
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-bold text-teal-400">Background Engine</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${status.enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${status.enabled ? "text-emerald-400" : "text-slate-500"}`}>
            {status.enabled ? "Running" : "Off"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Scanned Today", value: status.todayScanned, icon: Activity, color: "text-blue-300" },
          { label: "Queued Today", value: status.todayQueued, icon: Clock, color: "text-amber-300" },
          { label: "Applied Today", value: status.todayApplied, icon: CheckCircle2, color: "text-emerald-300" },
          { label: "Auto-Submitted", value: status.todayAutoSubmitted, icon: Zap, color: "text-violet-300" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <stat.icon className={`h-3 w-3 ${stat.color}`} />
              <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 border-t border-slate-700/60 pt-3">
        <span>Last scan: {timeAgo(status.lastScanAt)}</span>
        <span>Last process: {timeAgo(status.lastProcessAt)}</span>
        <span>Mode: <span className="text-slate-300 font-medium">{modeLabels[status.applyMode]}</span></span>
        {status.pendingReview > 0 && (
          <span className="text-amber-400">{status.pendingReview} awaiting review</span>
        )}
        {status.approvedPending > 0 && (
          <span className="text-emerald-400">{status.approvedPending} approved, pending apply</span>
        )}
      </div>
    </div>
  );
}

function PreferencesPanel({
  prefs,
  onSave,
  saving,
}: {
  prefs: AutoApplyPreferences | null;
  onSave: (prefs: Partial<AutoApplyPreferences>) => void;
  saving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    enabled: prefs?.enabled ?? false,
    target_roles: prefs?.target_roles?.join(", ") ?? "",
    preferred_locations: prefs?.preferred_locations?.join(", ") ?? "",
    remote_only: prefs?.remote_only ?? false,
    min_match_score: prefs?.min_match_score ?? 60,
    salary_min: prefs?.salary_min ?? 0,
    excluded_companies: prefs?.excluded_companies?.join(", ") ?? "",
    excluded_keywords: prefs?.excluded_keywords?.join(", ") ?? "",
    max_daily_applications: prefs?.max_daily_applications ?? 5,
    skip_2fa_sites: prefs?.skip_2fa_sites ?? true,
    apply_mode: (prefs?.apply_mode ?? "review_first") as ApplyMode,
    auto_submit_threshold: prefs?.auto_submit_threshold ?? 80,
    customize_resume: prefs?.customize_resume ?? true,
    generate_cover_letter: prefs?.generate_cover_letter ?? true,
  });

  useEffect(() => {
    if (prefs) {
      setForm({
        enabled: prefs.enabled,
        target_roles: prefs.target_roles.join(", "),
        preferred_locations: prefs.preferred_locations.join(", "),
        remote_only: prefs.remote_only,
        min_match_score: prefs.min_match_score,
        salary_min: prefs.salary_min,
        excluded_companies: prefs.excluded_companies.join(", "),
        excluded_keywords: prefs.excluded_keywords.join(", "),
        max_daily_applications: prefs.max_daily_applications,
        skip_2fa_sites: prefs.skip_2fa_sites,
        apply_mode: prefs.apply_mode ?? "review_first",
        auto_submit_threshold: prefs.auto_submit_threshold ?? 80,
        customize_resume: prefs.customize_resume ?? true,
        generate_cover_letter: prefs.generate_cover_letter ?? true,
      });
    }
  }, [prefs]);

  function handleSave() {
    const split = (s: string) => s.split(",").map((v) => v.trim()).filter(Boolean);
    onSave({
      enabled: form.enabled,
      target_roles: split(form.target_roles),
      preferred_locations: split(form.preferred_locations),
      remote_only: form.remote_only,
      min_match_score: form.min_match_score,
      salary_min: form.salary_min,
      excluded_companies: split(form.excluded_companies),
      excluded_keywords: split(form.excluded_keywords),
      max_daily_applications: form.max_daily_applications,
      skip_2fa_sites: form.skip_2fa_sites,
      apply_mode: form.apply_mode,
      auto_submit_threshold: form.auto_submit_threshold,
      customize_resume: form.customize_resume,
      generate_cover_letter: form.generate_cover_letter,
    });
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">Auto-Apply Preferences</span>
          {form.enabled && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-700/40 text-emerald-300">
              Active
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-700/60 pt-4">
          <button
            type="button"
            onClick={() => setForm({ ...form, enabled: !form.enabled })}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.enabled ? "bg-emerald-600" : "bg-slate-600"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-white font-medium">Enable Smart Auto-Apply</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Target Roles (comma-separated)</label>
              <input
                type="text"
                value={form.target_roles}
                onChange={(e) => setForm({ ...form, target_roles: e.target.value })}
                placeholder="Product Manager, UX Designer"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Preferred Locations</label>
              <input
                type="text"
                value={form.preferred_locations}
                onChange={(e) => setForm({ ...form, preferred_locations: e.target.value })}
                placeholder="San Francisco, New York, Remote"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Excluded Companies</label>
              <input
                type="text"
                value={form.excluded_companies}
                onChange={(e) => setForm({ ...form, excluded_companies: e.target.value })}
                placeholder="Companies to skip"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Excluded Keywords</label>
              <input
                type="text"
                value={form.excluded_keywords}
                onChange={(e) => setForm({ ...form, excluded_keywords: e.target.value })}
                placeholder="intern, entry-level, contract"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Min Match Score</label>
              <input
                type="number"
                min={0}
                max={99}
                value={form.min_match_score}
                onChange={(e) => setForm({ ...form, min_match_score: Number(e.target.value) })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Min Salary ($k/yr)</label>
              <input
                type="number"
                min={0}
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: Number(e.target.value) })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Max Daily Apps</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.max_daily_applications}
                onChange={(e) => setForm({ ...form, max_daily_applications: Number(e.target.value) })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remote_only}
                  onChange={(e) => setForm({ ...form, remote_only: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-600"
                />
                <span className="text-xs text-slate-300">Remote only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.skip_2fa_sites}
                  onChange={(e) => setForm({ ...form, skip_2fa_sites: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-600"
                />
                <span className="text-xs text-slate-300">Skip 2FA sites</span>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300">Background Engine Settings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Apply Mode</label>
                <select
                  value={form.apply_mode}
                  onChange={(e) => setForm({ ...form, apply_mode: e.target.value as ApplyMode })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
                >
                  <option value="review_first">Review First</option>
                  <option value="hybrid">Hybrid (auto above threshold)</option>
                  <option value="auto_submit">Auto Submit All</option>
                </select>
              </div>
              {form.apply_mode !== "review_first" && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Auto-Submit Threshold</label>
                  <input
                    type="number"
                    min={50}
                    max={99}
                    value={form.auto_submit_threshold}
                    onChange={(e) => setForm({ ...form, auto_submit_threshold: Number(e.target.value) })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Jobs above this score skip review</p>
                </div>
              )}
              <div className="flex flex-col gap-2 justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.customize_resume}
                    onChange={(e) => setForm({ ...form, customize_resume: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-600"
                  />
                  <span className="text-xs text-slate-300">Tailor resume keywords</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.generate_cover_letter}
                    onChange={(e) => setForm({ ...form, generate_cover_letter: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-teal-600"
                  />
                  <span className="text-xs text-slate-300">Generate cover letters</span>
                </label>
              </div>
            </div>

            {form.apply_mode !== "review_first" && (
              <div className="mt-3 flex items-start gap-2 bg-amber-950/20 border border-amber-800/30 rounded-lg p-3">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300/80">
                  {form.apply_mode === "auto_submit"
                    ? "All matches above your minimum score will be auto-submitted without review. Use with caution."
                    : `Jobs scoring ${form.auto_submit_threshold}%+ will be auto-submitted. Lower-scoring matches go to your review queue.`}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueItemCard({
  item,
  selected,
  onToggleSelect,
  onReview,
  reviewing,
}: {
  item: QueueItem;
  selected: boolean;
  onToggleSelect: () => void;
  onReview: (action: string, reason?: string) => void;
  reviewing: boolean;
}) {
  const [showReasons, setShowReasons] = useState(false);

  return (
    <div className={`bg-slate-800/40 border rounded-xl p-4 transition-all ${selected ? "border-teal-600/60 bg-teal-950/10" : "border-slate-700/60 hover:border-slate-600"}`}>
      <div className="flex items-start gap-3">
        {item.status === "pending_review" && (
          <button
            onClick={onToggleSelect}
            className={`mt-1 w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${selected ? "bg-teal-500 border-teal-500" : "border-slate-600 hover:border-slate-400"}`}
          >
            {selected && <Check className="h-3 w-3 text-white" />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white hover:text-teal-300 transition-colors line-clamp-1"
                >
                  {item.job_title}
                </a>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.company}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <MatchScoreBadge score={item.match_score} />
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-400 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {item.location && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="h-2.5 w-2.5" />
                {item.location}
              </span>
            )}
            {item.job_type && (
              <span className="text-[10px] text-slate-500">{item.job_type}</span>
            )}
            {item.salary && (
              <span className="text-[10px] text-emerald-400 font-medium">{item.salary}</span>
            )}
            <span className="text-[10px] text-slate-600 capitalize">{item.source}</span>
          </div>

          {item.matched_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.matched_skills.slice(0, 5).map((skill) => (
                <span key={skill} className="text-[10px] bg-teal-900/30 border border-teal-700/30 text-teal-400 px-1.5 py-0.5 rounded">
                  {skill}
                </span>
              ))}
              {item.matched_skills.length > 5 && (
                <span className="text-[10px] text-slate-500">+{item.matched_skills.length - 5}</span>
              )}
            </div>
          )}

          {item.match_reasons.length > 0 && (
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="text-[10px] text-violet-400 hover:text-violet-300 mt-1.5 flex items-center gap-1"
            >
              <Brain className="h-2.5 w-2.5" />
              {showReasons ? "Hide" : "Why this match?"}
            </button>
          )}

          {showReasons && (
            <div className="mt-2 space-y-1 pl-2 border-l-2 border-violet-800/40">
              {item.match_reasons.map((r, i) => (
                <div key={i} className="text-[10px] text-slate-400">
                  <span className="text-violet-300 font-medium">{r.factor}:</span>{" "}
                  {r.detail}
                </div>
              ))}
            </div>
          )}

          {item.description_snippet && (
            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{item.description_snippet}</p>
          )}

          {item.status === "pending_review" && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onReview("approved")}
                disabled={reviewing}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-600/40 text-emerald-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" />
                Approve
              </button>
              <button
                onClick={() => onReview("rejected")}
                disabled={reviewing}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/30 text-red-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3 w-3" />
                Reject
              </button>
              <button
                onClick={() => onReview("skipped")}
                disabled={reviewing}
                className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-700/50 text-slate-400 text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                <SkipForward className="h-3 w-3" />
                Skip
              </button>
              <button
                onClick={() => onReview("irrelevant")}
                disabled={reviewing}
                className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-700/50 text-slate-500 text-[10px] rounded-lg transition-colors disabled:opacity-50 ml-auto"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                Irrelevant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TabKey = "pending" | "approved" | "rejected" | "all";

export default function AutoApplyClient() {
  const email = useEmail();
  const [tab, setTab] = useState<TabKey>("pending");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [prefs, setPrefs] = useState<AutoApplyPreferences | null>(null);
  const [digest, setDigest] = useState<{
    counts: Record<string, number>;
    approvalRate: number;
    totalFeedback: number;
  } | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActioning, setBulkActioning] = useState(false);

  const fetchQueue = useCallback(async (statusFilter?: string) => {
    if (!email) return;
    const params = new URLSearchParams({ email });
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter === "pending" ? "pending_review" : statusFilter);
    const res = await fetch(`/api/auto-apply/queue?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
  }, [email]);

  const fetchPrefs = useCallback(async () => {
    if (!email) return;
    const res = await fetch(`/api/auto-apply/preferences?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      setPrefs(data.preferences);
    }
  }, [email]);

  const fetchDigest = useCallback(async () => {
    if (!email) return;
    const res = await fetch(`/api/auto-apply/digest?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      setDigest({
        counts: data.counts,
        approvalRate: data.approvalRate,
        totalFeedback: data.totalFeedback,
      });
    }
  }, [email]);

  const fetchEngineStatus = useCallback(async () => {
    if (!email) return;
    const res = await fetch(`/api/auto-apply/engine-status?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      setEngineStatus(data);
    }
  }, [email]);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    Promise.all([fetchQueue(tab), fetchPrefs(), fetchDigest(), fetchEngineStatus()]).finally(() =>
      setLoading(false)
    );
  }, [email, tab, fetchQueue, fetchPrefs, fetchDigest, fetchEngineStatus]);

  async function handleSavePrefs(updates: Partial<AutoApplyPreferences>) {
    setSaving(true);
    const res = await fetch("/api/auto-apply/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...updates }),
    });
    if (res.ok) {
      const data = await res.json();
      setPrefs(data.preferences);
    }
    setSaving(false);
  }

  async function handleScan() {
    setScanning(true);
    const res = await fetch("/api/auto-apply/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      await Promise.all([fetchQueue(tab), fetchDigest(), fetchEngineStatus()]);
    }
    setScanning(false);
  }

  async function handleReview(id: string, action: string, reason?: string) {
    setReviewingId(id);
    const res = await fetch("/api/auto-apply/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, id, action, reason }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: (action === "irrelevant" ? "rejected" : action) as QueueStatus }
            : item
        )
      );
      await fetchDigest();
    }
    setReviewingId(null);
  }

  async function handleBulkAction(action: string) {
    if (selectedIds.size === 0) return;
    setBulkActioning(true);
    const res = await fetch("/api/auto-apply/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ids: [...selectedIds], action }),
    });
    if (res.ok) {
      const newStatus = (action === "irrelevant" ? "rejected" : action) as QueueStatus;
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.has(item.id) ? { ...item, status: newStatus } : item
        )
      );
      setSelectedIds(new Set());
      await fetchDigest();
    }
    setBulkActioning(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredItems =
    tab === "all"
      ? items
      : items.filter((i) =>
          tab === "pending"
            ? i.status === "pending_review"
            : i.status === tab
        );

  const pendingCount = items.filter((i) => i.status === "pending_review").length;

  if (!email) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Sparkles className="h-10 w-10 text-teal-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Smart Auto-Apply</h2>
        <p className="text-slate-400 text-sm">
          Sign in to set up AI-powered job matching and one-click applications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h1 className="text-xl font-bold text-white">Smart Auto-Apply</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            AI matches jobs to your profile — you review and approve, we handle the rest
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning || !prefs?.enabled}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {scanning ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {scanning ? "Scanning..." : "Find Matches"}
        </button>
      </div>

      {/* Engine Status */}
      <EngineStatusCard status={engineStatus} />

      {/* Digest */}
      {digest && <DigestCard {...digest} />}

      {/* Preferences */}
      <PreferencesPanel prefs={prefs} onSave={handleSavePrefs} saving={saving} />

      {/* Queue */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-slate-700/60">
          {(
            [
              { key: "pending" as TabKey, label: "Pending Review", count: pendingCount },
              { key: "approved" as TabKey, label: "Approved" },
              { key: "rejected" as TabKey, label: "Rejected" },
              { key: "all" as TabKey, label: "All" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedIds(new Set()); }}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-teal-500 text-teal-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
              {"count" in t && typeof t.count === "number" && t.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-900/50 text-amber-300 text-[10px] font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {tab === "pending" && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-950/20 border-b border-teal-800/20">
            <span className="text-xs text-teal-300 font-medium">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleBulkAction("approved")}
              disabled={bulkActioning}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-600/40 text-emerald-300 text-[10px] font-medium rounded-md transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Approve All
            </button>
            <button
              onClick={() => handleBulkAction("rejected")}
              disabled={bulkActioning}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-900/30 hover:bg-red-900/50 border border-red-700/30 text-red-300 text-[10px] font-medium rounded-md transition-colors disabled:opacity-50"
            >
              <XCircle className="h-2.5 w-2.5" />
              Reject All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto"
            >
              Clear
            </button>
          </div>
        )}

        {/* Items */}
        <div className="p-4 space-y-3">
          {loading && (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading your review queue...</p>
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="py-8 text-center">
              <Mail className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-1">
                {tab === "pending"
                  ? "No jobs pending review"
                  : `No ${tab} jobs yet`}
              </p>
              {tab === "pending" && prefs?.enabled && (
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors mt-2"
                >
                  Scan for new matches
                </button>
              )}
              {!prefs?.enabled && (
                <p className="text-xs text-slate-500 mt-1">
                  Enable auto-apply and configure your preferences to get started
                </p>
              )}
            </div>
          )}

          {!loading &&
            filteredItems.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
                onReview={(action, reason) => handleReview(item.id, action, reason)}
                reviewing={reviewingId === item.id}
              />
            ))}
        </div>

        {!loading && filteredItems.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700/60 bg-slate-900/20">
            <p className="text-[10px] text-slate-500">
              {filteredItems.length} job{filteredItems.length !== 1 ? "s" : ""} shown
              {tab === "pending" && " — approve to add to your Job Tracker, or reject to train the AI"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
