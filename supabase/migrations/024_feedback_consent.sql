-- Feedback-consent capture (AIC-893 — REBUILD-HONEST consent pipeline).
-- Enables the honest social-proof program to accrue REAL, consented feedback
-- (Tiers 4-6) after the fabricated testimonials were removed (AIC-889/890).
--
-- One row per person (upsert by email). `consent` records exactly what the user
-- agreed to at the post-assessment / post-onboarding prompt:
--   'named'     -> may attribute with first_name + role
--   'anonymous' -> may quote only as "beta user"
--   'declined'  -> never used
-- Named/role attribution is permitted ONLY when consent = 'named'. No feedback
-- is ever shown without an explicit non-declined row here.
create table if not exists public.feedback_consent (
  id           uuid default gen_random_uuid() primary key,
  email        text not null,
  consent      text not null check (consent in ('named', 'anonymous', 'declined')),
  first_name   text,
  role         text,
  -- Where the prompt was answered (e.g. 'post_assessment', 'post_onboarding').
  source       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One consent row per person; emails normalized to lower-case before insert so
-- a plain unique index supports supabase-js upsert (onConflict: "email").
create unique index if not exists feedback_consent_email_key
  on public.feedback_consent (email);

-- Cheap scan for usable (non-declined) consented quotes as the program grows.
create index if not exists feedback_consent_usable_idx
  on public.feedback_consent (created_at)
  where consent in ('named', 'anonymous');

alter table public.feedback_consent enable row level security;

create policy "service_role_only_feedback_consent" on public.feedback_consent
  using (auth.role() = 'service_role');

create trigger feedback_consent_updated_at
  before update on public.feedback_consent
  for each row execute function public.set_updated_at();
