import { locales } from "../i18n/routing";
const productPaths = new Set(["/free", "/quiz", "/readiness", "/assessment", "/onboarding", "/pricing", "/pivot"]);
export function blogLinkInfo(href: string) {
  const internal = href.startsWith("/") && !href.startsWith("//");
  const path = href.split(/[?#]/)[0];
  const first = path.split("/")[1];
  const localized = (locales as readonly string[]).includes(first);
  const canonical = localized ? path.slice(first.length + 1) || "/" : path;
  // Public files are served at their root URL, outside locale-prefixed routes.
  const staticAsset = internal && /\/[^/]+\.[a-z0-9]+$/i.test(path);
  return { internal, localized, staticAsset, product: internal && !staticAsset && (productPaths.has(canonical) || canonical.startsWith("/pivot/")) };
}
