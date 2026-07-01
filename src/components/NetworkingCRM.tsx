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
  Sparkles,
  Send,
  Copy,
  Check,
  ArrowRight,
  GraduationCap,
  UserPlus,
  Globe,
  Link2,
  ChevronDown,
  ChevronUp,
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

interface WarmIntroPath {
  pathType: string;
  description: string;
  strength: string;
  actionSteps: string[];
  suggestedContact: {
    name: string;
    inferredRole: string;
    company: string;
    connectionReason: string;
  };
}

interface OutreachTemplate {
  templateType: string;
  subject: string;
  body: string;
  tips: string[];
}

interface WarmIntroStrategy {
  warmestPath: string;
  estimatedResponseRate: string;
  recommendedApproach: string;
  timingAdvice: string;
}

interface WarmIntroResult {
  connectionPaths: WarmIntroPath[];
  outreachTemplates: OutreachTemplate[];
  strategy: WarmIntroStrategy;
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
  const [activeView, setActiveView] = useState<"contacts" | "warm-intros">("contacts");

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

  const openContact = (c: Contact) => {
    setSelectedContact(c);
    fetchInteractions(c.id);
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
      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView("contacts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeView === "contacts"
              ? "bg-teal-600 text-white"
              : "bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" /> Contacts
        </button>
        <button
          onClick={() => setActiveView("warm-intros")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeView === "warm-intros"
              ? "bg-teal-600 text-white"
              : "bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Warm Intros
        </button>
      </div>

      {activeView === "warm-intros" ? (
        <WarmIntrosPanel userEmail={userEmail} onSaveContact={fetchContacts} />
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
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          {selectedContact && (
            <ContactDetail
              contact={selectedContact}
              interactions={interactions}
              onDelete={() => handleDeleteContact(selectedContact.id)}
              userEmail={userEmail}
              onInteractionAdded={() => fetchInteractions(selectedContact.id)}
            />
          )}
        </SheetContent>
      </Sheet>
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

function ContactDetail({
  contact,
  interactions,
  onDelete,
  userEmail,
  onInteractionAdded,
}: {
  contact: Contact;
  interactions: Interaction[];
  onDelete: () => void;
  userEmail: string;
  onInteractionAdded: () => void;
}) {
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [interType, setInterType] = useState("note");
  const [interDesc, setInterDesc] = useState("");

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
/*  Warm Intros Panel                                                  */
/* ------------------------------------------------------------------ */

const PATH_TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  alumni: { icon: <GraduationCap className="w-4 h-4" />, label: "Alumni", color: "text-violet-400" },
  "former-colleague": { icon: <Briefcase className="w-4 h-4" />, label: "Former Colleague", color: "text-blue-400" },
  "industry-peer": { icon: <Globe className="w-4 h-4" />, label: "Industry Peer", color: "text-cyan-400" },
  community: { icon: <Users className="w-4 h-4" />, label: "Community", color: "text-amber-400" },
  "second-degree": { icon: <Link2 className="w-4 h-4" />, label: "2nd Degree", color: "text-emerald-400" },
};

const STRENGTH_BADGE: Record<string, { bg: string; text: string }> = {
  strong: { bg: "bg-emerald-900/40", text: "text-emerald-300" },
  moderate: { bg: "bg-amber-900/40", text: "text-amber-300" },
  speculative: { bg: "bg-slate-700/40", text: "text-slate-400" },
};

const TEMPLATE_LABELS: Record<string, string> = {
  "alumni-intro": "Alumni Introduction",
  "mutual-connection": "Mutual Connection",
  "cold-warm": "Cold-Warm Outreach",
  "informational-interview": "Informational Interview",
  "referral-request": "Referral Request",
};

function WarmIntrosPanel({
  userEmail,
  onSaveContact,
}: {
  userEmail: string;
  onSaveContact: () => void;
}) {
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WarmIntroResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPath, setExpandedPath] = useState<number | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savingContact, setSavingContact] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!targetCompany.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/networking/warm-intros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          targetCompany: targetCompany.trim(),
          targetRole: targetRole.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze");
      }
      const data = await res.json();
      setResult(data);
      setExpandedPath(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = async (index: number, template: OutreachTemplate) => {
    const text = `Subject: ${template.subject}\n\n${template.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveContact = async (index: number, path: WarmIntroPath) => {
    setSavingContact(index);
    try {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: path.suggestedContact.name,
          company: path.suggestedContact.company,
          role: path.suggestedContact.inferredRole,
          source: "ai-suggested",
          tags: ["warm-intro", path.pathType],
          notes: `${path.suggestedContact.connectionReason}\n\nAction steps:\n${path.actionSteps.map((s) => `- ${s}`).join("\n")}`,
        }),
      });
      onSaveContact();
    } finally {
      setSavingContact(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Find Warm Introductions
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Enter a target company to discover connection paths through your alumni
          network, former colleagues, and existing contacts.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Target company (e.g. Google, Stripe)"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Target role (optional)"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="sm:w-48 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !targetCompany.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-medium text-white transition-colors shrink-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Find Paths
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <>
          {/* Strategy Overview */}
          <div className="bg-gradient-to-br from-violet-900/20 to-slate-800/60 border border-violet-700/30 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Strategy for {targetCompany}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Warmest Path</p>
                <p className="text-sm text-slate-200">
                  {result.strategy.warmestPath}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Est. Response Rate
                </p>
                <p className="text-sm text-slate-200">
                  {result.strategy.estimatedResponseRate}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Recommended Approach
                </p>
                <p className="text-sm text-slate-200">
                  {result.strategy.recommendedApproach}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Timing Advice</p>
                <p className="text-sm text-slate-200">
                  {result.strategy.timingAdvice}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Paths */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Handshake className="w-4 h-4 text-teal-400" />
              Connection Paths ({result.connectionPaths.length})
            </h3>
            <div className="space-y-3">
              {result.connectionPaths.map((path, i) => {
                const meta = PATH_TYPE_META[path.pathType] ?? PATH_TYPE_META.community;
                const badge = STRENGTH_BADGE[path.strength] ?? STRENGTH_BADGE.speculative;
                const isExpanded = expandedPath === i;

                return (
                  <div
                    key={i}
                    className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedPath(isExpanded ? null : i)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/80 transition-colors"
                    >
                      <div className={`shrink-0 ${meta.color}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-slate-200 truncate">
                            {path.suggestedContact.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${badge.bg} ${badge.text}`}
                          >
                            {path.strength}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs bg-slate-700/40 ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {path.suggestedContact.inferredRole} at{" "}
                          {path.suggestedContact.company}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
                        <div className="pt-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Connection Reason
                          </p>
                          <p className="text-sm text-slate-300">
                            {path.suggestedContact.connectionReason}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            How to Approach
                          </p>
                          <p className="text-sm text-slate-300">
                            {path.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-2">
                            Action Steps
                          </p>
                          <ol className="space-y-1.5">
                            {path.actionSteps.map((step, si) => (
                              <li
                                key={si}
                                className="flex items-start gap-2 text-sm text-slate-300"
                              >
                                <span className="w-5 h-5 rounded-full bg-teal-900/40 text-teal-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                                  {si + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                        <button
                          onClick={() => handleSaveContact(i, path)}
                          disabled={savingContact === i}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-xs font-medium transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {savingContact === i
                            ? "Saving..."
                            : "Save to Contacts"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outreach Templates */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Outreach Templates ({result.outreachTemplates.length})
            </h3>
            <div className="space-y-3">
              {result.outreachTemplates.map((tpl, i) => {
                const isExpanded = expandedTemplate === i;
                return (
                  <div
                    key={i}
                    className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedTemplate(isExpanded ? null : i)
                      }
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/80 transition-colors"
                    >
                      <Send className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">
                          {TEMPLATE_LABELS[tpl.templateType] || tpl.templateType}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {tpl.subject}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTemplate(i, tpl);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 transition-colors shrink-0"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />{" "}
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
                        <div className="pt-3">
                          <p className="text-xs text-slate-400 mb-1">
                            Subject
                          </p>
                          <p className="text-sm text-slate-200 font-medium">
                            {tpl.subject}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Body</p>
                          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {tpl.body}
                            </p>
                          </div>
                        </div>
                        {tpl.tips.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Tips</p>
                            <ul className="space-y-1">
                              {tpl.tips.map((tip, ti) => (
                                <li
                                  key={ti}
                                  className="flex items-start gap-2 text-xs text-slate-400"
                                >
                                  <Sparkles className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            Find warm introduction paths to any company
          </p>
          <p className="text-slate-500 text-xs mt-1">
            We&apos;ll analyze your education, work history, and existing
            contacts to find the warmest paths in
          </p>
        </div>
      )}
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
                <li>Go to LinkedIn Settings & Privacy</li>
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
