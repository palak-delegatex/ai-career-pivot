// PostHog analytics for the extension (AIC-747).
//
// The extension is an activation channel: install → first job capture →
// web signup. To measure it as one funnel we emit events to the SAME PostHog
// project the web app uses (public project token — already shipped in the web
// client bundle, safe to embed here) and key the person on the signed-in email
// so the extension person merges with the web person.
//
// All calls are best-effort and swallow errors: analytics must never break the
// capture/autofill UX.

const POSTHOG_HOST = "https://us.i.posthog.com";
const POSTHOG_TOKEN = "phc_BWtjPSrYN64kPwcJuJfPqcWMFekgjAg5gPhGCCS6Tq8m";
const CAPTURE_ENDPOINT = `${POSTHOG_HOST}/i/v0/e/`;

// Stable anonymous id, used before the user signs in. Once we know the email we
// switch the distinct_id to it (and $identify merges the two).
async function getAnonId() {
  const { ph_anon_id } = await chrome.storage.local.get("ph_anon_id");
  if (ph_anon_id) return ph_anon_id;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ ph_anon_id: id });
  return id;
}

async function getDistinctId() {
  const { userEmail } = await chrome.storage.sync.get("userEmail");
  return userEmail || (await getAnonId());
}

export async function track(event, properties = {}) {
  try {
    const distinct_id = await getDistinctId();
    await fetch(CAPTURE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_TOKEN,
        event,
        distinct_id,
        properties: {
          ...properties,
          $lib: "chrome-extension",
          source_surface: "extension",
          extension_version: chrome.runtime.getManifest().version,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    /* never throw */
  }
}

// Merge the anonymous extension person into the email-keyed person so the
// extension_installed event (emitted before sign-in) and the later web signup
// land on the same PostHog person.
export async function identifyByEmail(email) {
  if (!email) return;
  try {
    const anonId = await getAnonId();
    await fetch(CAPTURE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_TOKEN,
        event: "$identify",
        distinct_id: email,
        properties: {
          $anon_distinct_id: anonId,
          $set: { email, extension_user: true },
          $lib: "chrome-extension",
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    /* never throw */
  }
}

// First-capture is the key activation moment. Returns true exactly once.
export async function markFirstCaptureIfNew() {
  const { ph_first_capture_done } = await chrome.storage.local.get(
    "ph_first_capture_done"
  );
  if (ph_first_capture_done) return false;
  await chrome.storage.local.set({ ph_first_capture_done: true });
  return true;
}
