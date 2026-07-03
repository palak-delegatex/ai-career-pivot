import { defineRouting } from "next-intl/routing";

/**
 * Central i18n routing configuration for AICareerPivot (AIC-662).
 *
 * Adding a new locale is a three-step change:
 *   1. Add the code below and to `localeNames`.
 *   2. Add `messages/{locale}.json`.
 *   3. (CJK/Devanagari) ensure the font subset is loaded in the root layout.
 */
export const locales = ["en", "es", "hi", "pt-BR", "fr", "de", "ja"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * Human-readable, in-language names for the language switcher.
 * Per plan (AIC-661): language names, not flags.
 */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  hi: "हिन्दी",
  "pt-BR": "Português (Brasil)",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Default locale (en) is served unprefixed: `/dashboard`, `/es/dashboard`, `/hi/dashboard`.
  localePrefix: "as-needed",
  // Persist the user's explicit choice; fall back to Accept-Language on first visit.
  localeDetection: true,
});
