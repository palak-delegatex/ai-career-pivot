-- =============================================================================
-- AIC-765 — Production schema-drift bundle (paste-once apply)
-- =============================================================================
-- Consolidates the 4 unapplied prod migrations (003 / 007 / 010 / 017) plus the
-- extension-promo table (020, tracked in AIC-763) into ONE fully-idempotent
-- script so a human can paste it once into the Supabase SQL editor.
--
-- Why this file exists: the source migration files are correct, but a few of
-- their statements were NOT guarded for re-runs (007's indexes + policy, 017's
-- trigger + policy). Applied by hand, a partial/duplicate run would error. Every
-- statement below is wrapped to be safe to run any number of times.
--
-- Order matters (010 backfills against milestone_progress; 017's trigger needs
-- set_updated_at()). Run top-to-bottom, in a single transaction.
--
-- After running, these crons stop erroring on their next scheduled run
-- (08:00–13:00 UTC daily): milestone-emails, checkout-recovery, plan-recovery,
-- weekly-digest, extension-promo.
-- =============================================================================

begin;

-- Safety net: 017's trigger depends on this helper (defined in migration 001).
-- Included here so the bundle is self-contained even if 001 were ever missing.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------------------------------
-- 003_orders_plan_type.sql  →  /api/cron/checkout-recovery (42703 orders.plan_type)
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists plan_type text not null default 'report',
  add column if not exists stripe_subscription_id text;

-- -----------------------------------------------------------------------------
-- 007_milestone_emails.sql  →  /api/cron/milestone-emails (PGRST205 milestone_emails)
-- (original indexes + policy hardened with IF NOT EXISTS / drop-first)
-- -----------------------------------------------------------------------------
create table if not exists milestone_emails (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  email text not null,
  first_name text not null,
  plan_index integer not null default 0,
  phase text not null,              -- 'sixMonth', 'oneYear', 'twoYear'
  milestone_index integer not null,
  milestone_text text not null,
  send_at timestamptz not null,
  sent_at timestamptz,
  email_type text not null default 'checkin',  -- 'checkin' or 'nudge'
  nudge_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_milestone_emails_pending
  on milestone_emails (send_at)
  where sent_at is null;

create index if not exists idx_milestone_emails_report
  on milestone_emails (report_id);

alter table milestone_emails enable row level security;

drop policy if exists "Service role full access on milestone_emails" on milestone_emails;
create policy "Service role full access on milestone_emails"
  on milestone_emails for all
  using (true)
  with check (true);

-- -----------------------------------------------------------------------------
-- 010_last_active_at.sql  →  /api/cron/weekly-digest (42703 reports.last_active_at)
-- -----------------------------------------------------------------------------
alter table public.reports add column if not exists last_active_at timestamptz default now();

-- Unconditional backfill: ADD COLUMN DEFAULT now() already fills existing rows,
-- so a NULL-guard would skip the real backfill on first run. This UPDATE is
-- deterministic (recomputes the same COALESCE), so re-running is a safe no-op.
update public.reports r
set last_active_at = coalesce(
  (select max(completed_at) from public.milestone_progress mp where mp.report_id = r.id and mp.completed = true),
  r.created_at
);

create index if not exists idx_reports_last_active_at on public.reports(last_active_at);

-- -----------------------------------------------------------------------------
-- 017_plan_leads.sql  →  /api/cron/plan-recovery (PGRST205 plan_leads)
-- (original trigger + policy hardened with drop-first)
-- -----------------------------------------------------------------------------
create table if not exists public.plan_leads (
  id                     uuid default gen_random_uuid() primary key,
  email                  text not null,
  name                   text,
  recovery_email_sent_at timestamptz,
  converted_at           timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create unique index if not exists plan_leads_email_key
  on public.plan_leads (email);

create index if not exists plan_leads_recovery_scan_idx
  on public.plan_leads (created_at)
  where recovery_email_sent_at is null and converted_at is null;

alter table public.plan_leads enable row level security;

drop policy if exists "service_role_only_plan_leads" on public.plan_leads;
create policy "service_role_only_plan_leads" on public.plan_leads
  using (auth.role() = 'service_role');

drop trigger if exists plan_leads_updated_at on public.plan_leads;
create trigger plan_leads_updated_at
  before update on public.plan_leads
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 020_extension_promo_emails.sql  →  /api/cron/extension-promo (AIC-763 drip)
-- (already idempotent in source; included so this bundle covers all drift)
-- -----------------------------------------------------------------------------
create table if not exists extension_promo_emails (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  first_name    text not null default 'there',
  step          integer not null default 1,          -- next email to send; 4 = done
  next_email_at timestamptz not null default now(),
  installed     boolean not null default false,       -- suppression flag
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_extension_promo_pending
  on extension_promo_emails (next_email_at)
  where installed = false and step between 1 and 3;

alter table extension_promo_emails enable row level security;

drop policy if exists "service_role_full_access_extension_promo" on extension_promo_emails;
create policy "service_role_full_access_extension_promo"
  on extension_promo_emails for all
  using (true)
  with check (true);

commit;

-- =============================================================================
-- Verify (run after commit):
--   select to_regclass('public.milestone_emails'),
--          to_regclass('public.plan_leads'),
--          to_regclass('public.extension_promo_emails');
--   select column_name from information_schema.columns
--     where table_name='orders' and column_name in ('plan_type','stripe_subscription_id');
--   select column_name from information_schema.columns
--     where table_name='reports' and column_name='last_active_at';
-- All should return non-null / the expected rows.
-- =============================================================================
