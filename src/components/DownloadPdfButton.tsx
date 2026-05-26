"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { trackPdfDownloadStarted, trackPdfDownloadCompleted, trackPdfDownloadError } from "@/lib/tracking";

interface Props {
  reportId: string;
  planIndex: number;
  targetRole: string;
}

export default function DownloadPdfButton({ reportId, planIndex, targetRole }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    trackPdfDownloadStarted({ source: "report", target_role: targetRole });
    setLoading(true);
    try {
      const res = await fetch(`/api/report/pdf?id=${reportId}&plan=${planIndex}`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `career-pivot-${targetRole.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      trackPdfDownloadCompleted({ source: "report", target_role: targetRole });
    } catch (err) {
      trackPdfDownloadError({ source: "report", error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  return (
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
      {loading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}
