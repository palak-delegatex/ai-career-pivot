const DEFAULT_API_URL = "https://ai-career-pivot.vercel.app";

let selectedResumeId = null;
let currentStep = 1;

function msg(type, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, resolve);
  });
}

function show(id) {
  document.getElementById(id).hidden = false;
}

function hide(id) {
  document.getElementById(id).hidden = true;
}

// --- Step navigation ---

const STEP_IDS = ["stepWelcome", "stepConnect", "stepTryIt", "stepReady"];
const TRACK_FILL_PCT = [0, 33, 66, 100];

function goToStep(step) {
  currentStep = step;

  for (const id of STEP_IDS) {
    document.getElementById(id).hidden = true;
  }
  document.getElementById(STEP_IDS[step - 1]).hidden = false;

  for (let i = 1; i <= 4; i++) {
    const trackEl = document.getElementById(`track${i}`);
    trackEl.classList.remove("active", "completed");
    if (i < step) trackEl.classList.add("completed");
    if (i === step) trackEl.classList.add("active");
  }

  document.getElementById("trackFill").style.width = TRACK_FILL_PCT[step - 1] + "%";

  if (step === 2) loadConnectStep();
}

// --- Step 2: Connect (sign-in + resume) ---

async function loadConnectStep() {
  const session = await msg("GET_SESSION");

  if (!session.ok || !session.data) {
    show("authRequired");
    hide("resumeLoading");
    hide("resumeList");
    hide("resumeEmpty");
    return;
  }

  hide("authRequired");
  show("resumeLoading");
  hide("resumeList");
  hide("resumeEmpty");

  try {
    const email = session.data.user.email;
    const { apiUrl } = await chrome.storage.sync.get("apiUrl");
    const baseUrl = apiUrl || DEFAULT_API_URL;

    const res = await fetch(
      `${baseUrl}/api/resume-versions?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${session.data.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`API ${res.status}`);

    const { versions } = await res.json();
    hide("resumeLoading");

    if (!versions || versions.length === 0) {
      show("resumeEmpty");
      return;
    }

    renderResumeList(versions);
    show("resumeList");
  } catch {
    hide("resumeLoading");
    show("resumeEmpty");
  }
}

function renderResumeList(versions) {
  const list = document.getElementById("resumeList");
  list.innerHTML = "";

  for (const version of versions) {
    const item = document.createElement("div");
    item.className = "resume-item";
    item.dataset.id = version.id;

    const meta = [];
    if (version.target_role) meta.push(version.target_role);
    if (version.target_company) meta.push(version.target_company);
    if (!meta.length && version.updated_at) {
      meta.push(new Date(version.updated_at).toLocaleDateString());
    }

    item.innerHTML = `
      <div class="resume-radio"><div class="resume-radio-dot"></div></div>
      <div class="resume-info">
        <div class="resume-name">${escapeHtml(version.name)}</div>
        ${meta.length ? `<div class="resume-meta"><span>${escapeHtml(meta.join(" · "))}</span></div>` : ""}
      </div>
      ${version.match_score != null ? `<div class="resume-score">${version.match_score}%</div>` : ""}
    `;

    item.addEventListener("click", () => selectResume(version.id, item));
    list.appendChild(item);
  }
}

function selectResume(id, element) {
  document.querySelectorAll(".resume-item.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  element.classList.add("selected");
  selectedResumeId = id;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// --- Actions ---

async function finishOnboarding() {
  if (selectedResumeId) {
    await chrome.storage.sync.set({ activeResumeId: selectedResumeId });
  }
  await chrome.storage.sync.set({ onboardingComplete: true });
}

// --- Event listeners ---

// Step 1 → 2
document.getElementById("nextBtn").addEventListener("click", () => goToStep(2));

// Step 2: back, forward, skip
document.getElementById("backToWelcome").addEventListener("click", () => goToStep(1));
document.getElementById("nextToTryIt").addEventListener("click", () => goToStep(3));
document.getElementById("skipConnect").addEventListener("click", () => goToStep(3));

// Step 3: back, forward, skip
document.getElementById("backToConnect").addEventListener("click", () => goToStep(2));
document.getElementById("nextToReady").addEventListener("click", () => goToStep(4));
document.getElementById("skipTryIt").addEventListener("click", () => goToStep(4));

// Step 4: open dashboard
document.getElementById("openDashboard").addEventListener("click", async () => {
  await finishOnboarding();
  const { apiUrl } = await chrome.storage.sync.get("apiUrl");
  const baseUrl = apiUrl || DEFAULT_API_URL;
  chrome.tabs.create({ url: `${baseUrl}/dashboard` });
});

// Sign in
document.getElementById("signInBtn").addEventListener("click", async () => {
  const btn = document.getElementById("signInBtn");
  const errorEl = document.getElementById("authError");
  btn.disabled = true;
  btn.querySelector("span").textContent = "Signing in...";
  errorEl.hidden = true;

  const result = await msg("SIGN_IN_GOOGLE");
  if (result.ok) {
    loadConnectStep();
  } else {
    btn.disabled = false;
    btn.querySelector("span").textContent = "Continue with Google";
    errorEl.textContent = result.error || "Sign-in failed. Please try again.";
    errorEl.hidden = false;
  }
});
