"use client";
import { useEffect } from "react";
import posthog from "posthog-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthAnalytics() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!posthog.__loaded) return;
      if (session?.user) {
        // Stable pseudonymous identity; no email, name, provider tokens or profile.
        posthog.identify("user_" + session.user.id);
      } else if (event === "SIGNED_OUT" || posthog.get_distinct_id().startsWith("user_")) {
        // Server sign-out reloads the page: INITIAL_SESSION can be null without
        // a SIGNED_OUT browser event. Do not retain the previous account ID.
        if (event === "SIGNED_OUT") posthog.capture("auth_signed_out");
        posthog.reset();
        const id = posthog.get_distinct_id();
        if (/^[a-zA-Z0-9_-]{8,128}$/.test(id)) document.cookie = "aic_analytics_id=" + id + "; Path=/; SameSite=Lax; Max-Age=2592000" + (location.protocol === "https:" ? "; Secure" : "");
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}
