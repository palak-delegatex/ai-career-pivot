-- Auto-apply preferences per user
CREATE TABLE IF NOT EXISTS auto_apply_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  enabled boolean DEFAULT false,
  target_roles text[] DEFAULT '{}',
  preferred_locations text[] DEFAULT '{}',
  remote_only boolean DEFAULT false,
  min_match_score integer DEFAULT 60,
  salary_min integer DEFAULT 0,
  excluded_companies text[] DEFAULT '{}',
  excluded_keywords text[] DEFAULT '{}',
  max_daily_applications integer DEFAULT 5,
  sources text[] DEFAULT ARRAY['indeed', 'linkedin'],
  skip_2fa_sites boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_email)
);

CREATE INDEX IF NOT EXISTS idx_auto_apply_prefs_email ON auto_apply_preferences (user_email);

-- Auto-apply queue: AI-matched jobs pending user review
CREATE TABLE IF NOT EXISTS auto_apply_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  url text DEFAULT '',
  source text DEFAULT 'other',
  location text DEFAULT '',
  salary text DEFAULT '',
  job_type text DEFAULT '',
  description_snippet text DEFAULT '',
  tags text[] DEFAULT '{}',
  match_score integer DEFAULT 0,
  matched_skills text[] DEFAULT '{}',
  match_reasons jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending_review',
  feedback text DEFAULT '',
  resume_version_id uuid,
  cover_letter_id uuid,
  applied_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_email, url)
);

CREATE INDEX IF NOT EXISTS idx_auto_apply_queue_email ON auto_apply_queue (user_email);
CREATE INDEX IF NOT EXISTS idx_auto_apply_queue_status ON auto_apply_queue (user_email, status);

-- Feedback log for the learning loop
CREATE TABLE IF NOT EXISTS auto_apply_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  queue_item_id uuid REFERENCES auto_apply_queue(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason text DEFAULT '',
  job_title text DEFAULT '',
  company text DEFAULT '',
  match_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_apply_feedback_email ON auto_apply_feedback (user_email);
