import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthNextPath } from "../../../lib/auth-redirect";
import { trackServerJourney } from "@/lib/journey-server";
import { safeAnalyticsId } from "@/lib/journey-events";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = getAuthNextPath(params.get("next"));
  const analyticsId = safeAnalyticsId(request.cookies.get("aic_analytics_id")?.value);
  async function fail(reason: "provider" | "exchange" | "missing_code") {
    await trackServerJourney("auth_failed", analyticsId, { reason });
    const login = new URL("/login", request.url);
    login.searchParams.set("next", next);
    login.searchParams.set("error", reason === "provider" ? "server_error" : reason === "exchange" ? "exchange_failed" : "auth");
    // Never forward provider descriptions, authorization codes or raw errors.
    return NextResponse.redirect(login);
  }
  if (params.has("error")) return fail("provider");
  const code = params.get("code");
  if (!code) return fail("missing_code");
  try {
    const store = await cookies();
    const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => store.getAll(),
        setAll: values => { for (const { name, value, options } of values) store.set(name, value, options); },
      },
    });
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) return fail("exchange");
    if (data?.user) await trackServerJourney("auth_succeeded", "user_" + data.user.id, {
      method: data.user.app_metadata?.provider === "google" ? "google" : "magic_link",
    }, "auth:" + data.user.id + ":" + (data.session?.expires_at ?? "callback"));
    return NextResponse.redirect(new URL(next, request.url));
  } catch { return fail("exchange"); }
}
