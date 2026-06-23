import Link from "next/link";
import { localeNames, localePath, type Locale } from "@/i18n/config";

export function BlogLanguageSelector({
  slug,
  availableLocales,
  currentLocale,
}: {
  slug: string;
  availableLocales: Locale[];
  currentLocale: Locale;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {availableLocales.map((locale) => {
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={localePath(`/blog/${slug}`, locale)}
            aria-current={active ? "page" : undefined}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              active
                ? "bg-teal-600/20 border-teal-500/50 text-teal-300"
                : "border-slate-700 text-slate-400 hover:border-teal-500/40 hover:text-slate-200"
            }`}
          >
            {localeNames[locale]}
          </Link>
        );
      })}
    </div>
  );
}
