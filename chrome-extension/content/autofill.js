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

  async function init() {
    const config = await msg("GET_CONFIG");
    if (!config.ok || !config.data.userEmail || !config.data.userProfile) return;

    const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
    if (disabledSites.includes(window.location.hostname)) return;

    setTimeout(() => {
      const fields = detectFormFields();
      if (fields.some(f => f.field)) showBanner();
    }, 1500);
  }

  init();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TRIGGER_AUTOFILL") runAutofill();
  });
})();
