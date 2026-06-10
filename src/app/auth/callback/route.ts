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

  if (errorParam) {
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

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "exchange_failed");
    loginUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
