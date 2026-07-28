-- AIC-828: persist mock-interview delivery analytics so each session becomes a
-- saved, comparable report instead of an ephemeral scorecard. The mock already
-- computes filler-word %, words-per-minute and (voice mode) an aggregate speech
-- summary client-side; nothing was ever saved, so there was no retention loop.
--
-- One immutable row per completed interview, keyed by the authed user's email
-- (same convention as tracked_jobs / plan_leads). Every delivery metric is
-- nullable: text-mode interviews have no speech metrics, and jd_fit_score only
-- exists when the candidate pasted a job description.
create table if not exists public.interview_sessions (
  id              uuid default gen_random_uuid() primary key,
  user_email      text not null,
  target_role     text not null,
  interview_type  text,
  input_mode      text not null default 'text'
                    check (input_mode in ('text', 'voice')),
  questions_answered int,
  -- Voice-mode delivery metrics (null for text-mode sessions).
  filler_count    int,
  filler_pct      int,
  wpm             int,
  duration_seconds int,
  -- Deterministic 0-100 delivery composite derived from pace + filler rate.
  -- Doubles as the session's overall "confidence" score; null in text mode.
  overall_score   int check (overall_score is null or (overall_score between 0 and 100)),
  -- 0-10, parsed from the debrief when a job description was provided; else null.
  jd_fit_score    int check (jd_fit_score is null or (jd_fit_score between 0 and 10)),
  created_at      timestamptz default now()
);

-- The trend view lists a user's recent sessions newest-first; this covers it.
create index if not exists interview_sessions_user_created_idx
  on public.interview_sessions (user_email, created_at desc);

alter table public.interview_sessions enable row level security;

-- Rows are read/written only through the service-role API routes (email-scoped
-- in the query), never directly from the browser — matches plan_leads.
create policy "service_role_only_interview_sessions" on public.interview_sessions
  using (auth.role() = 'service_role');
