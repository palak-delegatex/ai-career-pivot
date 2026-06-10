const DEFAULT_API_URL = "https://ai-career-pivot.vercel.app";

async function getConfig() {
  const { apiUrl, userEmail, userProfile } = await chrome.storage.sync.get([
    "apiUrl",
    "userEmail",
    "userProfile",
  ]);
  return {
    apiUrl: apiUrl || DEFAULT_API_URL,
    userEmail: userEmail || null,
    userProfile: userProfile || null,
  };
}

async function apiRequest(path, options = {}) {
  const { apiUrl } = await getConfig();
  const url = `${apiUrl}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
  }
  return res.json();
}

async function saveJob(jobData) {
  const { userEmail } = await getConfig();
  if (!userEmail) throw new Error("Not signed in");
  return apiRequest("/api/job-tracker", {
    method: "POST",
    body: JSON.stringify({ email: userEmail, ...jobData }),
  });
}

async function getJobs() {
  const { userEmail } = await getConfig();
  if (!userEmail) throw new Error("Not signed in");
  return apiRequest(`/api/job-tracker?email=${encodeURIComponent(userEmail)}`);
}

async function updateJob(id, updates) {
  const { userEmail } = await getConfig();
  if (!userEmail) throw new Error("Not signed in");
  return apiRequest("/api/job-tracker", {
    method: "PATCH",
    body: JSON.stringify({ id, email: userEmail, ...updates }),
  });
}

function quickScore(jobDescription, userProfile) {
  if (!userProfile?.skills?.length) return { score: 0, matched: [], missing: [], total: 0 };

  const jdLower = jobDescription.toLowerCase();
  const jdWords = new Set(jdLower.split(/[\s,;.()\/]+/).filter(w => w.length > 2));

  const matched = [];
  const missing = [];

  for (const skill of userProfile.skills) {
    const skillLower = skill.toLowerCase();
    const skillWords = skillLower.split(/\s+/);
    const found =
      jdLower.includes(skillLower) ||
      skillWords.every(w => jdWords.has(w)) ||
      (userProfile.variants?.[skill] || []).some(v => jdLower.includes(v.toLowerCase()));

    if (found) {
      matched.push(skill);
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
    return jobs.find(j => j.url === url) || null;
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = async () => {
    try {
      switch (msg.type) {
        case "SAVE_JOB":
          return { ok: true, data: await saveJob(msg.payload) };

        case "GET_JOBS":
          return { ok: true, data: await getJobs() };

        case "UPDATE_JOB":
          return { ok: true, data: await updateJob(msg.payload.id, msg.payload.updates) };

        case "QUICK_SCORE": {
          const { userProfile } = await getConfig();
          const result = quickScore(msg.payload.jobDescription, userProfile);
          return { ok: true, data: result };
        }

        case "CHECK_SAVED":
          return { ok: true, data: await checkIfSaved(msg.payload.url) };

        case "GET_CONFIG":
          return { ok: true, data: await getConfig() };

        case "GET_AUTOFILL_DATA": {
          const { userProfile, userEmail } = await getConfig();
          return { ok: true, data: { ...userProfile, email: userEmail } };
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

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "open-dashboard") {
    const { apiUrl } = await getConfig();
    chrome.tabs.create({ url: `${apiUrl}/dashboard` });
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

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "options/options.html?onboarding=true" });
  }
});
