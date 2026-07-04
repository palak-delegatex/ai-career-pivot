import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createSupabaseProxyClient } from "@/lib/supabase-proxy";
import { routing } from "@/i18n/routing";

// next-intl handles locale detection, the `NEXT_LOCALE` cookie, and rewriting
// `/es/dashboard` etc. to the `[locale]` route tree (AIC-667).
const intlMiddleware = createIntlMiddleware(routing);

// Paths that require an authenticated Supabase session. Compared against the
// locale-stripped pathname so `/dashboard` and `/es/dashboard` both match.
const PROTECTED_PATHS = ["/dashboard", "/report", "/chat", "/account"];

/** Remove a leading locale segment (`/es/dashboard` -> `/dashboard`). */
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    const rest = "/" + segments.slice(2).join("/");
    return rest === "/" ? "/" : rest.replace(/\/+$/, "");
  }
  return pathname;
}

/** The locale prefix present on the incoming path, or "" for the default locale. */
function localePrefix(pathname: string): string {
  const maybeLocale = pathname.split("/")[1];
  return (routing.locales as readonly string[]).includes(maybeLocale)
    ? `/${maybeLocale}`
    : "";
}

export async function proxy(request: NextRequest) {
  // 1. Let next-intl resolve the locale first. Its response carries the locale
  //    rewrite and the NEXT_LOCALE cookie; Supabase cookie writes ride along.
  const response = intlMiddleware(request);

  const { pathname } = request.nextUrl;
  const barePath = stripLocale(pathname);
  const isProtected = PROTECTED_PATHS.some(
    (p) => barePath === p || barePath.startsWith(`${p}/`),
  );
  const isLogin = barePath === "/login";

  // 2. Only touch Supabase auth on paths that gate on it, preserving the
  //    original request cost profile while keeping session refresh intact.
  if (isProtected || isLogin) {
    const supabase = createSupabaseProxyClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const prefix = localePrefix(pathname);

    if (isProtected && !user) {
      const loginUrl = new URL(`${prefix}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isLogin && user) {
      return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url));
    }
  }

  return response;
}

export const config = {
  // Run on every request except API routes, Next internals, and static/metadata
  // files (anything with a dot, e.g. sitemap.xml, robots.txt, favicon.ico), plus
  // the dynamic image routes kept at the app root (icon/apple-icon/opengraph-image).
  matcher: [
    "/((?!api|_next|_vercel|icon|apple-icon|opengraph-image|.*\\..*).*)",
  ],
};
