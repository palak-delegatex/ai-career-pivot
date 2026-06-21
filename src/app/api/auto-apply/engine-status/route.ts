import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import type { EngineStatus, ApplyMode } from "@/lib/auto-apply";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [prefsResult, queueResult, logResult, engineRunResult] = await Promise.all([
    supabase
      .from("auto_apply_preferences")
      .select("enabled, apply_mode, auto_submit_threshold")
      .eq("user_email", email)
      .single(),
    supabase
      .from("auto_apply_queue")
      .select("status, created_at, applied_at")
      .eq("user_email", email),
    supabase
      .from("auto_apply_log")
      .select("action, created_at")
      .eq("user_email", email)
      .gte("created_at", todayISO),
    supabase
      .from("auto_apply_engine_runs")
      .select("run_type, created_at")
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  const prefs = prefsResult.data;
  const queue = queueResult.data ?? [];
  const todayLogs = logResult.data ?? [];
  const engineRuns = engineRunResult.data ?? [];

  const pendingReview = queue.filter((q) => q.status === "pending_review").length;
  const approvedPending = queue.filter((q) => q.status === "approved").length;

  const todayItems = queue.filter((q) => q.created_at >= todayISO);
  const todayApplied = queue.filter((q) => q.status === "applied" && q.applied_at && q.applied_at >= todayISO);
  const todayAutoSubmitted = todayLogs.filter((l) => l.action === "auto_submitted").length;

  const lastScanRun = engineRuns.find((r) => r.run_type === "scan");
  const lastProcessRun = engineRuns.find((r) => r.run_type === "process");

  const status: EngineStatus = {
    enabled: prefs?.enabled ?? false,
    lastScanAt: lastScanRun?.created_at ?? null,
    lastProcessAt: lastProcessRun?.created_at ?? null,
    todayScanned: todayItems.length,
    todayQueued: todayItems.filter((q) => q.status === "pending_review" || q.status === "approved").length,
    todayApplied: todayApplied.length,
    todayAutoSubmitted,
    pendingReview,
    approvedPending,
    applyMode: (prefs?.apply_mode as ApplyMode) ?? "review_first",
  };

  return NextResponse.json(status);
}
