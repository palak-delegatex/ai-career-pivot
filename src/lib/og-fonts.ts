import type { Locale } from "@/i18n/routing";

/**
 * Font loading for locale-aware OG images (AIC-665).
 *
 * `next/og` (Satori) only ships Latin glyph coverage, so Devanagari (hi) and
 * CJK (ja) overlay text renders as tofu unless we hand it a font with the right
 * coverage. We fetch the exact glyph subset from the Google Fonts CSS2 API:
 * passing `&text=` makes Google return a font file containing *only* the
 * characters actually rendered, so the download stays a few KB even for CJK.
 */

/** Google Fonts family that covers each locale's script (+ Latin fallback). */
const FONT_FAMILY: Record<Locale, string> = {
  en: "Inter",
  es: "Inter",
  "pt-BR": "Inter",
  fr: "Inter",
  de: "Inter",
  hi: "Noto Sans Devanagari",
  ja: "Noto Sans JP",
};

export function fontFamilyFor(locale: string): string {
  return FONT_FAMILY[locale as Locale] ?? "Inter";
}

/**
 * Fetch a subsetted TrueType/OpenType font covering exactly `text` from the
 * Google Fonts CSS2 API. Returns the raw font bytes for `ImageResponse.fonts`,
 * or `null` if the network call fails (caller falls back to the default font).
 */
export async function loadGoogleFont(
  family: string,
  text: string,
  weight = 700,
): Promise<ArrayBuffer | null> {
  try {
    const url =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
      `&text=${encodeURIComponent(text)}`;
    // The UA string makes Google serve a modern TTF/OTF (not WOFF2, which
    // Satori cannot parse).
    const cssRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format/)?.[1];
    if (!src) return null;
    const fontRes = await fetch(src);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}
