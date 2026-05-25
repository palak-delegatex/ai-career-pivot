"use client";

import { useState } from "react";
import Link from "next/link";
import type { PivotPlan, UserProfile } from "@/lib/intake";

interface Report {
  id: string;
  email: string;
  profile: UserProfile;
  plans: PivotPlan[];
  created_at: string;
}

export default function DashboardClient() {
  const [email, setEmail] = useState("");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReports(data.reports);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">Your Roadmaps</h1>
      <p className="text-slate-400 text-center mb-8">
        Enter the email you used to purchase your career pivot report.
      </p>

      <form onSubmit={handleLookup} className="flex gap-3 max-w-md mx-auto mb-10">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Look Up"}
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-center text-sm mb-6">{error}</p>
      )}

      {reports !== null && reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No roadmaps found for this email.</p>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block"
          >
            Get Your Career Pivot Report
          </Link>
        </div>
      )}

      {reports && reports.length > 0 && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            {reports.length} roadmap{reports.length > 1 ? "s" : ""} found
          </p>
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </main>
  );
}

function ReportCard({ report }: { report: Report }) {
  const plan = report.plans[0];
  const date = new Date(report.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/report/${report.id}`}
      className="block bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-teal-500 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-bold text-lg text-white group-hover:text-teal-400 transition-colors truncate">
            {plan?.targetRole ?? "Career Pivot Report"}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {plan?.targetIndustry}
            {plan?.estimatedTimeToTransition &&
              ` · ${plan.estimatedTimeToTransition}`}
          </p>
          {report.plans.length > 1 && (
            <p className="text-slate-500 text-xs mt-2">
              +{report.plans.length - 1} more plan
              {report.plans.length > 2 ? "s" : ""}
            </p>
          )}
        </div>
        <span className="text-slate-500 text-xs shrink-0">{date}</span>
      </div>

      {plan && ((plan.weekOneActions ?? []).length > 0 || (plan.keyActions ?? []).length > 0) && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-sm font-medium text-slate-300 mb-2">Next actions:</p>
          <ul className="space-y-1">
            {plan.weekOneActions
              ? plan.weekOneActions.slice(0, 3).map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-400"
                  >
                    <span className="text-teal-400 mt-0.5 shrink-0">○</span>
                    <span className="line-clamp-1">{action.title}</span>
                  </li>
                ))
              : plan.keyActions!.slice(0, 3).map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-400"
                  >
                    <span className="text-teal-400 mt-0.5 shrink-0">○</span>
                    <span className="line-clamp-1">{action}</span>
                  </li>
                ))
            }
          </ul>
        </div>
      )}
    </Link>
  );
}
