(() => {
  "use strict";

  let currentJobData = null;
  let savedJob = null;
  let scoreData = null;
  let aiMatchData = null;
  let highlightActive = false;

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

  let resumeVersions = [];
  let activeResumeId = null;

  function buildScorePanelContent(data) {
    const exact = data.matched.filter(m => m.matchType === "exact");
    const variant = data.matched.filter(m => m.matchType === "variant");
    const semantic = data.matched.filter(m => m.matchType === "semantic");

    const children = [
      el("div", { className: "acp-score-header" }, [
        el("div", { className: "acp-score-ring", innerHTML: scoreRingSvg(data.score, 64) }),
        el("div", { className: "acp-score-meta" }, [
          el("div", {
            className: "acp-score-label",
            textContent: data.score >= 80 ? "Strong Match" : data.score >= 60 ? "Good Match" : "Needs Work",
          }),
          el("div", {
            className: "acp-score-detail",
            textContent: `${data.matched.length}/${data.total} skills matched`,
          }),
        ]),
      ]),
      el("div", { className: "acp-score-metrics" }, [
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
          el("span", { className: "acp-metric-val", textContent: `${data.missing.length}` }),
          el("span", { className: "acp-metric-label", textContent: "Missing" }),
        ]),
      ]),
    ];

    if (data.matched.length > 0) {
      children.push(el("div", { className: "acp-keywords" }, [
        el("div", { className: "acp-kw-title", textContent: "Matched Skills" }),
        el("div", { className: "acp-kw-list" },
          data.matched.slice(0, 8).map(m => {
            const cls = { exact: "acp-kw-exact", variant: "acp-kw-variant", semantic: "acp-kw-semantic" }[m.matchType];
            return el("span", { className: `acp-kw-tag ${cls}`, textContent: m.skill });
          })
        ),
      ]));
    }

    if (data.missing.length > 0) {
      children.push(el("div", { className: "acp-keywords" }, [
        el("div", { className: "acp-kw-title", textContent: "Missing Skills" }),
        el("div", { className: "acp-kw-list" },
          data.missing.slice(0, 5).map(kw =>
            el("span", { className: "acp-kw-tag acp-kw-miss", textContent: kw })
          )
        ),
      ]));
    }

    return children;
  }

  function breakdownBarSvg(value, max, color) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return `<div class="acp-breakdown-bar"><div class="acp-breakdown-fill" style="width:${pct}%;background:${color}"></div></div>`;
  }

  function buildAIBreakdownContent(data) {
    if (!data?.breakdown) return [];

    const categories = [
      { key: "skills", label: "Skills", max: 40, color: "#10b981" },
      { key: "experience", label: "Experience", max: 25, color: "#3b82f6" },
      { key: "keywords", label: "Keywords", max: 15, color: "#8b5cf6" },
      { key: "education", label: "Education", max: 10, color: "#f59e0b" },
      { key: "location", label: "Location", max: 10, color: "#06b6d4" },
    ];

    const children = [
      el("div", { className: "acp-ai-section-title", textContent: "Match Breakdown" }),
      el("div", { className: "acp-breakdown-grid" },
        categories.map(c => {
          const val = data.breakdown[c.key] ?? 0;
          return el("div", { className: "acp-breakdown-row" }, [
            el("span", { className: "acp-breakdown-label", textContent: c.label }),
            el("div", { className: "acp-breakdown-bar-wrap", innerHTML: breakdownBarSvg(val, c.max, c.color) }),
            el("span", { className: "acp-breakdown-val", textContent: `${val}/${c.max}` }),
          ]);
        })
      ),
    ];

    if (data.improvements?.length > 0) {
      children.push(
        el("div", { className: "acp-ai-section-title acp-improve-title", textContent: "Score Boosters" }),
        el("div", { className: "acp-improve-list" },
          data.improvements.slice(0, 3).map(imp =>
            el("div", { className: `acp-improve-item acp-improve-${imp.priority}` }, [
              el("span", { className: "acp-improve-impact", textContent: `+${imp.estimatedImpact}` }),
              el("span", { className: "acp-improve-action", textContent: imp.action }),
            ])
          )
        )
      );
    }

    if (data.missingSkills?.length > 0) {
      children.push(
        el("div", { className: "acp-keywords" }, [
          el("div", { className: "acp-kw-title", textContent: "Missing from JD" }),
          el("div", { className: "acp-kw-list" },
            data.missingSkills.slice(0, 6).map(kw =>
              el("span", { className: "acp-kw-tag acp-kw-miss", textContent: kw })
            )
          ),
        ])
      );
    }

    return children;
  }

  async function rescorePanel(resumeId) {
    if (!currentJobData?.description) return;
    const resume = resumeVersions.find(v => v.id === resumeId);
    if (!resume?.enabled_skills?.length) return;

    const result = await msg("QUICK_SCORE", {
      jobDescription: currentJobData.description,
      skills: resume.enabled_skills,
    });
    if (!result.ok) return;

    scoreData = result.data;
    activeResumeId = resumeId;
    await msg("SET_ACTIVE_RESUME", { resumeId });
    clearHighlightsFromPage();
    injectScorePanel();
    if (highlightActive) {
      highlightKeywordsInPage();
    }
  }

  function createResumeBar() {
    if (resumeVersions.length === 0) return null;

    const active = activeResumeId
      ? resumeVersions.find(v => v.id === activeResumeId)
      : null;
    const name = active?.name || "Default Profile";

    const switchBtn = el("button", {
      className: "acp-rbar-switch",
      textContent: "Switch",
      onClick: (e) => {
        e.stopPropagation();
        const existing = document.querySelector(".acp-rbar-picker");
        if (existing) { existing.remove(); return; }

        const picker = el("div", { className: "acp-rbar-picker" },
          resumeVersions.map(v => {
            const meta = [v.target_role, v.target_company].filter(Boolean).join(" · ");
            return el("div", {
              className: "acp-rbar-item" + (v.id === activeResumeId ? " acp-rbar-active" : ""),
              onClick: () => {
                picker.remove();
                if (v.id !== activeResumeId) rescorePanel(v.id);
              },
            }, [
              el("div", { className: "acp-rbar-info" }, [
                el("div", { className: "acp-rbar-name", textContent: v.name }),
                meta ? el("div", { className: "acp-rbar-meta", textContent: meta }) : null,
              ].filter(Boolean)),
              v.id === activeResumeId ? el("span", { className: "acp-rbar-check", textContent: "✓" }) : null,
            ].filter(Boolean));
          })
        );

        const panel = document.querySelector(".acp-score-panel");
        if (panel) panel.appendChild(picker);
      },
    });

    return el("div", { className: "acp-resume-bar" }, [
      el("span", { className: "acp-rbar-label", textContent: name }),
      switchBtn,
    ]);
  }

  function buildHighlightTerms() {
    if (!scoreData) return { matched: [], missing: [] };

    const matchedTerms = scoreData.matched.map(m => {
      const variants = [m.skill];
      return { terms: variants, matchType: m.matchType };
    });

    const missingTerms = (scoreData.gaps || [])
      .filter(g => g.importance === "critical" || g.importance === "important")
      .map(g => g.keyword);

    return { matched: matchedTerms, missing: missingTerms };
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightKeywordsInPage() {
    const board = window.__acpDetector?.detectBoard();
    if (!board) return;

    const descEl = (() => {
      for (const sel of board.selectors.description) {
        const found = document.querySelector(sel);
        if (found) return found;
      }
      return null;
    })();
    if (!descEl) return;

    clearHighlightsFromPage();

    const { matched, missing } = buildHighlightTerms();

    const patterns = [];
    for (const m of matched) {
      for (const term of m.terms) {
        patterns.push({ regex: new RegExp("\\b" + escapeRegex(term) + "\\b", "gi"), cls: "acp-hl-matched" });
      }
    }
    for (const term of missing) {
      patterns.push({ regex: new RegExp("\\b" + escapeRegex(term) + "\\b", "gi"), cls: "acp-hl-missing" });
    }
    if (patterns.length === 0) return;

    const walker = document.createTreeWalker(descEl, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    for (const textNode of textNodes) {
      if (textNode.parentElement?.closest("mark.acp-hl-matched, mark.acp-hl-missing")) continue;

      const text = textNode.textContent;
      let lastIdx = 0;

      const allMatches = [];
      for (const p of patterns) {
        p.regex.lastIndex = 0;
        let m;
        while ((m = p.regex.exec(text)) !== null) {
          allMatches.push({ start: m.index, end: m.index + m[0].length, text: m[0], cls: p.cls });
        }
      }

      allMatches.sort((a, b) => a.start - b.start || b.end - a.end);

      const merged = [];
      for (const am of allMatches) {
        if (merged.length && am.start < merged[merged.length - 1].end) continue;
        merged.push(am);
      }

      if (merged.length === 0) continue;

      const frag = document.createDocumentFragment();
      for (const am of merged) {
        if (am.start > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, am.start)));
        }
        const mark = document.createElement("mark");
        mark.className = am.cls;
        mark.textContent = am.text;
        frag.appendChild(mark);
        lastIdx = am.end;
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }

      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  function clearHighlightsFromPage() {
    const marks = document.querySelectorAll("mark.acp-hl-matched, mark.acp-hl-missing");
    for (const mark of marks) {
      const parent = mark.parentNode;
      const text = document.createTextNode(mark.textContent);
      parent.replaceChild(text, mark);
      parent.normalize();
    }
  }

  function createHighlightToggle() {
    const { matched, missing } = buildHighlightTerms();
    const total = matched.length + missing.length;

    const btn = el("button", {
      className: "acp-hl-toggle" + (highlightActive ? " acp-hl-active" : ""),
      onClick: () => {
        highlightActive = !highlightActive;
        btn.classList.toggle("acp-hl-active", highlightActive);
        if (highlightActive) {
          highlightKeywordsInPage();
        } else {
          clearHighlightsFromPage();
        }
      },
    }, [
      el("span", {
        className: "acp-hl-toggle-icon",
        innerHTML: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4z"/></svg>`,
      }),
      el("span", { className: "acp-hl-toggle-label", textContent: "Highlight Keywords" }),
      el("span", { className: "acp-hl-toggle-count", textContent: `${total} terms` }),
    ]);

    return btn;
  }

  function createScorePanel() {
    if (!scoreData || !currentJobData) return null;

    const panel = el("div", { className: "acp-score-panel" });

    const closeBtn = el("button", {
      className: "acp-panel-close",
      textContent: "×",
      onClick: () => panel.remove(),
    });
    panel.appendChild(closeBtn);

    const resumeBar = createResumeBar();
    if (resumeBar) panel.appendChild(resumeBar);

    for (const child of buildScorePanelContent(scoreData)) {
      panel.appendChild(child);
    }

    panel.appendChild(createHighlightToggle());

    if (aiMatchData) {
      for (const child of buildAIBreakdownContent(aiMatchData)) {
        panel.appendChild(child);
      }
    }

    return panel;
  }

  function injectFloatingSaveButton() {
    if (document.querySelector(".acp-floating-save")) return;

    const btn = document.createElement("button");
    btn.className = "acp-floating-save";
    btn.title = "Save + Score (⌘⇧S)";
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>`;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentJobData || btn.classList.contains("acp-float-saved")) return;

      btn.classList.add("acp-float-saving");

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
        btn.classList.remove("acp-float-saving");
        btn.classList.add("acp-float-saved");
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>`;
        showSaveToast(currentJobData, scoreData);
        msg("UPDATE_BADGE");
      } else {
        btn.classList.remove("acp-float-saving");
      }
    });

    document.body.appendChild(btn);
  }

  function showSaveToast(jobData, scoreData) {
    const existing = document.querySelector(".acp-save-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "acp-save-toast";

    const scoreMeta = scoreData?.score ? `${scoreData.score}% match · ` : "";

    toast.innerHTML = `
      <div class="acp-toast-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="acp-toast-info">
        <div class="acp-toast-title">Saved to tracker</div>
        <div class="acp-toast-meta">${scoreMeta}${jobData.role} at ${jobData.company}</div>
      </div>
      <a href="#" class="acp-toast-link">View</a>
    `;

    toast.querySelector(".acp-toast-link").addEventListener("click", async (e) => {
      e.preventDefault();
      const configResult = await msg("GET_CONFIG");
      const apiUrl = configResult.ok ? configResult.data.apiUrl : "https://ai-career-pivot.vercel.app";
      window.open(`${apiUrl}/dashboard`, "_blank");
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("acp-toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function injectScorePanel() {
    const existing = document.querySelector(".acp-score-panel");
    if (existing) existing.remove();

    const panel = createScorePanel();
    if (panel) document.body.appendChild(panel);
  }

  async function onJobDetected(e) {
    const { jobData, board } = e.detail;

    clearHighlightsFromPage();
    currentJobData = jobData;

    const configResult = await msg("GET_CONFIG");
    if (!configResult.ok || !configResult.data.userEmail) return;

    const [savedResult, scoreResult, versionsResult, activeResult] = await Promise.all([
      msg("CHECK_SAVED", { url: jobData.url }),
      jobData.description
        ? msg("QUICK_SCORE", { jobDescription: jobData.description })
        : Promise.resolve({ ok: true, data: null }),
      msg("GET_RESUME_VERSIONS"),
      msg("GET_ACTIVE_RESUME"),
    ]);

    if (savedResult.ok && savedResult.data) {
      savedJob = savedResult.data;
    }
    if (scoreResult.ok && scoreResult.data) {
      scoreData = scoreResult.data;
    }
    if (versionsResult.ok && versionsResult.data?.versions) {
      resumeVersions = versionsResult.data.versions.filter(
        (v) => v.enabled_skills?.length > 0
      );
    }
    if (activeResult.ok) {
      activeResumeId = activeResult.data?.activeResumeId || null;
    }

    injectFloatingSaveButton();
    if (savedJob) {
      const floatBtn = document.querySelector(".acp-floating-save");
      if (floatBtn) {
        floatBtn.classList.add("acp-float-saved");
        floatBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>`;
      }
    }
    if (scoreData && scoreData.score > 0) {
      injectScorePanel();
      if (highlightActive) {
        highlightKeywordsInPage();
      }
    }

    if (jobData.description) {
      msg("AI_MATCH", {
        jobDescription: jobData.description,
        jobTitle: jobData.role || "",
        jobLocation: jobData.location || "",
        isRemote: /remote/i.test(jobData.location || ""),
      }).then((result) => {
        if (result.ok && result.data) {
          aiMatchData = result.data;
          if (scoreData && scoreData.score > 0) {
            injectScorePanel();
          }
        }
      });
    }
  }

  window.addEventListener("acp-job-detected", onJobDetected);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TRIGGER_SAVE") {
      const btn = document.querySelector(".acp-floating-save");
      if (btn && !btn.classList.contains("acp-float-saved")) btn.click();
    }
  });
})();
