import "server-only";
import type { Locale } from "./config";

type Dictionary = Record<string, Record<string, string>>;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en/common.json").then((m) => m.default),
  hi: () => import("./dictionaries/hi/common.json").then((m) => m.default),
  es: () => import("./dictionaries/es/common.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
