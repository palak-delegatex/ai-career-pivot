import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Multilingual SEO helpers (AIC-670).
 *
 * Emits hreflang alternates + self-referential canonical + og:locale so that
 * search engines discover and correctly attribute every locale variant of a page.
 *
 * Routing is `localePrefix: "as-needed"` (see i18n/routing.ts), so the default
 * locale (en) is served unprefixed (`/pricing`) and others are prefixed
 * (`/es/pricing`). All URLs here are RELATIVE — Next resolves them against
 * `metadataBase` (set in the root layout) into absolute URLs.
 */

// Google hreflang codes. Locale codes already match valid BCP-47 hreflang
// values (en, es, hi, pt-BR, fr, de, ja), so this is an identity map today —
// kept explicit so a future non-matching locale is an obvious edit here.
const HREFLANG: Record<Locale, string> = {
  en: "en",
  es: "es",
  hi: "hi",
  "pt-BR": "pt-BR",
  fr: "fr",
  de: "de",
  ja: "ja",
};

// Open Graph `og:locale` codes (underscore territory form).
const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  hi: "hi_IN",
  "pt-BR": "pt_BR",
  fr: "fr_FR",
  de: "de_DE",
  ja: "ja_JP",
};

/**
 * Relative URL for `path` in `locale`.
 * @param path canonical (en) path, e.g. "/" or "/pricing".
 */
export function localizedPath(path: string, locale: Locale): string {
  const seg = path === "/" ? "" : path.replace(/\/+$/, "");
  if (locale === defaultLocale) return seg === "" ? "/" : seg;
  return `/${locale}${seg}`;
}

/**
 * `alternates` block for a page: self-referential canonical for the current
 * locale plus the full hreflang set (every locale + `x-default` → en).
 */
export function alternatesFor(path: string, locale: Locale): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[HREFLANG[l]] = localizedPath(path, l);
  }
  languages["x-default"] = localizedPath(path, defaultLocale);

  return {
    canonical: localizedPath(path, locale),
    languages,
  };
}

/** `og:locale` for the current locale (falls back to en_US). */
export function ogLocaleFor(locale: string): string {
  return OG_LOCALE[locale as Locale] ?? OG_LOCALE[defaultLocale];
}
