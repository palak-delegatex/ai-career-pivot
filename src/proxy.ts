import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createSupabaseProxyClient } from "@/lib/supabase-proxy";
import { routing } from "@/i18n/routing";

// `/report/[id]` is intentionally NOT protected: it is the share-loop target
// (Google-Docs model — reachable only by its unguessable id, robots: noindex).
// The page itself renders a PII-minimized public view for non-owners and the
// full-fidelity view only for the authenticated owner (see report/[id]/page.tsx).
// Board decision AIC-712.
const PROTECTED_PATHS = ["/dashboard", "/chat", "/account"];

// next-intl locale detection + as-needed prefixing (AIC-667).
const handleI18nRouting = createMiddleware(routing);

// Next.js metadata image routes (e.g. `/report/<id>/opengraph-image`) live
// *under* protected paths, so the matcher's root-level `opengraph-image`
// exclusion never catches them. They must stay publicly fetchable: social
// crawlers are unauthenticated, and the share-loop card (score + role, no PII)
// is worthless if a crawler gets bounced to /login. Let these through the auth
// gate while the report page itself stays protected.
const METADATA_ROUTE = /\/(opengraph-image|twitter-image|icon|apple-icon)(-\w+)?\/?$/;

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
  //    The proxy runs on every non-API route, so a Supabase client-init or
  //    network failure here must never 500 the whole site (incl. the public
  //    homepage). On failure we treat the user as unknown/null: protected paths
  //    then fail CLOSED (redirect to /login below) while public routes serve
  //    normally. Seen in prod as a transient edge env-propagation glitch
  //    ("URL and Key are required to create a Supabase client!"), AIC-780.
  let user = null;
  try {
    const supabase = createSupabaseProxyClient(request, response);
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (error) {
    console.error("[proxy] Supabase session refresh failed:", error);
  }

  const pathname = stripLocale(request.nextUrl.pathname);

  // Metadata image routes stay public even under a protected path (see above).
  if (METADATA_ROUTE.test(pathname)) {
    return response;
  }

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
