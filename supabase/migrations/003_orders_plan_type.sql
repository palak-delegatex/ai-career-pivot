alter table public.orders
  add column if not exists plan_type text not null default 'report',
  add column if not exists stripe_subscription_id text;
