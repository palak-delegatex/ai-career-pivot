import type { JobStage } from "./job-tracker";

export type OutcomeEventType =
  | "stage_change"
  | "application_submitted"
  | "interview_scheduled"
  | "offer_received"
  | "transition_completed";

export interface OutcomeEvent {
  id: string;
  user_email: string;
  tracked_job_id: string | null;
  event_type: OutcomeEventType;
  from_stage: JobStage | null;
  to_stage: JobStage | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type CheckinStatus =
  | "actively_searching"
  | "interviewing"
  | "negotiating"
  | "transitioned"
  | "paused";

export interface OutcomeCheckin {
  id: string;
  user_email: string;
  status: CheckinStatus;
  current_role: string | null;
  transitioned: boolean;
  new_role: string | null;
  new_company: string | null;
  satisfaction: number | null;
  notes: string | null;
  created_at: string;
}

export interface PersonalOutcome {
  funnel: {
    applications: number;
    interviews: number;
    offers: number;
    transitions: number;
  };
  recentEvents: OutcomeEvent[];
  latestCheckin: OutcomeCheckin | null;
}

export interface AggregateOutcome {
  totalUsers: number;
  funnel: {
    applications: number;
    interviews: number;
    offers: number;
    transitions: number;
  };
  rates: {
    interviewRate: number;
    offerRate: number;
    transitionRate: number;
  };
}

export function eventTypeForStageChange(
  from: JobStage | null,
  to: JobStage
): OutcomeEventType {
  if (to === "applied") return "application_submitted";
  if (to === "interviewing") return "interview_scheduled";
  if (to === "offer") return "offer_received";
  if (to === "pivoted") return "transition_completed";
  return "stage_change";
}
