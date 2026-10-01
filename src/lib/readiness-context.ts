import { pivots } from "../content/pivots";

/** Accept only a single canonical pair that exists in the published corpus. */
export function readinessContext(
  query: Record<string, string | string[] | undefined>,
) {
  if (typeof query.from !== "string" || typeof query.to !== "string") return null;
  const pivot = pivots.find(
    (entry) => entry.fromSlug === query.from && entry.toSlug === query.to,
  );
  return pivot ? { fromRole: pivot.fromRole, toRole: pivot.toRole } : null;
}
