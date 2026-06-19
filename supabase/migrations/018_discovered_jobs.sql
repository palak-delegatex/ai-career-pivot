-- Discovered jobs from external job board APIs (Adzuna, Remotive)
CREATE TABLE IF NOT EXISTS discovered_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  url text DEFAULT '',
  source text DEFAULT 'adzuna',
  location text DEFAULT '',
  salary text DEFAULT '',
  salary_min numeric,
  salary_max numeric,
  job_type text DEFAULT '',
  description_snippet text DEFAULT '',
  tags text[] DEFAULT '{}',
  match_score integer DEFAULT 0,
  matched_skills text[] DEFAULT '{}',
  match_breakdown jsonb DEFAULT '{}'::jsonb,
  match_reasons jsonb DEFAULT '[]'::jsonb,
  is_remote boolean DEFAULT false,
  experience_level text,
  status text DEFAULT 'new',
  discovered_at timestamptz DEFAULT now(),
  dismissed_at timestamptz,
  saved_at timestamptz,
  UNIQUE (user_email, url)
);

CREATE INDEX IF NOT EXISTS idx_discovered_jobs_email ON discovered_jobs (user_email);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_email_status ON discovered_jobs (user_email, status);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_score ON discovered_jobs (user_email, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_jobs_discovered_at ON discovered_jobs (discovered_at);

-- Add source types for discovered job sources to tracked_jobs
DO $$
BEGIN
  -- Extend job_source if it exists as an enum; otherwise the text column handles it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_source') THEN
    BEGIN
      ALTER TYPE job_source ADD VALUE IF NOT EXISTS 'adzuna';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE job_source ADD VALUE IF NOT EXISTS 'remotive';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
