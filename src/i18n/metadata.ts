import { routing, type Locale } from "./routing";

/**
 * Shared helpers for localized marketing metadata (AIC-665).
 *
 * `localePrefix` is "as-needed", so the default locale (`en`) is served
 * unprefixed (`/blog`) while other locales are prefixed (`/es/blog`). These
 * helpers build canonical URLs and `hreflang` alternates that match that
 * routing so every localized page advertises its siblings correctly.
 */
export const BASE_URL = "https://ai-career-pivot.com";

/** Open Graph `og:locale` values (underscore form) per supported locale. */
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  hi: "hi_IN",
  "pt-BR": "pt_BR",
  fr: "fr_FR",
  de: "de_DE",
  ja: "ja_JP",
};

export function ogLocale(locale: string): string {
  return OG_LOCALE[locale as Locale] ?? OG_LOCALE[routing.defaultLocale];
}

function prefix(locale: string): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

/**
 * Absolute canonical URL for `locale` at an unprefixed `pathname`
 * (e.g. "" for the landing page, "/blog" for the blog index).
 */
export function canonicalFor(locale: string, pathname = ""): string {
  return `${BASE_URL}${prefix(locale)}${pathname}`;
}

/**
 * `hreflang` alternates map for a given unprefixed `pathname`, covering every
 * supported locale plus `x-default` (points at the unprefixed default locale).
 */
export function hreflangAlternates(pathname = ""): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${BASE_URL}${prefix(loc)}${pathname}`;
  }
  languages["x-default"] = `${BASE_URL}${pathname}`;
  return languages;
}
