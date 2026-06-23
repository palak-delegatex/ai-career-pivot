import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase-proxy";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { locales, defaultLocale } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

const PROTECTED_PATHS = ["/dashboard", "/report", "/chat", "/account"];

function getPreferredLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  const vercelCountry = request.headers.get("x-vercel-ip-country");
  const countryLocaleMap: Record<string, string> = {
    IN: "hi",
    ES: "es",
    MX: "es",
    AR: "es",
    CO: "es",
    CL: "es",
    PE: "es",
  };
  if (vercelCountry && countryLocaleMap[vercelCountry]) {
    return countryLocaleMap[vercelCountry];
  }

  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  try {
    return match(languages, [...locales], defaultLocale);
  } catch {
    return defaultLocale;
  }
}

function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

function getLocaleFromPathname(pathname: string): string | null {
  const segment = pathname.split("/")[1];
  if ((locales as readonly string[]).includes(segment)) return segment;
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/" && searchParams.has("error")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${defaultLocale}/login`;
    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next({ request });
  }

  if (!pathnameHasLocale(pathname)) {
    const locale = getPreferredLocale(request);
    if (locale === defaultLocale) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${defaultLocale}${pathname}`;
      return NextResponse.rewrite(rewriteUrl, { request });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  const locale = getLocaleFromPathname(pathname)!;

  if (locale === defaultLocale) {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathWithoutLocale;
    return NextResponse.redirect(redirectUrl);
  }

  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const response = NextResponse.next({ request });
  const supabase = createSupabaseProxyClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p)) &&
    !user
  ) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (pathWithoutLocale === "/login" && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
