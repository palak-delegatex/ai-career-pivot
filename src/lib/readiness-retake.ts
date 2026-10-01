/** Retaking clears the result token while retaining the optional path context. */
export function readinessRetakeUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("r");
  return url.pathname + url.search + url.hash;
}
