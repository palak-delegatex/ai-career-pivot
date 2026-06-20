"use client";

import { useState, useEffect, useCallback } from "react";

function getWeekBoundaries(weeksBack: number): { start: Date; end: Date }[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - diff);
  currentMonday.setHours(0, 0, 0, 0);

  const weeks: { start: Date; end: Date }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const start = new Date(currentMonday);
    start.setDate(currentMonday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weeks.push({ start, end });
  }
  return weeks;
}

export default function ApplicationVelocitySparkline({ email }: { email: string }) {
  const [counts, setCounts] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/job-tracker?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const { jobs } = await res.json();
      const weeks = getWeekBoundaries(8);
      const weekCounts = weeks.map(({ start, end }) =>
        (jobs as { stage: string; created_at: string }[]).filter((j) => {
          if (j.stage === "saved") return false;
          const d = new Date(j.created_at);
          return d >= start && d < end;
        }).length
      );
      setCounts(weekCounts);
    } finally {
      setLoaded(true);
    }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  if (!loaded || counts.length === 0) return null;

  const max = Math.max(...counts, 1);
  const width = 120;
  const height = 40;
  const padY = 4;
  const usableHeight = height - padY * 2;
  const stepX = width / (counts.length - 1);

  const points = counts.map((c, i) => ({
    x: i * stepX,
    y: padY + usableHeight - (c / max) * usableHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  const total = counts.reduce((a, b) => a + b, 0);
  const thisWeek = counts[counts.length - 1];

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} className="flex-shrink-0" aria-label={`Application velocity: ${thisWeek} this week, ${total} total over 8 weeks`}>
        <path d={areaPath} fill="rgb(20 184 166 / 0.1)" />
        <path d={linePath} fill="none" stroke="rgb(20 184 166)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points[points.length - 1] && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="rgb(20 184 166)" />
        )}
      </svg>
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">{thisWeek} this week</span>
        <span className="text-[10px] text-slate-500">{total} in 8 weeks</span>
      </div>
    </div>
  );
}
