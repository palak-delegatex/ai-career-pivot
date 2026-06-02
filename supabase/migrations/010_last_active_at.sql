-- Track user activity for inactivity nudge emails
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Backfill: set last_active_at to latest milestone completion or report creation
UPDATE public.reports r
SET last_active_at = COALESCE(
  (SELECT MAX(completed_at) FROM public.milestone_progress mp WHERE mp.report_id = r.id AND mp.completed = true),
  r.created_at
);

CREATE INDEX IF NOT EXISTS idx_reports_last_active_at ON public.reports(last_active_at);
