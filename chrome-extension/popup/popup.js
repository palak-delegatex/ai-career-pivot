document.addEventListener("DOMContentLoaded", async () => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

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
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#334155" stroke-width="${size > 40 ? 4 : 2.5}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${size > 40 ? 4 : 2.5}"
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

  // --- Tab Navigation ---

  function switchTab(tabName) {
    $$(".ext-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
    $$("#mainContent .tab-panel").forEach((p) => (p.hidden = p.id !== `panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`));
  }

  $("#tabBar").addEventListener("click", (e) => {
    const tab = e.target.closest(".ext-tab");
    if (tab && tab.dataset.tab) switchTab(tab.dataset.tab);
  });

  // --- Sync status ---

  function setSyncStatus(color, text) {
    $("#syncDot").className = `sync-dot ${color}`;
    $("#syncText").textContent = text;
  }

  async function syncCheck() {
    if (!navigator.onLine) {
      setSyncStatus("red", "Offline");
      return;
    }
    try {
      await msg("GET_JOBS");
      setSyncStatus("green", "Synced");
    } catch {
      setSyncStatus("amber", "Sync error");
    }
  }

  window.addEventListener("online", () => syncCheck());
  window.addEventListener("offline", () => setSyncStatus("red", "Offline"));

  // --- Show views helper ---

  function showSignedInUI() {
    $("#signInView").hidden = true;
    $("#tabBar").hidden = false;
    $("#mainContent").hidden = false;
  }

  function showSignInView() {
    $("#signInView").hidden = false;
    $("#tabBar").hidden = true;
    $("#mainContent").hidden = true;
    $("#contextBar").hidden = true;
  }

  function showErrorView() {
    $("#signInView").hidden = true;
    $("#tabBar").hidden = true;
    $("#mainContent").hidden = true;
    $("#errorView").hidden = false;
  }

  function showLoadingView() {
    $("#loadingView").hidden = false;
    $("#mainContent").hidden = true;
    $("#tabBar").hidden = true;
  }

  function hideLoadingView() {
    $("#loadingView").hidden = true;
  }

  // --- Auth check ---

  const sessionResult = await msg("GET_SESSION");
  const session = sessionResult.ok ? sessionResult.data : null;

  if (!session) {
    showSignInView();
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

    $("#settingsBtn").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  // --- Signed in: setup user UI ---

  const user = session.user;
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

  // Header user menu
  const userMenu = $("#userMenu");
  const userInitial = $("#userInitial");
  const userAvatarImg = $("#userAvatarImg");

  userMenu.hidden = false;
  $("#notifBtn").hidden = false;
  $("#settingsBtn").hidden = true;

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

  $("#signOutBtn").addEventListener("click", async () => {
    await msg("SIGN_OUT");
    window.location.reload();
  });

  $("#dropdownSettings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Profile tab
  if (avatarUrl) {
    $("#profileAvatar").innerHTML = `<img src="${escapeHtml(avatarUrl)}" alt="">`;
  } else {
    $("#profileAvatar").textContent = userName.charAt(0).toUpperCase();
  }
  $("#profileName").textContent = userName;
  $("#profileEmail").textContent = userEmail;

  $("#profileSettingsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  $("#profileSignOutBtn").addEventListener("click", async () => {
    await msg("SIGN_OUT");
    window.location.reload();
  });

  // --- Load config and detect job ---

  const configResult = await msg("GET_CONFIG");
  const config = configResult.ok ? configResult.data : { apiUrl: "https://ai-career-pivot.vercel.app" };

  showLoadingView();

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

  hideLoadingView();

  if (extractionFailed) {
    showErrorViewHandler(tab, config);
    return;
  }

  showSignedInUI();

  // Load jobs data for pipeline and recent saves
  const jobsResult = await msg("GET_JOBS");
  const jobs = jobsResult.ok ? (jobsResult.data.jobs || []) : [];

  // Pipeline counts
  const counts = { saved: 0, applied: 0, interview: 0, offer: 0 };
  for (const j of jobs) {
    if (j.stage === "saved") counts.saved++;
    else if (j.stage === "applied") counts.applied++;
    else if (j.stage === "phone_screen" || j.stage === "interview") counts.interview++;
    else if (j.stage === "offer") counts.offer++;
  }

  $("#circleSaved").textContent = counts.saved;
  $("#circleApplied").textContent = counts.applied;
  $("#circleInterview").textContent = counts.interview;
  $("#circleOffer").textContent = counts.offer;

  // Recent saves
  const recent = jobs.slice(0, 5);
  const recentContainer = $("#recentSaves");
  recentContainer.innerHTML = "";

  if (recent.length === 0) {
    recentContainer.innerHTML = '<div class="empty-recent">No saved jobs yet. Visit a job listing to get started!</div>';
  } else {
    for (const job of recent) {
      const item = document.createElement("div");
      item.className = "ext-recent-item";
      item.innerHTML = `
        <div class="ext-recent-icon" style="background:${companyBg(job.company)}">
          ${job.company.charAt(0).toUpperCase()}
        </div>
        <div class="ext-recent-info">
          <div class="ext-recent-title">${escapeHtml(job.role)}</div>
          <div class="ext-recent-meta">${escapeHtml(job.company)} · ${timeAgo(job.created_at)}</div>
        </div>
        ${job.match_score > 0 ? `<div class="ext-recent-score">${scoreRingSvg(job.match_score, 28)}</div>` : ""}
      `;
      recentContainer.appendChild(item);
    }
  }

  // Quick actions
  $("#saveCurrentBtn").addEventListener("click", () => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_SAVE" });
      window.close();
    }
  });

  $("#openDashboardBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: `${config.apiUrl}/dashboard` });
  });

  // --- Job detected: setup Score tab ---

  if (jobOnPage) {
    setupJobContext(jobOnPage, config, jobs);
  }

  async function setupJobContext(jobData, config, existingJobs) {
    // Show context bar
    $("#contextBar").hidden = false;
    $("#contextIcon").style.background = companyBg(jobData.company);
    $("#contextIcon").textContent = jobData.company.charAt(0).toUpperCase();
    $("#contextTitle").textContent = jobData.role;
    $("#contextCompany").textContent = `${jobData.company}${jobData.location ? ' · ' + jobData.location : ''}`;

    // Check if already saved
    const savedResult = await msg("CHECK_SAVED", { url: jobData.url });
    const savedJob = savedResult.ok ? savedResult.data : null;

    if (savedJob) {
      $("#contextBadge").textContent = "Saved ✓";
      $("#contextBadge").className = "ext-context-badge saved";
    } else {
      $("#contextBadge").textContent = "New";
      $("#contextBadge").className = "ext-context-badge unsaved";
    }

    // Score
    let scoreData = null;
    if (jobData.description) {
      const scoreResult = await msg("QUICK_SCORE", { jobDescription: jobData.description });
      if (scoreResult.ok) scoreData = scoreResult.data;
    }

    // Show Score tab
    const scoreTab = $("#scoreTab");
    scoreTab.hidden = false;
    if (scoreData && scoreData.score > 0) {
      $("#scoreTabBadge").textContent = scoreData.score;
    }

    // Switch to Score tab automatically when job detected
    switchTab("score");

    // Resume state
    let resumeVersions = [];
    let activeResumeId = null;

    function renderScore(data) {
      if (!data || data.total <= 0) return;
      scoreData = data;

      // Score ring
      $("#scoreRing").innerHTML = scoreRingSvg(data.score, 72);

      // Score label
      const label = data.score >= 80 ? "Strong Match" : data.score >= 60 ? "Good Match" : "Needs Work";
      $("#scoreLabel").textContent = label;
      $("#scoreLabel").style.color = scoreColor(data.score);
      $("#scoreDetail").textContent = `${data.matched.length} of ${data.total} skills matched`;

      // Tab badge
      $("#scoreTabBadge").textContent = data.score;

      // Metric pills
      const exact = data.matched.filter((m) => m.matchType === "exact");
      const variant = data.matched.filter((m) => m.matchType === "variant");
      const semantic = data.matched.filter((m) => m.matchType === "semantic");
      const gaps = data.gaps || [];
      const missingCount = gaps.length || data.missing.length;

      $("#pillExact").textContent = `Exact ${exact.length}`;
      $("#pillVariant").textContent = `Variant ${variant.length}`;
      $("#pillSemantic").textContent = `Semantic ${semantic.length}`;
      $("#pillMissing").textContent = `Missing ${missingCount}`;

      // Keywords
      const kwContainer = $("#kwTags");
      kwContainer.innerHTML = "";
      const typeClass = { exact: "exact", variant: "variant", semantic: "exact" };
      for (const m of data.matched.slice(0, 8)) {
        kwContainer.innerHTML += `<span class="ext-kw-tag ${typeClass[m.matchType]}">${escapeHtml(m.skill)}</span>`;
      }
      for (const kw of data.missing.slice(0, 5)) {
        kwContainer.innerHTML += `<span class="ext-kw-tag miss">${escapeHtml(kw)}</span>`;
      }
      if (kwContainer.children.length > 0) {
        $("#kwSection").hidden = false;
      }
    }

    renderScore(scoreData);

    // Keyword toggle
    $("#kwToggle").addEventListener("click", () => {
      const tags = $("#kwTags");
      const chevron = $("#kwChevron");
      tags.hidden = !tags.hidden;
      chevron.classList.toggle("open", !tags.hidden);
    });

    // Load resume versions
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
        $("#resumeName").textContent = active?.name || "Default Profile";
        $("#resumeInline").hidden = false;
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

    async function rescoreWithResume(resumeId) {
      if (!jobData.description) return;
      const resume = resumeVersions.find((v) => v.id === resumeId);
      const skills = resume?.enabled_skills;
      if (!skills?.length) return;

      const result = await msg("QUICK_SCORE", { jobDescription: jobData.description, skills });
      if (result.ok) {
        renderScore(result.data);
        await msg("SET_ACTIVE_RESUME", { resumeId });
        activeResumeId = resumeId;
        $("#resumeName").textContent = resume.name;
      }
    }

    // Save / saved state
    if (savedJob) {
      showSavedState(savedJob);
    } else {
      $("#saveCTA").hidden = false;
      $("#savedBar").hidden = true;

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
          showSavedState(result.data.job);
          // Update context badge
          $("#contextBadge").textContent = "Saved ✓";
          $("#contextBadge").className = "ext-context-badge saved";
          // Update pipeline count
          const current = parseInt($("#circleSaved").textContent) || 0;
          $("#circleSaved").textContent = current + 1;
        } else {
          btn.disabled = false;
          btn.textContent = result.error || "Error — try again";
          setTimeout(() => { btn.textContent = "Save & Track"; }, 2000);
        }
      });
    }

    function showSavedState(job) {
      $("#saveCTA").hidden = true;
      $("#savedBar").hidden = false;
      $("#currentStage").textContent = job.stage?.replace("_", " ") || "saved";

      $("#viewInTrackerBtn").addEventListener("click", () => {
        chrome.tabs.create({ url: `${config.apiUrl}/dashboard` });
      });

      $("#rescoreBtn").addEventListener("click", async () => {
        if (!jobData.description) return;
        if (activeResumeId) {
          await rescoreWithResume(activeResumeId);
        } else {
          const result = await msg("QUICK_SCORE", { jobDescription: jobData.description });
          if (result.ok) renderScore(result.data);
        }
      });
    }
  }

  // Sync check
  await syncCheck();

  // --- Error view ---

  function showErrorViewHandler(tab, config) {
    showErrorView();

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
      showManualSaveViewHandler(tab, config);
    });
  }

  function showManualSaveViewHandler(tab, config) {
    $("#errorView").hidden = true;
    $("#manualSaveView").hidden = false;
    if (tab?.url) $("#manualUrl").value = tab.url;

    $("#manualCancelBtn").addEventListener("click", () => {
      $("#manualSaveView").hidden = true;
      showErrorViewHandler(tab, config);
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
        setTimeout(() => window.location.reload(), 800);
      } else {
        btn.disabled = false;
        btn.textContent = "Save";
        $("#manualSaveError").textContent = result.error || "Save failed. Please try again.";
        $("#manualSaveError").hidden = false;
      }
    });
  }

});
