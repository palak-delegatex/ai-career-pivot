-- Persistent conversation sessions for AI follow-up
create table if not exists public.conversation_sessions (
  id          uuid default gen_random_uuid() primary key,
  report_id   uuid not null references public.reports(id) on delete cascade,
  plan_index  int not null default 0,
  messages    jsonb not null default '[]'::jsonb,
  summary     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists conversation_sessions_report_idx
  on public.conversation_sessions (report_id, plan_index);

alter table public.conversation_sessions enable row level security;

create policy "service_role_only_conversation_sessions" on public.conversation_sessions
  using (auth.role() = 'service_role');

create trigger conversation_sessions_updated_at
  before update on public.conversation_sessions
  for each row execute function public.set_updated_at();
