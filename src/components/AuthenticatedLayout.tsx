"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Map,
  Search,
  Compass,
  MessageSquare,
  FileText,
  Target,
  Mail,
  Briefcase,
  Users,
  Mic,
  ChevronDown,
  LogOut,
  Settings,
  Layers,
  Hammer,
  Send,
  Link2,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const STAGE_GROUPS = [
  {
    key: "plan",
    label: "Plan",
    color: "emerald",
    iconClass: "bg-emerald-500/15 text-emerald-400",
    activeClass: "border-emerald-500 bg-emerald-500/10 text-emerald-300",
    hoverClass: "hover:bg-emerald-500/5",
    dotClass: "bg-emerald-500",
    icon: Layers,
    items: [
      { href: "/dashboard", label: "Career Roadmap", icon: Map },
      { href: "/gap-analysis", label: "Gap Analysis", icon: Search },
      { href: "/assessment", label: "Career Assessment", icon: Compass },
      { href: "/chat", label: "AI Career Coach", icon: MessageSquare },
    ],
  },
  {
    key: "build",
    label: "Build",
    color: "teal",
    iconClass: "bg-teal-500/15 text-teal-400",
    activeClass: "border-teal-500 bg-teal-500/10 text-teal-300",
    hoverClass: "hover:bg-teal-500/5",
    dotClass: "bg-teal-500",
    icon: Hammer,
    items: [
      { href: "/resume-generator", label: "Resume Builder", icon: FileText },
      { href: "/ats-score", label: "ATS Score", icon: Target },
      { href: "/cover-letter", label: "Cover Letter", icon: Mail },
      { href: "/linkedin-optimizer", label: "LinkedIn Optimizer", icon: Link2 },
    ],
  },
  {
    key: "apply",
    label: "Apply",
    color: "cyan",
    iconClass: "bg-cyan-500/15 text-cyan-400",
    activeClass: "border-cyan-500 bg-cyan-500/10 text-cyan-300",
    hoverClass: "hover:bg-cyan-500/5",
    dotClass: "bg-cyan-500",
    icon: Send,
    items: [
      { href: "/job-tracker", label: "Job Tracker", icon: Briefcase },
      { href: "/networking", label: "Networking CRM", icon: Users },
      { href: "/mock-interview", label: "Mock Interview", icon: Mic },
    ],
  },
] as const;

const LogoIcon = (
  <svg
    className="w-3.5 h-3.5 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4"
    />
  </svg>
);

function activeGroup(pathname: string) {
  for (const g of STAGE_GROUPS) {
    if (g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))) {
      return g.key;
    }
  }
  return null;
}

function Sidebar({ pathname, user }: { pathname: string; user: User | null }) {
  const currentGroup = activeGroup(pathname);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-700/50 bg-slate-900/80 backdrop-blur-sm h-full fixed left-0 top-0 z-30">
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            {LogoIcon}
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            AICareerPivot
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {STAGE_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isActive = currentGroup === group.key;
          return (
            <Collapsible key={group.key} defaultOpen={isActive || currentGroup === null}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors group">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${group.iconClass}`}>
                  <GroupIcon className="w-3.5 h-3.5" />
                </div>
                <span>{group.label}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-data-[panel-open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-3 mt-0.5 space-y-0.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors border-l-2 ${
                        isItemActive
                          ? group.activeClass
                          : `border-transparent text-slate-400 hover:text-white ${group.hoverClass}`
                      }`}
                    >
                      <ItemIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-slate-700/50 p-3 space-y-1">
          <Link
            href="/account"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/account"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {user.user_metadata?.full_name || user.email}
            </span>
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 transition-colors w-full">
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const currentGroup = activeGroup(pathname);

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40">
      {STAGE_GROUPS.map((group) => (
        <Sheet
          key={group.key}
          open={openSheet === group.key}
          onOpenChange={(open) => setOpenSheet(open ? group.key : null)}
        >
          <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl px-4 pb-6 pt-3">
            <SheetTitle className="sr-only">{group.label} tools</SheetTitle>
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-4" />
            <div className="space-y-1">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpenSheet(null)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? group.activeClass
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <ItemIcon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      ))}

      <nav
        className="flex items-center justify-around bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50"
        style={{ height: 56, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {STAGE_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const isActive = currentGroup === group.key;
          return (
            <button
              key={group.key}
              onClick={() => setOpenSheet(openSheet === group.key ? null : group.key)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 min-w-[64px] transition-colors ${
                isActive ? "text-white" : "text-slate-500"
              }`}
            >
              <GroupIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{group.label}</span>
              {isActive && <div className={`w-1 h-1 rounded-full ${group.dotClass}`} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Sidebar pathname={pathname} user={user} />
      <MobileBottomNav pathname={pathname} />
      <div className="md:ml-64 min-h-screen pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
    </div>
  );
}
