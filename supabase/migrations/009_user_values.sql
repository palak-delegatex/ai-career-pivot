-- Values/personality assessment data
-- Stores results from the 4-step values discovery flow

alter table public.user_profiles
  add column if not exists values_assessment jsonb;

alter table public.reports
  add column if not exists values_assessment jsonb;
