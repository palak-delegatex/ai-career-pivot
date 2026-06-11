-- Cover letters: AI-generated cover letters persisted per user
create table if not exists public.cover_letters (
  id              uuid default gen_random_uuid() primary key,
  email           text not null,
  title           text not null,
  target_role     text not null,
  target_company  text,
  job_description text,
  tone            text not null default 'professional' check (tone in ('professional','conversational','bold')),
  content         text not null,
  status          text not null default 'draft' check (status in ('draft','ready','downloaded')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists cover_letters_email_idx on public.cover_letters (email);
create index if not exists cover_letters_email_status_idx on public.cover_letters (email, status);

alter table public.cover_letters enable row level security;

create policy "service_role_only_cover_letters" on public.cover_letters
  using (auth.role() = 'service_role');

create trigger cover_letters_updated_at
  before update on public.cover_letters
  for each row execute function public.set_updated_at();
