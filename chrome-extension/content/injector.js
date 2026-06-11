(() => {
  "use strict";

  let currentJobData = null;
  let savedJob = null;
  let scoreData = null;

  function msg(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, payload }, resolve);
    });
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") node.className = v;
      else if (k === "textContent") node.textContent = v;
      else if (k === "innerHTML") node.innerHTML = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === "string") node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  function scoreColor(score) {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  }

  function scoreRingSvg(score, size = 48) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);
    const color = scoreColor(score);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#334155" stroke-width="3"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="3"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"
        style="transition: stroke-dashoffset 0.6s ease"/>
      <text x="${size / 2}" y="${size / 2 + 1}" text-anchor="middle" dominant-baseline="central"
        fill="${color}" font-size="${size * 0.3}px" font-weight="700" font-family="system-ui">${score}</text>
    </svg>`;
  }

  function createSaveButton() {
    const btn = el("button", {
      className: "acp-save-btn",
      innerHTML: `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Save + Score</span>
      `,
    });

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentJobData) return;

      btn.classList.add("acp-saving");
      btn.querySelector("span").textContent = "Saving...";

      const result = await msg("SAVE_JOB", {
        role: currentJobData.role,
        company: currentJobData.company,
        url: currentJobData.url,
        source: currentJobData.source,
        stage: "saved",
        match_score: scoreData?.score || 0,
      });

      if (result.ok) {
        savedJob = result.data.job;
        btn.classList.remove("acp-saving");
        btn.classList.add("acp-saved");
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Saved</span>
          ${scoreData ? `<span class="acp-mini-score" style="color:${scoreColor(scoreData.score)}">${scoreData.score}%</span>` : ""}
        `;
      } else {
        btn.classList.remove("acp-saving");
        btn.querySelector("span").textContent = result.error || "Error";
        setTimeout(() => {
          btn.querySelector("span").textContent = "Save + Score";
        }, 2000);
      }
    });

    return btn;
  }

  function createScorePanel() {
    if (!scoreData || !currentJobData) return null;

    const panel = el("div", { className: "acp-score-panel" }, [
      el("div", { className: "acp-score-header" }, [
        el("div", { className: "acp-score-ring", innerHTML: scoreRingSvg(scoreData.score, 64) }),
        el("div", { className: "acp-score-meta" }, [
          el("div", {
            className: "acp-score-label",
            textContent: scoreData.score >= 80 ? "Strong Match" : scoreData.score >= 60 ? "Good Match" : "Needs Work",
          }),
          el("div", {
            className: "acp-score-detail",
            textContent: `${scoreData.matched.length}/${scoreData.total} skills matched`,
          }),
        ]),
      ]),
      (() => {
        const exact = scoreData.matched.filter(m => m.matchType === "exact");
        const variant = scoreData.matched.filter(m => m.matchType === "variant");
        const semantic = scoreData.matched.filter(m => m.matchType === "semantic");
        return el("div", { className: "acp-score-metrics" }, [
          el("div", { className: "acp-metric" }, [
            el("span", { className: "acp-metric-val", textContent: `${exact.length}` }),
            el("span", { className: "acp-metric-label", textContent: "Exact" }),
          ]),
          el("div", { className: "acp-metric" }, [
            el("span", { className: "acp-metric-val", textContent: `${variant.length}` }),
            el("span", { className: "acp-metric-label", textContent: "Variant" }),
          ]),
          el("div", { className: "acp-metric" }, [
            el("span", { className: "acp-metric-val", textContent: `${semantic.length}` }),
            el("span", { className: "acp-metric-label", textContent: "Semantic" }),
          ]),
          el("div", { className: "acp-metric" }, [
            el("span", { className: "acp-metric-val", textContent: `${scoreData.missing.length}` }),
            el("span", { className: "acp-metric-label", textContent: "Missing" }),
          ]),
        ]);
      })(),
      scoreData.matched.length > 0
        ? el("div", { className: "acp-keywords" }, [
            el("div", { className: "acp-kw-title", textContent: "Matched Skills" }),
            el("div", { className: "acp-kw-list" },
              scoreData.matched.slice(0, 8).map(m => {
                const cls = { exact: "acp-kw-exact", variant: "acp-kw-variant", semantic: "acp-kw-semantic" }[m.matchType];
                return el("span", { className: `acp-kw-tag ${cls}`, textContent: m.skill });
              })
            ),
          ])
        : null,
      scoreData.missing.length > 0
        ? el("div", { className: "acp-keywords" }, [
            el("div", { className: "acp-kw-title", textContent: "Missing Skills" }),
            el("div", { className: "acp-kw-list" },
              scoreData.missing.slice(0, 5).map(kw =>
                el("span", { className: "acp-kw-tag acp-kw-miss", textContent: kw })
              )
            ),
          ])
        : null,
    ]);

    const closeBtn = el("button", {
      className: "acp-panel-close",
      textContent: "×",
      onClick: () => panel.remove(),
    });
    panel.prepend(closeBtn);

    return panel;
  }

  function injectSaveButton(board) {
    if (document.querySelector(".acp-save-btn")) return;

    const applyBtn = window.__acpDetector.findApplyButton(board);
    const btn = createSaveButton();

    if (savedJob) {
      btn.classList.add("acp-saved");
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Saved</span>
        <span class="acp-stage-badge">${savedJob.stage}</span>
      `;
    }

    if (applyBtn?.parentElement) {
      applyBtn.parentElement.insertBefore(btn, applyBtn.nextSibling);
    } else {
      const h1 = document.querySelector("h1");
      if (h1?.parentElement) {
        h1.parentElement.appendChild(btn);
      }
    }
  }

  function injectScorePanel() {
    const existing = document.querySelector(".acp-score-panel");
    if (existing) existing.remove();

    const panel = createScorePanel();
    if (panel) document.body.appendChild(panel);
  }

  async function onJobDetected(e) {
    const { jobData, board } = e.detail;
    currentJobData = jobData;

    const configResult = await msg("GET_CONFIG");
    if (!configResult.ok || !configResult.data.userEmail) return;

    const [savedResult, scoreResult] = await Promise.all([
      msg("CHECK_SAVED", { url: jobData.url }),
      jobData.description
        ? msg("QUICK_SCORE", { jobDescription: jobData.description })
        : Promise.resolve({ ok: true, data: null }),
    ]);

    if (savedResult.ok && savedResult.data) {
      savedJob = savedResult.data;
    }
    if (scoreResult.ok && scoreResult.data) {
      scoreData = scoreResult.data;
    }

    injectSaveButton(board);
    if (scoreData && scoreData.score > 0) {
      injectScorePanel();
    }
  }

  window.addEventListener("acp-job-detected", onJobDetected);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TRIGGER_SAVE") {
      const btn = document.querySelector(".acp-save-btn");
      if (btn && !btn.classList.contains("acp-saved")) btn.click();
    }
  });
})();
