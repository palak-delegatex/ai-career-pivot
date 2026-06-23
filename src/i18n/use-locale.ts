"use client";

import { usePathname } from "next/navigation";
import { defaultLocale, hasLocale, type Locale } from "./config";

export function useLocale(): Locale {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  if (hasLocale(segment)) return segment;
  return defaultLocale;
}

export function useLocalePath(path: string): string {
  const locale = useLocale();
  if (!path.startsWith("/")) return path;
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}
