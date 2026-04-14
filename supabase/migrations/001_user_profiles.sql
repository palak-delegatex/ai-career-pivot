-- User profiles table for the intake pipeline
-- Run in Supabase SQL editor or via supabase db push

create table if not exists public.user_profiles (
  id            uuid default gen_random_uuid() primary key,
  email         text not null unique,
  current_title text,
  current_industry text,
  years_experience int,
  skills        text[] default '{}',
  transferable_skills text[] default '{}',
  experience    jsonb default '[]',
  education     jsonb default '[]',
  certifications text[] default '{}',
  interests     text[] default '{}',
  linkedin_url  text,
  website_url   text,
  raw_summary   text,
  pivot_plans   jsonb default '[]',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index for email lookups
create index if not exists user_profiles_email_idx on public.user_profiles (email);

-- RLS: only service role can read/write (no anon access to profile data)
alter table public.user_profiles enable row level security;

create policy "service_role_only" on public.user_profiles
  using (auth.role() = 'service_role');

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();
