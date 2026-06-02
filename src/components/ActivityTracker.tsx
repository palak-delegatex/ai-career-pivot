"use client";

import { useEffect } from "react";

export default function ActivityTracker({ reportId }: { reportId: string }) {
  useEffect(() => {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    }).catch(() => {});
  }, [reportId]);

  return null;
}
