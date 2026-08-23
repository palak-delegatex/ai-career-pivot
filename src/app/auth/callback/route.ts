import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const errorCode = searchParams.get("error_code");

  // AIC-1090: Google sign-in has failed silently in prod for months with no
  // server-side record of WHY — every prior fix flew blind. Log the exact
  // provider error and callback host here so the real failure is captured in
  // Vercel logs. `host` surfaces origin-mismatch (verifier set on origin A,
  // callback served on origin B) at a glance.
  if (errorParam) {
    console.error("[auth/callback] provider returned error", {
      error: errorParam,
      error_code: errorCode,
      error_description: errorDescription,
      host: request.nextUrl.host,
    });
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorParam);
    if (errorDescription) loginUrl.searchParams.set("error_description", errorDescription);
    if (errorCode) loginUrl.searchParams.set("error_code", errorCode);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    // AIC-1090: capture the exact exchange failure. The classic silent killer is
    // "code verifier not found" (PKCE verifier cookie absent at the callback —
    // e.g. sign-in started on a different origin than the one serving /callback).
    // `hasVerifierCookie` tells us instantly whether that cookie survived.
    const hasVerifierCookie = cookieStore
      .getAll()
      .some((c) => c.name.includes("code-verifier"));
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: (error as { status?: number }).status,
      code: (error as { code?: string }).code,
      host: request.nextUrl.host,
      hasVerifierCookie,
    });

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "exchange_failed");
    loginUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(loginUrl);
  }

  console.error("[auth/callback] hit with no code and no error param", {
    host: request.nextUrl.host,
  });
  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
