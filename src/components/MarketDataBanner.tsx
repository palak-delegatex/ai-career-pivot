"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { TrendingUp, DollarSign, Users, BarChart3, Loader2 } from "lucide-react";
import type { MarketData } from "@/lib/intake";

// Salary/employment figures are US BLS market data (USD); only the grouping
// separator is localized — the `$` symbol stays regardless of locale.
function fmt(n: number, locale: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString(locale);
}

function fmtSalary(n: number, locale: string): string {
  return `$${fmt(n, locale)}`;
}

function growthColor(pct: number | null): string {
  if (pct === null) return "text-slate-400";
  if (pct >= 20) return "text-emerald-400";
  if (pct >= 10) return "text-teal-400";
  if (pct >= 5) return "text-amber-400";
  return "text-slate-400";
}

function growthBg(pct: number | null): string {
  if (pct === null) return "bg-slate-800/60 border-slate-700";
  if (pct >= 20) return "bg-emerald-900/20 border-emerald-700/40";
  if (pct >= 10) return "bg-teal-900/20 border-teal-700/40";
  return "bg-slate-800/60 border-slate-700";
}

export default function MarketDataBanner({
  targetRole,
  marketData,
}: {
  targetRole: string;
  marketData: MarketData | null | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const locale = useLocale();

  if (!marketData) return null;

  const { salaryP25, salaryMedian, salaryP75, salaryP90, totalEmployment, growthPercent, growthLabel, source } = marketData;

  return (
    <div className={`border rounded-xl overflow-hidden mb-4 ${growthBg(growthPercent)}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <BarChart3 className={`h-4 w-4 shrink-0 ${growthColor(growthPercent)}`} />
        <div className="flex-1 text-left">
          <p className="text-xs font-medium text-slate-300">
            Market Signal: <span className="text-white">{marketData.role}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {fmtSalary(salaryMedian, locale)} median
            {growthPercent !== null && (
              <span className={`ml-2 ${growthColor(growthPercent)}`}>
                {growthPercent > 0 ? "+" : ""}{growthPercent}% projected growth
              </span>
            )}
            {totalEmployment > 0 && (
              <span className="ml-2 text-slate-500">{fmt(totalEmployment, locale)} employed</span>
            )}
          </p>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            <div className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">25th %ile</p>
              <p className="text-sm font-bold text-slate-300">{fmtSalary(salaryP25, locale)}</p>
            </div>
            <div className="bg-slate-900/60 border border-teal-700/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-teal-500 uppercase tracking-wider mb-1">Median</p>
              <p className="text-sm font-bold text-teal-300">{fmtSalary(salaryMedian, locale)}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">75th %ile</p>
              <p className="text-sm font-bold text-slate-300">{fmtSalary(salaryP75, locale)}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">90th %ile</p>
              <p className="text-sm font-bold text-emerald-300">{fmtSalary(salaryP90, locale)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            {growthPercent !== null && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className={`h-3.5 w-3.5 ${growthColor(growthPercent)}`} />
                <span className="text-slate-400">10-yr growth:</span>
                <span className={`font-medium ${growthColor(growthPercent)}`}>
                  {growthPercent > 0 ? "+" : ""}{growthPercent}%
                </span>
                <span className="text-slate-600">({growthLabel})</span>
              </div>
            )}
            {totalEmployment > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-400">Total employed:</span>
                <span className="text-slate-300 font-medium">{totalEmployment.toLocaleString(locale)}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-600">
            Source: {source}. Salary data is national; your market may vary.
          </p>
        </div>
      )}
    </div>
  );
}

export function MarketDataLoader({
  roles,
  children,
}: {
  roles: string[];
  children: (data: Record<string, MarketData>) => React.ReactNode;
}) {
  const [data, setData] = useState<Record<string, MarketData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roles.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch("/api/market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json.marketData ?? {});
      })
      .catch(() => {
        if (!cancelled) setData({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [roles.join("|")]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading market data...
      </div>
    );
  }

  if (!data) return null;
  return <>{children(data)}</>;
}
