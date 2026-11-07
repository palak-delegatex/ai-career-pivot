import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
  create: vi.fn(),
  track: vi.fn(),
}));
vi.mock("@/lib/journey-server", () => ({ trackServerJourney: mocks.track }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: mocks.getAll, set: mocks.set }),
}));
import { GET } from "./route";

describe("OAuth callback", () => {
  it("emits pseudonymous success only after a verified exchange", async () => {
    mocks.exchange.mockResolvedValue({ error: null, data: { user: { id: "fixture-id", app_metadata: { provider: "google" } }, session: { expires_at: 123 } } });
    await GET(new NextRequest("https://example.test/auth/callback?code=private-code"));
    expect(mocks.track).toHaveBeenCalledWith("auth_succeeded", "user_fixture-id", { method: "google" }, "auth:fixture-id:123");
    expect(JSON.stringify(mocks.track.mock.calls)).not.toContain("private-code");
  });
  it("does not forward provider descriptions containing codes", async () => {
    const res = await GET(new NextRequest("https://example.test/auth/callback?error=server_error&error_description=private-code"));
    expect(res.headers.get("location")).not.toContain("private-code");
    expect(res.headers.get("location")).not.toContain("error_description");
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getAll.mockReturnValue([{ name: "sb-test-auth-token-code-verifier", value: "test-only" }]);
    mocks.exchange.mockResolvedValue({ error: null });
    mocks.create.mockReturnValue({ auth: { exchangeCodeForSession: mocks.exchange } });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("exchanges a code and returns to the requested localized page", async () => {
    const response = await GET(new NextRequest("https://ai-career-pivot.com/auth/callback?code=test-code&next=%2Fes%2Faccount%3Ftab%3Dreports"));
    expect(mocks.exchange).toHaveBeenCalledWith("test-code");
    expect(response.headers.get("location")).toBe("https://ai-career-pivot.com/es/account?tab=reports");
  });
  it("never redirects a successful login to an external next URL", async () => {
    const response = await GET(new NextRequest("https://ai-career-pivot.com/auth/callback?code=test-code&next=https%3A%2F%2Fexample.com"));
    expect(response.headers.get("location")).toBe("https://ai-career-pivot.com/dashboard");
  });
  it("keeps the retry destination on a provider denial without exchanging a code", async () => {
    const response = await GET(new NextRequest("https://ai-career-pivot.com/auth/callback?error=access_denied&next=%2Faccount"));
    const url = new URL(response.headers.get("location")!);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/account");
    expect(url.searchParams.get("error")).toBe("server_error");
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it("keeps raw exchange errors out of URLs and logs", async () => {
    mocks.exchange.mockImplementation(async () => {
      mocks.getAll.mockReturnValue([]);
      return { error: { message: "Test exchange failure", status: 400, code: "test_error" } };
    });
    const response = await GET(new NextRequest("https://ai-career-pivot.com/auth/callback?code=test-code&next=%2Faccount"));
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("exchange_failed");
    expect(response.headers.get("location")).not.toContain("Test exchange failure");
    expect(JSON.stringify(mocks.track.mock.calls)).not.toContain("Test exchange failure");
  });
  it("returns to login on a thrown transport failure without logging the code", async () => {
    mocks.exchange.mockRejectedValue(new Error("test transport failure"));
    const response = await GET(new NextRequest("https://ai-career-pivot.com/auth/callback?code=test-code&next=%2Faccount"));
    const url = new URL(response.headers.get("location")!);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/account");
    expect(url.searchParams.get("error")).toBe("exchange_failed");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("test-code");
  });
  it("returns to login when the callback is incomplete", async () => {
    const response = await GET(new NextRequest("https://ai-career-pivot.com/auth/callback?next=%2Faccount"));
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("auth");
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
});
