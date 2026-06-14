"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, FileSignature, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDocuments, deleteDocument, type GeneratedDocument } from "@/lib/document-store";

interface SupabaseCoverLetter {
  id: string;
  title: string;
  target_role: string;
  target_company: string | null;
  tone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

type DisplayDoc = GeneratedDocument & { source: "local" | "supabase" };

const STATUS_STYLES: Record<string, string> = {
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

export default function DocumentsCard({ email }: { email?: string }) {
  const [docs, setDocs] = useState<DisplayDoc[]>([]);

  const loadDocs = useCallback(async () => {
    const localDocs: DisplayDoc[] = getDocuments().map((d) => ({
      ...d,
      source: "local" as const,
    }));

    if (email) {
      try {
        const res = await fetch(`/api/cover-letters?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const remote: SupabaseCoverLetter[] = await res.json();
          const remoteDocs: DisplayDoc[] = remote.map((r) => ({
            id: r.id,
            type: "cover-letter" as const,
            title: r.title,
            targetRole: r.target_role,
            company: r.target_company ?? undefined,
            content: "",
            createdAt: r.created_at,
            status: r.status as GeneratedDocument["status"],
            source: "supabase" as const,
          }));

          const localIds = new Set(localDocs.map((d) => d.title + d.createdAt.slice(0, 10)));
          const deduped = remoteDocs.filter(
            (r) => !localIds.has(r.title + r.createdAt.slice(0, 10))
          );

          setDocs(
            [...localDocs, ...deduped].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
          return;
        }
      } catch {
        // Fall through to local-only
      }
    }

    setDocs(localDocs);
  }, [email]);

  useEffect(() => {
    loadDocs();

    function onStorage() {
      loadDocs();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadDocs]);

  async function handleDelete(doc: DisplayDoc) {
    if (doc.source === "supabase") {
      try {
        await fetch(`/api/cover-letters/${doc.id}`, { method: "DELETE" });
      } catch {
        return;
      }
    } else {
      deleteDocument(doc.id);
    }
    loadDocs();
  }

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
              Generate your first resume or cover letter
            </p>
          </div>
        ) : (
          visible.map((doc) => (
            <div
              key={`${doc.source}-${doc.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-700/20 transition-colors group"
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
                  {doc.source === "supabase" && " · Saved"}
                </p>
              </div>
              <Badge className={`text-[9px] border ${STATUS_STYLES[doc.status] ?? STATUS_STYLES.ready}`}>
                {doc.status}
              </Badge>
              <button
                onClick={() => handleDelete(doc)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
