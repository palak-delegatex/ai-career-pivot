-- Outcome tracking: stage transition events + monthly check-ins
create table if not exists public.outcome_events (
  id              uuid default gen_random_uuid() primary key,
  user_email      text not null,
  tracked_job_id  uuid references public.tracked_jobs(id) on delete set null,
  event_type      text not null,
  from_stage      text,
  to_stage        text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create index if not exists outcome_events_user_idx
  on public.outcome_events (user_email, created_at desc);

create index if not exists outcome_events_type_idx
  on public.outcome_events (event_type);

alter table public.outcome_events enable row level security;

create policy "service_role_only_outcome_events" on public.outcome_events
  using (auth.role() = 'service_role');

-- Monthly check-in responses
create table if not exists public.outcome_checkins (
  id              uuid default gen_random_uuid() primary key,
  user_email      text not null,
  status          text not null,
  current_role    text,
  transitioned    boolean not null default false,
  new_role        text,
  new_company     text,
  satisfaction    int check (satisfaction between 1 and 5),
  notes           text,
  created_at      timestamptz default now()
);

create index if not exists outcome_checkins_user_idx
  on public.outcome_checkins (user_email, created_at desc);

alter table public.outcome_checkins enable row level security;

create policy "service_role_only_outcome_checkins" on public.outcome_checkins
  using (auth.role() = 'service_role');
