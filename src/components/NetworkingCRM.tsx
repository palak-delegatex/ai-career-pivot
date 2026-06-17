"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Bell,
  Handshake,
  TrendingUp,
  Plus,
  Upload,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MessageSquare,
  Video,
  StickyNote,
  ExternalLink,
  MapPin,
  Building2,
  Briefcase,
  X,
  Link2,
  UserPlus,
  Activity,
  BarChart3,
  ArrowRight,
  Trash2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Contact {
  id: string;
  user_email: string;
  name: string;
  email: string | null;
  linkedin_url: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  source: string;
  strength_score: number;
  strength_tier: string;
  tags: string[];
  notes: string;
  how_connected: string | null;
  created_at: string;
  updated_at: string;
}

interface Reminder {
  id: string;
  contact_id: string;
  user_email: string;
  description: string;
  due_date: string;
  status: string;
  snooze_until: string | null;
  contacts: {
    id: string;
    name: string;
    company: string | null;
    role: string | null;
    strength_tier: string;
  } | null;
}

interface Interaction {
  id: string;
  contact_id: string;
  type: string;
  description: string;
  occurred_at: string;
}

interface JobLink {
  id: string;
  contact_id: string;
  job_id: string;
  role: string;
  referral_status: string;
  notes: string;
  created_at: string;
  contacts: { id: string; name: string; company: string | null; role: string | null; strength_tier: string } | null;
  jobs: { id: string; role: string; company: string; stage: string } | null;
}

interface TrackedJob {
  id: string;
  role: string;
  company: string;
  stage: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TIER_COLORS: Record<string, { bg: string; fill: string; text: string }> = {
  strong: {
    bg: "bg-emerald-900/30",
    fill: "bg-emerald-500",
    text: "text-emerald-300",
  },
  warm: { bg: "bg-amber-900/30", fill: "bg-amber-500", text: "text-amber-300" },
  new: {
    bg: "bg-purple-900/30",
    fill: "bg-purple-500",
    text: "text-purple-300",
  },
  cold: { bg: "bg-slate-700/30", fill: "bg-slate-500", text: "text-slate-400" },
};

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  meeting: <Video className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  message: <MessageSquare className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
  event: <Calendar className="w-3.5 h-3.5" />,
  note: <StickyNote className="w-3.5 h-3.5" />,
};

const ROLE_LABELS: Record<string, string> = {
  referrer: "Referrer",
  hiring_manager: "Hiring Manager",
  recruiter: "Recruiter",
  interviewer: "Interviewer",
  insider: "Insider",
};

const REFERRAL_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  none: { bg: "bg-slate-700/40", text: "text-slate-400" },
  requested: { bg: "bg-amber-900/30", text: "text-amber-300" },
  submitted: { bg: "bg-blue-900/30", text: "text-blue-300" },
  accepted: { bg: "bg-emerald-900/30", text: "text-emerald-300" },
  declined: { bg: "bg-red-900/30", text: "text-red-300" },
};

const HOW_CONNECTED_OPTIONS = [
  "Former colleague",
  "Met at conference",
  "LinkedIn connection",
  "Mutual friend intro",
  "Cold outreach",
  "Alumni network",
  "Online community",
  "Recruiter contact",
  "Referral",
  "Other",
];

const CADENCE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
  { label: "Custom", days: 0 },
];

function tierLabel(tier: string) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 0) return `in ${Math.abs(days)}d`;
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function dueStatus(iso: string): "overdue" | "soon" | "later" {
  const diff = new Date(iso).getTime() - Date.now();
  const days = diff / 86400000;
  if (days < 0) return "overdue";
  if (days < 3) return "soon";
  return "later";
}

const DUE_STYLES = {
  overdue: "text-red-400",
  soon: "text-amber-400",
  later: "text-slate-400",
};

