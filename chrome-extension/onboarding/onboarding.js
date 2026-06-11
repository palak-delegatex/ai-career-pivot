const DEFAULT_API_URL = "https://ai-career-pivot.vercel.app";

let selectedResumeId = null;

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

function goToStep(step) {
  const stepWelcome = document.getElementById("stepWelcome");
  const stepResume = document.getElementById("stepResume");
  const dot1 = document.getElementById("dot1");
  const dot2 = document.getElementById("dot2");

  if (step === 1) {
    stepWelcome.hidden = false;
    stepResume.hidden = true;
    dot1.classList.add("active");
    dot2.classList.remove("active");
  } else {
    stepWelcome.hidden = true;
    stepResume.hidden = false;
    dot1.classList.remove("active");
    dot2.classList.add("active");
    loadResumeStep();
  }
}

// --- Step 2: Resume loading ---

async function loadResumeStep() {
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
  document.getElementById("finishBtn").disabled = false;
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
  window.close();
}

// --- Event listeners ---

document.getElementById("nextBtn").addEventListener("click", () => goToStep(2));
document.getElementById("backBtn").addEventListener("click", () => goToStep(1));

document.getElementById("finishBtn").addEventListener("click", finishOnboarding);

document.getElementById("skipBtn").addEventListener("click", async () => {
  await chrome.storage.sync.set({ onboardingComplete: true });
  window.close();
});

document.getElementById("signInBtn").addEventListener("click", async () => {
  const btn = document.getElementById("signInBtn");
  const errorEl = document.getElementById("authError");
  btn.disabled = true;
  btn.querySelector("span").textContent = "Signing in...";
  errorEl.hidden = true;

  const result = await msg("SIGN_IN_GOOGLE");
  if (result.ok) {
    loadResumeStep();
  } else {
    btn.disabled = false;
    btn.querySelector("span").textContent = "Continue with Google";
    errorEl.textContent = result.error || "Sign-in failed. Please try again.";
    errorEl.hidden = false;
  }
});
