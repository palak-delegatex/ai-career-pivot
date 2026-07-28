"use client";

import { useCallback, useEffect, useState } from "react";
import type { FreeToolSlug, UsageState } from "@/lib/free-usage";

/**
 * useFreeUsage (AIC-844) — client hook that reads and increments a free tool's
 * usage via /api/free-usage. Keeps FreeUsageMeter presentational: the tool page
 * calls `consume()` after a successful run and feeds `state` into the meter.
 *
 * Metering is a soft nudge — every network failure fails open (null state, so
 * the meter simply doesn't render) and never blocks the underlying tool.
 */
export function useFreeUsage(tool: FreeToolSlug) {
  const [state, setState] = useState<UsageState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/free-usage?tool=${encodeURIComponent(tool)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      setState((await res.json()) as UsageState);
    } catch {
      // fail open — leave state as-is
    } finally {
      setLoading(false);
    }
  }, [tool]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Record one use and update local state with the server's authoritative count. */
  const consume = useCallback(async () => {
    try {
      const res = await fetch("/api/free-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool }),
      });
      if (!res.ok) return;
      setState((await res.json()) as UsageState);
    } catch {
      // fail open
    }
  }, [tool]);

  return { state, loading, refresh, consume };
}
