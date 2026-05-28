"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PivotPlan, UserProfile } from "@/lib/intake";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface Report {
  id: string;
  email: string;
  profile: UserProfile;
  plans: PivotPlan[];
  created_at: string;
}

export default function DashboardClient() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Unable to determine your email. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
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

    loadReports();
  }, []);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading your roadmaps...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-center mb-2">
        Your Roadmaps
      </h1>
      <p className="text-slate-400 text-center mb-8">
        Your career pivot reports linked to your account.
      </p>

      {error && (
        <p className="text-red-400 text-center text-sm mb-6">{error}</p>
      )}

      {reports !== null && reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No roadmaps found yet.</p>
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

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm text-center mb-3">
              Ready to pick up where you left off?
            </p>
            <Link
              href={`/report/${reports[0].id}`}
              className="block w-full text-center px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 font-semibold text-sm transition-all shadow-lg shadow-teal-900/30"
            >
              Continue My Roadmap
            </Link>
          </div>
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

      {plan &&
        ((plan.weekOneActions ?? []).length > 0 ||
          (plan.keyActions ?? []).length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-sm font-medium text-slate-300 mb-2">
              Next actions:
            </p>
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
                  ))}
            </ul>
          </div>
        )}
    </Link>
  );
}
