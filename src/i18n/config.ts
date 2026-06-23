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
