import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAtsBenchmark, recordAtsScoreSample } from "./ats-benchmark";

// The aggregate function returns a single-row array via supabase.rpc.
function mockRpc(
  row: { sample_count: number; avg_score: number | null; median_score: number | null } | null,
  error: string | null = null
): SupabaseClient {
  return {
    rpc: () =>
      Promise.resolve({
        data: row ? [row] : [],
        error: error ? { message: error } : null,
      }),
  } as unknown as SupabaseClient;
}

describe("getAtsBenchmark", () => {
  it("surfaces the real mean anchor once the sample floor is met", async () => {
    const b = await getAtsBenchmark(mockRpc({ sample_count: 120, avg_score: 62.4, median_score: 64 }));
    expect(b.sampleCount).toBe(120);
    expect(b.averageScore).toBe(62); // rounded
    expect(b.medianScore).toBe(64);
    expect(b.primary).toEqual({
      value: 62,
      label: "the average score for recent résumés we've checked",
      kind: "average",
    });
  });

  it("withholds the anchor (null primary) when below the sample floor", async () => {
    const b = await getAtsBenchmark(mockRpc({ sample_count: 12, avg_score: 58, median_score: 60 }));
    expect(b.sampleCount).toBe(12);
    expect(b.averageScore).toBe(58); // still reports the raw number...
    expect(b.primary).toBeNull(); // ...but never anchors on a thin sample
  });

  it("returns the empty benchmark when the window has no samples", async () => {
    const b = await getAtsBenchmark(mockRpc({ sample_count: 0, avg_score: null, median_score: null }));
    expect(b).toEqual({ sampleCount: 0, averageScore: null, medianScore: null, primary: null });
  });

  it("degrades to the empty benchmark on query error rather than surfacing a wrong number", async () => {
    const b = await getAtsBenchmark(mockRpc(null, "db down"));
    expect(b).toEqual({ sampleCount: 0, averageScore: null, medianScore: null, primary: null });
  });
});

describe("recordAtsScoreSample", () => {
  it("inserts a rounded in-range score", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: () => ({ insert }) } as unknown as SupabaseClient;
    await recordAtsScoreSample(supabase, 71.6);
    expect(insert).toHaveBeenCalledWith({ score: 72 });
  });

  it("ignores out-of-range scores defensively without inserting", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: () => ({ insert }) } as unknown as SupabaseClient;
    await recordAtsScoreSample(supabase, 150);
    await recordAtsScoreSample(supabase, -1);
    expect(insert).not.toHaveBeenCalled();
  });

  it("swallows insert errors so scoring never fails on a dropped sample", async () => {
    const supabase = {
      from: () => ({ insert: () => Promise.reject(new Error("db down")) }),
    } as unknown as SupabaseClient;
    await expect(recordAtsScoreSample(supabase, 50)).resolves.toBeUndefined();
  });
});
