-- AIC-501: add a follow-up date and a priority to tracked jobs so the Kanban
-- can surface deadline badges and priority indicators, and the detail view can
-- set them. Both nullable — existing rows and jobs without a follow-up/priority
-- simply have NULL.
ALTER TABLE tracked_jobs ADD COLUMN IF NOT EXISTS next_action_date date;
ALTER TABLE tracked_jobs ADD COLUMN IF NOT EXISTS priority text
  CHECK (priority IS NULL OR priority IN ('hot', 'warm', 'cool'));
