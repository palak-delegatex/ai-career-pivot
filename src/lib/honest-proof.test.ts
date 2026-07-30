import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getHonestProofSignal } from "./honest-proof";

// Minimal fake of the supabase count query. `select(...).gte(...)` resolves to
// the weekly count; awaiting `select(...)` directly resolves to the total.
function mockSupabase(weekly: number, total: number, error: string | null = null): SupabaseClient {
  return {
    from() {
      return {
        select() {
          const totalResult = Promise.resolve({ count: total, error: error ? { message: error } : null });
          return Object.assign(totalResult, {
            gte: () => Promise.resolve({ count: weekly, error: error ? { message: error } : null }),
          });
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("getHonestProofSignal", () => {
  it("prefers weekly momentum once it clears the weekly floor", async () => {
    const signal = await getHonestProofSignal(mockSupabase(8, 120));
    expect(signal.plansThisWeek).toBe(8);
    expect(signal.primary).toEqual({
      value: 8,
      label: "people started their pivot plan this week",
      kind: "weekly",
    });
  });

  it("falls back to total when weekly is below floor but total clears its floor", async () => {
    const signal = await getHonestProofSignal(mockSupabase(2, 40));
    expect(signal.primary?.kind).toBe("total");
    expect(signal.primary?.value).toBe(40);
  });

  it("returns a null primary when nothing clears its floor (UI uses capability signals)", async () => {
    const signal = await getHonestProofSignal(mockSupabase(2, 10));
    expect(signal.plansThisWeek).toBe(2);
    expect(signal.plansTotal).toBe(10);
    expect(signal.primary).toBeNull();
  });

  it("degrades to a null/zero signal on query error rather than surfacing a wrong number", async () => {
    const signal = await getHonestProofSignal(mockSupabase(99, 999, "db down"));
    expect(signal).toEqual({ plansThisWeek: 0, plansTotal: 0, primary: null });
  });
});
