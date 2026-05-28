import type { SupabaseClient } from "@supabase/supabase-js";

interface PlanMilestones {
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
}

const PHASE_OFFSETS_DAYS: Record<string, number> = {
  sixMonth: 180,
  oneYear: 365,
  twoYear: 730,
};

export async function scheduleMilestoneEmails(
  supabase: SupabaseClient,
  reportId: string,
  email: string,
  firstName: string,
  plans: PlanMilestones[],
  planIndex: number = 0
) {
  const plan = plans[planIndex];
  if (!plan) return;

  const now = Date.now();
  const rows: Array<{
    report_id: string;
    email: string;
    first_name: string;
    plan_index: number;
    phase: string;
    milestone_index: number;
    milestone_text: string;
    send_at: string;
    email_type: string;
  }> = [];

  for (const [phase, offsetDays] of Object.entries(PHASE_OFFSETS_DAYS)) {
    const key = `${phase}Milestones` as keyof PlanMilestones;
    const milestones = plan[key];
    if (!milestones?.length) continue;

    const milestonesPerPhase = milestones.length;
    const phaseDuration = offsetDays === 180 ? 180 : offsetDays === 365 ? 185 : 365;
    const intervalDays = Math.floor(phaseDuration / (milestonesPerPhase + 1));

    const phaseStartDay = offsetDays === 180 ? 0 : offsetDays === 365 ? 180 : 365;

    milestones.forEach((text, idx) => {
      const sendDay = phaseStartDay + intervalDays * (idx + 1);
      const sendAt = new Date(now + sendDay * 24 * 60 * 60 * 1000).toISOString();

      rows.push({
        report_id: reportId,
        email,
        first_name: firstName,
        plan_index: planIndex,
        phase,
        milestone_index: idx,
        milestone_text: text,
        send_at: sendAt,
        email_type: "checkin",
      });
    });
  }

  if (rows.length === 0) return;

  const { error } = await supabase.from("milestone_emails").insert(rows);
  if (error) {
    console.error("Failed to schedule milestone emails:", error);
  }
}
