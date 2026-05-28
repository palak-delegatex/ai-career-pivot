-- Milestone progress tracking for interactive roadmaps
create table if not exists public.milestone_progress (
  id          uuid default gen_random_uuid() primary key,
  report_id   uuid not null references public.reports(id) on delete cascade,
  plan_index  int not null,
  phase       text not null,
  milestone_index int not null,
  completed   boolean not null default false,
  notes       text,
  completed_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (report_id, plan_index, phase, milestone_index)
);

create index if not exists milestone_progress_report_idx
  on public.milestone_progress (report_id, plan_index);

alter table public.milestone_progress enable row level security;

create policy "service_role_only_milestone_progress" on public.milestone_progress
  using (auth.role() = 'service_role');

create trigger milestone_progress_updated_at
  before update on public.milestone_progress
  for each row execute function public.set_updated_at();
