-- 021_tighten_pii_rls.sql
-- =============================================================================
-- AIC-766 (CTO security fix) — close anon-key PII exposure on two tables.
-- =============================================================================
-- milestone_emails (migration 007) and extension_promo_emails (migration 020)
-- were created with `for all using (true) with check (true)` RLS policies.
--
-- RLS policies gate the `anon` and `authenticated` roles; `service_role`
-- bypasses RLS entirely. So `using (true)` does NOT restrict access to the
-- service role — it grants the PUBLIC anon key (embedded in the frontend) full
-- read/write on these tables, which hold PII (email, first_name). Anyone with
-- the anon key could `GET /rest/v1/milestone_emails` and dump every user's
-- email + name.
--
-- 020's own inline comment even says "Service-role only ...; no anon access" —
-- the predicate just never matched that intent. Every other table in this
-- schema (001/002/004/005/011/012/013/017) correctly uses
-- `using (auth.role() = 'service_role')`. This migration brings the two
-- outliers into line.
--
-- Behaviour-preserving for the app: both tables are only ever accessed by the
-- crons/libs via the service-role client (src/app/api/cron/{milestone-emails,
-- weekly-digest,extension-promo}), which bypasses RLS. No client/anon reads.
--
-- Idempotent (drop-then-create): safe to re-run.
-- =============================================================================

-- milestone_emails (007)
alter table public.milestone_emails enable row level security;
drop policy if exists "Service role full access on milestone_emails" on public.milestone_emails;
create policy "Service role full access on milestone_emails"
  on public.milestone_emails for all
  using (auth.role() = 'service_role');

-- extension_promo_emails (020)
alter table public.extension_promo_emails enable row level security;
drop policy if exists "service_role_full_access_extension_promo" on public.extension_promo_emails;
create policy "service_role_full_access_extension_promo"
  on public.extension_promo_emails for all
  using (auth.role() = 'service_role');
