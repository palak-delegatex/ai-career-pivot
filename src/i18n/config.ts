export const defaultLocale = "en" as const;

export const locales = ["en", "hi", "es"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  es: "Español",
};

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  hi: "ltr",
  es: "ltr",
};

export function hasLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

const BASE_URL = "https://ai-career-pivot.com";

export function localePath(path: string, locale: Locale = defaultLocale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return `/${locale}${clean}`;
}

export function localeUrl(path: string, locale: Locale = defaultLocale): string {
  return `${BASE_URL}${localePath(path, locale)}`;
}

export const localeToOgLocale: Record<Locale, string> = {
  en: "en_US",
  hi: "hi_IN",
  es: "es_ES",
};
