-- Honest ATS-score benchmark (AIC-884 §4, parent AIC-881).
--
-- The Designer's live-score surface wants a target-anchor: "the average user
-- scores X — you can beat it." Per the AIC-860/862 rule that number must be
-- REAL and self-updating, never invented. To have a real distribution to
-- average over, we first need to STORE the scores we already compute in
-- /api/ats-gamified (today they are returned and discarded).
--
-- This table records ONE PII-free sample per gamified scoring: the 0-100 score
-- and when it was produced. No résumé text, no JD, no email, no person link —
-- it exists solely to compute an aggregate anchor, so it carries nothing that
-- could identify a user even if the row leaked.
create table if not exists public.ats_score_samples (
  id         uuid default gen_random_uuid() primary key,
  score      smallint not null check (score >= 0 and score <= 100),
  created_at timestamptz default now()
);

-- The benchmark aggregate scans a recent window; this keeps that scan cheap as
-- the table grows.
create index if not exists ats_score_samples_created_at_idx
  on public.ats_score_samples (created_at);

alter table public.ats_score_samples enable row level security;

-- Service-role only: samples are written by the server route and read only by
-- the aggregate function below. No client ever touches raw rows.
create policy "service_role_only_ats_score_samples" on public.ats_score_samples
  using (auth.role() = 'service_role');

-- Real aggregate over a trailing window. Returns the sample count plus the mean
-- and true median (percentile_cont) of scores in the window. Doing the
-- aggregation in one DB round-trip (vs. shipping rows to JS) keeps the median
-- honest on the full window and the hot path cheap. The lib floor-gates on
-- sample_count before surfacing anything, so an empty/thin table simply yields
-- count 0 and the UI shows no anchor rather than a misleading one.
create or replace function public.get_ats_score_benchmark(window_days integer default 90)
returns table (
  sample_count  bigint,
  avg_score     numeric,
  median_score  numeric
)
language sql
stable
as $$
  select
    count(*)                                              as sample_count,
    avg(score)                                            as avg_score,
    percentile_cont(0.5) within group (order by score)    as median_score
  from public.ats_score_samples
  where created_at >= now() - make_interval(days => window_days);
$$;
