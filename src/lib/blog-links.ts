import { locales } from "../i18n/routing";
const productPaths = new Set(["/free", "/quiz", "/readiness", "/assessment", "/onboarding", "/pricing", "/pivot"]);
export function blogLinkInfo(href: string) {
  const internal = href.startsWith("/") && !href.startsWith("//");
  const path = href.split(/[?#]/)[0];
  const first = path.split("/")[1];
  const localized = (locales as readonly string[]).includes(first);
  const canonical = localized ? path.slice(first.length + 1) || "/" : path;
  return { internal, localized, product: internal && (productPaths.has(canonical) || canonical.startsWith("/pivot/")) };
}
