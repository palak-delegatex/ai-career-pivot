(() => {
  "use strict";

  const DEFAULT_API_URL = "https://ai-career-pivot.vercel.app";
  let localScoreData = null;
  let aiOptimizeData = null;
  let panelVisible = false;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

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

  function scoreLabel(score) {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Weak";
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

  // ---------------------------------------------------------------------------
  // Profile detection
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Profile extraction
  // ---------------------------------------------------------------------------

  function extractProfileData() {
    const headline = document.querySelector(
      ".text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint h2"
    )?.textContent?.trim() || "";

    const summary = document.querySelector(
      '#about ~ div .pv-shared-text-with-see-more span[aria-hidden="true"], ' +
      'section.pv-about-section .pv-about__summary-text, ' +
      '#about ~ div .inline-show-more-text span[aria-hidden="true"]'
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

    const educationItems = document.querySelectorAll(
      '#education ~ div .pvs-list__paged-list-item, ' +
      'section#education-section .pv-education-entity'
    );
    const education = [];
    educationItems.forEach((item) => {
      const institution = item.querySelector(
        '.mr1.hoverable-link-text span[aria-hidden="true"], ' +
        '.pv-entity__school-name'
      )?.textContent?.trim() || "";
      const degreeField = item.querySelector(
        '.t-14.t-normal span[aria-hidden="true"], ' +
        '.pv-entity__degree-name'
      )?.textContent?.trim() || "";
      if (institution) education.push({ institution, degreeField });
    });

    return { headline, summary, experience, skills, education };
  }

  // ---------------------------------------------------------------------------
  // Client-side scoring engine
  // ---------------------------------------------------------------------------

  const SECTION_WEIGHTS = {
    headline: 0.20,
    summary: 0.25,
    experience: 0.25,
    skills: 0.15,
    education: 0.15,
  };

  const ROLE_KEYWORDS = {
    "software engineer": ["python", "javascript", "react", "node.js", "aws", "docker", "kubernetes", "sql", "git", "agile", "ci/cd", "typescript", "api", "microservices", "cloud"],
    "data scientist": ["python", "machine learning", "sql", "tensorflow", "pytorch", "statistics", "data visualization", "pandas", "scikit-learn", "deep learning", "nlp", "r", "jupyter", "a/b testing", "big data"],
    "product manager": ["roadmap", "stakeholder", "agile", "scrum", "user research", "analytics", "strategy", "prioritization", "cross-functional", "metrics", "kpi", "market research", "wireframe", "go-to-market", "user stories"],
    "designer": ["figma", "sketch", "user research", "prototyping", "wireframing", "design systems", "typography", "accessibility", "usability testing", "responsive design", "adobe creative suite", "interaction design", "visual design", "information architecture"],
    "marketing": ["seo", "content strategy", "google analytics", "social media", "email marketing", "crm", "hubspot", "copywriting", "brand strategy", "paid media", "conversion rate", "a/b testing", "content marketing", "marketing automation"],
    "project manager": ["pmp", "agile", "scrum", "stakeholder management", "risk management", "budgeting", "gantt", "jira", "resource planning", "cross-functional", "waterfall", "sprint planning", "milestone tracking", "change management"],
    "sales": ["crm", "salesforce", "pipeline", "cold calling", "negotiation", "b2b", "b2c", "lead generation", "account management", "quota", "forecasting", "prospecting", "closing", "relationship building"],
    "default": ["leadership", "communication", "problem-solving", "teamwork", "project management", "analytics", "strategy", "collaboration", "presentation", "data-driven"],
  };

  function detectRoleCategory(headline) {
    const h = headline.toLowerCase();
    if (/software|developer|engineer|full.?stack|front.?end|back.?end|devops|sre|platform/i.test(h)) return "software engineer";
    if (/data scien|machine learn|ml engineer|ai engineer|deep learning/i.test(h)) return "data scientist";
    if (/product manag|product lead|pm\b|product own/i.test(h)) return "product manager";
    if (/design|ux|ui|creative director|visual|interaction/i.test(h)) return "designer";
    if (/market|growth|seo|content|brand|digital market/i.test(h)) return "marketing";
    if (/project manag|program manag|pmo|scrum master/i.test(h)) return "project manager";
    if (/sales|business develop|account exec|revenue|sdr|bdr/i.test(h)) return "sales";
    return "default";
  }

  function hasQuantifiedAchievements(text) {
    return /\d+%|\$[\d,]+|\d+[xX]|\d+\+|\d+ (?:million|billion|thousand|users|customers|clients|projects|teams|revenue|growth)/i.test(text);
  }

  function scoreHeadline(headline) {
    if (!headline) return { score: 0, tips: ["Add a headline — it's the first thing recruiters see"], status: "missing" };
    const tips = [];
    let score = 40;

    const words = headline.split(/\s+/).length;
    if (words >= 5) score += 15;
    else tips.push("Expand your headline — aim for 5+ descriptive words");

    if (words >= 8) score += 10;

    if (/\||•|·|—|,/.test(headline)) score += 10;
    else tips.push("Use separators (| or ·) to list multiple strengths");

    const hasKeywords = /engineer|developer|manager|lead|director|specialist|analyst|designer|consultant|scientist|architect/i.test(headline);
    if (hasKeywords) score += 15;
    else tips.push("Include your target job title so recruiters find you in search");

    if (headline.length > 120) score += 10;

    if (/helping|passionate|driven|results/i.test(headline)) score += 5;

    score = Math.min(100, score);
    return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
  }

  function scoreSummary(summary) {
    if (!summary) return { score: 0, tips: ["Add an About section — this is your personal pitch"], status: "missing" };
    const tips = [];
    let score = 30;

    if (summary.length >= 100) score += 10;
    if (summary.length >= 300) score += 10;
    else tips.push("Expand your About section — aim for 300+ characters for better recruiter engagement");

    if (summary.length >= 500) score += 5;

    if (hasQuantifiedAchievements(summary)) score += 15;
    else tips.push("Add metrics and numbers (e.g., 'led a team of 12', 'grew revenue 40%')");

    const paragraphs = summary.split(/\n\s*\n/).length;
    if (paragraphs >= 2) score += 10;
    else tips.push("Break your About into paragraphs — wall-of-text gets skipped");

    if (/\b(email|reach out|contact|connect|let's talk|open to)\b/i.test(summary)) score += 10;
    else tips.push("End with a call-to-action (e.g., 'Open to opportunities in...' or 'Reach out at...')");

    if (summary.split(/\s+/).length >= 50) score += 10;

    score = Math.min(100, score);
    return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
  }

  function scoreExperience(experience) {
    if (!experience || experience.length === 0) return { score: 0, tips: ["Add your work experience — this is the most important section for recruiters"], status: "missing" };
    const tips = [];
    let score = 30;

    if (experience.length >= 2) score += 10;
    if (experience.length >= 4) score += 5;

    const withDescriptions = experience.filter((e) => e.description && e.description.length > 30);
    const descRatio = withDescriptions.length / experience.length;
    if (descRatio >= 0.8) score += 15;
    else if (descRatio >= 0.5) score += 8;

    const thinEntries = experience.filter((e) => !e.description || e.description.length < 50);
    if (thinEntries.length > 0) {
      const names = thinEntries.slice(0, 2).map((e) => e.title || "an entry").join(", ");
      tips.push(`Add descriptions to: ${names} — thin entries hurt your score`);
    }

    const withMetrics = experience.filter((e) => hasQuantifiedAchievements(e.description || ""));
    if (withMetrics.length >= 2) score += 15;
    else if (withMetrics.length >= 1) score += 8;
    else tips.push("Add quantified achievements to your experience (numbers, percentages, dollar amounts)");

    const avgDescLen = withDescriptions.reduce((sum, e) => sum + e.description.length, 0) / (withDescriptions.length || 1);
    if (avgDescLen >= 150) score += 10;
    else if (avgDescLen >= 80) score += 5;

    if (/\b(led|managed|built|launched|designed|developed|increased|reduced|improved|created|implemented|drove|spearheaded|orchestrated)\b/i.test(experience.map((e) => e.description).join(" "))) {
      score += 10;
    } else {
      tips.push("Use strong action verbs: led, built, launched, increased, reduced, improved");
    }

    score = Math.min(100, score);
    return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
  }

  function scoreSkills(skills) {
    if (!skills || skills.length === 0) return { score: 0, tips: ["Add skills — recruiters filter candidates by skills"], status: "missing" };
    const tips = [];
    let score = 30;

    if (skills.length >= 5) score += 15;
    if (skills.length >= 10) score += 15;
    else tips.push(`Add more skills — you have ${skills.length}, aim for 10+`);

    if (skills.length >= 15) score += 10;
    if (skills.length >= 20) score += 10;

    if (skills.length >= 30) score += 10;

    if (skills.length < 5) tips.push("Listing at least 5 skills significantly boosts recruiter search visibility");

    score = Math.min(100, score);
    return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
  }

  function scoreEducation(education) {
    if (!education || education.length === 0) return { score: 0, tips: ["Add education or certifications — many recruiters filter by this"], status: "missing" };
    const tips = [];
    let score = 50;

    if (education.length >= 1) score += 20;
    if (education.length >= 2) score += 10;

    const withDegree = education.filter((e) => e.degreeField && e.degreeField.length > 3);
    if (withDegree.length > 0) score += 20;
    else tips.push("Add degree and field of study to your education entries");

    score = Math.min(100, score);
    return { score, tips, status: tips.length === 0 ? "strong" : "improvable" };
  }

  function suggestKeywords(profileData) {
    const category = detectRoleCategory(profileData.headline);
    const keywords = ROLE_KEYWORDS[category] || ROLE_KEYWORDS["default"];

    const profileText = [
      profileData.headline,
      profileData.summary,
      ...profileData.experience.map((e) => `${e.title} ${e.description}`),
      ...profileData.skills,
    ].join(" ").toLowerCase();

    const missing = [];
    const present = [];
    for (const kw of keywords) {
      if (profileText.includes(kw.toLowerCase())) {
        present.push(kw);
      } else {
        missing.push(kw);
      }
    }

    return { category, missing, present, total: keywords.length };
  }

  function computeLocalScore(profileData) {
    const sections = {
      headline: scoreHeadline(profileData.headline),
      summary: scoreSummary(profileData.summary),
      experience: scoreExperience(profileData.experience),
      skills: scoreSkills(profileData.skills),
      education: scoreEducation(profileData.education),
    };

    let weightedSum = 0;
    for (const [key, data] of Object.entries(sections)) {
      weightedSum += data.score * SECTION_WEIGHTS[key];
    }
    const overallScore = Math.round(weightedSum);

    const keywords = suggestKeywords(profileData);

    const missingSections = Object.entries(sections)
      .filter(([, data]) => data.status === "missing")
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

    const allTips = [];
    for (const [, data] of Object.entries(sections)) {
      allTips.push(...data.tips);
    }

    return {
      overallScore,
      overallLabel: scoreLabel(overallScore),
      sections,
      keywords,
      missingSections,
      quickWins: allTips.slice(0, 5),
      allTips,
    };
  }

  // ---------------------------------------------------------------------------
  // UI: Side panel
  // ---------------------------------------------------------------------------

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
      zIndex: "2147483647",
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

    if (!localScoreData) {
      panel.appendChild(el("div", {
        innerHTML: `
          <div style="text-align:center;padding:24px 0">
            <div style="color:#2dd4bf;font-weight:700;font-size:15px;margin-bottom:8px">LinkedIn Profile Score</div>
            <div style="color:#94a3b8;font-size:12px;margin-bottom:16px">Analyzing your profile...</div>
            <div style="width:32px;height:32px;border:3px solid #334155;border-top-color:#2dd4bf;border-radius:50%;animation:acp-spin 1s linear infinite;margin:0 auto"></div>
          </div>
          <style>@keyframes acp-spin{to{transform:rotate(360deg)}}</style>
        `,
      }));
      return panel;
    }

    const data = localScoreData;

    // --- Score header ---
    const header = el("div", {});
    Object.assign(header.style, {
      display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px",
    });
    header.appendChild(el("div", { innerHTML: scoreRingSvg(data.overallScore, 56) }));
    const meta = el("div", {});
    meta.appendChild(el("div", {
      textContent: `Profile Score: ${data.overallLabel}`,
    }));
    Object.assign(meta.lastChild.style, {
      fontWeight: "700", fontSize: "15px", color: scoreColor(data.overallScore),
    });
    const subtitle = data.missingSections.length > 0
      ? `Missing: ${data.missingSections.join(", ")}`
      : "All sections present";
    meta.appendChild(el("div", { textContent: subtitle }));
    Object.assign(meta.lastChild.style, {
      fontSize: "11px",
      color: data.missingSections.length > 0 ? "#f59e0b" : "#94a3b8",
      marginTop: "2px",
    });
    header.appendChild(meta);
    panel.appendChild(header);

    // --- Section scores ---
    const sectionOrder = ["headline", "summary", "experience", "skills", "education"];
    const sectionLabels = { headline: "Headline", summary: "About", experience: "Experience", skills: "Skills", education: "Education" };

    const sectionList = el("div", {});
    Object.assign(sectionList.style, { marginBottom: "16px" });

    for (const key of sectionOrder) {
      const s = data.sections[key];
      const row = el("div", {});
      Object.assign(row.style, {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 0", borderBottom: "1px solid rgba(51,65,85,0.5)",
      });

      const left = el("div", {});
      Object.assign(left.style, { display: "flex", alignItems: "center", gap: "8px" });

      const dot = el("span", {});
      Object.assign(dot.style, {
        width: "8px", height: "8px", borderRadius: "50%",
        backgroundColor: s.status === "missing" ? "#ef4444" : scoreColor(s.score),
        flexShrink: "0",
      });
      left.appendChild(dot);

      const labelText = sectionLabels[key] + (s.status === "missing" ? " (Missing)" : "");
      left.appendChild(el("span", { textContent: labelText }));
      Object.assign(left.lastChild.style, {
        fontSize: "12px",
        color: s.status === "missing" ? "#f87171" : "#e2e8f0",
      });

      row.appendChild(left);
      row.appendChild(el("span", { textContent: `${s.score}` }));
      Object.assign(row.lastChild.style, {
        fontSize: "12px", fontWeight: "600", color: scoreColor(s.score),
      });
      sectionList.appendChild(row);

      if (s.tips.length > 0) {
        const tipsContainer = el("div", {});
        Object.assign(tipsContainer.style, {
          padding: "4px 0 8px 16px", borderBottom: "1px solid rgba(51,65,85,0.3)",
        });
        for (const tip of s.tips) {
          const tipEl = el("div", { textContent: "→ " + tip });
          Object.assign(tipEl.style, {
            fontSize: "11px", color: "#94a3b8", padding: "2px 0",
          });
          tipsContainer.appendChild(tipEl);
        }
        sectionList.appendChild(tipsContainer);
      }
    }
    panel.appendChild(sectionList);

    // --- Keyword suggestions ---
    if (data.keywords.missing.length > 0) {
      const kwTitle = el("div", { textContent: `Keywords for ${data.keywords.category}` });
      Object.assign(kwTitle.style, {
        fontWeight: "700", fontSize: "12px", color: "#60a5fa",
        marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em",
      });
      panel.appendChild(kwTitle);

      const kwDesc = el("div", {
        textContent: `${data.keywords.present.length}/${data.keywords.total} industry keywords found. Consider adding:`,
      });
      Object.assign(kwDesc.style, { fontSize: "11px", color: "#94a3b8", marginBottom: "8px" });
      panel.appendChild(kwDesc);

      const kwContainer = el("div", {});
      Object.assign(kwContainer.style, {
        display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "16px",
      });
      for (const kw of data.keywords.missing.slice(0, 10)) {
        const tag = el("span", { textContent: kw });
        Object.assign(tag.style, {
          fontSize: "11px", color: "#93c5fd", backgroundColor: "rgba(59,130,246,0.15)",
          padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(59,130,246,0.3)",
        });
        kwContainer.appendChild(tag);
      }
      panel.appendChild(kwContainer);
    }

    // --- Quick wins ---
    if (data.quickWins.length > 0) {
      const qwTitle = el("div", { textContent: "Quick Wins" });
      Object.assign(qwTitle.style, {
        fontWeight: "700", fontSize: "12px", color: "#fbbf24",
        marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em",
      });
      panel.appendChild(qwTitle);

      for (const win of data.quickWins) {
        const item = el("div", { textContent: win });
        Object.assign(item.style, {
          fontSize: "11px", color: "#cbd5e1", padding: "6px 8px",
          backgroundColor: "#1a1f2e", borderRadius: "8px", marginBottom: "4px",
          borderLeft: "2px solid #fbbf24",
        });
        panel.appendChild(item);
      }
    }

    // --- AI Deep Analysis CTA ---
    const aiSection = el("div", {});
    Object.assign(aiSection.style, {
      marginTop: "16px", borderTop: "1px solid #334155", paddingTop: "12px",
    });

    if (aiOptimizeData) {
      const aiLabel = el("div", { textContent: "AI Suggestions Available" });
      Object.assign(aiLabel.style, {
        fontSize: "11px", color: "#10b981", fontWeight: "600", marginBottom: "8px",
      });
      aiSection.appendChild(aiLabel);

      for (const section of aiOptimizeData.sectionScores || []) {
        if (!section.suggested) continue;
        const sBlock = el("div", {});
        Object.assign(sBlock.style, {
          marginBottom: "8px", padding: "8px", backgroundColor: "#0f2922",
          borderRadius: "8px", borderLeft: "2px solid #10b981",
        });

        sBlock.appendChild(el("div", { textContent: `${section.section} — ${section.scoreLabel}` }));
        Object.assign(sBlock.firstChild.style, {
          fontSize: "11px", fontWeight: "700", color: scoreColor(section.score), marginBottom: "4px",
        });

        const sugText = section.suggested.slice(0, 200) + (section.suggested.length > 200 ? "..." : "");
        sBlock.appendChild(el("div", { textContent: sugText }));
        Object.assign(sBlock.lastChild.style, { fontSize: "11px", color: "#94d8b8" });

        const copyBtn = el("button", {
          textContent: "Copy",
          onClick: () => {
            navigator.clipboard.writeText(section.suggested);
            copyBtn.textContent = "Copied!";
            copyBtn.style.color = "#10b981";
            setTimeout(() => { copyBtn.textContent = "Copy"; copyBtn.style.color = "#2dd4bf"; }, 2000);
          },
        });
        Object.assign(copyBtn.style, {
          background: "none", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf",
          padding: "3px 8px", borderRadius: "4px", cursor: "pointer",
          fontSize: "10px", fontWeight: "600", marginTop: "4px",
        });
        sBlock.appendChild(copyBtn);
        aiSection.appendChild(sBlock);
      }
    } else {
      const aiBtn = el("button", {
        textContent: "Get AI-Powered Suggestions →",
        className: "acp-ai-optimize-btn",
      });
      Object.assign(aiBtn.style, {
        display: "block", width: "100%", textAlign: "center",
        padding: "10px", borderRadius: "10px", fontWeight: "700",
        fontSize: "13px", color: "#fff", border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #0d9488, #059669)",
      });

      aiBtn.addEventListener("click", async () => {
        aiBtn.textContent = "Analyzing with AI...";
        aiBtn.disabled = true;
        aiBtn.style.opacity = "0.7";

        const profileData = extractProfileData();
        const result = await msg("LINKEDIN_OPTIMIZE", {
          profileData,
          targetRole: profileData.headline || "Professional",
        });

        if (result.ok && result.data) {
          aiOptimizeData = result.data;
          const existingPanel = document.querySelector(".acp-li-optimizer-panel");
          if (existingPanel) {
            existingPanel.remove();
            document.body.appendChild(createPanel());
          }
          attachSectionTooltips();
        } else {
          aiBtn.textContent = result.error || "Failed — try again";
          aiBtn.style.background = "#7f1d1d";
          aiBtn.disabled = false;
          aiBtn.style.opacity = "1";
          setTimeout(() => {
            aiBtn.textContent = "Get AI-Powered Suggestions →";
            aiBtn.style.background = "linear-gradient(135deg, #0d9488, #059669)";
          }, 3000);
        }
      });
      aiSection.appendChild(aiBtn);

      const aiNote = el("div", { textContent: "Requires sign-in. Uses AI to rewrite sections for your target role." });
      Object.assign(aiNote.style, {
        fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "6px",
      });
      aiSection.appendChild(aiNote);
    }

    panel.appendChild(aiSection);

    // --- Full Analysis link ---
    const cta = el("a", {
      textContent: "Full Analysis on Dashboard →",
      href: `${DEFAULT_API_URL}/linkedin-optimizer`,
    });
    Object.assign(cta.style, {
      display: "block", textAlign: "center", marginTop: "12px",
      fontSize: "11px", color: "#2dd4bf", textDecoration: "none", fontWeight: "600",
    });
    cta.target = "_blank";
    panel.appendChild(cta);

    return panel;
  }

  // ---------------------------------------------------------------------------
  // UI: Inline section badges
  // ---------------------------------------------------------------------------

  function attachInlineBadges() {
    if (!localScoreData) return;

    const sectionMap = {
      headline: {
        selectors: 'div.text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint',
        position: "after",
      },
      summary: {
        selectors: '#about, section.pv-about-section',
        position: "corner",
      },
      experience: {
        selectors: '#experience, section#experience-section',
        position: "corner",
      },
      skills: {
        selectors: '#skills, section.pv-skill-categories-section',
        position: "corner",
      },
      education: {
        selectors: '#education, section#education-section',
        position: "corner",
      },
    };

    for (const [key, config] of Object.entries(sectionMap)) {
      const sectionScore = localScoreData.sections[key];
      const target = document.querySelector(config.selectors);
      if (!target) continue;
      if (target.dataset.acpScoreBadge) continue;
      target.dataset.acpScoreBadge = "true";

      const badge = el("div", { className: "acp-li-section-badge" });
      const color = sectionScore.status === "missing" ? "#ef4444" : scoreColor(sectionScore.score);
      const label = sectionScore.status === "missing" ? "Missing" : `${sectionScore.score}`;

      Object.assign(badge.style, {
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "2px 8px", borderRadius: "12px",
        backgroundColor: "rgba(30,41,59,0.95)", border: `1px solid ${color}`,
        fontSize: "11px", fontWeight: "600", color,
        fontFamily: "system-ui, -apple-system, sans-serif",
        zIndex: "9999", cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transition: "transform 0.15s",
      });

      badge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0"></span>${label}`;

      if (sectionScore.tips.length > 0) {
        badge.title = sectionScore.tips[0];
      }

      badge.addEventListener("click", () => {
        if (!panelVisible) {
          panelVisible = true;
          document.body.appendChild(createPanel());
        }
      });

      badge.addEventListener("mouseenter", () => { badge.style.transform = "scale(1.1)"; });
      badge.addEventListener("mouseleave", () => { badge.style.transform = "scale(1)"; });

      if (config.position === "corner") {
        Object.assign(target.style, { position: "relative" });
        Object.assign(badge.style, { position: "absolute", top: "8px", right: "8px" });
        target.appendChild(badge);
      } else {
        Object.assign(badge.style, { marginLeft: "8px", verticalAlign: "middle" });
        target.parentElement?.appendChild(badge);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // UI: AI suggestion tooltips (reuses AI data)
  // ---------------------------------------------------------------------------

  function createTooltip(section) {
    const existing = document.querySelector(".acp-li-suggestion-tooltip");
    if (existing) existing.remove();

    const tip = el("div", { className: "acp-li-suggestion-tooltip" });
    Object.assign(tip.style, {
      position: "absolute",
      zIndex: "2147483647",
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
    if (!aiOptimizeData) return;

    const sectionMap = {
      Headline: 'div.text-body-medium.break-words, .pv-text-details__about-this-profile-entrypoint',
      Summary: '#about, section.pv-about-section',
      Experience: '#experience, section#experience-section',
      Skills: '#skills, section.pv-skill-categories-section',
      Education: '#education, section#education-section',
    };

    for (const section of aiOptimizeData.sectionScores) {
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

  // ---------------------------------------------------------------------------
  // UI: Trigger button
  // ---------------------------------------------------------------------------

  function injectTriggerButton() {
    if (document.querySelector(".acp-li-optimize-trigger")) return;

    const btn = el("button", {
      className: "acp-li-optimize-trigger",
    });

    const scoreText = localScoreData ? `${localScoreData.overallScore}/100` : "Score";
    const color = localScoreData ? scoreColor(localScoreData.overallScore) : "#2dd4bf";

    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> <span>${scoreText}</span>`;

    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483646",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 18px",
      borderRadius: "12px",
      border: "none",
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      color: "#fff",
      fontSize: "13px",
      fontWeight: "700",
      fontFamily: "system-ui, -apple-system, sans-serif",
      cursor: "pointer",
      boxShadow: `0 8px 24px ${color}66`,
      transition: "transform 0.15s, box-shadow 0.15s",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = `0 12px 32px ${color}88`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = `0 8px 24px ${color}66`;
    });

    btn.addEventListener("click", () => {
      if (panelVisible) {
        const panel = document.querySelector(".acp-li-optimizer-panel");
        if (panel) { panel.remove(); panelVisible = false; return; }
      }
      panelVisible = true;
      document.body.appendChild(createPanel());
    });

    document.body.appendChild(btn);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  async function init() {
    const configResult = await msg("GET_CONFIG");
    if (!configResult.ok || !configResult.data.userEmail) return;

    await new Promise((r) => setTimeout(r, 2000));

    if (!isOwnProfile()) return;

    const profileData = extractProfileData();
    localScoreData = computeLocalScore(profileData);

    injectTriggerButton();
    attachInlineBadges();
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
