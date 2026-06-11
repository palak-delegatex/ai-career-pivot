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
  let isJobBoard = false;
  let extractionFailed = false;

  if (tab?.id) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.__acpDetector) {
            const board = window.__acpDetector.detectBoard();
            if (board) {
              const data = window.__acpDetector.extractJobData(board);
              return { board: true, data };
            }
          }
          return { board: false, data: null };
        },
      });
      const extracted = result?.result || { board: false, data: null };
      isJobBoard = extracted.board;
      jobOnPage = extracted.data;
      extractionFailed = isJobBoard && !jobOnPage;
    } catch {
      // Content script not injected on this page
    }
  }

  if (jobOnPage) {
    await showJobView(jobOnPage, config);
  } else if (extractionFailed) {
    showErrorView(tab, config);
  } else {
    await showDefaultView(config);
  }

  // Sync status
  await syncCheck();

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

    // --- Resume state ---
    let resumeVersions = [];
    let activeResumeId = null;
    let activeResumeName = null;

    function renderScore(data) {
      if (!data || data.total <= 0) {
        $("#scoreSection").hidden = true;
        return;
      }
      scoreData = data;
      $("#scoreSection").hidden = false;
      $("#scoreRing").innerHTML = scoreRingSvg(data.score, 96);

      const exact = data.matched.filter((m) => m.matchType === "exact");
      const variant = data.matched.filter((m) => m.matchType === "variant");
      const semantic = data.matched.filter((m) => m.matchType === "semantic");

      $("#exactCount").textContent = exact.length;
      $("#variantCount").textContent = variant.length;
      $("#semanticCount").textContent = semantic.length;
      $("#missingCount").textContent = data.missing.length;

      const kwContainer = $("#keywordBreakdown");
      kwContainer.innerHTML = "";
      const typeClass = { exact: "kw-exact", variant: "kw-variant", semantic: "kw-semantic" };
      const typeLabel = { exact: "Exact", variant: "Variant", semantic: "Semantic" };
      for (const m of data.matched) {
        kwContainer.innerHTML += `<span class="kw-tag ${typeClass[m.matchType]}">${escapeHtml(m.skill)} <span class="kw-badge">${typeLabel[m.matchType]}</span></span>`;
      }
      for (const kw of data.missing.slice(0, 8)) {
        kwContainer.innerHTML += `<span class="kw-tag kw-miss">${escapeHtml(kw)}</span>`;
      }
    }

    async function rescoreWithResume(resumeId) {
      if (!jobData.description) return;
      const resume = resumeVersions.find((v) => v.id === resumeId);
      const skills = resume?.enabled_skills;
      if (!skills?.length) return;

      const payload = { jobDescription: jobData.description, skills };
      const result = await msg("QUICK_SCORE", payload);
      if (result.ok) {
        renderScore(result.data);
        await msg("SET_ACTIVE_RESUME", { resumeId });
        activeResumeId = resumeId;
        activeResumeName = resume.name;
        $("#resumeName").textContent = resume.name;
      }
    }

    // Show initial score
    renderScore(scoreData);

    // Load resume versions and show resume bar
    if (scoreData && scoreData.total > 0) {
      const [versionsResult, activeResult] = await Promise.all([
        msg("GET_RESUME_VERSIONS"),
        msg("GET_ACTIVE_RESUME"),
      ]);

      if (versionsResult.ok) {
        resumeVersions = (versionsResult.data?.versions || []).filter(
          (v) => v.enabled_skills?.length > 0
        );
      }
      if (activeResult.ok) {
        activeResumeId = activeResult.data?.activeResumeId || null;
      }

      if (resumeVersions.length > 0) {
        const active = activeResumeId
          ? resumeVersions.find((v) => v.id === activeResumeId)
          : null;
        activeResumeName = active?.name || "Default Profile";
        $("#resumeName").textContent = activeResumeName;
        $("#resumeBar").hidden = false;
      }

      // Resume picker
      $("#resumeSwitchBtn").addEventListener("click", () => {
        const picker = $("#resumePicker");
        if (!picker.hidden) {
          picker.hidden = true;
          return;
        }
        const list = $("#resumePickerList");
        list.innerHTML = "";

        for (const v of resumeVersions) {
          const item = document.createElement("div");
          item.className = "resume-picker-item" + (v.id === activeResumeId ? " active" : "");
          const meta = [v.target_role, v.target_company].filter(Boolean).join(" · ");
          item.innerHTML = `
            <div class="resume-picker-info">
              <div class="resume-picker-name">${escapeHtml(v.name)}</div>
              ${meta ? `<div class="resume-picker-meta">${escapeHtml(meta)}</div>` : ""}
            </div>
            ${v.id === activeResumeId ? '<span class="resume-picker-check">✓</span>' : ""}
          `;
          item.addEventListener("click", async () => {
            if (v.id === activeResumeId) {
              picker.hidden = true;
              return;
            }
            picker.hidden = true;
            $("#resumeName").textContent = "Scoring...";
            await rescoreWithResume(v.id);
          });
          list.appendChild(item);
        }
        picker.hidden = false;
      });

      $("#resumePickerClose").addEventListener("click", () => {
        $("#resumePicker").hidden = true;
      });
    }

    // Re-score handler for saved state
    async function handleRescore() {
      if (!jobData.description) return;
      if (activeResumeId) {
        await rescoreWithResume(activeResumeId);
      } else {
        const result = await msg("QUICK_SCORE", { jobDescription: jobData.description });
        if (result.ok) renderScore(result.data);
      }
    }

    // Save / saved state
    if (savedJob) {
      showSavedState(savedJob, config, handleRescore);
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
          showSavedState(result.data.job, config, handleRescore);
        } else {
          btn.disabled = false;
          btn.textContent = result.error || "Error — try again";
          setTimeout(() => { btn.textContent = "Save & Track"; }, 2000);
        }
      });
    }
  }

  function showSavedState(job, config, onRescore) {
    $("#saveCTA").hidden = true;
    $("#savedCTA").hidden = false;
    $("#currentStage").textContent = job.stage?.replace("_", " ") || "saved";

    $("#viewInTrackerBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: `${config.apiUrl}/dashboard` });
    });

    if (onRescore) {
      $("#rescoreBtn").addEventListener("click", () => onRescore());
    }
  }

  function setSyncStatus(color, text, showRetry = false) {
    $("#syncDot").className = `sync-dot ${color}`;
    $("#syncText").textContent = text;
    $("#syncRetryBtn").hidden = !showRetry;
  }

  async function syncCheck() {
    if (!navigator.onLine) {
      setSyncStatus("red", "Offline", true);
      return;
    }
    try {
      await msg("GET_JOBS");
      setSyncStatus("green", "Synced");
    } catch {
      setSyncStatus("amber", "Sync error", true);
    }
  }

  $("#syncRetryBtn").addEventListener("click", async () => {
    setSyncStatus("amber", "Retrying...");
    await syncCheck();
  });

  window.addEventListener("online", () => syncCheck());
  window.addEventListener("offline", () => setSyncStatus("red", "Offline", true));

  // --- Error view ---

  function showErrorView(tab, config) {
    show("#errorView");

    if (tab?.url) {
      $("#errorPasteInput").value = tab.url;
    }

    $("#errorPasteGo").addEventListener("click", () => {
      const url = $("#errorPasteInput").value.trim();
      if (url) chrome.tabs.create({ url });
    });

    $("#errorRetryBtn").addEventListener("click", () => {
      window.location.reload();
    });

    $("#errorManualSave").addEventListener("click", () => {
      showManualSaveView(tab, config);
    });
  }

  function showManualSaveView(tab, config) {
    show("#manualSaveView");
    if (tab?.url) $("#manualUrl").value = tab.url;

    $("#manualCancelBtn").addEventListener("click", () => {
      showErrorView(tab, config);
    });

    $("#manualSaveBtn").addEventListener("click", async () => {
      const role = $("#manualRole").value.trim();
      const company = $("#manualCompany").value.trim();
      const url = $("#manualUrl").value.trim();

      if (!role || !company) {
        $("#manualSaveError").textContent = "Title and company are required.";
        $("#manualSaveError").hidden = false;
        return;
      }

      const btn = $("#manualSaveBtn");
      btn.disabled = true;
      btn.textContent = "Saving...";
      $("#manualSaveError").hidden = true;

      const result = await msg("SAVE_JOB", {
        role,
        company,
        url: url || tab?.url || "",
        source: "manual",
        stage: "saved",
        match_score: 0,
      });

      if (result.ok) {
        btn.textContent = "Saved!";
        setTimeout(() => showDefaultView(config), 800);
      } else {
        btn.disabled = false;
        btn.textContent = "Save";
        $("#manualSaveError").textContent = result.error || "Save failed. Please try again.";
        $("#manualSaveError").hidden = false;
      }
    });
  }

  // Settings
  $("#settingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
