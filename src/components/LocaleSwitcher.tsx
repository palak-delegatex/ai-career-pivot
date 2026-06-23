"use client";

import { usePathname } from "next/navigation";
import { locales, localeNames, defaultLocale, hasLocale, type Locale } from "@/i18n/config";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    const segments = pathname.split("/");
    const firstSegment = segments[1];
    const currentIsNonDefault = hasLocale(firstSegment) && firstSegment !== defaultLocale;

    let pathWithoutLocale: string;
    if (currentIsNonDefault) {
      pathWithoutLocale = "/" + segments.slice(2).join("/");
    } else {
      pathWithoutLocale = pathname;
    }

    const newPath =
      newLocale === defaultLocale
        ? pathWithoutLocale
        : `/${newLocale}${pathWithoutLocale}`;

    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    window.location.href = newPath;
  }

  return (
    <div className="relative inline-block">
      <select
        value={currentLocale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        className="appearance-none bg-slate-800/60 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 pe-6 cursor-pointer hover:border-teal-500/50 focus:outline-none focus:border-teal-500 transition-colors"
        aria-label="Language"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute inset-y-0 end-1.5 my-auto h-3 w-3 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
