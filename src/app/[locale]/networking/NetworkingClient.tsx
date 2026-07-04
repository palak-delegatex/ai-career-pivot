"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import NetworkingCRM from "@/components/NetworkingCRM";

export default function NetworkingClient() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Please sign in to use the Networking CRM.");
        setLoading(false);
        return;
      }

      setEmail(user.email);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-xl font-semibold text-slate-300 mb-2">Sign in required</h2>
        <p className="text-slate-400">{error || "Please sign in to manage your network."}</p>
      </div>
    );
  }

  return <NetworkingCRM userEmail={email} />;
}
