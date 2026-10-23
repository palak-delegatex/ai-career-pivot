// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import BlogArticleLink from "./BlogArticleLink";
import BlogCtaLink from "../BlogCtaLink";
import { trackCtaClicked, trackBlogCtaViewed } from "@/lib/tracking";

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/blog/example", useParams: () => ({ locale: "de" }),
  useRouter: () => ({}), useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(), permanentRedirect: vi.fn(),
}));
vi.mock("@/lib/tracking", () => ({ trackCtaClicked: vi.fn(), trackBlogCtaViewed: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
let observerCallback: IntersectionObserverCallback;
const disconnect = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { observerCallback = callback; }
    observe() {}
    disconnect = disconnect;
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function render(children: ReactNode) {
  await act(async () => root.render(<NextIntlClientProvider locale="de" messages={{}} timeZone="UTC">{children}</NextIntlClientProvider>));
}
async function click(anchor: HTMLAnchorElement) {
  // Cancel browser navigation after React handles the click.
  document.addEventListener("click", (event) => event.preventDefault(), { once: true });
  await act(async () => anchor.click());
}
function visible(ratio: number, isIntersecting = true) {
  observerCallback([{ isIntersecting, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver);
}

it("uses the real locale-aware Link and emits one inline product event", async () => {
  await render(<BlogArticleLink href="/free?mode=upload" blogSlug="example"><strong>Resume snapshot</strong></BlogArticleLink>);
  const anchor = container.querySelector("a")!;
  expect(anchor.getAttribute("href")).toBe("/de/free?mode=upload");
  await click(anchor);
  expect(trackCtaClicked).toHaveBeenCalledExactlyOnceWith({ cta_text: "Resume snapshot", cta_location: "blog_inline", destination: "/free?mode=upload", blog_slug: "example" });
});

it.each(["https://example.org/source#section", "//example.org/path", "#sources", "mailto:reader@example.org"])("preserves external/fragment href %s without a product event", async (href) => {
  await render(<BlogArticleLink href={href} blogSlug="example" target="_blank" rel="noreferrer">Source</BlogArticleLink>);
  const anchor = container.querySelector("a")!;
  expect(anchor.getAttribute("href")).toBe(href);
  expect(anchor.getAttribute("target")).toBe("_blank");
  expect(anchor.getAttribute("rel")).toBe("noreferrer");
  await click(anchor);
  expect(trackCtaClicked).not.toHaveBeenCalled();
});

it("preserves an explicit localized path and ignores nonproduct reading links", async () => {
  await render(<><BlogArticleLink href="/fr/quiz" blogSlug="example">Quiz</BlogArticleLink><BlogArticleLink href="/blog/another#sources" blogSlug="example">Read next</BlogArticleLink></>);
  const anchors = container.querySelectorAll("a");
  expect(anchors[0].getAttribute("href")).toBe("/fr/quiz");
  expect(anchors[1].getAttribute("href")).toBe("/de/blog/another#sources");
  await click(anchors[1]);
  expect(trackCtaClicked).not.toHaveBeenCalled();
  await click(anchors[0]);
  expect(trackCtaClicked).toHaveBeenCalledTimes(1);
});

it("counts a named CTA once and deduplicates half-visible impressions per article placement", async () => {
  const cta = (slug: string) => <BlogCtaLink href="/quiz" ctaText="Explore roles" ctaLocation="blog_after_takeaways" blogSlug={slug} trackImpression>Explore roles</BlogCtaLink>;
  await render(cta("first"));
  expect(container.querySelector("a")?.getAttribute("href")).toBe("/de/quiz");
  visible(0.49);
  visible(0.8, false);
  expect(trackBlogCtaViewed).not.toHaveBeenCalled();
  visible(0.5);
  visible(1);
  expect(trackBlogCtaViewed).toHaveBeenCalledExactlyOnceWith({ cta_location: "blog_after_takeaways", destination: "/quiz", blog_slug: "first" });
  expect(disconnect).toHaveBeenCalled();
  await click(container.querySelector("a")!);
  expect(trackCtaClicked).toHaveBeenCalledTimes(1);
  await render(cta("second"));
  visible(1);
  expect(trackBlogCtaViewed).toHaveBeenCalledTimes(2);
  await render(cta("first"));
  visible(1);
  expect(trackBlogCtaViewed).toHaveBeenCalledTimes(2);
});

it("still provides navigation and click tracking without IntersectionObserver", async () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  await render(<BlogCtaLink href="/quiz" ctaText="Quiz" ctaLocation="blog_end" blogSlug="example" trackImpression>Quiz</BlogCtaLink>);
  await click(container.querySelector("a")!);
  expect(trackCtaClicked).toHaveBeenCalledTimes(1);
  expect(trackBlogCtaViewed).not.toHaveBeenCalled();
});
