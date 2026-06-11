(() => {
  "use strict";

  const FIELD_PATTERNS = {
    firstName: /first.?name|given.?name|fname/i,
    lastName: /last.?name|family.?name|surname|lname/i,
    fullName: /full.?name|your.?name|^name$/i,
    email: /e?.?mail|email.?address/i,
    phone: /phone|mobile|tel|cell/i,
    linkedin: /linkedin|linked.?in/i,
    address: /address|street/i,
    city: /city|town/i,
    state: /state|province|region/i,
    zip: /zip|postal|post.?code/i,
    currentCompany: /current.?company|current.?employer|company.?name/i,
    currentTitle: /current.?title|current.?role|job.?title|position/i,
    website: /website|portfolio|personal.?site|url/i,
    github: /github/i,
    yearsExperience: /years?.?(?:of)?.?experience|experience.?years/i,
  };

  const SKIP_PATTERNS = /cover.?letter|salary|expectation|visa|sponsor|relocat|gender|race|ethnic|veteran|disability/i;

  const RESUME_FILE_PATTERNS = /resume|cv|curriculum/i;
  const RESUME_ACCEPT_TYPES = /\.pdf|\.doc|\.docx|application\/pdf|application\/msword/i;

  function msg(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, payload }, resolve);
    });
  }

  function identifyField(input) {
    const sources = [
      input.name,
      input.id,
      input.placeholder,
      input.getAttribute("aria-label"),
      input.getAttribute("autocomplete"),
      input.labels?.[0]?.textContent,
    ].filter(Boolean).join(" ");

    for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(sources)) return field;
    }
    return null;
  }

  function setFieldValue(input, value) {
    if (!value) return false;

    const nativeSet = Object.getOwnPropertyDescriptor(
      input.constructor.prototype, "value"
    )?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

    if (nativeSet) {
      nativeSet.call(input, value);
    } else {
      input.value = value;
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    input.classList.add("acp-field-highlight");
    setTimeout(() => input.classList.remove("acp-field-highlight"), 1500);
    return true;
  }

  function mapProfileToField(field, profile) {
    const map = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
      email: profile.email,
      phone: profile.phone,
      linkedin: profile.linkedin,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
      currentCompany: profile.currentCompany,
      currentTitle: profile.currentTitle,
      website: profile.website,
      github: profile.github,
      yearsExperience: profile.yearsExperience,
    };
    return map[field] || null;
  }

  function detectFormFields() {
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"], input:not([type]), textarea'
    );

    const fields = [];
    for (const input of inputs) {
      if (input.type === "hidden" || input.offsetParent === null) continue;

      const label = input.labels?.[0]?.textContent?.trim() || "";
      if (SKIP_PATTERNS.test(label) || SKIP_PATTERNS.test(input.name || "")) {
        fields.push({ input, field: null, needsAttention: true, label });
        continue;
      }

      const field = identifyField(input);
      if (field) {
        fields.push({ input, field, needsAttention: false, label });
      }
    }

    return fields;
  }

  async function runAutofill() {
    const result = await msg("GET_AUTOFILL_DATA");
    if (!result.ok || !result.data) return { filled: 0, total: 0, attention: 0 };

    const profile = result.data;
    const fields = detectFormFields();
    let filled = 0;
    let attention = 0;

    for (const { input, field, needsAttention } of fields) {
      if (needsAttention) {
        input.classList.add("acp-field-attention");
        attention++;
        continue;
      }

      if (!field) continue;
      const value = mapProfileToField(field, profile);
      if (value && !input.value) {
        await new Promise((r) => setTimeout(r, 100));
        if (setFieldValue(input, value)) filled++;
      }
    }

    return { filled, total: fields.length, attention };
  }

  function showBanner() {
    if (document.querySelector(".acp-autofill-banner")) return;

    const banner = document.createElement("div");
    banner.className = "acp-autofill-banner";
    banner.innerHTML = `
      <div class="acp-autofill-banner-text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>AICareerPivot can fill in your details</span>
      </div>
      <button class="acp-banner-btn acp-banner-btn-fill">Autofill</button>
      <button class="acp-banner-btn acp-banner-btn-skip">Not now</button>
      <button class="acp-banner-btn acp-banner-btn-never">Never on this site</button>
    `;

    const fillBtn = banner.querySelector(".acp-banner-btn-fill");
    const skipBtn = banner.querySelector(".acp-banner-btn-skip");
    const neverBtn = banner.querySelector(".acp-banner-btn-never");

    fillBtn.addEventListener("click", async () => {
      fillBtn.textContent = "Filling...";
      const result = await runAutofill();
      banner.querySelector(".acp-autofill-banner-text span").textContent =
        `Filled ${result.filled} of ${result.total} fields` +
        (result.attention ? ` — ${result.attention} need attention` : "");
      fillBtn.remove();
      skipBtn.textContent = "Done";
      neverBtn.remove();
      setTimeout(() => banner.remove(), 4000);
    });

    skipBtn.addEventListener("click", () => banner.remove());

    neverBtn.addEventListener("click", async () => {
      const host = window.location.hostname;
      const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
      if (!disabledSites.includes(host)) {
        disabledSites.push(host);
        await chrome.storage.sync.set({ disabledSites });
      }
      banner.remove();
    });

    document.body.prepend(banner);
  }

  function detectFileInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const resumeInputs = [];

    for (const input of fileInputs) {
      if (input.offsetParent === null && !input.closest('[style*="opacity"]')) continue;
      if (input.dataset.acpResumeHandled) continue;

      const context = [
        input.name,
        input.id,
        input.getAttribute("aria-label"),
        input.getAttribute("accept"),
        input.labels?.[0]?.textContent,
        input.closest("label")?.textContent,
        input.closest("[class*=upload], [class*=file], [class*=resume], [class*=attach]")?.textContent,
      ].filter(Boolean).join(" ");

      const accept = input.getAttribute("accept") || "";
      const isResumeByContext = RESUME_FILE_PATTERNS.test(context);
      const isResumeByType = RESUME_ACCEPT_TYPES.test(accept);

      if (isResumeByContext || isResumeByType || accept === "") {
        resumeInputs.push(input);
      }
    }

    return resumeInputs;
  }

  function base64ToFile(base64, filename) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: "application/pdf" });
  }

  function injectFileToInput(fileInput, file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    fileInput.dispatchEvent(new Event("input", { bubbles: true }));
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function uploadResume(fileInput, resumeId) {
    const result = await msg("FETCH_RESUME_PDF", resumeId ? { resumeId } : {});
    if (!result.ok) throw new Error(result.error || "Failed to fetch resume");

    const file = base64ToFile(result.data.base64, result.data.filename);
    injectFileToInput(fileInput, file);
    return result.data;
  }

  function createResumeUploadBtn(fileInput) {
    if (fileInput.dataset.acpResumeHandled) return;
    fileInput.dataset.acpResumeHandled = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "acp-resume-upload-wrapper";

    const btn = document.createElement("button");
    btn.className = "acp-resume-upload-btn";
    btn.type = "button";
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 12 15 15"/>
      </svg>
      <span>Upload from AICareerPivot</span>
    `;

    const statusEl = document.createElement("span");
    statusEl.className = "acp-resume-status";

    wrapper.appendChild(btn);
    wrapper.appendChild(statusEl);

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      btn.classList.add("acp-resume-loading");
      btn.querySelector("span").textContent = "Loading resumes…";

      try {
        const listResult = await msg("GET_RESUME_LIST");
        if (!listResult.ok) throw new Error(listResult.error);

        const { resumes, activeResumeId } = listResult.data;

        if (!resumes.length) {
          statusEl.textContent = "No resumes available — create one in your dashboard";
          statusEl.className = "acp-resume-status acp-resume-error";
          btn.classList.remove("acp-resume-loading");
          btn.querySelector("span").textContent = "Upload from AICareerPivot";
          return;
        }

        if (resumes.length === 1) {
          await doUpload(fileInput, resumes[0], btn, statusEl);
          return;
        }

        showResumePicker(fileInput, resumes, activeResumeId, btn, statusEl, wrapper);
      } catch (err) {
        statusEl.textContent = err.message;
        statusEl.className = "acp-resume-status acp-resume-error";
        btn.classList.remove("acp-resume-loading");
        btn.querySelector("span").textContent = "Upload from AICareerPivot";
      }
    });

    const anchor = fileInput.closest("label") || fileInput.closest("[class*=upload]") || fileInput;
    if (anchor.parentNode) {
      anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);
    }
  }

  async function doUpload(fileInput, resume, btn, statusEl) {
    btn.querySelector("span").textContent = "Uploading…";
    try {
      const data = await uploadResume(fileInput, resume.id);
      btn.classList.remove("acp-resume-loading");
      btn.classList.add("acp-resume-done");
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${data.resumeName}</span>
      `;
      statusEl.textContent = `Attached: ${data.filename}`;
      statusEl.className = "acp-resume-status acp-resume-success";
    } catch (err) {
      btn.classList.remove("acp-resume-loading");
      btn.querySelector("span").textContent = "Upload from AICareerPivot";
      statusEl.textContent = err.message;
      statusEl.className = "acp-resume-status acp-resume-error";
    }
  }

  function showResumePicker(fileInput, resumes, activeResumeId, btn, statusEl, wrapper) {
    const existing = wrapper.querySelector(".acp-resume-picker");
    if (existing) { existing.remove(); return; }

    btn.classList.remove("acp-resume-loading");
    btn.querySelector("span").textContent = "Select a resume";

    const picker = document.createElement("div");
    picker.className = "acp-resume-picker";

    const sorted = [...resumes].sort((a, b) => {
      if (a.id === activeResumeId) return -1;
      if (b.id === activeResumeId) return 1;
      return 0;
    });

    for (const resume of sorted) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "acp-resume-picker-item";
      if (resume.id === activeResumeId) item.classList.add("acp-resume-active");

      const label = resume.targetRole
        ? `${resume.name} — ${resume.targetRole}`
        : resume.name;

      const scoreHtml = resume.matchScore != null
        ? `<span class="acp-resume-score">${resume.matchScore}%</span>`
        : "";

      item.innerHTML = `
        <span class="acp-resume-name">${label}</span>
        ${scoreHtml}
        ${resume.id === activeResumeId ? '<span class="acp-resume-badge">Active</span>' : ""}
      `;

      item.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        picker.remove();
        btn.classList.add("acp-resume-loading");
        await doUpload(fileInput, resume, btn, statusEl);
      });

      picker.appendChild(item);
    }

    wrapper.appendChild(picker);

    const dismiss = (e) => {
      if (!wrapper.contains(e.target)) {
        picker.remove();
        btn.querySelector("span").textContent = "Upload from AICareerPivot";
        document.removeEventListener("click", dismiss);
      }
    };
    setTimeout(() => document.addEventListener("click", dismiss), 0);
  }

  function showResumeUploadBanner(fileInputs) {
    if (!fileInputs.length) return;
    const banner = document.querySelector(".acp-autofill-banner");
    if (!banner) return;

    const existing = banner.querySelector(".acp-banner-btn-resume");
    if (existing) return;

    const skipBtn = banner.querySelector(".acp-banner-btn-skip");
    const resumeBtn = document.createElement("button");
    resumeBtn.className = "acp-banner-btn acp-banner-btn-resume";
    resumeBtn.textContent = "Upload Resume";

    resumeBtn.addEventListener("click", async () => {
      resumeBtn.textContent = "Uploading…";
      resumeBtn.disabled = true;

      try {
        const result = await msg("FETCH_RESUME_PDF");
        if (!result.ok) throw new Error(result.error);

        const file = base64ToFile(result.data.base64, result.data.filename);
        for (const input of fileInputs) {
          injectFileToInput(input, file);
        }

        resumeBtn.textContent = "Resume attached ✓";
        resumeBtn.classList.add("acp-banner-btn-resume-done");
      } catch (err) {
        resumeBtn.textContent = "Upload Resume";
        resumeBtn.disabled = false;
      }
    });

    if (skipBtn) {
      banner.insertBefore(resumeBtn, skipBtn);
    } else {
      banner.appendChild(resumeBtn);
    }
  }

  async function init() {
    const config = await msg("GET_CONFIG");
    if (!config.ok || !config.data.userEmail || !config.data.userProfile) return;

    const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
    if (disabledSites.includes(window.location.hostname)) return;

    setTimeout(() => {
      const fields = detectFormFields();
      const fileInputs = detectFileInputs();

      if (fields.some(f => f.field) || fileInputs.length) showBanner();

      for (const fi of fileInputs) {
        createResumeUploadBtn(fi);
      }

      if (fileInputs.length) {
        showResumeUploadBanner(fileInputs);
      }
    }, 1500);

    const observer = new MutationObserver(() => {
      const newFileInputs = detectFileInputs();
      for (const fi of newFileInputs) {
        createResumeUploadBtn(fi);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  init();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TRIGGER_AUTOFILL") runAutofill();
    if (message.type === "TRIGGER_RESUME_UPLOAD") {
      const fileInputs = detectFileInputs();
      if (fileInputs.length) {
        const btn = fileInputs[0].parentNode?.querySelector(".acp-resume-upload-btn");
        if (btn) btn.click();
      }
    }
  });
})();
