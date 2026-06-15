"use client";

import { useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { trackPdfDownloadStarted, trackPdfDownloadCompleted, trackPdfDownloadError } from "@/lib/tracking";

interface Props {
  reportId: string;
  planIndex: number;
  targetRole: string;
  label?: string;
}

const MAX_RETRIES = 2;
const FETCH_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function DownloadPdfButton({ reportId, planIndex, targetRole, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    trackPdfDownloadStarted({ source: "report", target_role: targetRole });
    setLoading(true);
    setError(null);

    let lastErr = "";
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetchWithTimeout(
          `/api/report/pdf?id=${reportId}&plan=${planIndex}`,
          FETCH_TIMEOUT_MS,
        );
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `career-pivot-${targetRole.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        trackPdfDownloadCompleted({ source: "report", target_role: targetRole });
        setLoading(false);
        return;
      } catch (err) {
        lastErr = err instanceof Error
          ? (err.name === "AbortError" ? "Request timed out" : err.message)
          : "Unknown error";
      }
    }

    trackPdfDownloadError({ source: "report", error: lastErr });
    setError("PDF download failed. Please try again.");
    setLoading(false);
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {loading ? "Generating PDF..." : (label ?? "Download PDF")}
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      )}
    </div>
  );
}
