CREATE TABLE badges_earned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  plan_index INT NOT NULL DEFAULT 0,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, plan_index, badge_key)
);

CREATE INDEX idx_badges_earned_report ON badges_earned(report_id, plan_index);
