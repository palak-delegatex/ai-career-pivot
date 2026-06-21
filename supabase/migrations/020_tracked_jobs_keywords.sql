-- Add job_description and extracted_keywords columns to tracked_jobs
-- for auto keyword extraction feature (AIC-516)
ALTER TABLE tracked_jobs
  ADD COLUMN IF NOT EXISTS job_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS extracted_keywords jsonb DEFAULT NULL;
