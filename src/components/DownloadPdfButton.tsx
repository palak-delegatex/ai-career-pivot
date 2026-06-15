"use client";

import { useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { trackPdfDownloadStarted, trackPdfDownloadCompleted, trackPdfDownloadError } from "@/lib/tracking";
import { downloadPdf } from "@/lib/pdf-download";

interface Props {
  reportId: string;
  planIndex: number;
  targetRole: string;
  label?: string;
}

export default function DownloadPdfButton({ reportId, planIndex, targetRole, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    trackPdfDownloadStarted({ source: "report", target_role: targetRole });
    setLoading(true);
    setError(null);
    try {
      await downloadPdf(
        `/api/report/pdf?id=${reportId}&plan=${planIndex}`,
        {},
        `career-pivot-${targetRole.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`,
      );
      trackPdfDownloadCompleted({ source: "report", target_role: targetRole });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      trackPdfDownloadError({ source: "report", error: msg });
      setError("PDF download failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
