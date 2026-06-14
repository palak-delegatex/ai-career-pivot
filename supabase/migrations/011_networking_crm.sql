-- Networking CRM tables: contacts, interactions, follow-up reminders

create table if not exists public.contacts (
  id              uuid default gen_random_uuid() primary key,
  user_email      text not null,
  name            text not null,
  email           text,
  linkedin_url    text,
  company         text,
  role            text,
  location        text,
  source          text not null default 'manual',
  strength_score  int not null default 0,
  strength_tier   text not null default 'new',
  tags            text[] not null default '{}',
  notes           text not null default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists contacts_user_email_idx
  on public.contacts (user_email);

create index if not exists contacts_strength_tier_idx
  on public.contacts (user_email, strength_tier);

alter table public.contacts enable row level security;
create policy "service_role_only_contacts" on public.contacts
  using (auth.role() = 'service_role');

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- Contact interactions (activity timeline)
create table if not exists public.contact_interactions (
  id              uuid default gen_random_uuid() primary key,
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  user_email      text not null,
  type            text not null,
  description     text not null default '',
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz default now()
);

create index if not exists contact_interactions_contact_idx
  on public.contact_interactions (contact_id);

create index if not exists contact_interactions_user_idx
  on public.contact_interactions (user_email);

alter table public.contact_interactions enable row level security;
create policy "service_role_only_contact_interactions" on public.contact_interactions
  using (auth.role() = 'service_role');

-- Follow-up reminders
create table if not exists public.follow_up_reminders (
  id              uuid default gen_random_uuid() primary key,
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  user_email      text not null,
  description     text not null default '',
  due_date        timestamptz not null,
  status          text not null default 'pending',
  snooze_until    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists follow_up_reminders_user_idx
  on public.follow_up_reminders (user_email, status);

create index if not exists follow_up_reminders_contact_idx
  on public.follow_up_reminders (contact_id);

alter table public.follow_up_reminders enable row level security;
create policy "service_role_only_follow_up_reminders" on public.follow_up_reminders
  using (auth.role() = 'service_role');

create trigger follow_up_reminders_updated_at
  before update on public.follow_up_reminders
  for each row execute function public.set_updated_at();
