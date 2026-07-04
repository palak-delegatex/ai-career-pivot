-- Plan-abandoner recovery (AIC-691, follow-up to AIC-437).
-- PostHog showed 66.7% of users who generate a career plan never start checkout.
-- We already capture their email at onboarding, so record every free-flow plan
-- generation as a lead; the plan-recovery cron nudges the ones who never convert.
create table if not exists public.plan_leads (
  id                     uuid default gen_random_uuid() primary key,
  email                  text not null,
  name                   text,
  recovery_email_sent_at timestamptz,
  converted_at           timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- One lead row per person. Emails are normalized to lower-case before insert so
-- a plain unique index is enough for supabase-js upsert (onConflict: "email").
create unique index if not exists plan_leads_email_key
  on public.plan_leads (email);

-- The recovery cron scans for un-emailed, un-converted leads in an age window;
-- this partial index keeps that scan cheap as the table grows.
create index if not exists plan_leads_recovery_scan_idx
  on public.plan_leads (created_at)
  where recovery_email_sent_at is null and converted_at is null;

alter table public.plan_leads enable row level security;

create policy "service_role_only_plan_leads" on public.plan_leads
  using (auth.role() = 'service_role');

create trigger plan_leads_updated_at
  before update on public.plan_leads
  for each row execute function public.set_updated_at();
