import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function request(answers: unknown) {
  return new NextRequest("http://localhost/api/career-quiz", { method: "POST", body: JSON.stringify(answers) });
}

describe("career quiz promises", () => {
  it("describes the interest/experience rule without inventing current-role evidence", async () => {
    const answers = { currentRole: "Healthcare", years: "3-5", interests: ["design"], timeline: "exploring" };
    const result = await (await POST(request(answers))).json();
    const changedRole = await (await POST(request({ ...answers, currentRole: "Finance" }))).json();
    expect(result.matchedRole).toBe("AI UX Designer");
    expect(result.matchedRole).toBe(changedRole.matchedRole);
    expect(result.rationale).toBe(changedRole.rationale);
    expect(result.rationale).toContain("interest in design and UX");
    expect(result.rationale).toContain("not an assessment of your skills");
    expect(result.timelineNote).toContain("free career snapshot");
    expect(result.timelineNote).toContain("not a full roadmap");
  });

  it("does not produce a suggestion without a valid interest", async () => {
    const response = await POST(request({ interests: ["invalid"] }));
    expect(response.status).toBe(400);
    expect(await response.json()).not.toHaveProperty("matchedRole");
  });
});
