-- Add auth_user_id column to link OAuth users to their reports and orders
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_reports_auth_user_id ON public.reports(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_auth_user_id ON public.orders(auth_user_id);
