import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ remove: vi.fn(), signOut: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: vi.fn(), delete: m.remove }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { signOut: m.signOut } }) }));
import { POST } from "./route";
beforeEach(() => { m.remove.mockClear(); m.signOut.mockReset().mockResolvedValue({ error: null }); });
it("clears purchase and analytics cookies and follows POST with a GET redirect", async () => {
 const response = await POST(new NextRequest("https://app.example.test/api/auth/signout", { method: "POST" }));
 expect(m.signOut).toHaveBeenCalledOnce();
 expect(m.remove.mock.calls).toEqual([["aic_order_access"], ["aic_analytics_id"]]);
 expect(response.status).toBe(303); expect(response.headers.get("location")).toBe("https://app.example.test/");
});
