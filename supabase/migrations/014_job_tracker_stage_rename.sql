-- AIC-433: Rename job tracker stages for career-pivot context
-- saved → exploring, phone_screen+interview → interviewing, rejected → passed, add pivoted

-- Rename existing stage values
UPDATE tracked_jobs SET stage = 'exploring' WHERE stage = 'saved';
UPDATE tracked_jobs SET stage = 'interviewing' WHERE stage IN ('phone_screen', 'interview');
UPDATE tracked_jobs SET stage = 'passed' WHERE stage = 'rejected';

-- Add source_type column for extension clip tracking
ALTER TABLE tracked_jobs ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual';
