"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { MenuIcon } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/free", label: "Free Snapshot" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/dashboard", label: "My Roadmaps" },
  { href: "/job-tracker", label: "Job Tracker" },
  { href: "/cover-letter", label: "Cover Letter" },
  { href: "/linkedin-optimizer", label: "LinkedIn" },
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

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
        {LogoIcon}
      </div>
      <span className="font-semibold text-base tracking-tight text-white">
        AICareerPivot
      </span>
    </Link>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
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
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-teal-600 focus:text-white focus:font-semibold focus:text-sm"
      >
        Skip to content
      </a>
    <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto w-full">
      <Logo />

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        <NavigationMenu>
          <NavigationMenuList>
            {NAV_LINKS.map(({ href, label }) => (
              <NavigationMenuItem key={href}>
                <NavigationMenuLink
                  href={href}
                  active={pathname === href}
                  className="text-sm font-medium text-slate-400 hover:text-white hover:bg-transparent focus:bg-transparent data-active:text-white"
                >
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        {user ? (
          <div className="flex items-center gap-3 ml-2">
            <Link
              href="/account"
              className="text-sm text-slate-300 hover:text-white truncate max-w-[150px] transition-colors"
            >
              {user.user_metadata?.full_name || user.email}
            </Link>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        ) : (
          <Button render={<Link href="/login" />} size="sm" className="ml-2">
            Sign In
          </Button>
        )}
      </div>

      {/* Mobile nav — only hamburger icon, everything else inside the sheet */}
      <div className="md:hidden flex items-center">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open menu" className="min-w-[44px] min-h-[44px]" />
            }
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col gap-1 p-4 pt-6">
              {/* Logo at top of sheet */}
              <div className="mb-4">
                <Logo />
              </div>

              {/* Prominent CTA for non-auth users */}
              {!user && (
                <SheetClose
                  render={
                    <Link
                      href="/preview"
                      className="block rounded-lg px-4 py-3 min-h-[44px] flex items-center justify-center text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:shadow-lg hover:shadow-teal-500/30 transition-all mb-3"
                    />
                  }
                >
                  Get Started Free
                </SheetClose>
              )}

              <Separator className="mb-2" />

              {NAV_LINKS.map(({ href, label }) => (
                <SheetClose
                  key={href}
                  render={
                    <Link
                      href={href}
                      className={`block rounded-lg px-3 py-3 min-h-[44px] flex items-center text-sm font-medium transition-colors ${
                        pathname === href
                          ? "bg-muted text-white border-l-4 border-teal-500"
                          : "text-slate-400 hover:text-white hover:bg-muted border-l-4 border-transparent"
                      }`}
                    />
                  }
                >
                  {label}
                </SheetClose>
              ))}
              <Separator className="my-2" />
              {user ? (
                <>
                  <SheetClose
                    render={
                      <Link
                        href="/account"
                        className={`block rounded-lg px-3 py-3 min-h-[44px] flex items-center text-sm font-medium transition-colors ${
                          pathname === "/account"
                            ? "bg-muted text-white border-l-4 border-teal-500"
                            : "text-slate-400 hover:text-white hover:bg-muted border-l-4 border-transparent"
                        }`}
                      />
                    }
                  >
                    Account
                  </SheetClose>
                  <div className="px-3 py-2 text-xs text-slate-400 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <form action="/api/auth/signout" method="POST">
                    <button className="block w-full text-left rounded-lg px-3 py-3 min-h-[44px] text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <SheetClose
                  render={
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-3 min-h-[44px] flex items-center text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                    />
                  }
                >
                  Sign In
                </SheetClose>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
    </>
  );
}
