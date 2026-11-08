// @vitest-environment jsdom
import { act, type AnchorHTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CareerQuizClient from "./CareerQuizClient";
import { trackCareerQuizCompleted, trackCareerQuizToFree, trackCtaClicked } from "@/lib/tracking";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} onClick={(event) => { event.preventDefault(); onClick?.(event); }} />,
}));
vi.mock("@/components/StepIndicator", () => ({ StepIndicator: () => null }));
vi.mock("@/lib/tracking", () => ({
  trackCareerQuizStarted: vi.fn(), trackCareerQuizCompleted: vi.fn(), trackCareerQuizToFree: vi.fn(), trackCtaClicked: vi.fn(),
}));

const result = { matchedRole: "AI UX Designer", rationale: "A starting suggestion based on design interests.", salaryLow: 110, salaryHigh: 160, salaryDisplay: "$110k–$160k", timelineNote: "Optional resume snapshot", adjacentRoles: [] };
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function click(label: string) {
  const element = [...container.querySelectorAll("button,a")].find((node) => node.textContent?.includes(label)) as HTMLElement | undefined;
  expect(element, `Expected control: ${label}`).toBeDefined();
  await act(async () => element!.click());
}

async function fillQuiz() {
  await act(async () => root.render(<CareerQuizClient />));
  const select = container.querySelector("select")!;
  await act(async () => {
    select.value = "Design";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await click("Next");
  await click("3–5 years");
  await click("Next");
  await click("Design & UX");
  await click("Next");
  await click("Just exploring");
}

it("counts only a valid rendered result, carries context only on upload, and resets", async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
  sessionStorage.setItem("quiz_answers", '{"matchedRole":"Old role"}');
  await fillQuiz();
  expect(sessionStorage.getItem("quiz_answers")).toBeNull();
  await click("See my match");
  expect(trackCareerQuizCompleted).not.toHaveBeenCalled();
  await act(async () => finish(new Response(JSON.stringify(result))));
  expect(container.querySelector("h1")?.textContent).toBe(result.matchedRole);
  expect(trackCareerQuizCompleted).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem("quiz_answers")).toBeNull();
  await click("See plans & pricing");
  expect(trackCareerQuizToFree).not.toHaveBeenCalled();
  expect(trackCtaClicked).toHaveBeenCalledWith(expect.objectContaining({ destination: "/pricing" }));
  await click("Upload a resume");
  expect(trackCareerQuizToFree).toHaveBeenCalledTimes(1);
  expect(JSON.parse(sessionStorage.getItem("quiz_answers")!).matchedRole).toBe(result.matchedRole);
  expect(container.querySelector('a[href*="source=career_quiz"]')).not.toBeNull();
  await click("Retake");
  expect(sessionStorage.getItem("quiz_answers")).toBeNull();
  expect(container.querySelector("select")?.value).toBe("");
  expect(trackCareerQuizCompleted).toHaveBeenCalledTimes(1);
});

it.each([
  [503, { error: "Try later" }],
  [200, { matchedRole: "Incomplete" }],
])("does not count API status %s with an unusable result", async (status, body) => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));
  await fillQuiz();
  await click("See my match");
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(trackCareerQuizCompleted).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("quiz_answers")).toBeNull();
});

it("still renders results and permits retake when storage is unavailable", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(result))));
  vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new Error("blocked"); });
  await fillQuiz();
  await click("See my match");
  await click("Upload a resume");
  expect(trackCareerQuizCompleted).toHaveBeenCalledTimes(1);
  await click("Retake");
  expect(container.querySelector("select")?.value).toBe("");
});
