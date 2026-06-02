import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { sendDripEmail } from "@/lib/email-drip";

export async function GET(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");
  const planIndex = req.nextUrl.searchParams.get("planIndex");

  if (!reportId || planIndex === null) {
    return NextResponse.json({ error: "Missing reportId or planIndex" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("milestone_progress")
    .select("phase, milestone_index, completed, notes, completed_at")
    .eq("report_id", reportId)
    .eq("plan_index", Number(planIndex));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reportId, planIndex, phase, milestoneIndex, completed, notes } = body;

  if (!reportId || planIndex === undefined || !phase || milestoneIndex === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("milestone_progress")
    .upsert(
      {
        report_id: reportId,
        plan_index: planIndex,
        phase,
        milestone_index: milestoneIndex,
        completed: !!completed,
        notes: notes ?? null,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "report_id,plan_index,phase,milestone_index" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update last_active_at on the report
  await supabase
    .from("reports")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", reportId);

  // Fire celebration email when a milestone is marked complete
  if (completed) {
    void (async () => {
      try {
        const { data: report } = await supabase
          .from("reports")
          .select("email, profile, plans")
          .eq("id", reportId)
          .single();
        if (report?.email) {
          const firstName = (report.profile?.name as string | undefined)?.split(" ")[0] ?? "there";
          const plan = (report.plans as { targetRole?: string; sixMonthMilestones?: string[]; oneYearMilestones?: string[]; twoYearMilestones?: string[] }[] | undefined)?.[planIndex];
          const phaseKey = `${phase}Milestones` as "sixMonthMilestones" | "oneYearMilestones" | "twoYearMilestones";
          const milestoneText = plan?.[phaseKey]?.[milestoneIndex] ?? "a milestone";

          const { data: allProgress } = await supabase
            .from("milestone_progress")
            .select("phase, milestone_index, completed")
            .eq("report_id", reportId)
            .eq("plan_index", planIndex);

          const completedSet = new Set(
            (allProgress ?? []).filter((p) => p.completed).map((p) => `${p.phase}:${p.milestone_index}`)
          );
          completedSet.add(`${phase}:${milestoneIndex}`);

          const allMilestones = [
            ...(plan?.sixMonthMilestones ?? []).map((m, i) => ({ key: `sixMonth:${i}`, text: m })),
            ...(plan?.oneYearMilestones ?? []).map((m, i) => ({ key: `oneYear:${i}`, text: m })),
            ...(plan?.twoYearMilestones ?? []).map((m, i) => ({ key: `twoYear:${i}`, text: m })),
          ];
          const nextMilestone = allMilestones.find((m) => !completedSet.has(m.key));

          await sendDripEmail(report.email, firstName, 15, {
            milestoneName: milestoneText,
            reportId,
            planIndex,
            ...(nextMilestone ? { nextAction: nextMilestone.text } : {}),
          });
        }
      } catch {
        // Non-critical — don't fail the progress save
      }
    })();
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");
  const planIndex = req.nextUrl.searchParams.get("planIndex");
  const phase = req.nextUrl.searchParams.get("phase");
  const milestoneIndex = req.nextUrl.searchParams.get("milestoneIndex");

  if (!reportId || planIndex === null || !phase || milestoneIndex === null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("milestone_progress")
    .delete()
    .eq("report_id", reportId)
    .eq("plan_index", Number(planIndex))
    .eq("phase", phase)
    .eq("milestone_index", Number(milestoneIndex));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
