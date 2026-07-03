"use client";

import { useState, useEffect } from "react";

interface UsageMeter {
  label: string;
  current: number;
  limit: number | null;
}

interface UsageSummaryResponse {
  meters: UsageMeter[];
}

function meterColor(current: number, limit: number): string {
  const pct = current / limit;
  if (pct >= 1) return "#ef4444";
  if (pct >= 0.75) return "#f59e0b";
  return "#10b981";
}

function meterBgColor(current: number, limit: number): string {
  const pct = current / limit;
  if (pct >= 1) return "rgba(239, 68, 68, 0.15)";
  if (pct >= 0.75) return "rgba(245, 158, 11, 0.15)";
  return "rgba(16, 185, 129, 0.15)";
}

export default function UsageMeterStrip() {
  const [meters, setMeters] = useState<UsageMeter[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/usage/summary");
        if (!res.ok) return;
        const data: UsageSummaryResponse = await res.json();
        setMeters(data.meters);
      } catch {
        // silent
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  if (!loaded || meters.length === 0) return null;

  const displayMeters = meters.filter((m) => m.limit !== null && m.limit > 0);
  if (displayMeters.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {displayMeters.slice(0, 4).map((meter) => {
        const limit = meter.limit!;
        const pct = Math.min(meter.current / limit, 1);
        const color = meterColor(meter.current, limit);
        const bgColor = meterBgColor(meter.current, limit);

        return (
          <div
            key={meter.label}
            className="rounded-xl p-3 border border-[#1e293b]"
            style={{ background: "#0f172a" }}
          >
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">
              {meter.label}
            </p>
            <p className="text-sm font-semibold text-white mt-1">
              {meter.current}/{limit}
            </p>
            <div
              className="h-1 w-full rounded-full mt-2 overflow-hidden"
              style={{ background: bgColor }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct * 100}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