const DUE_DOT = {
  overdue: "bg-red-400",
  soon: "bg-amber-400",
  later: "bg-emerald-400",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NetworkingCRM({ userEmail }: { userEmail: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [jobLinks, setJobLinks] = useState<JobLink[]>([]);
  const [activeTab, setActiveTab] = useState<"contacts" | "dashboard">("contacts");

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams({ email: userEmail });
    if (activeTier) params.set("tier", activeTier);
    if (search) params.set("q", search);
    const res = await fetch(`/api/contacts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts);
    }
  }, [userEmail, activeTier, search]);

  const fetchReminders = useCallback(async () => {
    const res = await fetch(
      `/api/contacts/reminders?email=${encodeURIComponent(userEmail)}`
    );
    if (res.ok) {
      const data = await res.json();
      setReminders(data.reminders);
    }
  }, [userEmail]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchContacts(), fetchReminders()]).finally(() =>
      setLoading(false)
    );
  }, [fetchContacts, fetchReminders]);

  const fetchInteractions = async (contactId: string) => {
    const res = await fetch(
      `/api/contacts/interactions?email=${encodeURIComponent(userEmail)}&contactId=${contactId}`
    );
    if (res.ok) {
      const data = await res.json();
      setInteractions(data.interactions);
    }
  };

  const fetchJobLinks = async (contactId: string) => {
    const res = await fetch(
      `/api/contacts/job-links?email=${encodeURIComponent(userEmail)}&contactId=${contactId}`
    );
    if (res.ok) {
      const data = await res.json();
      setJobLinks(data.links);
    }
  };

  const openContact = (c: Contact) => {
    setSelectedContact(c);
    fetchInteractions(c.id);
    fetchJobLinks(c.id);
  };

  const handleReminderAction = async (
    id: string,
    action: "done" | "snooze"
  ) => {
    await fetch("/api/contacts/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email: userEmail, action }),
    });
    fetchReminders();
  };

  const handleDeleteContact = async (id: string) => {
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email: userEmail }),
    });
    setSelectedContact(null);
    fetchContacts();
    fetchReminders();
  };

  /* Stats */
  const totalContacts = contacts.length;
  const followUpsDue = reminders.filter(
    (r) => r.status === "pending" && dueStatus(r.due_date) !== "later"
  ).length;
  const strongConnections = contacts.filter(
    (c) => c.strength_tier === "strong"
  ).length;
  const avgScore =
    totalContacts > 0
      ? Math.round(
          contacts.reduce((s, c) => s + c.strength_score, 0) / totalContacts
        )
      : 0;

  /* Tier distribution for dashboard */
  const tierCounts = {
    strong: contacts.filter((c) => c.strength_tier === "strong").length,
    warm: contacts.filter((c) => c.strength_tier === "warm").length,
    new: contacts.filter((c) => c.strength_tier === "new").length,
    cold: contacts.filter((c) => c.strength_tier === "cold").length,
  };

  /* Recent activity for dashboard */
  const recentContacts = contacts
    .filter((c) => {
      const daysSince = (Date.now() - new Date(c.updated_at).getTime()) / 86400000;
      return daysSince <= 7;
    }).length;

  const overdueReminders = reminders.filter(
    (r) => r.status === "pending" && dueStatus(r.due_date) === "overdue"
  ).length;

  const FILTERS = [
    { label: "All", value: null },
    { label: "Strong", value: "strong" },
    { label: "Warm", value: "warm" },
    { label: "New", value: "new" },
    { label: "Cold", value: "cold" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-800/60 border border-slate-700 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "contacts"
              ? "bg-teal-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Contacts
          </span>
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "dashboard"
              ? "bg-teal-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </span>
        </button>
      </div>

      {activeTab === "dashboard" ? (
        <NetworkingDashboard
          totalContacts={totalContacts}
          tierCounts={tierCounts}
          followUpsDue={followUpsDue}
          overdueReminders={overdueReminders}
          strongConnections={strongConnections}
          avgScore={avgScore}
          recentContacts={recentContacts}
          reminders={reminders}
          contacts={contacts}
          onReminderAction={handleReminderAction}
        />
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5 text-teal-400" />}
              label="Total Contacts"
              value={totalContacts}
            />
            <StatCard
              icon={<Bell className="w-5 h-5 text-amber-400" />}
              label="Follow-ups Due"
              value={followUpsDue}
            />
            <StatCard
              icon={<Handshake className="w-5 h-5 text-emerald-400" />}
              label="Strong Connections"
              value={strongConnections}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
              label="Avg. Strength"
              value={`${avgScore}%`}
            />
          </div>

          {/* Follow-up Reminders */}
          {reminders.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Follow-up Reminders
              </h3>
              <div className="divide-y divide-slate-700/40">
                {reminders.slice(0, 5).map((r) => {
                  const status = dueStatus(r.due_date);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${DUE_DOT[status]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">
                          {r.contacts?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {r.description || "Follow up"}
                        </p>
                      </div>
                      <span className={`text-xs shrink-0 ${DUE_STYLES[status]}`}>
                        {relativeDate(r.due_date)}
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleReminderAction(r.id, "done")}
                          className="px-2.5 py-1 text-xs rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => handleReminderAction(r.id, "snooze")}
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          Snooze
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search + Filters + Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setActiveTier(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeTier === f.value
                      ? "bg-teal-600 border-teal-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium text-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4" /> Import
              </button>
            </div>
          </div>

          {/* Contact Cards Grid */}
          {contacts.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No contacts yet</p>
              <p className="text-slate-500 text-xs mt-1">
                Add a contact or import from LinkedIn to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  onClick={() => openContact(c)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          userEmail={userEmail}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchContacts();
          }}
        />
      )}

      {/* LinkedIn Import Modal */}
      {showImportModal && (
        <ImportModal
          userEmail={userEmail}
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            setShowImportModal(false);
            fetchContacts();
          }}
        />
      )}

      {/* Contact Detail Sheet */}
      <Sheet
        open={!!selectedContact}
        onOpenChange={(open) => {
          if (!open) setSelectedContact(null);
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selectedContact && (
            <ContactDetail
              contact={selectedContact}
              interactions={interactions}
              jobLinks={jobLinks}
              onDelete={() => handleDeleteContact(selectedContact.id)}
              userEmail={userEmail}
              onInteractionAdded={() => fetchInteractions(selectedContact.id)}
              onReminderAdded={fetchReminders}
              onJobLinkChanged={() => fetchJobLinks(selectedContact.id)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Networking Dashboard                                               */
/* ------------------------------------------------------------------ */

function NetworkingDashboard({
  totalContacts,
  tierCounts,
  followUpsDue,
  overdueReminders,
  strongConnections,
  avgScore,
  recentContacts,
  reminders,
  contacts,
  onReminderAction,
}: {
  totalContacts: number;
  tierCounts: Record<string, number>;
  followUpsDue: number;
  overdueReminders: number;
  strongConnections: number;
  avgScore: number;
  recentContacts: number;
  reminders: Reminder[];
  contacts: Contact[];
  onReminderAction: (id: string, action: "done" | "snooze") => void;
}) {
  const maxTier = Math.max(...Object.values(tierCounts), 1);

  const companyCounts: Record<string, number> = {};
  contacts.forEach((c) => {
    if (c.company) {
      companyCounts[c.company] = (companyCounts[c.company] || 0) + 1;
    }
  });
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-teal-400" />}
          label="Total Contacts"
          value={totalContacts}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-cyan-400" />}
          label="Active This Week"
          value={recentContacts}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-400" />}
          label="Overdue Follow-ups"
          value={overdueReminders}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="Avg. Strength"
          value={`${avgScore}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health — Tier Distribution */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Relationship Pipeline
          </h3>
          <div className="space-y-3">
            {(["strong", "warm", "new", "cold"] as const).map((tier) => {
              const tc = TIER_COLORS[tier];
              const count = tierCounts[tier];
              const pct = totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0;
              return (
                <div key={tier}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium ${tc.text}`}>
                      {tierLabel(tier)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full ${tc.fill} transition-all`}
                      style={{ width: `${(count / maxTier) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Strong connections</span>
              <span className="text-sm font-semibold text-emerald-300">{strongConnections}</span>
            </div>
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            Top Companies in Network
          </h3>
          {topCompanies.length === 0 ? (
            <p className="text-xs text-slate-500">No company data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topCompanies.map(([company, count]) => (
                <div key={company} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-900/60 flex items-center justify-center text-[10px] font-semibold text-slate-300 shrink-0">
                      {company.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-200 truncate">{company}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{count} contact{count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Follow-ups Full List */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          All Pending Follow-ups ({followUpsDue} due soon)
        </h3>
        {reminders.length === 0 ? (
          <p className="text-xs text-slate-500">No pending reminders</p>
        ) : (
          <div className="divide-y divide-slate-700/40">
            {reminders.map((r) => {
              const status = dueStatus(r.due_date);
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${DUE_DOT[status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">
                      {r.contacts?.name ?? "Unknown"}
                      {r.contacts?.company && (
                        <span className="text-slate-500"> at {r.contacts.company}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {r.description || "Follow up"} &middot; Due {formatDate(r.due_date)}
                    </p>
                  </div>
                  <span className={`text-xs shrink-0 ${DUE_STYLES[status]}`}>
                    {relativeDate(r.due_date)}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => onReminderAction(r.id, "done")}
                      className="px-2.5 py-1 text-xs rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => onReminderAction(r.id, "snooze")}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      Snooze
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Networking Activity Summary */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Networking Health
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">{recentContacts}</p>
            <p className="text-xs text-slate-400">Active this week</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">{followUpsDue}</p>
            <p className="text-xs text-slate-400">Follow-ups due</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${avgScore >= 50 ? "text-emerald-300" : avgScore >= 25 ? "text-amber-300" : "text-red-300"}`}>
              {avgScore >= 50 ? "Healthy" : avgScore >= 25 ? "Growing" : "Needs Work"}
            </p>
            <p className="text-xs text-slate-400">Network status</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
      <div className="p-2 rounded-xl bg-slate-900/60">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  onClick,
}: {
  contact: Contact;
  onClick: () => void;
}) {
  const tier = TIER_COLORS[contact.strength_tier] ?? TIER_COLORS.new;

  return (
    <button
      onClick={onClick}
      className="text-left bg-slate-800/60 border border-slate-700 rounded-2xl p-4 hover:border-teal-600/50 hover:bg-slate-800/80 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full ${tier.bg} flex items-center justify-center text-sm font-semibold ${tier.text} shrink-0`}
        >
          {initials(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-100 truncate">
            {contact.name}
          </p>
          {contact.role && (
            <p className="text-xs text-slate-400 truncate">{contact.role}</p>
          )}
          {contact.company && (
            <p className="text-xs text-slate-500 truncate">{contact.company}</p>
          )}
        </div>
        {contact.linkedin_url && (
          <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </div>

      {/* How Connected */}
      {contact.how_connected && (
        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <UserPlus className="w-3 h-3" />
          {contact.how_connected}
        </p>
      )}

      {/* Strength Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs ${tier.text}`}>
            {tierLabel(contact.strength_tier)}
          </span>
          <span className="text-xs text-slate-500">
            {contact.strength_score}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full ${tier.fill} transition-all`}
            style={{ width: `${contact.strength_score}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-400 text-xs"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span className="text-xs text-slate-500">
              +{contact.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span>Updated {relativeDate(contact.updated_at)}</span>
        <Calendar className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-500 transition-colors" />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact Detail (Enhanced)                                          */
/* ------------------------------------------------------------------ */

function ContactDetail({
  contact,
  interactions,
  jobLinks,
  onDelete,
  userEmail,
  onInteractionAdded,
  onReminderAdded,
  onJobLinkChanged,
}: {
  contact: Contact;
  interactions: Interaction[];
  jobLinks: JobLink[];
  onDelete: () => void;
  userEmail: string;
  onInteractionAdded: () => void;
  onReminderAdded: () => void;
  onJobLinkChanged: () => void;
}) {
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [interType, setInterType] = useState("note");
  const [interDesc, setInterDesc] = useState("");
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showLinkJobForm, setShowLinkJobForm] = useState(false);

  const tier = TIER_COLORS[contact.strength_tier] ?? TIER_COLORS.new;

  const handleAddInteraction = async () => {
    if (!interDesc.trim()) return;
    await fetch("/api/contacts/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        contactId: contact.id,
        type: interType,
        description: interDesc,
      }),
    });
    setInterDesc("");
    setAddingInteraction(false);
    onInteractionAdded();
  };

  const handleDeleteJobLink = async (linkId: string) => {
    await fetch("/api/contacts/job-links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: linkId, email: userEmail }),
    });
    onJobLinkChanged();
  };

  const handleUpdateReferralStatus = async (linkId: string, status: string) => {
    await fetch("/api/contacts/job-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: linkId, email: userEmail, referral_status: status }),
    });
    onJobLinkChanged();
  };

  return (
    <div className="pt-2">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full ${tier.bg} flex items-center justify-center text-base font-bold ${tier.text}`}
          >
            {initials(contact.name)}
          </div>
          <div>
            <SheetTitle>{contact.name}</SheetTitle>
            {contact.role && (
              <p className="text-xs text-slate-400">{contact.role}</p>
            )}
          </div>
        </div>
      </SheetHeader>

      <div className="px-4 space-y-5 pb-6">
        {/* Contact Info */}
        <div className="space-y-2">
          {contact.company && (
            <InfoRow icon={<Building2 />} value={contact.company} />
          )}
          {contact.role && (
            <InfoRow icon={<Briefcase />} value={contact.role} />
          )}
          {contact.location && (
            <InfoRow icon={<MapPin />} value={contact.location} />
          )}
          {contact.email && <InfoRow icon={<Mail />} value={contact.email} />}
          {contact.linkedin_url && (
            <InfoRow icon={<ExternalLink />} value="LinkedIn Profile" href={contact.linkedin_url} />
          )}
          {contact.how_connected && (
            <InfoRow icon={<UserPlus />} value={contact.how_connected} />
          )}
        </div>

        {/* Strength */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Relationship Strength</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-700">
              <div
                className={`h-full rounded-full ${tier.fill}`}
                style={{ width: `${contact.strength_score}%` }}
              />
            </div>
            <span className={`text-sm font-semibold ${tier.text}`}>
              {contact.strength_score}%
            </span>
          </div>
          <p className={`text-xs mt-1 ${tier.text}`}>
            {tierLabel(contact.strength_tier)}
          </p>
        </div>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Follow-up Reminder Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Bell className="w-3 h-3" /> Follow-up Reminders
            </p>
            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="text-xs text-teal-400 hover:text-teal-300"
            >
              {showReminderForm ? "Cancel" : "+ Schedule"}
            </button>
          </div>

          {showReminderForm && (
            <AddReminderForm
              userEmail={userEmail}
              contactId={contact.id}
              onAdded={() => {
                setShowReminderForm(false);
                onReminderAdded();
              }}
            />
          )}
        </div>

        {/* Linked Jobs Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Linked Applications
            </p>
            <button
              onClick={() => setShowLinkJobForm(!showLinkJobForm)}
              className="text-xs text-teal-400 hover:text-teal-300"
            >
              {showLinkJobForm ? "Cancel" : "+ Link Job"}
            </button>
          </div>

          {showLinkJobForm && (
            <LinkJobForm
              userEmail={userEmail}
              contactId={contact.id}
              onLinked={() => {
                setShowLinkJobForm(false);
                onJobLinkChanged();
              }}
            />
          )}

          {jobLinks.length > 0 && (
            <div className="space-y-2">
              {jobLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-slate-900/60 border border-slate-700 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        {link.jobs?.role ?? "Unknown Role"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {link.jobs?.company ?? "Unknown Company"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteJobLink(link.id)}
                      className="text-slate-500 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 text-xs">
                      {ROLE_LABELS[link.role] ?? link.role}
                    </span>
                    <select
                      value={link.referral_status}
                      onChange={(e) => handleUpdateReferralStatus(link.id, e.target.value)}
                      className={`px-2 py-0.5 rounded-full text-xs border-0 cursor-pointer ${
                        REFERRAL_STATUS_STYLES[link.referral_status]?.bg ?? "bg-slate-700/40"
                      } ${REFERRAL_STATUS_STYLES[link.referral_status]?.text ?? "text-slate-400"}`}
                    >
                      <option value="none">No Referral</option>
                      <option value="requested">Requested</option>
                      <option value="submitted">Submitted</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                  {link.jobs?.stage && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      Application: {link.jobs.stage.replace("_", " ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {jobLinks.length === 0 && !showLinkJobForm && (
            <p className="text-xs text-slate-500">No linked applications</p>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Activity</p>
            <button
              onClick={() => setAddingInteraction(!addingInteraction)}
              className="text-xs text-teal-400 hover:text-teal-300"
            >
              {addingInteraction ? "Cancel" : "+ Add"}
            </button>
          </div>

          {addingInteraction && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 mb-3 space-y-2">
              <select
                value={interType}
                onChange={(e) => setInterType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="note">Note</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="message">Message</option>
                <option value="call">Call</option>
                <option value="event">Event</option>
              </select>
              <input
                type="text"
                placeholder="Description..."
                value={interDesc}
                onChange={(e) => setInterDesc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddInteraction()}
              />
              <button
                onClick={handleAddInteraction}
                className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs text-white font-medium transition-colors"
              >
                Save
              </button>
            </div>
          )}

          {interactions.length === 0 ? (
            <p className="text-xs text-slate-500">No interactions logged yet</p>
          ) : (
            <div className="space-y-0">
              {interactions.map((i) => (
                <div key={i.id} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      {INTERACTION_ICONS[i.type] ?? (
                        <StickyNote className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="w-px flex-1 bg-slate-700/50" />
                  </div>
                  <div className="pb-2 min-w-0">
                    <p className="text-sm text-slate-200 truncate">
                      {i.description || i.type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {relativeDate(i.occurred_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-full py-2 rounded-xl border border-red-800/50 text-red-400 text-xs hover:bg-red-900/20 transition-colors"
        >
          Delete Contact
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Reminder Form (with cadence presets)                           */
/* ------------------------------------------------------------------ */

function AddReminderForm({
  userEmail,
  contactId,
  onAdded,
}: {
  userEmail: string;
  contactId: string;
  onAdded: () => void;
}) {
  const [description, setDescription] = useState("");
  const [cadence, setCadence] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const days = cadence === 0 ? parseInt(customDays) || 7 : cadence;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    setSaving(true);
    await fetch("/api/contacts/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        contactId,
        description: description || `Follow up in ${days} days`,
        due_date: dueDate.toISOString(),
      }),
    });
    setSaving(false);
    onAdded();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 mb-3 space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Follow-up Cadence</label>
        <div className="flex gap-1.5 flex-wrap">
          {CADENCE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setCadence(opt.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cadence === opt.days
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {cadence === 0 && (
        <input
          type="number"
          placeholder="Days..."
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
          min="1"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
        />
      )}

      <input
        type="text"
        placeholder="Reminder note (optional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500"
      />

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-xs text-white font-medium transition-colors"
      >
        {saving ? "Scheduling..." : `Schedule Follow-up`}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Link Job Form                                                      */
/* ------------------------------------------------------------------ */

function LinkJobForm({
  userEmail,
  contactId,
  onLinked,
}: {
  userEmail: string;
  contactId: string;
  onLinked: () => void;
}) {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [role, setRole] = useState("referrer");
  const [saving, setSaving] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const res = await fetch(`/api/jobs?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
      setLoadingJobs(false);
    };
    fetchJobs();
  }, [userEmail]);

  const handleSubmit = async () => {
    if (!selectedJob) return;
    setSaving(true);
    await fetch("/api/contacts/job-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        contactId,
        jobId: selectedJob,
        role,
      }),
    });
    setSaving(false);
    onLinked();
  };

  if (loadingJobs) {
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 mb-3">
        <p className="text-xs text-slate-500">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 mb-3 space-y-2">
      {jobs.length === 0 ? (
        <p className="text-xs text-slate-500">
          No tracked jobs found. Add jobs in the Job Tracker first.
        </p>
      ) : (
        <>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="">Select a job...</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.role} at {j.company} ({j.stage.replace("_", " ")})
              </option>
            ))}
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="referrer">Referrer</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="recruiter">Recruiter</option>
            <option value="interviewer">Interviewer</option>
            <option value="insider">Insider</option>
          </select>

          <button
            onClick={handleSubmit}
            disabled={!selectedJob || saving}
            className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-xs text-white font-medium transition-colors"
          >
            {saving ? "Linking..." : "Link to Application"}
          </button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */

function InfoRow({
  icon,
  value,
  href,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <span className="text-slate-500 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:text-teal-400 transition-colors">
        {content}
      </a>
    );
  }
  return content;
}

/* ------------------------------------------------------------------ */
/*  Add Contact Modal                                                  */
/* ------------------------------------------------------------------ */

function AddContactModal({
  userEmail,
  onClose,
  onAdded,
}: {
  userEmail: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    company: "",
    role: "",
    linkedin_url: "",
    location: "",
    how_connected: "",
    tags: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        name: form.name.trim(),
        contact_email: form.contact_email || undefined,
        company: form.company || undefined,
        role: form.role || undefined,
        linkedin_url: form.linkedin_url || undefined,
        location: form.location || undefined,
        how_connected: form.how_connected || undefined,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (res.ok) onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-slate-100">
            Add Contact
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <ModalInput
            label="Name *"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <ModalInput
            label="Email"
            value={form.contact_email}
            onChange={(v) => setForm((f) => ({ ...f, contact_email: v }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <ModalInput
              label="Company"
              value={form.company}
              onChange={(v) => setForm((f) => ({ ...f, company: v }))}
            />
            <ModalInput
              label="Role"
              value={form.role}
              onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            />
          </div>
          <ModalInput
            label="LinkedIn URL"
            value={form.linkedin_url}
            onChange={(v) => setForm((f) => ({ ...f, linkedin_url: v }))}
          />
          <ModalInput
            label="Location"
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          />

          {/* How Connected */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">How Connected</label>
            <select
              value={form.how_connected}
              onChange={(e) => setForm((f) => ({ ...f, how_connected: e.target.value }))}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="">Select...</option>
              {HOW_CONNECTED_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <ModalInput
            label="Tags (comma-separated)"
            value={form.tags}
            onChange={(v) => setForm((f) => ({ ...f, tags: v }))}
          />
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-sm font-medium text-white transition-colors"
          >
            {saving ? "Adding..." : "Add Contact"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ModalInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LinkedIn Import Modal                                              */
/* ------------------------------------------------------------------ */

function ImportModal({
  userEmail,
  onClose,
  onImported,
}: {
  userEmail: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    total: number;
  } | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("email", userEmail);
    formData.append("file", file);
    const res = await fetch("/api/contacts/import", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-slate-100">
            Import LinkedIn Contacts
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-slate-200">
              Imported {result.imported} of {result.total} contacts
            </p>
            <button
              onClick={onImported}
              className="mt-4 px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-sm font-medium text-white transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 space-y-2">
              <p className="text-xs text-slate-400">How to export:</p>
              <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                <li>Go to LinkedIn Settings &amp; Privacy</li>
                <li>Select &quot;Get a copy of your data&quot;</li>
                <li>Choose &quot;Connections&quot; and request archive</li>
                <li>Download and upload the Connections.csv file</li>
              </ol>
            </div>

            <label className="block border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 transition-colors">
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-300">
                {file ? file.name : "Choose Connections.csv"}
              </p>
              <p className="text-xs text-slate-500 mt-1">CSV files only</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-sm font-medium text-white transition-colors"
            >
              {uploading ? "Importing..." : "Import Contacts"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
