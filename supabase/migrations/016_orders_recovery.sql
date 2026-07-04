-- Checkout recovery: track abandoned/failed checkouts so the recovery cron
-- can email buyers whose order is stuck in 'pending' without ever double-sending.
alter table public.orders
  add column if not exists recovery_email_sent_at timestamptz;

-- The recovery cron scans for pending orders in an age window; this index keeps
-- that scan cheap as the orders table grows.
create index if not exists orders_recovery_scan_idx
  on public.orders (status, created_at)
  where recovery_email_sent_at is null;
