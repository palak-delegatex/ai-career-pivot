import { describe, it, expect } from "vitest";
import {
  consumeUsage,
  isFreeToolSlug,
  parseUsageCookie,
  periodKey,
  readUsage,
  resetsAt,
} from "./free-usage";

const JULY = new Date("2026-07-15T12:00:00Z");

describe("periodKey", () => {
  it("keys months as YYYY-MM (UTC)", () => {
    expect(periodKey("month", JULY)).toBe("2026-07");
    expect(periodKey("month", new Date("2026-12-31T23:59:00Z"))).toBe("2026-12");
  });
  it("keys days as YYYY-MM-DD (UTC)", () => {
    expect(periodKey("day", JULY)).toBe("2026-07-15");
  });
});

describe("resetsAt", () => {
  it("monthly resets on the first of next month, UTC", () => {
    expect(resetsAt("month", JULY)).toBe("2026-08-01T00:00:00.000Z");
    expect(resetsAt("month", new Date("2026-12-10T00:00:00Z"))).toBe(
      "2027-01-01T00:00:00.000Z",
    );
  });
  it("daily resets at the next UTC midnight", () => {
    expect(resetsAt("day", JULY)).toBe("2026-07-16T00:00:00.000Z");
  });
});

describe("isFreeToolSlug", () => {
  it("accepts known slugs and rejects unknown ones", () => {
    expect(isFreeToolSlug("ats-score")).toBe(true);
    expect(isFreeToolSlug("career-coach")).toBe(true);
    expect(isFreeToolSlug("nope")).toBe(false);
  });
});

describe("parseUsageCookie", () => {
  it("returns empty on undefined/garbage/wrong-version", () => {
    expect(parseUsageCookie(undefined).tools).toEqual({});
    expect(parseUsageCookie("not json").tools).toEqual({});
    expect(parseUsageCookie(JSON.stringify({ v: 99, tools: {} })).tools).toEqual(
      {},
    );
  });
});

describe("readUsage", () => {
  it("reports the full free allowance when no cookie exists", () => {
    const s = readUsage(undefined, "ats-score", JULY);
    expect(s).toMatchObject({ used: 0, limit: 3, remaining: 3, period: "month" });
    expect(s.resetsAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("does not mutate — repeated reads are stable", () => {
    const { cookieValue } = consumeUsage(undefined, "ats-score", JULY);
    expect(readUsage(cookieValue, "ats-score", JULY).used).toBe(1);
    expect(readUsage(cookieValue, "ats-score", JULY).used).toBe(1);
  });

  it("treats a stale period key as a full reset", () => {
    const stale = JSON.stringify({
      v: 1,
      tools: { "ats-score": { n: 3, p: "2026-06" } },
    });
    expect(readUsage(stale, "ats-score", JULY).remaining).toBe(3);
  });
});

describe("consumeUsage", () => {
  it("increments within the period and persists the count", () => {
    let cookie: string | undefined;
    let last = consumeUsage(cookie, "ats-score", JULY);
    expect(last.state.used).toBe(1);
    expect(last.state.remaining).toBe(2);
    cookie = last.cookieValue;

    last = consumeUsage(cookie, "ats-score", JULY);
    expect(last.state.used).toBe(2);
    cookie = last.cookieValue;

    last = consumeUsage(cookie, "ats-score", JULY);
    expect(last.state.used).toBe(3);
    expect(last.state.remaining).toBe(0);
  });

  it("never exceeds the limit or goes negative", () => {
    let cookie: string | undefined;
    for (let i = 0; i < 6; i++) {
      cookie = consumeUsage(cookie, "gap-analysis", JULY).cookieValue; // limit 1
    }
    const s = readUsage(cookie, "gap-analysis", JULY);
    expect(s.used).toBe(1);
    expect(s.remaining).toBe(0);
  });

  it("isolates counts per tool", () => {
    const first = consumeUsage(undefined, "ats-score", JULY).cookieValue;
    const second = consumeUsage(first, "cover-letter", JULY).cookieValue;
    expect(readUsage(second, "ats-score", JULY).used).toBe(1);
    expect(readUsage(second, "cover-letter", JULY).used).toBe(1);
    expect(readUsage(second, "linkedin-optimizer", JULY).used).toBe(0);
  });

  it("resets a daily tool the next UTC day", () => {
    const day1 = consumeUsage(undefined, "career-coach", JULY).cookieValue;
    expect(readUsage(day1, "career-coach", JULY).used).toBe(1);
    const nextDay = new Date("2026-07-16T00:05:00Z");
    expect(readUsage(day1, "career-coach", nextDay).used).toBe(0);
  });
});
