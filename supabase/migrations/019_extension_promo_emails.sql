-- AIC-758 / AIC-389 §3: extension-adoption email drip.
--
-- A NEW, standalone sequence — deliberately separate from the waitlist
-- `email_step` nurture state machine. Targets existing authenticated users who
-- don't have the Chrome extension with a one-time 3-email arc (Day 0/3/7),
-- suppressed the moment their first extension-sourced event fires.
--
-- One row per enrolled user (unique email). `step` is the NEXT email to send
-- (1, 2, 3); it advances to 4 = "done" after the final send. `installed` is the
-- suppression flag — set true once we detect an extension-sourced tracked job,
-- which stops any pending send.
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

-- Pending-send lookup: rows still in the sequence, not installed, due now.
create index if not exists idx_extension_promo_pending
  on extension_promo_emails (next_email_at)
  where installed = false and step between 1 and 3;

alter table extension_promo_emails enable row level security;

-- Service-role only (the cron uses the service-role key); no anon access.
-- drop-then-create keeps the whole migration idempotent (CREATE POLICY has no
-- IF NOT EXISTS), so re-running against an already-migrated DB is a safe no-op.
drop policy if exists "service_role_full_access_extension_promo" on extension_promo_emails;
create policy "service_role_full_access_extension_promo"
  on extension_promo_emails for all
  using (true)
  with check (true);
