"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

// `key` maps to a `nav.*` entry in messages/*.json (AIC-667). Hrefs stay
// locale-agnostic — the locale-aware Link from `@/i18n/navigation` prefixes them.
const NAV_LINKS = [
  { href: "/free", key: "nav.freeSnapshot" },
  { href: "/blog", key: "nav.blog" },
  { href: "/pricing", key: "nav.pricing" },
  { href: "/how-it-works", key: "nav.howItWorks" },
  { href: "/dashboard", key: "nav.myRoadmaps" },
  { href: "/job-tracker", key: "nav.jobTracker" },
  { href: "/networking", key: "nav.networking" },
  { href: "/cover-letter", key: "nav.coverLetter" },
  { href: "/linkedin-optimizer", key: "nav.linkedin" },
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
  const t = useTranslations();
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
        {t("nav.skipToContent")}
      </a>
    <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto w-full">
      <Logo />

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        <NavigationMenu>
          <NavigationMenuList>
            {NAV_LINKS.map(({ href, key }) => (
              <NavigationMenuItem key={href}>
                <NavigationMenuLink
                  render={<Link href={href} />}
                  active={pathname === href}
                  className="text-sm font-medium text-slate-400 hover:text-white hover:bg-transparent focus:bg-transparent data-active:text-white"
                >
                  {t(key)}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <LanguageSwitcher />
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
                {t("common.signOut")}
              </Button>
            </form>
          </div>
        ) : (
          <Button render={<Link href="/login" />} size="sm" className="ml-2">
            {t("common.signIn")}
          </Button>
        )}
      </div>

      {/* Mobile nav — language switcher + hamburger; everything else in the sheet */}
      <div className="md:hidden flex items-center gap-1">
        <LanguageSwitcher />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label={t("nav.openMenu")} className="min-w-[44px] min-h-[44px]" />
            }
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">{t("nav.openMenu")}</SheetTitle>
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
                  {t("common.getStartedFree")}
                </SheetClose>
              )}

              <Separator className="mb-2" />

              {NAV_LINKS.map(({ href, key }) => (
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
                  {t(key)}
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
                    {t("common.account")}
                  </SheetClose>
                  <div className="px-3 py-2 text-xs text-slate-400 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <form action="/api/auth/signout" method="POST">
                    <button className="block w-full text-left rounded-lg px-3 py-3 min-h-[44px] text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                      {t("common.signOut")}
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
                  {t("common.signIn")}
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
