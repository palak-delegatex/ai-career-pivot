-- AIC-757: store the raw job description on tracked jobs so the resume tailor's
-- Live Match tab can load a tracked job's JD without re-scraping or re-pasting.
-- Nullable — older rows (and jobs added without a JD) simply have NULL.
ALTER TABLE tracked_jobs ADD COLUMN IF NOT EXISTS job_description text;
