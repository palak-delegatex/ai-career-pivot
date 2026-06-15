import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function exchangeWithRetry(
  supabase: ReturnType<typeof createServerClient>,
  code: string,
  attempts = 2
) {
  for (let i = 0; i < attempts; i++) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return { error: null };
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    } else {
      return { error };
    }
  }
  return { error: new Error("exchange retry exhausted") };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const errorCode = searchParams.get("error_code");

  if (errorParam) {
    const retryCount = parseInt(searchParams.get("retry") ?? "0", 10);
    const isTransient =
      errorCode === "unexpected_failure" ||
      (errorDescription ?? "").toLowerCase().includes("exchange");

    if (isTransient && retryCount < 1) {
      const retryUrl = new URL("/login", request.url);
      retryUrl.searchParams.set("error", errorParam);
      if (errorDescription) retryUrl.searchParams.set("error_description", errorDescription);
      if (errorCode) retryUrl.searchParams.set("error_code", errorCode);
      retryUrl.searchParams.set("auto_retry", "1");
      return NextResponse.redirect(retryUrl);
    }

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
            try {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options);
              }
            } catch {
              // cookies().set() can throw in certain Next.js contexts
            }
          },
        },
      }
    );

    const { error } = await exchangeWithRetry(supabase, code);

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
