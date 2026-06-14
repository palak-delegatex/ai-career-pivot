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
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
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

  function createPanel() {
    const existing = document.querySelector(".acp-li-optimizer-panel");
    if (existing) existing.remove();

    const panel = el("div", { className: "acp-li-optimizer-panel" });

    Object.assign(panel.style, {
      position: "fixed",
      top: "80px",
      right: "16px",
      width: "360px",
      maxHeight: "calc(100vh - 100px)",
      overflowY: "auto",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "16px",
      padding: "20px",
      zIndex: "9999",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#e2e8f0",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      fontSize: "13px",
      lineHeight: "1.5",
    });

    const closeBtn = el("button", {
      textContent: "×",
      onClick: () => { panel.remove(); panelVisible = false; },
    });
    Object.assign(closeBtn.style, {
      position: "absolute", top: "12px", right: "12px",
      background: "none", border: "none", color: "#94a3b8",
      fontSize: "20px", cursor: "pointer", padding: "4px",
    });
    panel.appendChild(closeBtn);

    if (!optimizeData) {
      panel.appendChild(el("div", {
        innerHTML: `
          <div style="text-align:center;padding:24px 0">
            <div style="color:#2dd4bf;font-weight:700;font-size:15px;margin-bottom:8px">LinkedIn Optimizer</div>
            <div style="color:#94a3b8;font-size:12px;margin-bottom:16px">Analyzing your profile...</div>
            <div style="width:32px;height:32px;border:3px solid #334155;border-top-color:#2dd4bf;border-radius:50%;animation:acp-spin 1s linear infinite;margin:0 auto"></div>
          </div>
          <style>@keyframes acp-spin{to{transform:rotate(360deg)}}</style>
        `,
      }));
      return panel;
    }

    const data = optimizeData;

    // Score header
    const header = el("div", { className: "acp-opt-header" });
    Object.assign(header.style, {
      display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px",
    });
    header.appendChild(el("div", { innerHTML: scoreRingSvg(data.overallScore, 56) }));
    const meta = el("div", {});
    meta.appendChild(el("div", {
      textContent: data.overallLabel,
      className: "acp-opt-label",
    }));
    Object.assign(meta.lastChild.style, {
      fontWeight: "700", fontSize: "15px", color: scoreColor(data.overallScore),
    });
    meta.appendChild(el("div", {
      textContent: data.bridgeStorySummary.slice(0, 80) + (data.bridgeStorySummary.length > 80 ? "..." : ""),
    }));
    Object.assign(meta.lastChild.style, { fontSize: "11px", color: "#94a3b8", marginTop: "2px" });
    header.appendChild(meta);
    panel.appendChild(header);

    // Section scores
    const sectionList = el("div", {});
    Object.assign(sectionList.style, { marginBottom: "16px" });
    for (const s of data.sectionScores) {
      const row = el("div", {});
      Object.assign(row.style, {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 0", borderBottom: "1px solid #1e293b",
      });
      const left = el("div", {});
      Object.assign(left.style, { display: "flex", alignItems: "center", gap: "8px" });
      const dot = el("span", {});
      Object.assign(dot.style, {
        width: "8px", height: "8px", borderRadius: "50%",
        backgroundColor: scoreColor(s.score), flexShrink: "0",
      });
      left.appendChild(dot);
      left.appendChild(el("span", { textContent: s.section }));
      Object.assign(left.lastChild.style, { fontSize: "12px" });
      row.appendChild(left);
      row.appendChild(el("span", {
        textContent: `${s.score}`,
      }));
      Object.assign(row.lastChild.style, {
        fontSize: "12px", fontWeight: "600", color: scoreColor(s.score),
      });
      sectionList.appendChild(row);
    }
    panel.appendChild(sectionList);

    // Quick wins
    if (data.quickWins?.length > 0) {
      const qwTitle = el("div", { textContent: "Quick Wins" });
      Object.assign(qwTitle.style, {
        fontWeight: "700", fontSize: "12px", color: "#fbbf24",
        marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em",
      });
      panel.appendChild(qwTitle);

      for (const win of data.quickWins.slice(0, 3)) {
        const item = el("div", { textContent: win });
        Object.assign(item.style, {
          fontSize: "11px", color: "#cbd5e1", padding: "6px 8px",
          backgroundColor: "#1a1f2e", borderRadius: "8px", marginBottom: "4px",
          borderLeft: "2px solid #fbbf24",
        });
        panel.appendChild(item);
      }
    }

    // Full Analysis CTA
    const cta = el("a", {
      textContent: "Full Analysis →",
      href: `${DEFAULT_API_URL}/linkedin-optimizer`,
    });
    Object.assign(cta.style, {
      display: "block", textAlign: "center", marginTop: "16px",
      padding: "10px", borderRadius: "10px", fontWeight: "700",
      fontSize: "13px", color: "#fff", textDecoration: "none",
      background: "linear-gradient(135deg, #0d9488, #059669)",
    });
    cta.target = "_blank";
    panel.appendChild(cta);

    return panel;
  }

  function createTooltip(section) {
    const existing = document.querySelector(".acp-li-suggestion-tooltip");
    if (existing) existing.remove();

    const tip = el("div", { className: "acp-li-suggestion-tooltip" });
    Object.assign(tip.style, {
      position: "absolute",
      zIndex: "10000",
      width: "320px",
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "12px",
      padding: "14px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#e2e8f0",
      fontSize: "12px",
      lineHeight: "1.5",
    });

    const titleRow = el("div", {});
    Object.assign(titleRow.style, {
      display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px",
    });
    titleRow.appendChild(el("span", {
      textContent: `${section.section} — ${section.scoreLabel}`,
    }));
    Object.assign(titleRow.firstChild.style, { fontWeight: "700", color: scoreColor(section.score) });

    const dismissBtn = el("button", {
      textContent: "×",
      onClick: () => tip.remove(),
    });
    Object.assign(dismissBtn.style, {
      background: "none", border: "none", color: "#94a3b8",
      fontSize: "16px", cursor: "pointer", padding: "2px",
    });
    titleRow.appendChild(dismissBtn);
    tip.appendChild(titleRow);

    tip.appendChild(el("div", { textContent: section.suggested.slice(0, 200) + (section.suggested.length > 200 ? "..." : "") }));
    Object.assign(tip.lastChild.style, {
      color: "#94d8b8", fontSize: "11px", marginBottom: "10px",
      backgroundColor: "#0f2922", padding: "8px", borderRadius: "8px",
    });

    const copyBtn = el("button", {
      textContent: "Copy Suggestion",
      onClick: () => {
        navigator.clipboard.writeText(section.suggested);
        copyBtn.textContent = "Copied!";
        copyBtn.style.color = "#10b981";
        setTimeout(() => {
          copyBtn.textContent = "Copy Suggestion";
          copyBtn.style.color = "#2dd4bf";
        }, 2000);
      },
    });
    Object.assign(copyBtn.style, {
      background: "none", border: "1px solid #2dd4bf", color: "#2dd4bf",
      padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
      fontSize: "11px", fontWeight: "600",
    });
    tip.appendChild(copyBtn);

    return tip;
  }

  function attachSectionTooltips() {
    if (!optimizeData) return;

    const sectionMap = {
      Headline: 'div.text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint',
      Summary: '#about, section.pv-about-section',
      Experience: '#experience, section#experience-section',
      Skills: '#skills, section.pv-skill-categories-section',
      Education: '#education, section#education-section',
    };

    for (const section of optimizeData.sectionScores) {
      const selectors = sectionMap[section.section];
      if (!selectors) continue;

      const target = document.querySelector(selectors);
      if (!target) continue;
      if (target.dataset.acpOptimizer) continue;
      target.dataset.acpOptimizer = "true";

      Object.assign(target.style, { position: "relative" });

      target.addEventListener("mouseenter", () => {
        const tip = createTooltip(section);
        target.appendChild(tip);
        tip.style.top = "0";
        tip.style.right = "-340px";
      });

      target.addEventListener("mouseleave", (e) => {
        const tip = target.querySelector(".acp-li-suggestion-tooltip");
        if (tip && !tip.contains(e.relatedTarget)) {
          setTimeout(() => {
            if (!tip.matches(":hover")) tip.remove();
          }, 200);
        }
      });
    }
  }

  function injectTriggerButton() {
    if (document.querySelector(".acp-li-optimize-trigger")) return;

    const btn = el("button", {
      className: "acp-li-optimize-trigger",
      innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> <span>Optimize Profile</span>`,
    });

    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "9998",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 18px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #0d9488, #059669)",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "700",
      fontFamily: "system-ui, -apple-system, sans-serif",
      cursor: "pointer",
      boxShadow: "0 8px 24px rgba(13,148,136,0.4)",
      transition: "transform 0.15s, box-shadow 0.15s",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 12px 32px rgba(13,148,136,0.5)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 8px 24px rgba(13,148,136,0.4)";
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
        const targetRole = ""; // user sets in the full analysis page

        const result = await msg("LINKEDIN_OPTIMIZE", {
          profileData,
          targetRole: targetRole || profileData.headline || "Professional",
        });

        if (result.ok && result.data) {
          optimizeData = result.data;
          const panel = document.querySelector(".acp-li-optimizer-panel");
          if (panel) {
            panel.remove();
            document.body.appendChild(createPanel());
          }
          attachSectionTooltips();
        } else {
          const panel = document.querySelector(".acp-li-optimizer-panel");
          if (panel) {
            panel.innerHTML = `
              <div style="text-align:center;padding:24px;color:#f87171">
                <div style="font-weight:700;margin-bottom:8px">Optimization Failed</div>
                <div style="font-size:11px;color:#94a3b8">${result.error || "Please try again or use the full analysis page."}</div>
                <a href="${DEFAULT_API_URL}/linkedin-optimizer" target="_blank"
                   style="display:inline-block;margin-top:12px;color:#2dd4bf;font-size:12px;font-weight:600;text-decoration:none">
                  Open Full Analysis →
                </a>
              </div>
            `;
          }
        }
      }
    });

    document.body.appendChild(btn);
  }

  async function init() {
    const configResult = await msg("GET_CONFIG");
    if (!configResult.ok || !configResult.data.userEmail) return;

    await new Promise((r) => setTimeout(r, 2000));

    if (!isOwnProfile()) return;

    injectTriggerButton();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
