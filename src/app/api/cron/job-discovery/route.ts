import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: users, error: usersError } = await supabase
    .from("auto_apply_preferences")
    .select("user_email")
    .eq("enabled", true)
    .limit(100);

  if (usersError || !users?.length) {
    return NextResponse.json({
      scanned: 0,
      error: usersError?.message ?? "No active users",
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  let totalDiscovered = 0;
  let totalQueued = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const res = await fetch(`${baseUrl}/api/jobs/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.user_email }),
      });

      if (res.ok) {
        const data = await res.json();
        totalDiscovered += data.saved ?? 0;
        totalQueued += data.queued ?? 0;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  await supabase.from("auto_apply_engine_runs").insert({
    run_type: "scan",
    users_processed: users.length,
    applications_processed: totalDiscovered,
    cover_letters_generated: 0,
    errors,
  });

  return NextResponse.json({
    scanned: users.length,
    discovered: totalDiscovered,
    queued: totalQueued,
    errors,
  });
}
