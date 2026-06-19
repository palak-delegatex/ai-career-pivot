(() => {
  "use strict";

  const DEFAULT_API_URL = "https://ai-career-pivot.vercel.app";
  let optimizeData = null;
  let panelVisible = false;

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
    if (score >= 60) return "#2dd4bf";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  function scoreRingSvg(score, size = 64) {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);
    const color = scoreColor(score);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="LinkedIn optimization score: ${score} percent">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#334155" stroke-width="3"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="3"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"
        style="transition: stroke-dashoffset 0.6s ease"/>
      <text x="${size / 2}" y="${size / 2 + 1}" text-anchor="middle" dominant-baseline="central"
        fill="${color}" font-size="${size * 0.28}px" font-weight="700" font-family="system-ui">${score}</text>
    </svg>`;
  }

  function isOwnProfile() {
    const editBtn = document.querySelector(
      'button[aria-label*="Edit intro"], button.profile-edit-btn, ' +
      'a[href*="/edit/"], section.artdeco-card button svg[data-test-icon="pencil"]'
    );
    if (editBtn) return true;

    const openToWork = document.querySelector(
      '.pv-open-to-carousel, [data-test-id="open-to-work"]'
    );
    if (openToWork) return true;

    const addSection = document.querySelector(
      'button[aria-label="Add profile section"]'
    );
    return !!addSection;
  }

  function extractProfileData() {
    const headline = document.querySelector(
      ".text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint h2"
    )?.textContent?.trim() || "";

    const summary = document.querySelector(
      '#about ~ div .pv-shared-text-with-see-more span[aria-hidden="true"], ' +
      'section.pv-about-section .pv-about__summary-text'
    )?.textContent?.trim() || "";

    const experienceItems = document.querySelectorAll(
      '#experience ~ div .pvs-list__paged-list-item, ' +
      'section#experience-section .pv-position-entity'
    );
    const experience = [];
    experienceItems.forEach((item) => {
      const title = item.querySelector(
        '.mr1.hoverable-link-text span[aria-hidden="true"], ' +
        '.pv-entity__summary-info h3'
      )?.textContent?.trim() || "";
      const company = item.querySelector(
        '.t-14.t-normal span[aria-hidden="true"], ' +
        '.pv-entity__secondary-title'
      )?.textContent?.trim() || "";
      const desc = item.querySelector(
        '.pvs-list__outer-container .pv-shared-text-with-see-more span[aria-hidden="true"]'
      )?.textContent?.trim() || "";
      if (title) experience.push({ title, company, description: desc });
    });

    const skillEls = document.querySelectorAll(
      '#skills ~ div .pvs-list__paged-list-item span[aria-hidden="true"], ' +
      'section.pv-skill-categories-section .pv-skill-category-entity__name-text'
    );
    const skills = [];
    skillEls.forEach((s) => {
      const text = s.textContent?.trim();
      if (text && !skills.includes(text)) skills.push(text);
    });

    return { headline, summary, experience, skills };
  }

  // --- Score badge (injected next to profile name) ---

  function injectScoreBadge(score) {
    if (document.querySelector(".acp-li-score-badge")) return;

    const headlineEl = document.querySelector(
      ".text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint"
    );
    if (!headlineEl) return;

    const badge = el("span", {
      className: "acp-li-score-badge",
      innerHTML: scoreRingSvg(score, 32),
      onClick: () => {
        if (!panelVisible) {
          panelVisible = true;
          document.body.appendChild(createPanel());
        }
      },
    });
    badge.title = `LinkedIn score: ${score}/100 — click to see details`;

    headlineEl.parentNode.insertBefore(badge, headlineEl.nextSibling);
  }

  // --- Section score dots ---

  const SECTION_SELECTORS = {
    Headline: 'div.text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint',
    Summary: '#about, section.pv-about-section',
    Experience: '#experience, section#experience-section',
    Skills: '#skills, section.pv-skill-categories-section',
    Education: '#education, section#education-section',
  };

  function injectSectionDots() {
    if (!optimizeData) return;

    for (const section of optimizeData.sectionScores) {
      const selectors = SECTION_SELECTORS[section.section];
      if (!selectors) continue;

      const target = document.querySelector(selectors);
      if (!target || target.querySelector(".acp-li-section-dot")) continue;

      const headerEl = target.querySelector("h2, .pvs-header__title span, .pv-profile-card-anchor") || target;

      const dot = el("span", {
        className: "acp-li-section-dot",
        onClick: (e) => {
          e.stopPropagation();
          showInlineSuggestion(target, section);
        },
      });
      dot.style.backgroundColor = scoreColor(section.score);
      dot.title = `${section.section}: ${section.score}/100 — click for suggestion`;

      if (headerEl.parentNode) {
        headerEl.parentNode.insertBefore(dot, headerEl.nextSibling);
      }
    }
  }

  function showInlineSuggestion(target, section) {
    const existing = document.querySelector(".acp-li-suggestion-tooltip");
    if (existing) existing.remove();

    const tip = el("div", { className: "acp-li-suggestion-tooltip" });

    const titleRow = el("div", { className: "acp-li-tooltip-title-row" });
    const titleSpan = el("span", {
      className: "acp-li-tooltip-title",
      textContent: `${section.section} — ${section.scoreLabel}`,
    });
    titleSpan.style.color = scoreColor(section.score);
    titleRow.appendChild(titleSpan);

    const dismissBtn = el("button", {
      className: "acp-li-tooltip-dismiss",
      textContent: "×",
      onClick: () => tip.remove(),
    });
    titleRow.appendChild(dismissBtn);
    tip.appendChild(titleRow);

    const suggestionText = section.suggested.slice(0, 200) + (section.suggested.length > 200 ? "..." : "");
    tip.appendChild(el("div", {
      className: "acp-li-tooltip-suggestion",
      textContent: suggestionText,
    }));

    const copyBtn = el("button", {
      className: "acp-li-tooltip-copy",
      textContent: "Copy Suggestion",
      onClick: () => {
        navigator.clipboard.writeText(section.suggested);
        copyBtn.textContent = "Copied!";
        copyBtn.style.color = "#10b981";
        setTimeout(() => {
          copyBtn.textContent = "Copy Suggestion";
          copyBtn.style.color = "";
        }, 2000);
      },
    });
    tip.appendChild(copyBtn);

    target.style.position = target.style.position || "relative";
    target.appendChild(tip);
    tip.style.top = "0";
    tip.style.right = "-340px";
  }

  // --- Optimizer panel ---

  function createPanel() {
    const existing = document.querySelector(".acp-li-optimizer-panel");
    if (existing) existing.remove();

    const panel = el("div", { className: "acp-li-optimizer-panel" });

    const closeBtn = el("button", {
      className: "acp-li-panel-close",
      textContent: "×",
      onClick: () => { panel.remove(); panelVisible = false; },
    });
    panel.appendChild(closeBtn);

    if (!optimizeData) {
      const loading = el("div", { className: "acp-li-panel-loading" });
      loading.appendChild(el("div", { className: "acp-li-panel-loading-title", textContent: "LinkedIn Optimizer" }));
      loading.appendChild(el("div", { className: "acp-li-panel-loading-subtitle", textContent: "Analyzing your profile..." }));
      loading.appendChild(el("div", { className: "acp-li-panel-spinner" }));
      panel.appendChild(loading);
      return panel;
    }

    const data = optimizeData;

    const header = el("div", { className: "acp-li-opt-header" });
    header.appendChild(el("div", { innerHTML: scoreRingSvg(data.overallScore, 56) }));
    const meta = el("div");
    const label = el("div", {
      className: "acp-li-opt-label",
      textContent: data.overallLabel,
    });
    label.style.color = scoreColor(data.overallScore);
    meta.appendChild(label);
    const summaryText = data.bridgeStorySummary.slice(0, 80) + (data.bridgeStorySummary.length > 80 ? "..." : "");
    meta.appendChild(el("div", { className: "acp-li-opt-summary", textContent: summaryText }));
    header.appendChild(meta);
    panel.appendChild(header);

    const sectionList = el("div", { className: "acp-li-section-list" });
    for (const s of data.sectionScores) {
      const row = el("div", { className: "acp-li-section-row" });

      const left = el("div", { className: "acp-li-section-left" });
      const dot = el("span", { className: "acp-li-section-dot-panel" });
      dot.style.backgroundColor = scoreColor(s.score);
      left.appendChild(dot);
      left.appendChild(el("span", { className: "acp-li-section-name", textContent: s.section }));
      row.appendChild(left);

      const scoreEl = el("span", { className: "acp-li-section-score", textContent: `${s.score}` });
      scoreEl.style.color = scoreColor(s.score);
      row.appendChild(scoreEl);

      sectionList.appendChild(row);
    }
    panel.appendChild(sectionList);

    if (data.quickWins?.length > 0) {
      panel.appendChild(el("div", { className: "acp-li-qw-title", textContent: "Quick Wins" }));
      for (const win of data.quickWins.slice(0, 3)) {
        panel.appendChild(el("div", { className: "acp-li-qw-item", textContent: win }));
      }
    }

    const cta = el("a", {
      className: "acp-li-cta",
      textContent: "Full Analysis →",
      href: `${DEFAULT_API_URL}/linkedin-optimizer`,
    });
    cta.target = "_blank";
    panel.appendChild(cta);

    return panel;
  }

  // --- Trigger button ---

  function injectTriggerButton() {
    if (document.querySelector(".acp-li-trigger-btn")) return;

    const btn = el("button", {
      className: "acp-li-trigger-btn",
      innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> <span>Optimize Profile</span>`,
    });

    btn.addEventListener("click", async () => {
      if (panelVisible) {
        const panel = document.querySelector(".acp-li-optimizer-panel");
        if (panel) { panel.remove(); panelVisible = false; return; }
      }

      panelVisible = true;
      document.body.appendChild(createPanel());

      if (!optimizeData) {
        const profileData = extractProfileData();

        const result = await msg("LINKEDIN_OPTIMIZE", {
          profileData,
          targetRole: profileData.headline || "Professional",
        });

        if (result.ok && result.data) {
          optimizeData = result.data;
          const panel = document.querySelector(".acp-li-optimizer-panel");
          if (panel) {
            panel.remove();
            document.body.appendChild(createPanel());
          }
          injectScoreBadge(optimizeData.overallScore);
          injectSectionDots();
        } else {
          const panel = document.querySelector(".acp-li-optimizer-panel");
          if (panel) {
            panel.innerHTML = "";
            const closeBtn = el("button", {
              className: "acp-li-panel-close",
              textContent: "×",
              onClick: () => { panel.remove(); panelVisible = false; },
            });
            panel.appendChild(closeBtn);

            const errorDiv = el("div", { className: "acp-li-panel-error" });
            errorDiv.appendChild(el("div", { className: "acp-li-panel-error-title", textContent: "Optimization Failed" }));
            errorDiv.appendChild(el("div", {
              className: "acp-li-panel-error-msg",
              textContent: result.error || "Please try again or use the full analysis page.",
            }));
            const link = el("a", {
              className: "acp-li-panel-error-link",
              textContent: "Open Full Analysis →",
              href: `${DEFAULT_API_URL}/linkedin-optimizer`,
            });
            link.target = "_blank";
            errorDiv.appendChild(link);
            panel.appendChild(errorDiv);
          }
        }
      }
    });

    document.body.appendChild(btn);
  }

  // --- Background preload for score badge ---

  async function preloadOptimizeData() {
    const profileData = extractProfileData();

    const result = await msg("LINKEDIN_OPTIMIZE", {
      profileData,
      targetRole: profileData.headline || "Professional",
    });

    if (result.ok && result.data) {
      optimizeData = result.data;
      injectScoreBadge(optimizeData.overallScore);
      injectSectionDots();
    }
  }

  // --- Init ---

  async function init() {
    const configResult = await msg("GET_CONFIG");
    if (!configResult.ok || !configResult.data.userEmail) return;

    await new Promise((r) => setTimeout(r, 500));

    if (!isOwnProfile()) return;

    injectTriggerButton();
    preloadOptimizeData();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
