(function () {
  "use strict";

  const SUPPORTED_SITES = [
    { host: "linkedin.com", selectors: { title: ".job-details-jobs-unified-top-card__job-title", company: ".job-details-jobs-unified-top-card__company-name", description: ".jobs-description__content" } },
    { host: "indeed.com", selectors: { title: ".jobsearch-JobInfoHeader-title", company: "[data-company-name]", description: "#jobDescriptionText" } },
    { host: "glassdoor.com", selectors: { title: ".css-1vg6q84", company: ".css-87uc0g", description: ".jobDescriptionContent" } },
  ];

  function getSiteConfig() {
    const hostname = window.location.hostname;
    return SUPPORTED_SITES.find((s) => hostname.includes(s.host));
  }

  function extractJobData(config) {
    const getText = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent.trim() : "";
    };

    return {
      title: getText(config.selectors.title),
      company: getText(config.selectors.company),
      description: getText(config.selectors.description),
      url: window.location.href,
      source: config.host.split(".")[0],
    };
  }

  function createScoreBadge(score, recommendation) {
    const existing = document.getElementById("acp-match-badge");
    if (existing) existing.remove();

    const color =
      score >= 75
        ? "#10b981"
        : score >= 50
          ? "#f59e0b"
          : score >= 25
            ? "#f97316"
            : "#ef4444";

    const badge = document.createElement("div");
    badge.id = "acp-match-badge";
    badge.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 999999;
      background: #1e293b; border: 2px solid ${color}; border-radius: 16px;
      padding: 16px 20px; min-width: 280px; max-width: 360px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4); color: #f1f5f9;
    `;

    badge.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: conic-gradient(${color} ${score * 3.6}deg, #334155 0deg); display: flex; align-items: center; justify-content: center;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: ${color};">
            ${score}
          </div>
        </div>
        <div>
          <div style="font-weight: 600; font-size: 14px;">Match Score</div>
          <div style="font-size: 12px; color: #94a3b8;">${recommendation}</div>
        </div>
        <button id="acp-close-badge" style="position: absolute; top: 8px; right: 12px; background: none; border: none; color: #64748b; cursor: pointer; font-size: 18px;">×</button>
      </div>
      <button id="acp-save-job" style="
        width: 100%; padding: 8px 16px; margin-top: 8px;
        background: linear-gradient(135deg, #14b8a6, #10b981); color: white;
        border: none; border-radius: 8px; font-weight: 600; font-size: 13px;
        cursor: pointer;
      ">Save to Job Tracker</button>
    `;

    document.body.appendChild(badge);

    document.getElementById("acp-close-badge").addEventListener("click", () => badge.remove());
    document.getElementById("acp-save-job").addEventListener("click", () => saveJob(score));
  }

  async function saveJob(matchScore) {
    const config = getSiteConfig();
    if (!config) return;
    const jobData = extractJobData(config);

    const btn = document.getElementById("acp-save-job");
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
      const { apiUrl, userEmail } = await chrome.storage.sync.get(["apiUrl", "userEmail"]);
      if (!apiUrl || !userEmail) {
        btn.textContent = "Set up extension first";
        return;
      }

      const res = await fetch(`${apiUrl}/api/jobs/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          job: { ...jobData, matchScore, description: jobData.description },
        }),
      });

      if (res.ok) {
        btn.textContent = "Saved ✓";
        btn.style.background = "#10b981";
      } else {
        btn.textContent = "Failed — retry";
        btn.disabled = false;
      }
    } catch {
      btn.textContent = "Failed — retry";
      btn.disabled = false;
    }
  }

  async function scoreCurrentJob() {
    const config = getSiteConfig();
    if (!config) return;

    const jobData = extractJobData(config);
    if (!jobData.title) return;

    try {
      const { apiUrl, userSkills, targetRole } = await chrome.storage.sync.get([
        "apiUrl",
        "userSkills",
        "targetRole",
      ]);
      if (!apiUrl || !userSkills) return;

      const res = await fetch(`${apiUrl}/api/jobs/match-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobData.title,
          jobDescription: jobData.description,
          jobTags: [],
          userSkills: JSON.parse(userSkills),
          targetRole,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      createScoreBadge(data.matchScore, data.recommendation);
    } catch {
      // silently fail
    }
  }

  if (getSiteConfig()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(scoreCurrentJob, 1500));
    } else {
      setTimeout(scoreCurrentJob, 1500);
    }

    const observer = new MutationObserver(() => {
      clearTimeout(observer._debounce);
      observer._debounce = setTimeout(scoreCurrentJob, 2000);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
