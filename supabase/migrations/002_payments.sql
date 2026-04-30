-- Stripe payment records for early-access $9 checkout
-- Run in Supabase SQL editor or via supabase db push

create table if not exists public.payments (
  id                    uuid default gen_random_uuid() primary key,
  stripe_session_id     text not null unique,
  stripe_payment_intent text,
  customer_email        text not null,
  amount_total          int not null,
  currency              text not null default 'usd',
  status                text not null,
  paid_at               timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

create index if not exists payments_session_id_idx on public.payments (stripe_session_id);
create index if not exists payments_customer_email_idx on public.payments (customer_email);

alter table public.payments enable row level security;

create policy "service_role_only_payments" on public.payments
  using (auth.role() = 'service_role');
