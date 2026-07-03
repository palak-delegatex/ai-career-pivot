"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect, useTransition } from "react";
import { GlobeIcon, CheckIcon } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";

/**
 * Language switcher (AIC-662): globe icon + dropdown of in-language names
 * (no flags, per the CEO plan). Preserves the current path when switching so
 * the user stays on the same page in the new locale.
 */
export function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const activeLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectLocale(locale: Locale) {
    setOpen(false);
    if (locale === activeLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("change")}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
      >
        <GlobeIcon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{localeNames[activeLocale]}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("label")}
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 py-1 shadow-xl"
        >
          {locales.map((locale) => {
            const isActive = locale === activeLocale;
            return (
              <li key={locale}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectLocale(locale)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-800/70 ${
                    isActive ? "text-white" : "text-slate-300"
                  }`}
                >
                  <span>{localeNames[locale]}</span>
                  {isActive && (
                    <CheckIcon className="size-4 text-teal-400" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
