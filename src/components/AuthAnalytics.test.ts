// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ subscribe: vi.fn(), identify: vi.fn(), capture: vi.fn(), reset: vi.fn(), id: "user_previous" }));
vi.mock("react", () => ({ useEffect: (effect: () => void) => effect() }));
vi.mock("posthog-js", () => ({ default: { __loaded: true, identify: m.identify, capture: m.capture, reset: m.reset, get_distinct_id: () => m.id } }));
vi.mock("@/lib/supabase-browser", () => ({ getSupabaseBrowserClient: () => ({ auth: { onAuthStateChange: m.subscribe } }) }));
import AuthAnalytics from "./AuthAnalytics";
beforeEach(() => {
 m.id = "user_previous"; m.reset.mockReset().mockImplementation(() => { m.id = "anonymous_after_reset"; });
 m.capture.mockClear(); m.identify.mockClear();
 m.subscribe.mockReset().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
});
it("clears a previous identity after server sign-out reload", () => {
 AuthAnalytics(); m.subscribe.mock.calls[0][0]("INITIAL_SESSION", null);
 expect(m.reset).toHaveBeenCalledOnce(); expect(document.cookie).toContain("aic_analytics_id=anonymous_after_reset");
});
it("keeps an anonymous identity across ordinary reloads", () => {
 m.id = "anonymous_fixture"; AuthAnalytics(); m.subscribe.mock.calls[0][0]("INITIAL_SESSION", null);
 expect(m.reset).not.toHaveBeenCalled();
});
