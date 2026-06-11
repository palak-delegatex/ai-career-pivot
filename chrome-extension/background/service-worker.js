const SUPABASE_URL = "https://aqukrcnzdrhkohdjibwy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdWtyY256ZHJoa29oZGppYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjI5MzgsImV4cCI6MjA5MTY5ODkzOH0.Iwy3onpZdAvl3_jYCx0mVA3fp7_PuKRYlM70e_okZp4";
const DEFAULT_API_URL = "https://ai-career-pivot.vercel.app";

// --- PKCE ---

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function generatePKCE() {
  const verifier = base64urlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return { verifier, challenge: base64urlEncode(digest) };
}

// --- Auth ---
// NOTE: chrome.identity.getRedirectURL() must be added to Supabase
// Dashboard > Authentication > URL Configuration > Redirect URLs

let refreshPromise = null;

async function signInWithGoogle() {
  const { verifier, challenge } = await generatePKCE();
  const redirectUrl = chrome.identity.getRedirectURL();

  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirectUrl);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  const code = new URL(responseUrl).searchParams.get("code");
  if (!code) throw new Error("No auth code received");

  const tokenRes = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    }
  );

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || "Sign-in failed");
  }

  const data = await tokenRes.json();
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    user: data.user,
  };

  await chrome.storage.local.set({ supabase_session: session });
  await chrome.storage.sync.set({ userEmail: data.user.email });
  scheduleTokenRefresh(data.expires_in);

  return session;
}

async function getSession() {
  const { supabase_session } = await chrome.storage.local.get(
    "supabase_session"
  );
  if (!supabase_session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now >= supabase_session.expires_at - 60) {
    return refreshSession();
  }
  return supabase_session;
}

async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { supabase_session } = await chrome.storage.local.get(
      "supabase_session"
    );
    if (!supabase_session?.refresh_token) {
      await clearSession();
      return null;
    }

    try {
      const res = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            refresh_token: supabase_session.refresh_token,
          }),
        }
      );

      if (!res.ok) {
        await clearSession();
        return null;
      }

      const data = await res.json();
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        user: data.user,
      };

      await chrome.storage.local.set({ supabase_session: session });
      await chrome.storage.sync.set({ userEmail: data.user.email });
      scheduleTokenRefresh(data.expires_in);

      return session;
    } catch {
      return supabase_session;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function signOut() {
  const { supabase_session } = await chrome.storage.local.get(
    "supabase_session"
  );

  if (supabase_session?.access_token) {
    fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabase_session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    }).catch(() => {});
  }

  await clearSession();
}

async function clearSession() {
  await chrome.storage.local.remove("supabase_session");
  await chrome.storage.sync.remove("userEmail");
  chrome.alarms.clear("token-refresh");
}

function scheduleTokenRefresh(expiresInSeconds) {
  const delayMinutes = Math.max((expiresInSeconds - 300) / 60, 1);
  chrome.alarms.create("token-refresh", { delayInMinutes: delayMinutes });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "token-refresh") {
    refreshSession();
  }
});

// --- Config ---

async function getConfig() {
  const session = await getSession();
  const { apiUrl, userProfile } = await chrome.storage.sync.get([
    "apiUrl",
    "userProfile",
  ]);
  return {
    apiUrl: apiUrl || DEFAULT_API_URL,
    userEmail: session?.user?.email || null,
    userProfile: userProfile || null,
    user: session?.user || null,
  };
}

// --- API ---

function isTransientError(status) {
  return status >= 500 || status === 408 || status === 429;
}

