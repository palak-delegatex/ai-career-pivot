document.addEventListener("DOMContentLoaded", async () => {
  const $ = (sel) => document.querySelector(sel);
  const show = (id) => {
    document.querySelectorAll(".view").forEach((v) => (v.hidden = true));
    $(id).hidden = false;
  };

  function msg(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, payload }, resolve);
    });
  }

  function scoreColor(score) {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  }

  function scoreRingSvg(score, size) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);
    const color = scoreColor(score);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#334155" stroke-width="3"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="3"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="${size / 2}" y="${size / 2 + 1}" text-anchor="middle" dominant-baseline="central"
        fill="${color}" font-size="${size * 0.28}px" font-weight="700" font-family="system-ui">${score}</text>
    </svg>`;
  }

  function companyBg(company) {
    const colors = [
      "#3b82f6", "#8b5cf6", "#d97706", "#475569",
      "#2563eb", "#ef4444", "#ec4899", "#10b981",
    ];
    let hash = 0;
    for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % colors.length];
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Auth check ---

  const sessionResult = await msg("GET_SESSION");
  const session = sessionResult.ok ? sessionResult.data : null;

  if (!session) {
    show("#signInView");
    setSyncStatus("red", "Not signed in");

    const signInBtn = $("#googleSignInBtn");
    const signInError = $("#signInError");

    signInBtn.addEventListener("click", async () => {
      signInBtn.disabled = true;
      signInBtn.querySelector("span").textContent = "Signing in...";
      signInError.hidden = true;

      const result = await msg("SIGN_IN_GOOGLE");
      if (result.ok) {
        window.location.reload();
      } else {
        signInBtn.disabled = false;
        signInBtn.querySelector("span").textContent = "Continue with Google";
        signInError.textContent = result.error || "Sign-in failed. Please try again.";
        signInError.hidden = false;
      }
    });

    // Settings still accessible
    $("#settingsBtn").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  // --- Signed in: show user menu ---

  const user = session.user;
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

  const userMenu = $("#userMenu");
  const userInitial = $("#userInitial");
  const userAvatarImg = $("#userAvatarImg");

  userMenu.hidden = false;

  if (avatarUrl) {
    userAvatarImg.src = avatarUrl;
    userAvatarImg.hidden = false;
    userInitial.hidden = true;
  } else {
    userInitial.textContent = userName.charAt(0).toUpperCase();
    userInitial.hidden = false;
    userAvatarImg.hidden = true;
  }

  $("#dropdownName").textContent = userName;
  $("#dropdownEmail").textContent = userEmail;

  // User dropdown toggle
  const userBtn = $("#userBtn");
  const userDropdown = $("#userDropdown");

  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.hidden = !userDropdown.hidden;
  });

  document.addEventListener("click", () => {
    userDropdown.hidden = true;
  });

  userDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Sign out
  $("#signOutBtn").addEventListener("click", async () => {
    await msg("SIGN_OUT");
    window.location.reload();
  });

  // Dropdown settings
  $("#dropdownSettings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // --- Load config and proceed ---

  const configResult = await msg("GET_CONFIG");
  const config = configResult.ok ? configResult.data : { apiUrl: "https://ai-career-pivot.vercel.app" };

  // Check active tab for job data
  show("#loadingView");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let jobOnPage = null;

  if (tab?.id) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.__acpDetector) {
            const board = window.__acpDetector.detectBoard();
            if (board) return window.__acpDetector.extractJobData(board);
          }
          return null;
        },
      });
      jobOnPage = result?.result || null;
    } catch {
      // Content script not injected on this page
    }
  }

  if (jobOnPage) {
    await showJobView(jobOnPage, config);
  } else {
    await showDefaultView(config);
  }

  // Sync status
  try {
    await msg("GET_JOBS");
    setSyncStatus("green", "Synced");
  } catch {
    setSyncStatus("amber", "Offline — cached data");
  }

  // --- Views ---

  async function showDefaultView(config) {
    show("#defaultView");

    const result = await msg("GET_JOBS");
    if (!result.ok) {
      setSyncStatus("red", result.error);
      return;
    }

    const jobs = result.data.jobs || [];

    // Pipeline counts
    const counts = { saved: 0, applied: 0, interview: 0, offer: 0 };
    for (const j of jobs) {
      if (j.stage === "saved") counts.saved++;
      else if (j.stage === "applied") counts.applied++;
      else if (j.stage === "phone_screen" || j.stage === "interview") counts.interview++;
      else if (j.stage === "offer") counts.offer++;
    }

    $("#countSaved").textContent = counts.saved;
    $("#countApplied").textContent = counts.applied;
    $("#countInterview").textContent = counts.interview;
    $("#countOffer").textContent = counts.offer;

    // Recent saves
    const recent = jobs.slice(0, 3);
    const container = $("#recentSaves");
    container.innerHTML = "";

    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-recent">No saved jobs yet. Visit a job listing to get started!</div>';
    } else {
      for (const job of recent) {
        const item = document.createElement("div");
        item.className = "recent-job";
        item.innerHTML = `
          <div class="recent-job-icon" style="background:${companyBg(job.company)}">
            ${job.company.charAt(0).toUpperCase()}
          </div>
          <div class="recent-job-info">
            <div class="recent-job-title">${escapeHtml(job.role)}</div>
            <div class="recent-job-company">${escapeHtml(job.company)} · ${timeAgo(job.created_at)}</div>
          </div>
          ${job.match_score > 0 ? `<div class="recent-job-score">${scoreRingSvg(job.match_score, 32)}</div>` : ""}
        `;
        container.appendChild(item);
      }
    }

    // Paste URL
    let pasteMode = false;
    $("#pasteUrlBtn").addEventListener("click", () => {
      if (pasteMode) return;
      pasteMode = true;
      const row = document.createElement("div");
      row.className = "paste-url-row";
      row.innerHTML = `
        <input class="paste-url-input" type="url" placeholder="Paste job URL...">
        <button class="paste-url-go">Go</button>
      `;
      $("#pasteUrlBtn").replaceWith(row);

      const input = row.querySelector("input");
      input.focus();

      row.querySelector("button").addEventListener("click", () => {
        const url = input.value.trim();
        if (url) chrome.tabs.create({ url });
      });
    });

    // Dashboard
    $("#openDashboardBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: `${config.apiUrl}/dashboard` });
    });
  }

  async function showJobView(jobData, config) {
    show("#jobView");

    // Job card
    $("#companyIcon").style.background = companyBg(jobData.company);
    $("#companyIcon").textContent = jobData.company.charAt(0).toUpperCase();
    $("#jobTitle").textContent = jobData.role;
    $("#jobCompany").textContent = jobData.company;
    $("#jobLocation").textContent = jobData.location || "";
    $("#jobSalary").textContent = jobData.salary || "";
    $("#jobSource").textContent = jobData.source;

    // Check if already saved
    const savedResult = await msg("CHECK_SAVED", { url: jobData.url });
    const savedJob = savedResult.ok ? savedResult.data : null;

    // Quick score
    let scoreData = null;
    if (jobData.description) {
      const scoreResult = await msg("QUICK_SCORE", { jobDescription: jobData.description });
      if (scoreResult.ok) scoreData = scoreResult.data;
    }

    // Show score
    if (scoreData && scoreData.total > 0) {
      $("#scoreSection").hidden = false;
      $("#scoreRing").innerHTML = scoreRingSvg(scoreData.score, 96);
      $("#matchedCount").textContent = scoreData.matched.length;
      $("#missingCount").textContent = scoreData.missing.length;
      $("#transferableCount").textContent = Math.min(scoreData.matched.length, 6);

      const kwContainer = $("#keywordBreakdown");
      kwContainer.innerHTML = "";
      for (const kw of scoreData.matched) {
        kwContainer.innerHTML += `<span class="kw-tag kw-match">${escapeHtml(kw)}</span>`;
      }
      for (const kw of scoreData.missing.slice(0, 8)) {
        kwContainer.innerHTML += `<span class="kw-tag kw-miss">${escapeHtml(kw)}</span>`;
      }
    }

    // Save / saved state
    if (savedJob) {
      showSavedState(savedJob, config);
    } else {
      $("#saveCTA").hidden = false;
      $("#savedCTA").hidden = true;

      $("#saveBtn").addEventListener("click", async () => {
        const btn = $("#saveBtn");
        btn.disabled = true;
        btn.textContent = "Saving...";

        const result = await msg("SAVE_JOB", {
          role: jobData.role,
          company: jobData.company,
          url: jobData.url,
          source: jobData.source,
          stage: "saved",
          match_score: scoreData?.score || 0,
        });

        if (result.ok) {
          showSavedState(result.data.job, config);
        } else {
          btn.disabled = false;
          btn.textContent = result.error || "Error — try again";
          setTimeout(() => { btn.textContent = "Save & Track"; }, 2000);
        }
      });
    }
  }

  function showSavedState(job, config) {
    $("#saveCTA").hidden = true;
    $("#savedCTA").hidden = false;
    $("#currentStage").textContent = job.stage?.replace("_", " ") || "saved";

    $("#viewInTrackerBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: `${config.apiUrl}/dashboard` });
    });
  }

  function setSyncStatus(color, text) {
    $("#syncDot").className = `sync-dot ${color}`;
    $("#syncText").textContent = text;
  }

  // Settings
  $("#settingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
