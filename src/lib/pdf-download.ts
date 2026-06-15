const MAX_RETRIES = 2;
const FETCH_TIMEOUT_MS = 30_000;

export async function downloadPdf(
  url: string,
  init: RequestInit,
  filename: string,
): Promise<void> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Server error (${res.status})`);

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objUrl);
      return;
    } catch (err) {
      lastErr =
        err instanceof Error
          ? err.name === "AbortError"
            ? new Error("Request timed out")
            : err
          : new Error("Unknown error");
    }
  }

  throw lastErr ?? new Error("PDF download failed");
}
