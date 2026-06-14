"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  DollarSign,
  MessageSquare,
  FileText,
  Calculator,
  ClipboardCheck,
  Send,
  ArrowLeft,
  RotateCcw,
  TrendingUp,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────

type Tab = "overview" | "market" | "roleplay" | "talking-points" | "counter-offer" | "readiness";
type Scenario = "initial_offer" | "counter_offer" | "competing_offers" | "equity_negotiation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MarketData {
  role: string;
  salaryP10: number;
  salaryP25: number;
  salaryMedian: number;
  salaryP75: number;
  salaryP90: number;
  totalEmployment: number;
  growthPercent: number | null;
  growthLabel: string;
  source: string;
}

interface OfferDetails {
  base: string;
  equity: string;
  bonus: string;
  benefits: string;
}

// ── Readiness quiz ──────────────────────────────────────────────────────

const READINESS_QUESTIONS = [
  { q: "I know the market salary range for my target role and location.", id: "market_research" },
  { q: "I can clearly articulate my unique value proposition and key accomplishments.", id: "value_prop" },
  { q: "I have a specific target number and a walkaway number defined.", id: "target_number" },
  { q: "I have practiced saying my counter-offer out loud.", id: "practice" },
  { q: "I'm prepared to negotiate beyond base salary (equity, bonus, PTO, title, etc.).", id: "beyond_base" },
  { q: "I have a response ready for 'that's the best we can do.'", id: "pushback_ready" },
  { q: "I know my BATNA (best alternative to a negotiated agreement).", id: "batna" },
  { q: "I feel confident negotiating without apologizing or hedging.", id: "confidence" },
  { q: "I have researched the company's financial health and funding stage.", id: "company_research" },
  { q: "I have written thank-you/follow-up email templates ready.", id: "follow_up" },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "$" + n.toLocaleString();
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      nodes.push(<p key={key++} className="font-bold text-white mt-3 mb-1">{line.slice(2, -2)}</p>);
    } else if (line.match(/^[-*] /)) {
      nodes.push(<li key={key++} className="ml-4 leading-relaxed list-disc">{line.slice(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
      nodes.push(<li key={key++} className="ml-4 leading-relaxed list-decimal">{line.replace(/^\d+\.\s*/, "")}</li>);
    } else if (line.trim() === "") {
      if (nodes.length > 0) nodes.push(<div key={key++} className="h-1" />);
    } else {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      nodes.push(
        <p key={key++} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  }
  return <>{nodes}</>;
}

// ── Salary bar chart ────────────────────────────────────────────────────

function SalaryBar({ data, offerBase }: { data: MarketData; offerBase?: number }) {
  const max = data.salaryP90 * 1.1;
  const pct = (v: number) => `${Math.round((v / max) * 100)}%`;

  const tiers = [
    { label: "10th", value: data.salaryP10, color: "bg-slate-600" },
    { label: "25th", value: data.salaryP25, color: "bg-blue-600" },
    { label: "Median", value: data.salaryMedian, color: "bg-emerald-500" },
    { label: "75th", value: data.salaryP75, color: "bg-teal-400" },
    { label: "90th", value: data.salaryP90, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-3">
      {tiers.map((t) => (
        <div key={t.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-14 text-right shrink-0">{t.label}</span>
          <div className="flex-1 h-7 bg-slate-800 rounded-full overflow-hidden relative">
            <div className={`h-full ${t.color} rounded-full transition-all duration-700`} style={{ width: pct(t.value) }} />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">{fmt(t.value)}</span>
          </div>
        </div>
      ))}
      {offerBase && offerBase > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 w-14 text-right shrink-0 font-bold">Your offer</span>
          <div className="flex-1 h-7 bg-slate-800 rounded-full overflow-hidden relative border border-amber-500/50">
            <div className="h-full bg-amber-500/60 rounded-full transition-all duration-700" style={{ width: pct(offerBase) }} />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-300">{fmt(offerBase)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export default function SalaryNegotiationClient() {
  const [tab, setTab] = useState<Tab>("overview");
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [offer, setOffer] = useState<OfferDetails>({ base: "", equity: "", bonus: "", benefits: "" });
  const [keySkills, setKeySkills] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");

  // Market data
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // Role-play chat
  const [scenario, setScenario] = useState<Scenario>("initial_offer");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Talking points
  const [talkingPoints, setTalkingPoints] = useState("");
  const [tpLoading, setTpLoading] = useState(false);

  // Readiness
  const [readinessAnswers, setReadinessAnswers] = useState<Record<string, boolean>>({});

  const effectiveRole = targetRole === "custom" ? customRole.trim() : targetRole;

  const scrollChat = useCallback(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollChat(); }, [chatMessages, scrollChat]);

  // ── Market data fetch ───────────────────────────────────────────────

  async function fetchMarket() {
    if (!effectiveRole) return;
    setMarketLoading(true);
    try {
      const res = await fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: [effectiveRole] }),
      });
      const json = await res.json();
      const data = json.marketData?.[effectiveRole] ?? Object.values(json.marketData ?? {})[0];
      setMarketData(data ?? null);
    } catch {
      setMarketData(null);
    } finally {
      setMarketLoading(false);
    }
  }

  // ── Role-play chat ──────────────────────────────────────────────────

  async function startRoleplay() {
    setChatMessages([]);
    setChatStreaming(true);
    setTab("roleplay");

    const startMsg: Message = { role: "user", content: "Start the negotiation role-play." };
    try {
      const res = await fetch("/api/salary-negotiation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: effectiveRole,
          scenario,
          currentSalary: currentSalary ? parseFloat(currentSalary) : undefined,
          offerDetails: offer.base ? {
            base: parseFloat(offer.base),
            equity: offer.equity ? parseFloat(offer.equity) : undefined,
            bonus: offer.bonus ? parseFloat(offer.bonus) : undefined,
            benefits: offer.benefits || undefined,
          } : undefined,
          messages: [startMsg],
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let content = "";
      setChatMessages([{ role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setChatMessages([{ role: "assistant", content }]);
      }
      setChatMessages([{ role: "assistant", content }]);
    } catch {
      setChatMessages([{ role: "assistant", content: "Sorry, I had trouble starting the role-play. Please try again." }]);
    } finally {
      setChatStreaming(false);
    }
  }

  async function sendChatMessage(text?: string) {
    const content = (text ?? chatInput).trim();
    if (!content || chatStreaming) return;

    const userMsg: Message = { role: "user", content };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    if (chatInputRef.current) chatInputRef.current.style.height = "auto";
    setChatStreaming(true);

    try {
      const res = await fetch("/api/salary-negotiation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: effectiveRole,
          scenario,
          currentSalary: currentSalary ? parseFloat(currentSalary) : undefined,
          offerDetails: offer.base ? {
            base: parseFloat(offer.base),
            equity: offer.equity ? parseFloat(offer.equity) : undefined,
            bonus: offer.bonus ? parseFloat(offer.bonus) : undefined,
            benefits: offer.benefits || undefined,
          } : undefined,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setChatMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantContent };
          return next;
        });
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
    } finally {
      setChatStreaming(false);
    }
  }

  // ── Talking points ──────────────────────────────────────────────────

  async function generateTalkingPoints() {
    setTpLoading(true);
    setTalkingPoints("");
    setTab("talking-points");

    try {
      const res = await fetch("/api/salary-negotiation/talking-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: effectiveRole,
          currentSalary: currentSalary ? parseFloat(currentSalary) : undefined,
          offerBase: offer.base ? parseFloat(offer.base) : undefined,
          offerEquity: offer.equity ? parseFloat(offer.equity) : undefined,
          offerBonus: offer.bonus ? parseFloat(offer.bonus) : undefined,
          yearsExperience: yearsExp ? parseInt(yearsExp) : undefined,
          keySkills: keySkills ? keySkills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
          uniqueValue: uniqueValue || undefined,
          location: location || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setTalkingPoints(content);
      }
      setTalkingPoints(content);
    } catch {
      setTalkingPoints("Sorry, I had trouble generating talking points. Please try again.");
    } finally {
      setTpLoading(false);
    }
  }

  // ── Counter-offer calculator ────────────────────────────────────────

  function calculateCounter(): { suggestedBase: number; suggestedTotal: number; reasoning: string } | null {
    const base = parseFloat(offer.base);
    if (!base || !marketData) return null;

    const expMultiplier = yearsExp ? Math.min(1 + parseInt(yearsExp) * 0.02, 1.3) : 1;
    const target75 = marketData.salaryP75;
    const targetMedian = marketData.salaryMedian;

    let suggestedBase: number;
    let reasoning: string;

    if (base < targetMedian) {
      suggestedBase = Math.round(targetMedian * expMultiplier);
      reasoning = `Your offer of ${fmt(base)} is below the median (${fmt(targetMedian)}). Counter at ${fmt(suggestedBase)} — this targets the median adjusted for your ${yearsExp || "N/A"} years of experience.`;
    } else if (base < target75) {
      suggestedBase = Math.round(((base + target75) / 2) * expMultiplier);
      reasoning = `Your offer of ${fmt(base)} is between the median and 75th percentile. Counter at ${fmt(suggestedBase)} — splitting the difference toward the 75th percentile (${fmt(target75)}).`;
    } else {
      suggestedBase = Math.round(base * 1.1);
      reasoning = `Your offer of ${fmt(base)} is already strong (above 75th percentile at ${fmt(target75)}). A modest 10% counter at ${fmt(suggestedBase)} is reasonable, or focus on equity/bonus/benefits.`;
    }

    const equity = parseFloat(offer.equity) || 0;
    const bonus = parseFloat(offer.bonus) || 0;
    const suggestedTotal = suggestedBase + equity + bonus;

    return { suggestedBase, suggestedTotal, reasoning };
  }

  // ── Readiness score ─────────────────────────────────────────────────

  const readinessScore = Object.values(readinessAnswers).filter(Boolean).length;
  const readinessTotal = READINESS_QUESTIONS.length;
  const readinessPct = Math.round((readinessScore / readinessTotal) * 100);

  // ── Navigation tabs ─────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <DollarSign className="w-4 h-4" /> },
    { id: "market", label: "Market Data", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "roleplay", label: "Role-Play", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "talking-points", label: "Talking Points", icon: <FileText className="w-4 h-4" /> },
    { id: "counter-offer", label: "Counter-Offer", icon: <Calculator className="w-4 h-4" /> },
    { id: "readiness", label: "Readiness", icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  const POPULAR_ROLES = [
    "Software Engineer", "Product Manager", "Data Scientist", "UX Designer",
    "Marketing Manager", "Financial Analyst", "Project Manager", "Sales Engineer",
  ];

  const SCENARIOS: { value: Scenario; label: string; desc: string }[] = [
    { value: "initial_offer", label: "Initial Offer", desc: "You just received an offer" },
    { value: "counter_offer", label: "Counter-Offer", desc: "Make a counter-proposal" },
    { value: "competing_offers", label: "Competing Offers", desc: "Leverage multiple offers" },
    { value: "equity_negotiation", label: "Equity Talk", desc: "Negotiate stock/equity" },
  ];

  // ── Chat key handler ────────────────────────────────────────────────

  function handleChatKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }

  // ── Overview (setup) tab ────────────────────────────────────────────

  if (tab === "overview") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-xs font-semibold mb-4">
            <DollarSign className="w-3.5 h-3.5" />
            Salary Negotiation Coach
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Negotiate Your Worth
          </h1>
          <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
            Market data, AI role-play practice, and personalized strategies. Negotiators earn 18.83% more on average.
          </p>
        </div>

        <div className="space-y-6">
          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Target Role</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {POPULAR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => { setTargetRole(role); setMarketData(null); }}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    targetRole === role
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {role}
                </button>
              ))}
              <button
                onClick={() => { setTargetRole("custom"); setMarketData(null); }}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  targetRole === "custom"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                Other role…
              </button>
            </div>
            {targetRole === "custom" && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. DevRel Engineer, Data Analyst"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            )}
          </div>

          {/* Offer details */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Your Offer Details <span className="text-slate-500 font-normal">(optional)</span></label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Base Salary</label>
                <input type="number" value={offer.base} onChange={(e) => setOffer({ ...offer, base: e.target.value })} placeholder="120000" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Equity/Stock</label>
                <input type="number" value={offer.equity} onChange={(e) => setOffer({ ...offer, equity: e.target.value })} placeholder="50000" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Signing/Annual Bonus</label>
                <input type="number" value={offer.bonus} onChange={(e) => setOffer({ ...offer, bonus: e.target.value })} placeholder="15000" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Benefits Notes</label>
                <input type="text" value={offer.benefits} onChange={(e) => setOffer({ ...offer, benefits: e.target.value })} placeholder="401k match, remote, etc." className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Experience & current salary */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Years Experience</label>
              <input type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="5" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Current Salary</label>
              <input type="number" value={currentSalary} onChange={(e) => setCurrentSalary(e.target.value)} placeholder="95000" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="NYC, Remote" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Skills and unique value */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Key Skills <span className="text-slate-600">(comma-separated)</span></label>
              <input type="text" value={keySkills} onChange={(e) => setKeySkills(e.target.value)} placeholder="Python, SQL, team leadership, AWS" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Unique Value / Accomplishments</label>
              <input type="text" value={uniqueValue} onChange={(e) => setUniqueValue(e.target.value)} placeholder="Led 3x revenue growth, built team of 12, patented ML system" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => { fetchMarket(); setTab("market"); }}
              disabled={!effectiveRole}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-4 h-4" /> Market Data
            </button>
            <button
              onClick={startRoleplay}
              disabled={!effectiveRole}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" /> Practice Role-Play
            </button>
            <button
              onClick={generateTalkingPoints}
              disabled={!effectiveRole}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" /> Talking Points
            </button>
            <button
              onClick={() => { if (!marketData) fetchMarket(); setTab("counter-offer"); }}
              disabled={!effectiveRole || !offer.base}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-4 h-4" /> Counter-Offer
            </button>
          </div>

          <button
            onClick={() => setTab("readiness")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-sm transition-colors text-slate-300"
          >
            <ClipboardCheck className="w-4 h-4" /> Take Readiness Assessment
          </button>
        </div>
      </main>
    );
  }

  // ── Inner page layout (all non-overview tabs) ───────────────────────

  return (
    <main className="flex flex-col h-[calc(100vh-72px)] max-h-[calc(100vh-72px)]">
      {/* Tab bar */}
      <header className="shrink-0 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === "market" && !marketData && effectiveRole) fetchMarket(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Market Data tab */}
      {tab === "market" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-2">Market Salary Data</h2>
            <p className="text-slate-400 text-sm mb-6">
              Real salary ranges for <span className="text-white font-medium">{effectiveRole}</span> from the Bureau of Labor Statistics.
            </p>
            {marketLoading ? (
              <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading market data…
              </div>
            ) : marketData ? (
              <div className="space-y-8">
                <SalaryBar data={marketData} offerBase={offer.base ? parseFloat(offer.base) : undefined} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Median</div>
                    <div className="text-xl font-bold text-emerald-400">{fmt(marketData.salaryMedian)}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">75th Percentile</div>
                    <div className="text-xl font-bold text-teal-400">{fmt(marketData.salaryP75)}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Employment</div>
                    <div className="text-xl font-bold text-blue-400">{marketData.totalEmployment.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <div className="text-xs text-slate-400 mb-1">Growth</div>
                    <div className="text-xl font-bold text-purple-400">{marketData.growthPercent ?? "N/A"}%</div>
                    <div className="text-xs text-slate-500">{marketData.growthLabel}</div>
                  </div>
                </div>
                {offer.base && (
                  <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-5">
                    <h3 className="font-semibold text-sm mb-2">Your Offer vs. Market</h3>
                    {(() => {
                      const base = parseFloat(offer.base);
                      const pctOfMedian = Math.round((base / marketData.salaryMedian) * 100);
                      const diff = base - marketData.salaryMedian;
                      return (
                        <p className="text-sm text-slate-300">
                          Your offer of <span className="text-white font-semibold">{fmt(base)}</span> is{" "}
                          <span className={diff >= 0 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                            {pctOfMedian}% of median
                          </span>
                          {diff < 0 ? ` (${fmt(Math.abs(diff))} below median — strong case for a counter)` : ` (${fmt(diff)} above median — focus on equity/perks)`}.
                        </p>
                      );
                    })()}
                  </div>
                )}
                <p className="text-xs text-slate-600">Source: {marketData.source}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>No market data found for &quot;{effectiveRole}&quot;.</p>
                <p className="text-xs mt-2">Try a more common role title.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role-play chat tab */}
      {tab === "roleplay" && (
        <>
          {chatMessages.length === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-2 text-center">Negotiation Role-Play</h2>
                <p className="text-slate-400 text-sm mb-8 text-center">
                  Practice with an AI hiring manager. Pick your scenario.
                </p>
                <div className="space-y-3 mb-8">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScenario(s.value)}
                      className={`w-full px-4 py-3 rounded-xl text-left transition-colors ${
                        scenario === s.value
                          ? "bg-purple-600/20 border-2 border-purple-500 text-white"
                          : "bg-slate-800/60 border-2 border-transparent text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="text-xs text-slate-500">{s.desc}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={startRoleplay}
                  className="w-full px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-lg transition-colors shadow-lg shadow-purple-900/30"
                >
                  Start Negotiation Practice
                </button>
              </div>
            </div>
          ) : (
            <>
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800/60 text-slate-200 border-l-[3px] border-emerald-500/60"
                      }`}>
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatStreaming && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].content === "" && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="bg-slate-800/60 border-l-[3px] border-emerald-500/60 rounded-2xl px-4 py-2.5">
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
              <div className="shrink-0 border-t border-slate-700/60 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
                <div className="max-w-3xl mx-auto">
                  <div className="flex gap-2 items-end">
                    <textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => {
                        setChatInput(e.target.value);
                        e.currentTarget.style.height = "auto";
                        e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px";
                      }}
                      onKeyDown={handleChatKeyDown}
                      placeholder="Negotiate your offer..."
                      rows={1}
                      style={{ minHeight: "44px", maxHeight: "120px" }}
                      className="flex-1 bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                    />
                    <button
                      onClick={() => sendChatMessage()}
                      disabled={!chatInput.trim() || chatStreaming}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-slate-600">Enter to send · Shift+Enter for new line</p>
                    <button onClick={() => { setChatMessages([]); }} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> New scenario
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Talking points tab */}
      {tab === "talking-points" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-2">Personalized Talking Points</h2>
            <p className="text-slate-400 text-sm mb-6">
              Data-driven negotiation arguments tailored to your profile.
            </p>
            {tpLoading && !talkingPoints ? (
              <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" /> Generating your strategy…
              </div>
            ) : talkingPoints ? (
              <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-6 text-sm text-slate-200">
                <div className="space-y-0.5">{renderMarkdown(talkingPoints)}</div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">Fill in your profile details and generate personalized talking points.</p>
                <button
                  onClick={() => setTab("overview")}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1.5" /> Back to Setup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Counter-offer tab */}
      {tab === "counter-offer" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-2">Counter-Offer Calculator</h2>
            <p className="text-slate-400 text-sm mb-6">
              Market-justified counter based on your offer and experience.
            </p>
            {!offer.base ? (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">Enter your offer details first to calculate a counter.</p>
                <button onClick={() => setTab("overview")} className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-sm transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1.5" /> Enter Offer Details
                </button>
              </div>
            ) : marketLoading ? (
              <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading market data for comparison…
              </div>
            ) : marketData ? (
              (() => {
                const counter = calculateCounter();
                if (!counter) return <p className="text-slate-500">Unable to calculate. Check your inputs.</p>;
                return (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-800/40 border border-amber-600/30 p-6">
                      <div className="text-sm text-amber-400 font-medium mb-1">Suggested Counter-Offer</div>
                      <div className="text-4xl font-extrabold text-white mb-2">{fmt(counter.suggestedBase)}</div>
                      <div className="text-sm text-slate-300">{counter.reasoning}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Current Offer</div>
                        <div className="text-lg font-bold text-slate-300">{fmt(parseFloat(offer.base))}</div>
                      </div>
                      <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Suggested Counter</div>
                        <div className="text-lg font-bold text-amber-400">{fmt(counter.suggestedBase)}</div>
                      </div>
                      <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Increase</div>
                        <div className="text-lg font-bold text-emerald-400">
                          +{fmt(counter.suggestedBase - parseFloat(offer.base))}
                        </div>
                        <div className="text-xs text-slate-500">
                          +{Math.round(((counter.suggestedBase - parseFloat(offer.base)) / parseFloat(offer.base)) * 100)}%
                        </div>
                      </div>
                    </div>

                    <SalaryBar data={marketData} offerBase={parseFloat(offer.base)} />

                    <div className="rounded-xl bg-slate-800/40 border border-slate-700 p-5 space-y-3">
                      <h3 className="font-semibold text-sm">Next Steps</h3>
                      <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Practice delivering your counter with the Role-Play feature</li>
                        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Generate Talking Points for personalized scripts</li>
                        <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Take the Readiness Assessment before your call</li>
                      </ul>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>Could not load market data for comparison.</p>
                <button onClick={fetchMarket} className="mt-3 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Readiness assessment tab */}
      {tab === "readiness" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-2">Negotiation Readiness</h2>
            <p className="text-slate-400 text-sm mb-6">
              Check off each item you&apos;ve prepared. Aim for 8/10 before your negotiation call.
            </p>

            {/* Score circle */}
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={readinessPct >= 80 ? "#10b981" : readinessPct >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${readinessPct * 2.64} 264`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold">{readinessScore}/{readinessTotal}</span>
                  <span className="text-xs text-slate-400">
                    {readinessPct >= 80 ? "Ready!" : readinessPct >= 50 ? "Almost" : "Prep more"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {READINESS_QUESTIONS.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
                    readinessAnswers[item.id]
                      ? "bg-emerald-950/30 border border-emerald-800/30"
                      : "bg-slate-800/40 border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!readinessAnswers[item.id]}
                    onChange={(e) => setReadinessAnswers({ ...readinessAnswers, [item.id]: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 shrink-0"
                  />
                  <span className={`text-sm ${readinessAnswers[item.id] ? "text-emerald-300" : "text-slate-300"}`}>
                    {item.q}
                  </span>
                </label>
              ))}
            </div>

            {readinessPct >= 80 && (
              <div className="mt-8 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 p-5 text-center">
                <p className="text-emerald-400 font-semibold mb-3">You&apos;re ready to negotiate!</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={startRoleplay}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors"
                  >
                    Practice Role-Play
                  </button>
                  <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold text-sm transition-colors">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
