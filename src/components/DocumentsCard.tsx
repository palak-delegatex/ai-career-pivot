"use client";

import { useState, useEffect } from "react";
import { FileText, FileSignature, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDocuments, type GeneratedDocument } from "@/lib/document-store";

const STATUS_STYLES: Record<GeneratedDocument["status"], string> = {
  draft: "bg-amber-900/30 border-amber-700/30 text-amber-300",
  ready: "bg-emerald-900/30 border-emerald-700/30 text-emerald-300",
  downloaded: "bg-slate-700/40 border-slate-600/30 text-slate-400",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsCard() {
  const [docs, setDocs] = useState<GeneratedDocument[]>([]);

  useEffect(() => {
    setDocs(getDocuments());

    function onStorage() {
      setDocs(getDocuments());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const visible = docs.slice(0, 5);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-bold text-teal-400">My Documents</h3>
          {docs.length > 0 && (
            <Badge className="bg-teal-900/40 border-teal-700/40 text-teal-300 text-[10px]">
              {docs.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-700/40">
        {visible.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/40 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 mb-1">No documents yet</p>
            <p className="text-xs text-slate-500">
              Generate your first resume from any career path
            </p>
          </div>
        ) : (
          visible.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-700/20 transition-colors"
            >
              {doc.type === "resume" ? (
                <FileText className="h-4 w-4 text-teal-400 shrink-0" />
              ) : (
                <FileSignature className="h-4 w-4 text-cyan-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 font-medium truncate">
                  {doc.title}
                </p>
                <p className="text-[10px] text-slate-500">
                  {doc.company ? `${doc.company} · ` : ""}
                  {formatDate(doc.createdAt)}
                </p>
              </div>
              <Badge className={`text-[9px] border ${STATUS_STYLES[doc.status]}`}>
                {doc.status}
              </Badge>
            </div>
          ))
        )}
      </div>

      {docs.length > 5 && (
        <div className="px-5 py-2.5 border-t border-slate-700/60 bg-slate-900/20">
          <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
            View All ({docs.length})
            <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </div>
      )}
    </div>
  );
}
