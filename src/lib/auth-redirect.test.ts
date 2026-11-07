import { describe, expect, it } from "vitest";
import { getAuthCallbackUrl, getAuthNextPath } from "./auth-redirect";

describe("authentication destinations", () => {
  it("keeps a localized destination, query and fragment", () => {
    expect(getAuthNextPath("/es/account?tab=reports#saved")).toBe("/es/account?tab=reports#saved");
  });
  it.each([null, "", "https://example.com", "//example.com", "/\\example.com", "/%5cexample.com", "/%2fexample.com", "/\nexample.com", "/%0aexample.com", "/%ZZ"])(
    "rejects an unsafe or malformed destination %s", (value) => {
      expect(getAuthNextPath(value)).toBe("/dashboard");
    }
  );
  it("preserves the initiating origin and safely encodes the return path", () => {
    const url = new URL(getAuthCallbackUrl("https://ai-career-pivot.com", "/es/account?tab=reports"));
    expect(url.origin + url.pathname).toBe("https://ai-career-pivot.com/auth/callback");
    expect(url.searchParams.get("next")).toBe("/es/account?tab=reports");
  });
});
