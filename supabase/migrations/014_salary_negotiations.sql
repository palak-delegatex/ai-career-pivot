create table if not exists salary_negotiations (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  target_role text not null,
  current_salary numeric,
  offer_base numeric,
  offer_equity numeric,
  offer_bonus numeric,
  offer_benefits text,
  location text,
  years_experience integer,
  negotiation_history jsonb default '[]'::jsonb,
  readiness_score integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_salary_negotiations_email on salary_negotiations(user_email);
