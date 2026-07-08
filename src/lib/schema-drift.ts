// Schema-drift tolerance for cron routes.
//
// Prod occasionally runs ahead of an unapplied migration (a human applies DDL
// via the Supabase dashboard — see supabase/migrations/apply/). Until that
// paste happens, a table or column a cron queries may not exist yet. That is an
// *expected, transient* state, not a server fault: the cron has no work it can
// do, so it should skip quietly on its next run rather than 500 and pollute
// error tracking (which masks genuine failures). Once the migration lands, the
// query error goes away and the cron resumes normally with zero code change.
//
// We match only the specific "missing table / missing column" codes so real DB
// errors (constraint violations, timeouts, auth) still surface as 500s.

type MaybePostgrestError = { code?: string | null; message?: string | null } | null | undefined;

// Postgres: 42P01 undefined_table, 42703 undefined_column.
// PostgREST schema cache: PGRST205 (table absent), PGRST204 (column absent).
const SCHEMA_DRIFT_CODES = new Set(["42P01", "42703", "PGRST205", "PGRST204"]);

export function isSchemaDriftError(error: MaybePostgrestError): boolean {
  if (!error) return false;
  if (error.code && SCHEMA_DRIFT_CODES.has(error.code)) return true;
  // Some PostgREST responses carry the code only in the message text.
  const msg = error.message ?? "";
  return /does not exist|schema cache/i.test(msg) &&
    /(relation|column|table)/i.test(msg);
}
