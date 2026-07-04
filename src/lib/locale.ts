import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Server-side locale utilities shared by AI API routes (AIC-662).
 *
 * The core differentiator of the multilingual rollout: AI-generated outputs
 * (resumes, cover letters, gap analysis, mock interview) must be produced in
 * the user's selected language. Routes accept a `locale` field in their JSON
 * body and append `localeSystemPrompt(locale)` to their system prompt.
 */

/** English endonym used inside AI instructions ("Write in Spanish."). */
const AI_LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
  hi: "Hindi",
  "pt-BR": "Brazilian Portuguese",
  fr: "French",
  de: "German",
  ja: "Japanese",
};

/** Narrow an untrusted string (request body, cookie) to a supported locale. */
export function normalizeLocale(input: unknown): Locale {
  return typeof input === "string" && (locales as readonly string[]).includes(input)
    ? (input as Locale)
    : defaultLocale;
}

/**
 * Instruction appended to an AI system prompt so the model writes its output
 * in the target language. Returns an empty string for English (no-op) so
 * existing English behavior is untouched.
 */
export function localeSystemPrompt(input: unknown): string {
  const locale = normalizeLocale(input);
  if (locale === defaultLocale) return "";
  const name = AI_LANGUAGE_NAMES[locale];
  return (
    `\n\nIMPORTANT — LANGUAGE: Write ALL of your output in ${name}. ` +
    `Use natural, professional ${name} appropriate for a career/hiring context, ` +
    `including region-appropriate resume and cover-letter conventions. ` +
    `Do not mix in English except for widely-recognized proper nouns, ` +
    `job titles, company names, or technical terms that are not translated in ${name}.`
  );
}
