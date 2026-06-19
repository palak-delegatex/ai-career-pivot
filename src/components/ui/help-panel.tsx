"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, BookOpen, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getArticlesForRoute, helpArticles, type HelpArticle } from "@/lib/help-articles";
import { cn } from "@/lib/utils";

function ArticleCard({
  article,
  expanded,
  onToggle,
}: {
  article: HelpArticle;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 text-left transition-colors hover:border-slate-600"
    >
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200">
              {article.title}
            </span>
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{article.summary}</p>
          {expanded && (
            <p className="mt-3 text-sm leading-relaxed text-slate-300 border-t border-slate-700/50 pt-3">
              {article.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export function HelpPanel() {
  const pathname = usePathname();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contextual = getArticlesForRoute(pathname);
  const otherArticles = helpArticles.filter(
    (a) => !contextual.some((c) => c.id === a.id)
  );

  function toggleArticle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <Sheet>
      <SheetTrigger
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/30 transition-transform hover:scale-105 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="Open help"
      >
        <HelpCircle className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[380px] overflow-y-auto border-slate-700 bg-slate-900"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-slate-100">
            <HelpCircle className="h-5 w-5 text-teal-400" />
            Help & Guides
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Tips and guides for getting the most out of AICareerPivot
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {contextual.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-400">
                Relevant to this page
              </h3>
              <div className="flex flex-col gap-2">
                {contextual.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    expanded={expandedId === article.id}
                    onToggle={() => toggleArticle(article.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {otherArticles.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                All guides
              </h3>
              <div className="flex flex-col gap-2">
                {otherArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    expanded={expandedId === article.id}
                    onToggle={() => toggleArticle(article.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
