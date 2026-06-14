-- Resume versions: modular content blocks with per-JD toggling and comparison
create table if not exists public.resume_versions (
  id              uuid default gen_random_uuid() primary key,
  email           text not null,
  name            text not null,
  target_role     text,
  target_company  text,
  job_description text,
  template        text not null default 'professional',
  status          text not null default 'draft' check (status in ('draft','ready','sent','archived')),
  match_score     int check (match_score is null or (match_score >= 0 and match_score <= 100)),
  content         jsonb not null default '{}',
  enabled_skills  jsonb not null default '[]',
  enabled_experience_indices jsonb not null default '[]',
  sections        jsonb not null default '{}',
  generated_text  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists resume_versions_email_idx on public.resume_versions (email);
create index if not exists resume_versions_status_idx on public.resume_versions (email, status);

alter table public.resume_versions enable row level security;

create policy "service_role_only_resume_versions" on public.resume_versions
  using (auth.role() = 'service_role');

create trigger resume_versions_updated_at
  before update on public.resume_versions
  for each row execute function public.set_updated_at();
