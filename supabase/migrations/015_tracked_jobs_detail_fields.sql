-- Add salary_range, location, and stage_history columns to tracked_jobs
ALTER TABLE tracked_jobs
  ADD COLUMN IF NOT EXISTS salary_range text DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage_history jsonb DEFAULT '[]'::jsonb;
