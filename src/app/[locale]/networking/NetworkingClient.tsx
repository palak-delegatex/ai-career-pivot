"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import NetworkingCRM from "@/components/NetworkingCRM";

export default function NetworkingClient() {
  const t = useTranslations("networking");
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
        setError(t("client.signInToUse"));
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
        <h2 className="text-xl font-semibold text-slate-300 mb-2">{t("client.signInRequired")}</h2>
        <p className="text-slate-400">{error || t("client.signInToManage")}</p>
      </div>
    );
  }

  return <NetworkingCRM userEmail={email} />;
}
