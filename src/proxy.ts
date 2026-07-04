import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createSupabaseProxyClient } from "@/lib/supabase-proxy";
import { routing } from "@/i18n/routing";

const PROTECTED_PATHS = ["/dashboard", "/report", "/chat", "/account"];

// next-intl locale detection + as-needed prefixing (AIC-667).
const handleI18nRouting = createMiddleware(routing);

// Path checks must ignore an optional leading locale segment (e.g. `/es/dashboard`).
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (
    segments.length > 1 &&
    (routing.locales as readonly string[]).includes(segments[1])
  ) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  // 1. Locale detection / redirects / rewrites run first. The returned response
  //    carries next-intl's locale cookie and any rewrite headers.
  const response = handleI18nRouting(request);

  // 2. Refresh the Supabase session and apply auth gating on top of that same
  //    response so both the locale cookie and refreshed auth cookies survive.
  const supabase = createSupabaseProxyClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = stripLocale(request.nextUrl.pathname);

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Run on everything except API routes, the OAuth callback, Next internals,
  // root-level metadata routes, and files with an extension.
  matcher: [
    "/((?!api|auth|_next|_vercel|icon|apple-icon|opengraph-image|manifest|robots|sitemap|.*\\..*).*)",
  ],
};