async function apiRequest(path, options = {}, retries = 3) {
  const { apiUrl } = await chrome.storage.sync.get("apiUrl");
  const session = await getSession();
  const url = `${apiUrl || DEFAULT_API_URL}${path}`;

  const headers = { "Content-Type": "application/json", ...options.headers };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, ...options });
      if (res.ok) return res.json();

      if (attempt < retries && isTransientError(res.status)) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }

      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API ${res.status}`);
    } catch (err) {
      lastError = err;
      if (err.message?.startsWith("API ")) throw err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

// --- Jobs ---

async function saveJob(jobData) {
  const config = await getConfig();
  if (!config.userEmail) throw new Error("Not signed in");
  return apiRequest("/api/job-tracker", {
    method: "POST",
    body: JSON.stringify({ email: config.userEmail, ...jobData }),
  });
}

async function getJobs() {
  const config = await getConfig();
  if (!config.userEmail) throw new Error("Not signed in");
  return apiRequest(
    `/api/job-tracker?email=${encodeURIComponent(config.userEmail)}`
  );
}

async function updateJob(id, updates) {
  const config = await getConfig();
  if (!config.userEmail) throw new Error("Not signed in");
  return apiRequest("/api/job-tracker", {
    method: "PATCH",
    body: JSON.stringify({ id, email: config.userEmail, ...updates }),
  });
}

function quickScore(jobDescription, userProfile) {
  if (!userProfile?.skills?.length)
    return { score: 0, matched: [], missing: [], total: 0 };

  const jdLower = jobDescription.toLowerCase();
  const jdWords = new Set(
    jdLower.split(/[\s,;.()\/]+/).filter((w) => w.length > 2)
  );

  const matched = [];
  const missing = [];

  for (const skill of userProfile.skills) {
    const skillLower = skill.toLowerCase();
    const skillWords = skillLower.split(/\s+/);

    if (jdLower.includes(skillLower)) {
      matched.push({ skill, matchType: "exact" });
    } else if (
      (userProfile.variants?.[skill] || []).some((v) =>
        jdLower.includes(v.toLowerCase())
      )
    ) {
      matched.push({ skill, matchType: "variant" });
    } else if (
      skillWords.length > 1 &&
      skillWords.every((w) => jdWords.has(w))
    ) {
      matched.push({ skill, matchType: "semantic" });
    } else {
      missing.push(skill);
    }
  }

  const total = userProfile.skills.length;
  const score = total > 0 ? Math.round((matched.length / total) * 100) : 0;
  return { score, matched, missing, total };
}

async function checkIfSaved(url) {
  try {
    const { jobs } = await getJobs();
    return jobs.find((j) => j.url === url) || null;
  } catch {
    return null;
  }
}

// --- Message Handler ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = async () => {
    try {
      switch (msg.type) {
        case "SIGN_IN_GOOGLE":
          return { ok: true, data: await signInWithGoogle() };

        case "SIGN_OUT":
          await signOut();
          return { ok: true };

        case "GET_SESSION": {
          const session = await getSession();
          return { ok: true, data: session };
        }

        case "SAVE_JOB":
          return { ok: true, data: await saveJob(msg.payload) };

        case "GET_JOBS":
          return { ok: true, data: await getJobs() };

        case "UPDATE_JOB":
          return {
            ok: true,
            data: await updateJob(msg.payload.id, msg.payload.updates),
          };

        case "QUICK_SCORE": {
          const { userProfile } = await chrome.storage.sync.get("userProfile");
          const result = quickScore(msg.payload.jobDescription, userProfile);
          return { ok: true, data: result };
        }

        case "CHECK_SAVED":
          return { ok: true, data: await checkIfSaved(msg.payload.url) };

        case "GET_CONFIG":
          return { ok: true, data: await getConfig() };

        case "GET_AUTOFILL_DATA": {
          const config = await getConfig();
          const { userProfile } = await chrome.storage.sync.get("userProfile");
          return { ok: true, data: { ...userProfile, email: config.userEmail } };
        }

        case "GET_RESUME_VERSIONS": {
          const config = await getConfig();
          if (!config.userEmail) throw new Error("Not signed in");
          return {
            ok: true,
            data: await apiRequest(
              `/api/resume-versions?email=${encodeURIComponent(config.userEmail)}`
            ),
          };
        }

        case "AI_GENERATE": {
          const config = await getConfig();
          if (!config.userEmail) throw new Error("Not signed in");
          const session = await getSession();
          const genRes = await fetch(
            `${config.apiUrl}/api/ai-generate`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                type: msg.payload.type,
                question: msg.payload.question || undefined,
                jobDescription: msg.payload.jobDescription || undefined,
                jobTitle: msg.payload.jobTitle || undefined,
                company: msg.payload.company || undefined,
                email: config.userEmail,
              }),
            }
          );
          if (!genRes.ok) {
            const err = await genRes.json().catch(() => ({}));
            throw new Error(err.error || `API ${genRes.status}`);
          }
          return { ok: true, data: await genRes.json() };
        }

        case "GET_ACTIVE_RESUME": {
          const { activeResumeId } = await chrome.storage.sync.get(
            "activeResumeId"
          );
          return { ok: true, data: { activeResumeId: activeResumeId || null } };
        }

        case "SET_ACTIVE_RESUME": {
          await chrome.storage.sync.set({
            activeResumeId: msg.payload.resumeId,
          });
          return { ok: true };
        }

        case "FETCH_RESUME_PDF": {
          const config = await getConfig();
          if (!config.userEmail) throw new Error("Not signed in");
          const session = await getSession();

          const res = await apiRequest(
            `/api/resume-versions?email=${encodeURIComponent(config.userEmail)}&status=ready`
          );
          const versions = res.versions || [];

          const resumeId = msg.payload?.resumeId;
          const { activeResumeId: storedId } = await chrome.storage.sync.get("activeResumeId");
          const targetId = resumeId || storedId;

          let resume = null;
          if (targetId && versions.length) {
            resume = versions.find((v) => v.id === targetId);
          }
          if (!resume && versions.length) {
            resume = versions[0];
          }
          if (!resume) throw new Error("No resume versions available");

          const pdfRes = await fetch(`${config.apiUrl}/api/resume/pdf`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              content: resume.generated_text,
              targetRole: resume.target_role || "Professional",
              name: config.user?.user_metadata?.full_name || config.userEmail,
              type: "resume",
            }),
          });

          if (!pdfRes.ok) throw new Error(`PDF generation failed: ${pdfRes.status}`);

          const arrayBuf = await pdfRes.arrayBuffer();
          const bytes = new Uint8Array(arrayBuf);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const base64 = btoa(binary);

          return {
            ok: true,
            data: {
              base64,
              filename: `Resume_${(resume.target_role || "Professional").replace(/\s+/g, "_")}.pdf`,
              resumeId: resume.id,
              resumeName: resume.name,
            },
          };
        }

        case "GET_RESUME_LIST": {
          const config = await getConfig();
          if (!config.userEmail) throw new Error("Not signed in");
          const listRes = await apiRequest(
            `/api/resume-versions?email=${encodeURIComponent(config.userEmail)}&status=ready`
          );
          const versions = listRes.versions || [];
          const { activeResumeId: activeId } = await chrome.storage.sync.get("activeResumeId");
          return {
            ok: true,
            data: {
              resumes: versions.map((v) => ({
                id: v.id,
                name: v.name,
                targetRole: v.target_role,
                targetCompany: v.target_company,
                matchScore: v.match_score,
                updatedAt: v.updated_at,
              })),
              activeResumeId: activeId || null,
            },
          };
        }

        default:
          return { ok: false, error: "Unknown message type" };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  handler().then(sendResponse);
  return true;
});

// --- Commands ---

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-dashboard") {
    const config = await getConfig();
    chrome.tabs.create({ url: `${config.apiUrl}/dashboard` });
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  if (command === "save-job") {
    chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_SAVE" });
  } else if (command === "autofill") {
    chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_AUTOFILL" });
  }
});

// --- Install ---

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "onboarding/onboarding.html" });
  }
});

// --- Startup: ensure token refresh alarm ---

chrome.runtime.onStartup.addListener(async () => {
  const { supabase_session } = await chrome.storage.local.get(
    "supabase_session"
  );
  if (supabase_session?.expires_at) {
    const remaining =
      supabase_session.expires_at - Math.floor(Date.now() / 1000);
    if (remaining > 0) {
      scheduleTokenRefresh(remaining);
    } else if (supabase_session.refresh_token) {
      refreshSession();
    }
  }
});
