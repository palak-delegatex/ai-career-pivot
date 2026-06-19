"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  BookOpen,
  Lightbulb,
  PlayCircle,
  ChevronRight,
  Keyboard,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTourCompleted } from "@/lib/help-state";

// ── Route-aware help content ────────────────────────────────────────────────

interface HelpEntry {
  title: string;
  body: string;
  icon: typeof BookOpen;
}

interface RouteHelp {
  heading: string;
  description: string;
  tips: HelpEntry[];
  tourId?: string;
  tourLabel?: string;
}

const ROUTE_HELP: Record<string, RouteHelp> = {
  "/dashboard": {
    heading: "Dashboard",
    description: "Your career transition command center.",
    tips: [
      {
        title: "Track your progress",
        body: "Complete milestones to advance through your career transition phases. Each phase builds on the last.",
        icon: BookOpen,
      },
      {
        title: "Quick actions",
        body: "Use the action cards to jump directly to resume building, job tracking, or interview prep.",
        icon: Lightbulb,
      },
    ],
    tourId: "dashboard",
    tourLabel: "Dashboard tour",
  },
  "/resume-generator": {
    heading: "Resume Builder",
    description: "Create ATS-optimized resumes tailored to your target role.",
    tips: [
      {
        title: "ATS scoring",
        body: "The real-time ATS panel shows how well your resume matches job descriptions. Aim for 80%+.",
        icon: BookOpen,
      },
      {
        title: "Writing tips",
        body: "Start bullets with strong action verbs and include quantified metrics where possible.",
        icon: Lightbulb,
      },
      {
        title: "Templates",
        body: "Choose a template that matches your industry. Tech roles work well with Modern or Minimal.",
        icon: BookOpen,
      },
    ],
    tourId: "resume",
    tourLabel: "Resume builder tour",
  },
  "/job-tracker": {
    heading: "Job Tracker",
    description: "Manage your job applications in a Kanban board.",
    tips: [
      {
        title: "Organize applications",
        body: "Drag cards between columns to update status. Use labels to categorize by priority.",
        icon: BookOpen,
      },
      {
        title: "Follow up",
        body: "Set follow-up dates to stay on top of applications. The system will remind you when it's time.",
        icon: Lightbulb,
      },
    ],
    tourId: "job-tracker",
    tourLabel: "Job tracker tour",
  },
  "/mock-interview": {
    heading: "Mock Interview",
    description: "Practice with AI-powered interview simulations.",
    tips: [
      {
        title: "Practice regularly",
        body: "Consistent practice builds confidence. Try at least 2–3 sessions per week.",
        icon: BookOpen,
      },
      {
        title: "Review feedback",
        body: "After each session, review the AI feedback carefully and note patterns in areas to improve.",
        icon: Lightbulb,
      },
    ],
    tourId: "mock-interview",
    tourLabel: "Interview prep tour",
  },
  "/salary-negotiation": {
    heading: "Salary Negotiation",
    description: "Get data-driven salary insights and talking points.",
    tips: [
      {
        title: "Market data",
        body: "Compare offers against real market data to know your worth. Location and experience level matter.",
        icon: BookOpen,
      },
      {
        title: "Talking points",
        body: "Use the generated talking points as a starting framework — personalize them with your achievements.",
        icon: Lightbulb,
      },
    ],
    tourId: "salary",
    tourLabel: "Salary negotiation tour",
  },
};

const DEFAULT_HELP: RouteHelp = {
  heading: "Help & Tips",
  description: "Get the most out of AICareerPivot.",
  tips: [
    {
      title: "Getting started",
      body: "Complete your career profile first — it powers all personalized recommendations.",
      icon: BookOpen,
    },
    {
      title: "Keyboard shortcut",
      body: "Press ? anywhere to open or close this help panel.",
      icon: Keyboard,
    },
  ],
};

// ── Component ───────────────────────────────────────────────────────────────

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour?: (tourId: string) => void;
}

export function HelpPanel({ open, onOpenChange, onStartTour }: HelpPanelProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const routeKey = Object.keys(ROUTE_HELP).find((key) =>
    pathname.startsWith(key)
  );
  const help = routeKey ? ROUTE_HELP[routeKey] : DEFAULT_HELP;

  const filteredTips = useMemo(() => {
    if (!searchQuery.trim()) return help.tips;
    const q = searchQuery.toLowerCase();
    return help.tips.filter(
      (tip) =>
        tip.title.toLowerCase().includes(q) ||
        tip.body.toLowerCase().includes(q)
    );
  }, [help.tips, searchQuery]);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  const handleTourReplay = useCallback(() => {
    if (help.tourId && onStartTour) {
      onOpenChange(false);
      onStartTour(help.tourId);
    }
  }, [help.tourId, onStartTour, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>{help.heading}</SheetTitle>
          <SheetDescription>{help.description}</SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative px-4">
          <Search className="absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help topics…"
            className="h-9 w-full rounded-md border border-border bg-input/30 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search help topics"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tips list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" role="list">
          {filteredTips.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={tip.title}
                    role="listitem"
                    className="rounded-lg border border-border bg-card/50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          {tip.title}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {tip.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tour replay */}
        {help.tourId && onStartTour && (
          <div className="border-t border-border px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTourReplay}
              className="w-full gap-2"
            >
              <PlayCircle className="size-4" />
              {help.tourLabel ?? "Replay tour"}
            </Button>
          </div>
        )}

        {/* Keyboard hint */}
        <div className="border-t border-border px-4 py-2">
          <p className="text-center text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ?
            </kbd>{" "}
            to toggle this panel
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
