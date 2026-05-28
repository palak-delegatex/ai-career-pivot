-- Scheduled milestone-based email drip campaigns
-- Emails are queued when a roadmap is generated and sent by the daily cron

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

create index idx_milestone_emails_pending
  on milestone_emails (send_at)
  where sent_at is null;

create index idx_milestone_emails_report
  on milestone_emails (report_id);

alter table milestone_emails enable row level security;

create policy "Service role full access on milestone_emails"
  on milestone_emails for all
  using (true)
  with check (true);
