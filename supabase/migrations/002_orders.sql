-- Orders table for Stripe payments
create table if not exists public.orders (
  id                uuid default gen_random_uuid() primary key,
  email             text not null,
  stripe_session_id text unique,
  stripe_payment_intent text,
  amount_cents      int not null,
  currency          text not null default 'usd',
  status            text not null default 'pending',
  discount_code     text,
  report_id         uuid,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_stripe_session_idx on public.orders (stripe_session_id);
create index if not exists orders_report_id_idx on public.orders (report_id);

alter table public.orders enable row level security;

create policy "service_role_only_orders" on public.orders
  using (auth.role() = 'service_role');

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Reports table for generated career pivot reports
create table if not exists public.reports (
  id          uuid default gen_random_uuid() primary key,
  order_id    uuid references public.orders(id),
  email       text not null,
  profile     jsonb not null,
  plans       jsonb not null,
  created_at  timestamptz default now()
);

create index if not exists reports_order_id_idx on public.reports (order_id);

alter table public.reports enable row level security;

create policy "service_role_only_reports" on public.reports
  using (auth.role() = 'service_role');
