import { randomUUID } from "node:crypto";
type Row = Record<string, unknown>;
export class MemoryDb {
  rows: Record<string, Row[]> = { orders: [], reports: [] };
  failure: { table: string; op: string } | null = null;
  from(table: string) {
    let op = "read"; let values: Row = {}; let ignore = false; let conflict = "id";
    const filters: ((row: Row) => boolean)[] = [];
    const run = () => {
      if (this.failure?.table === table && this.failure.op === op) { this.failure = null; return { data: null, error: { code: "test_failure" } }; }
      const rows = this.rows[table] ??= [];
      let data = rows.filter(row => filters.every(f => f(row)));
      if (op === "insert" || op === "upsert") {
        const existing = rows.find(row => row[conflict] === values[conflict] && values[conflict] !== undefined);
        if (existing && op === "insert") return { data: null, error: { code: "23505" } };
        if (existing) { if (!ignore) Object.assign(existing, values); data = [existing]; }
        else { const row = { id: randomUUID(), created_at: new Date().toISOString(), ...values }; rows.push(row); data = [row]; }
      }
      if (op === "update") data.forEach(row => Object.assign(row, values));
      if (op === "delete") this.rows[table] = rows.filter(row => !data.includes(row));
      return { data, error: null };
    };
    const builder = {
      select: () => builder,
      eq: (key: string, value: unknown) => { filters.push(row => row[key] === value); return builder; },
      is: (key: string, value: unknown) => { filters.push(row => (row[key] ?? null) === value); return builder; },
      filter: (key: string, _operator: string, value: string) => { filters.push(row => JSON.stringify(row[key]) === value); return builder; },
      insert: (row: Row) => { op = "insert"; values = row; return builder; },
      upsert: (row: Row, options: { onConflict?: string; ignoreDuplicates?: boolean } = {}) => { op = "upsert"; values = row; conflict = options.onConflict ?? "id"; ignore = options.ignoreDuplicates ?? false; return builder; },
      update: (row: Row) => { op = "update"; values = row; return builder; },
      delete: () => { op = "delete"; return builder; },
      maybeSingle: async () => { const r = run(); return { ...r, data: r.data?.[0] ?? null }; },
      single: async () => { const r = run(); return { data: r.data?.length === 1 ? r.data[0] : null, error: r.error ?? (r.data?.length === 1 ? null : { code: "not_single" }) }; },
      then: <T>(resolve: (result: ReturnType<typeof run>) => T) => Promise.resolve(run()).then(resolve),
    };
    return builder;
  }
}
