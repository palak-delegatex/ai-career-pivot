"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

interface Report {
  id: string;
  email: string;
  profile: { currentRole?: string; targetRole?: string };
  plans: { targetRole: string }[];
  created_at: string;
}

export default function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email) {
        try {
          const res = await fetch("/api/dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });
          if (res.ok) {
            const data = await res.json();
            setReports(data.reports ?? []);
          }
        } catch {}
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading account...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-slate-400">Please sign in to view your account.</p>
      </main>
    );
  }

  const provider = user.app_metadata?.provider ?? "email";
  const providerLabel = provider === "google" ? "Google" : "Email (magic link)";

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold mb-2">Account</h1>
      <p className="text-slate-400 mb-8">Manage your profile and view saved reports.</p>

      <section className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Name</span>
            <span className="text-sm font-medium">
              {user.user_metadata?.full_name || "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Sign-in method</span>
            <span className="text-sm font-medium">{providerLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Member since</span>
            <span className="text-sm font-medium">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">
          Saved Reports
          <span className="text-slate-500 text-sm font-normal ml-2">
            ({reports.length})
          </span>
        </h2>
        {reports.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm mb-4">No reports yet.</p>
            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors inline-block"
            >
              Get Your First Report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/report/${report.id}`}
                className="block rounded-xl bg-slate-700/30 hover:bg-slate-700/50 border border-slate-700/50 p-4 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {report.plans?.[0]?.targetRole ?? "Career Pivot Report"}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                {report.plans && report.plans.length > 1 && (
                  <p className="text-slate-400 text-xs">
                    {report.plans.length} career paths compared
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
        <h2 className="text-lg font-bold mb-4">Actions</h2>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full text-center px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm transition-colors"
          >
            Go to Dashboard
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-red-400 font-semibold text-sm transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
