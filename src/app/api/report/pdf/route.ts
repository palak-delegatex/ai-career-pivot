import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { buildPivotPlanPdf } from "@/lib/pdf-builder";
import type { PivotPlan, UserProfile } from "@/lib/intake";

export async function GET(request: NextRequest) {
  const reportId = request.nextUrl.searchParams.get("id");
  const planIndex = Number(request.nextUrl.searchParams.get("plan") ?? "0");

  if (!reportId) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const profile = report.profile as UserProfile;
  const plans = report.plans as PivotPlan[];
  const plan = plans[planIndex];

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const doc = buildPivotPlanPdf(profile, plan, report.created_at);

  const chunks: Uint8Array[] = [];
  await new Promise<void>((resolve, reject) => {
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", resolve);
    doc.on("error", reject);
  });

  const buffer = Buffer.concat(chunks);
  const filename = `career-pivot-${plan.targetRole.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
