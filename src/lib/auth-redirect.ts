/** Only allow an in-app destination after authentication. */
export function getAuthNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) {
    return "/dashboard";
  }
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f]/.test(decoded)) return "/dashboard";
    const url = new URL(value, "https://auth-local.invalid");
    if (url.origin !== "https://auth-local.invalid") return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}

export function getAuthCallbackUrl(origin: string, next: string | null): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", getAuthNextPath(next));
  return url.toString();
}
