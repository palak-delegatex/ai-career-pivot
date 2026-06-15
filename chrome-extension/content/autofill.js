(() => {
  "use strict";

  // --- Field pattern matchers ---

  const FIELD_PATTERNS = {
    firstName: /first.?name|given.?name|fname/i,
    lastName: /last.?name|family.?name|surname|lname/i,
    fullName: /full.?name|your.?name|^name$/i,
    email: /e?.?mail|email.?address/i,
    phone: /phone|mobile|tel(?:ephone)?|cell/i,
    linkedin: /linkedin|linked.?in/i,
    address: /address|street/i,
    city: /city|town/i,
    state: /state|province|region/i,
    zip: /zip|postal|post.?code/i,
    country: /country/i,
    currentCompany: /current.?company|current.?employer|company.?name|most.?recent.?employer/i,
    currentTitle: /current.?title|current.?role|job.?title|position(?!.*type)/i,
    website: /website|portfolio|personal.?site|url/i,
    github: /github/i,
    yearsExperience: /years?.?(?:of)?.?experience|experience.?years|total.?experience/i,
    school: /school|university|college|institution|alma.?mater/i,
    degree: /degree|qualification/i,
    fieldOfStudy: /field.?of.?study|major|concentration|discipline/i,
    graduationYear: /graduat(?:ion|e).?year|year.?graduat|completion.?year/i,
    gpa: /\bgpa\b|grade.?point/i,
    startDate: /start.?date/i,
    endDate: /end.?date/i,
    coverLetter: /cover.?letter|motivation.?letter|letter.?of.?interest/i,
    summary: /summary|about.?(?:you|me|yourself)|professional.?summary|objective/i,
    salaryExpectation: /salary|compensation|pay.?expectation|desired.?pay/i,
    availability: /availab|start.?date|earliest.?start|when.?can.?you/i,
    authorization: /authorized|legally|right.?to.?work|eligib/i,
    sponsorship: /sponsor|visa/i,
    gender: /gender|sex/i,
    race: /race|ethnic/i,
    veteran: /veteran|military/i,
    disability: /disabilit/i,
  };

  const SKIP_PATTERNS = /salary|expectation|desired.?pay|gender|sex|race|ethnic|veteran|disability|accommodat/i;
  const EEO_PATTERNS = /gender|sex|race|ethnic|veteran|disability|accommodat|pronoun/i;

  const RESUME_FILE_PATTERNS = /resume|cv|curriculum/i;
  const RESUME_ACCEPT_TYPES = /\.pdf|\.doc|\.docx|application\/pdf|application\/msword/i;

  // --- ATS Platform Detection ---

  const ATS_ADAPTERS = {
    workday: {
      hostPattern: /myworkdayjobs\.com/,
      formSelector: '[data-automation-id="jobApplicationForm"], .css-1dbjc4n, form',
      fieldOverrides: {
        firstName: '[data-automation-id="legalNameSection_firstName"], input[aria-label*="First Name"]',
        lastName: '[data-automation-id="legalNameSection_lastName"], input[aria-label*="Last Name"]',
        email: '[data-automation-id="email"], input[aria-label*="Email"]',
        phone: '[data-automation-id="phone-number"], input[aria-label*="Phone"]',
        address: '[data-automation-id="addressSection_addressLine1"]',
        city: '[data-automation-id="addressSection_city"]',
        state: '[data-automation-id="addressSection_countryRegion"]',
        zip: '[data-automation-id="addressSection_postalCode"]',
        country: '[data-automation-id="addressSection_country"]',
      },
      resumeSelector: '[data-automation-id="file-upload-input-ref"], input[type="file"][data-automation-id*="resume"]',
      getSelectFields() {
        return document.querySelectorAll('[data-automation-id] button[aria-haspopup="listbox"]');
      },
    },
    greenhouse: {
      hostPattern: /greenhouse\.io/,
      formSelector: '#application_form, #main_fields, form[action*="application"]',
      fieldOverrides: {
        firstName: '#first_name, input[name="job_application[first_name]"]',
        lastName: '#last_name, input[name="job_application[last_name]"]',
        email: '#email, input[name="job_application[email]"]',
        phone: '#phone, input[name="job_application[phone]"]',
        linkedin: 'input[name*="linkedin"], input[id*="linkedin"]',
        website: 'input[name*="website"], input[id*="website"]',
        currentCompany: 'input[name*="current_company"], input[id*="current_company"]',
        currentTitle: 'input[name*="current_title"], input[id*="current_title"]',
      },
      resumeSelector: 'input[type="file"][name*="resume"], input[type="file"][id*="resume"]',
    },
    lever: {
      hostPattern: /lever\.co/,
      formSelector: '.application-form, .postings-btn-wrapper + form, form',
      fieldOverrides: {
        fullName: 'input[name="name"]',
        email: 'input[name="email"]',
        phone: 'input[name="phone"]',
        linkedin: 'input[name="urls[LinkedIn]"], input[name*="linkedin"]',
        website: 'input[name="urls[Portfolio]"], input[name*="portfolio"], input[name*="website"]',
        github: 'input[name="urls[GitHub]"], input[name*="github"]',
        currentCompany: 'input[name="org"], input[name*="company"]',
      },
      resumeSelector: 'input[type="file"][name="resume"], input[type="file"]',
    },
    ashby: {
      hostPattern: /ashbyhq\.com/,
      formSelector: 'form[class*="application"], form',
      fieldOverrides: {
        firstName: 'input[name="firstName"], input[name="_systemfield_name"]',
        lastName: 'input[name="lastName"]',
        email: 'input[name="email"], input[name="_systemfield_email"]',
        phone: 'input[name="phone"], input[name="_systemfield_phone"]',
        linkedin: 'input[name*="linkedin"], input[name="_systemfield_linkedin"]',
      },
      resumeSelector: 'input[type="file"]',
    },
    icims: {
      hostPattern: /icims\.com/,
      formSelector: '.iCIMS_MainWrapper form, form',
      fieldOverrides: {
        firstName: 'input[id*="FirstName"], input[name*="FirstName"]',
        lastName: 'input[id*="LastName"], input[name*="LastName"]',
        email: 'input[id*="Email"], input[name*="Email"], input[type="email"]',
        phone: 'input[id*="Phone"], input[name*="Phone"]',
        address: 'input[id*="Street"], input[name*="Street"]',
        city: 'input[id*="City"], input[name*="City"]',
        state: 'select[id*="State"], select[name*="State"]',
        zip: 'input[id*="Zip"], input[name*="Zip"], input[name*="Postal"]',
      },
      resumeSelector: 'input[type="file"][id*="resume"], input[type="file"][name*="resume"], input[type="file"]',
    },
    taleo: {
      hostPattern: /taleo\.net|oraclecloud\.com/,
      formSelector: '#requisitionDescriptionInterface, form',
      fieldOverrides: {
        firstName: 'input[id*="FirstName"], input[name*="FirstName"]',
        lastName: 'input[id*="LastName"], input[name*="LastName"]',
        email: 'input[id*="Email"], input[name*="Email"]',
        phone: 'input[id*="Phone"], input[name*="Phone"]',
        address: 'input[id*="Address"], input[name*="Address"]',
        city: 'input[id*="City"], input[name*="City"]',
        zip: 'input[id*="ZipCode"], input[name*="ZipCode"], input[name*="PostalCode"]',
      },
      resumeSelector: 'input[type="file"]',
    },
    smartrecruiters: {
      hostPattern: /smartrecruiters\.com/,
      formSelector: '.application-form, form[class*="application"], form',
      fieldOverrides: {
        firstName: 'input[name="firstName"], input[id*="firstName"]',
        lastName: 'input[name="lastName"], input[id*="lastName"]',
        email: 'input[name="email"], input[type="email"]',
        phone: 'input[name="phoneNumber"], input[name="phone"]',
        linkedin: 'input[name*="linkedin"], input[id*="linkedin"]',
        website: 'input[name*="website"], input[name*="portfolio"]',
        currentCompany: 'input[name*="company"], input[name*="currentCompany"]',
        currentTitle: 'input[name*="title"], input[name*="currentTitle"]',
        address: 'input[name*="address"], input[name*="street"]',
        city: 'input[name*="city"]',
        state: 'input[name*="state"], select[name*="state"]',
        zip: 'input[name*="zip"], input[name*="postalCode"]',
        country: 'select[name*="country"], input[name*="country"]',
      },
      resumeSelector: 'input[type="file"][name*="resume"], input[type="file"]',
    },
    bamboohr: {
      hostPattern: /bamboohr\.com/,
      formSelector: '.ResumatorJobApplication, form[id*="application"], form',
      fieldOverrides: {
        firstName: 'input[name="firstName"], input[id="firstName"]',
        lastName: 'input[name="lastName"], input[id="lastName"]',
        email: 'input[name="email"], input[type="email"]',
        phone: 'input[name="phone"], input[id="phone"]',
        address: 'input[name="address"], input[name*="street"]',
        city: 'input[name="city"]',
        state: 'input[name="state"], select[name="state"]',
        zip: 'input[name="zip"]',
        linkedin: 'input[name*="linkedin"]',
        website: 'input[name*="website"]',
        coverLetter: 'textarea[name*="coverLetter"], textarea[name*="cover"]',
      },
      resumeSelector: 'input[type="file"][name*="resume"], input[type="file"]',
    },
    jazzhr: {
      hostPattern: /applytojob\.com|jazz\.co/,
      formSelector: '#applicationForm, form[id*="apply"], form',
      fieldOverrides: {
        firstName: 'input[name="first_name"], input[id="first_name"]',
        lastName: 'input[name="last_name"], input[id="last_name"]',
        email: 'input[name="email"], input[type="email"]',
        phone: 'input[name="phone"], input[id="phone"]',
        address: 'input[name="address"], input[name*="address1"]',
        city: 'input[name="city"]',
        state: 'select[name="state"], input[name="state"]',
        zip: 'input[name="zip"]',
        linkedin: 'input[name*="linkedin"]',
        website: 'input[name*="website"]',
        currentCompany: 'input[name*="company"]',
        currentTitle: 'input[name*="title"]',
      },
      resumeSelector: 'input[type="file"][name*="resume"], input[type="file"]',
    },
    jobvite: {
      hostPattern: /jobvite\.com|jobs\.lever\.co/,
      formSelector: '.jv-application, form[class*="application"], form',
      fieldOverrides: {
        firstName: 'input[name="firstName"], input[id*="firstName"]',
        lastName: 'input[name="lastName"], input[id*="lastName"]',
        email: 'input[name="email"], input[type="email"]',
        phone: 'input[name="phone"], input[id*="phone"]',
        address: 'input[name*="address"]',
        city: 'input[name*="city"]',
        state: 'select[name*="state"], input[name*="state"]',
        zip: 'input[name*="zip"], input[name*="postal"]',
        linkedin: 'input[name*="linkedin"]',
        website: 'input[name*="website"], input[name*="portfolio"]',
        currentCompany: 'input[name*="employer"], input[name*="company"]',
        currentTitle: 'input[name*="jobTitle"], input[name*="title"]',
      },
      resumeSelector: 'input[type="file"]',
    },
    linkedinApply: {
      hostPattern: /linkedin\.com/,
      formSelector: '.jobs-easy-apply-content, .jobs-apply-form, form',
      fieldOverrides: {
        firstName: 'input[id*="first-name"], input[name*="firstName"]',
        lastName: 'input[id*="last-name"], input[name*="lastName"]',
        email: 'input[id*="email"], input[name*="email"]',
        phone: 'input[id*="phone"], input[name*="phone"]',
        city: 'input[id*="city"], input[name*="city"]',
        linkedin: 'input[id*="linkedin"], input[name*="linkedin"]',
        website: 'input[id*="website"], input[name*="website"]',
        currentCompany: 'input[id*="company"], input[name*="company"]',
        currentTitle: 'input[id*="title"], input[name*="title"]',
        school: 'input[id*="school"], input[name*="school"]',
        degree: 'select[id*="degree"], input[name*="degree"]',
        fieldOfStudy: 'input[id*="field-of-study"], input[name*="fieldOfStudy"]',
        yearsExperience: 'input[id*="experience"], select[id*="experience"]',
      },
      resumeSelector: 'input[type="file"]',
    },
    indeedApply: {
      hostPattern: /indeed\.com/,
      formSelector: '#indeed-apply-widget, .ia-Application, form[id*="apply"], form',
      fieldOverrides: {
        fullName: 'input[id*="name"], input[name="name"]',
        email: 'input[id*="email"], input[name="email"], input[type="email"]',
        phone: 'input[id*="phone"], input[name="phone"], input[type="tel"]',
        city: 'input[id*="city"], input[name*="city"]',
        state: 'select[id*="state"], input[name*="state"]',
        currentTitle: 'input[id*="title"], input[name*="jobTitle"]',
        currentCompany: 'input[id*="company"], input[name*="company"]',
        school: 'input[id*="school"], input[name*="school"]',
        degree: 'select[id*="degree"], input[name*="degree"]',
        yearsExperience: 'input[id*="experience"], select[id*="experience"]',
      },
      resumeSelector: 'input[type="file"][name*="resume"], input[type="file"]',
    },
    glassdoorApply: {
      hostPattern: /glassdoor\.com/,
      formSelector: '.applyForm, form[class*="apply"], form',
      fieldOverrides: {
        firstName: 'input[name="firstName"], input[id*="firstName"]',
        lastName: 'input[name="lastName"], input[id*="lastName"]',
        email: 'input[name="email"], input[type="email"]',
        phone: 'input[name="phone"], input[type="tel"]',
        currentCompany: 'input[name*="company"]',
        currentTitle: 'input[name*="title"]',
        linkedin: 'input[name*="linkedin"]',
      },
      resumeSelector: 'input[type="file"]',
    },
    ziprecruiterApply: {
      hostPattern: /ziprecruiter\.com/,
      formSelector: '.apply-form, form[class*="apply"], form',
      fieldOverrides: {
        firstName: 'input[name="first_name"], input[id*="first_name"]',
        lastName: 'input[name="last_name"], input[id*="last_name"]',
        email: 'input[name="email"], input[type="email"]',
        phone: 'input[name="phone"], input[type="tel"]',
        city: 'input[name*="city"]',
        state: 'select[name*="state"], input[name*="state"]',
        zip: 'input[name*="zip"]',
      },
      resumeSelector: 'input[type="file"]',
    },
  };

  function detectATS() {
    const host = window.location.hostname;
    for (const [name, adapter] of Object.entries(ATS_ADAPTERS)) {
      if (adapter.hostPattern.test(host)) return { name, ...adapter };
    }
    return null;
  }

  // --- Messaging ---

  function msg(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, payload }, resolve);
    });
  }

  // --- Field identification ---

  function getFieldContext(input) {
    return [
      input.name,
      input.id,
      input.placeholder,
      input.getAttribute("aria-label"),
      input.getAttribute("autocomplete"),
      input.getAttribute("data-automation-id"),
      input.labels?.[0]?.textContent,
      input.closest("label")?.textContent,
      (() => {
        const parent = input.closest(
          ".field, .form-group, .form-field, [class*='field'], [class*='question'], [class*='form-row']"
        );
        if (!parent) return "";
        const label = parent.querySelector(
          "label, .label, legend, [class*='label']"
        );
        return label?.textContent?.trim() || "";
      })(),
    ].filter(Boolean).join(" ");
  }

  function identifyField(input) {
    const sources = getFieldContext(input);

    for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(sources)) return field;
    }

    const autocomplete = input.getAttribute("autocomplete") || "";
    const autocompleteMap = {
      "given-name": "firstName",
      "family-name": "lastName",
      "name": "fullName",
      "email": "email",
      "tel": "phone",
      "street-address": "address",
      "address-line1": "address",
      "address-level2": "city",
      "address-level1": "state",
      "postal-code": "zip",
      "country-name": "country",
      "organization": "currentCompany",
      "organization-title": "currentTitle",
      "url": "website",
    };
    if (autocompleteMap[autocomplete]) return autocompleteMap[autocomplete];

    return null;
  }

  // --- Value setters ---

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
    markFieldFilled(input);
    return true;
  }

  function setSelectValue(select, value) {
    if (!value || !select) return false;

    const valueLower = value.toLowerCase();
    let bestOption = null;
    let bestScore = 0;

    for (const option of select.options) {
      if (!option.value && !option.textContent.trim()) continue;

      const optText = option.textContent.trim().toLowerCase();
      const optVal = (option.value || "").toLowerCase();

      if (optVal === valueLower || optText === valueLower) {
        bestOption = option;
        bestScore = 100;
        break;
      }
      if (optText.includes(valueLower) || valueLower.includes(optText)) {
        const score = 50;
        if (score > bestScore) { bestOption = option; bestScore = score; }
      }
      const valueWords = valueLower.split(/\s+/);
      if (valueWords.some(w => w.length > 2 && optText.includes(w))) {
        const score = 30;
        if (score > bestScore) { bestOption = option; bestScore = score; }
      }
    }

    if (bestOption && bestScore >= 30) {
      select.value = bestOption.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      select.dispatchEvent(new Event("input", { bubbles: true }));
      markFieldFilled(select);
      return true;
    }

    return false;
  }

  // --- Visual indicators ---

  function markFieldFilled(input) {
    input.classList.add("acp-autofilled");
    input.dataset.acpFilled = "true";

    let indicator = input.parentElement?.querySelector(".acp-fill-indicator");
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "acp-fill-indicator";
      indicator.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
      indicator.title = "Filled by AICareerPivot — click to clear";

      indicator.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.classList.remove("acp-autofilled");
        delete input.dataset.acpFilled;
        indicator.remove();
      });

      const wrapper = input.closest("label, .field, .form-group, [class*='field']");
      if (wrapper) {
        wrapper.style.position = wrapper.style.position || "relative";
        wrapper.appendChild(indicator);
      } else if (input.parentElement) {
        input.parentElement.style.position = input.parentElement.style.position || "relative";
        input.parentElement.appendChild(indicator);
      }
    }
  }

  // --- Profile data mapping ---

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
      country: profile.country,
      currentCompany: profile.currentCompany || profile.experience?.[0]?.company,
      currentTitle: profile.currentTitle || profile.experience?.[0]?.title,
      website: profile.website,
      github: profile.github,
      yearsExperience: profile.yearsExperience?.toString(),
      school: profile.education?.[0]?.institution,
      degree: profile.education?.[0]?.degree,
      fieldOfStudy: profile.education?.[0]?.field,
      graduationYear: profile.education?.[0]?.year?.toString(),
      summary: profile.rawSummary || profile.summary,
    };
    return map[field] || null;
  }

  // --- Form field detection ---

  function detectFormFields(atsAdapter) {
    const fields = [];
    const processedInputs = new Set();

    if (atsAdapter?.fieldOverrides) {
      for (const [field, selector] of Object.entries(atsAdapter.fieldOverrides)) {
        const input = document.querySelector(selector);
        if (!input || input.offsetParent === null) continue;
        processedInputs.add(input);

        if (input.tagName === "SELECT") {
          fields.push({ input, field, needsAttention: false, isSelect: true, label: "" });
        } else {
          fields.push({ input, field, needsAttention: false, isSelect: false, label: "" });
        }
      }
    }

    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"], input:not([type]), textarea, select'
    );

    for (const input of inputs) {
      if (processedInputs.has(input)) continue;
      if (input.type === "hidden" || input.type === "checkbox" || input.type === "radio" || input.type === "file") continue;
      if (input.offsetParent === null) continue;

      const context = getFieldContext(input);

      if (EEO_PATTERNS.test(context)) {
        fields.push({ input, field: null, needsAttention: true, isEeo: true, label: context.slice(0, 60) });
        continue;
      }

      if (SKIP_PATTERNS.test(context)) {
        fields.push({ input, field: null, needsAttention: true, label: context.slice(0, 60) });
        continue;
      }

      const field = identifyField(input);
      if (field) {
        fields.push({
          input,
          field,
          needsAttention: false,
          isSelect: input.tagName === "SELECT",
          label: input.labels?.[0]?.textContent?.trim() || context.slice(0, 60),
        });
      }
    }

    return fields;
  }

  // --- Resume handling ---

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

  // --- Summary panel ---

  function createSummaryPanel(results) {
    const existing = document.querySelector(".acp-summary-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.className = "acp-summary-panel";

    const filledItems = results.filledFields.map((f) =>
      `<div class="acp-summary-item acp-summary-filled">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${escapeHtml(f.label || f.field)}</span>
      </div>`
    ).join("");

    const attentionItems = results.attentionFields.map((f) =>
      `<div class="acp-summary-item acp-summary-attention">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${escapeHtml(f.label || "Needs review")}</span>
      </div>`
    ).join("");

    const skippedItems = results.skippedFields.map((f) =>
      `<div class="acp-summary-item acp-summary-skipped">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>${escapeHtml(f.label || f.field)}</span>
      </div>`
    ).join("");

    const resumeHtml = results.resumeAttached
      ? `<div class="acp-summary-item acp-summary-filled">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Resume attached</span>
        </div>`
      : results.resumeDetected
        ? `<div class="acp-summary-item acp-summary-attention">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>Resume upload detected — use button below the upload field</span>
          </div>`
        : "";

    const atsLabel = results.atsName
      ? `<span class="acp-summary-ats">${results.atsName}</span>`
      : "";

    panel.innerHTML = `
      <div class="acp-summary-header">
        <div class="acp-summary-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Autofill Complete</span>
          ${atsLabel}
        </div>
        <button class="acp-summary-close" type="button">&times;</button>
      </div>
      <div class="acp-summary-stats">
        <div class="acp-summary-stat">
          <span class="acp-stat-num" style="color:#10b981">${results.filled}</span>
          <span class="acp-stat-label">Filled</span>
        </div>
        <div class="acp-summary-stat">
          <span class="acp-stat-num" style="color:#f59e0b">${results.attention}</span>
          <span class="acp-stat-label">Review</span>
        </div>
        <div class="acp-summary-stat">
          <span class="acp-stat-num" style="color:#64748b">${results.skipped}</span>
          <span class="acp-stat-label">Skipped</span>
        </div>
      </div>
      <div class="acp-summary-details">
        ${filledItems}${resumeHtml}${attentionItems}${skippedItems}
      </div>
      <div class="acp-summary-hint">Click the ✓ icon on any field to clear and manually edit</div>
    `;

    panel.querySelector(".acp-summary-close").addEventListener("click", () => panel.remove());

    document.body.appendChild(panel);
    setTimeout(() => panel.remove(), 15000);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Profile sync ---

  async function syncProfile() {
    const result = await msg("SYNC_PROFILE");
    if (result?.ok && result.data) {
      await chrome.storage.sync.set({ userProfile: result.data });
      return result.data;
    }
    return null;
  }

  // --- Main autofill ---

  async function runAutofill() {
    const ats = detectATS();

    const result = await msg("GET_AUTOFILL_DATA");
    if (!result.ok || !result.data) return { filled: 0, total: 0, attention: 0 };

    let profile = result.data;

    if (!profile.firstName && !profile.lastName && !profile.email) {
      const synced = await syncProfile();
      if (synced) {
        profile = { ...synced, email: profile.email || synced.email };
      }
    }

    const fields = detectFormFields(ats);
    const fileInputs = detectFileInputs();

    const filledFields = [];
    const attentionFields = [];
    const skippedFields = [];

    for (const entry of fields) {
      const { input, field, needsAttention, isSelect, isEeo } = entry;

      if (isEeo) {
        continue;
      }

      if (needsAttention) {
        input.classList.add("acp-field-attention");
        attentionFields.push(entry);
        continue;
      }

      if (!field) continue;

      if (input.value && input.value.trim()) {
        skippedFields.push({ ...entry, label: entry.label || field });
        continue;
      }

      const value = mapProfileToField(field, profile);
      if (!value) {
        skippedFields.push({ ...entry, label: entry.label || field });
        continue;
      }

      await new Promise((r) => setTimeout(r, 80));

      if (isSelect) {
        if (setSelectValue(input, value)) {
          filledFields.push({ ...entry, label: entry.label || field });
        } else {
          skippedFields.push({ ...entry, label: entry.label || field });
        }
      } else {
        if (setFieldValue(input, value)) {
          filledFields.push({ ...entry, label: entry.label || field });
        }
      }
    }

    let resumeAttached = false;
    const resumeDetected = fileInputs.length > 0;

    if (fileInputs.length) {
      try {
        const resumeResult = await msg("FETCH_RESUME_PDF");
        if (resumeResult.ok) {
          const file = base64ToFile(resumeResult.data.base64, resumeResult.data.filename);
          for (const fi of fileInputs) {
            injectFileToInput(fi, file);
            fi.dataset.acpResumeHandled = "true";
          }
          resumeAttached = true;
        }
      } catch {}
    }

    const results = {
      filled: filledFields.length,
      attention: attentionFields.length,
      skipped: skippedFields.length,
      total: fields.length,
      filledFields,
      attentionFields,
      skippedFields,
      resumeAttached,
      resumeDetected,
      atsName: ats?.name ? ats.name.charAt(0).toUpperCase() + ats.name.slice(1) : null,
    };

    createSummaryPanel(results);
    return results;
  }

  // --- Banner ---

  function showBanner() {
    if (document.querySelector(".acp-autofill-banner")) return;

    const ats = detectATS();
    const atsLabel = ats ? ` (${ats.name.charAt(0).toUpperCase() + ats.name.slice(1)} detected)` : "";

    const banner = document.createElement("div");
    banner.className = "acp-autofill-banner";
    banner.innerHTML = `
      <div class="acp-autofill-banner-text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>AICareerPivot can fill in your details${atsLabel}</span>
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
      fillBtn.disabled = true;
      const result = await runAutofill();
      banner.querySelector(".acp-autofill-banner-text span").textContent =
        `Filled ${result.filled} of ${result.total} fields` +
        (result.attention ? ` — ${result.attention} need review` : "");
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

    injectClipButton();
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

  // --- One-click job clip ---

  function extractJobFromApplicationPage() {
    const url = window.location.href;
    const host = window.location.hostname;

    let company = "";
    let role = "";
    let source = "other";

    if (/linkedin\.com/.test(host)) {
      source = "linkedin";
      role = document.querySelector('.jobs-unified-top-card__job-title, .t-24')?.textContent?.trim() || "";
      company = document.querySelector('.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || "";
    } else if (/indeed\.com/.test(host)) {
      source = "indeed";
      role = document.querySelector('.jobsearch-JobInfoHeader-title, h1')?.textContent?.trim() || "";
      company = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating a')?.textContent?.trim() || "";
    } else if (/glassdoor\.com/.test(host)) {
      source = "glassdoor";
      role = document.querySelector("[data-test='job-title'], h1")?.textContent?.trim() || "";
      company = document.querySelector("[data-test='employer-name']")?.textContent?.trim() || "";
    } else if (/greenhouse\.io/.test(host)) {
      source = "greenhouse";
      role = document.querySelector('#header h1, .app-title')?.textContent?.trim() || "";
      company = document.querySelector('.company-name, #header .company')?.textContent?.trim() || "";
    } else if (/lever\.co/.test(host)) {
      source = "lever";
      role = document.querySelector('.posting-headline h2, .posting-title')?.textContent?.trim() || "";
      company = document.querySelector('.posting-headline .company, .main-header-logo img')?.getAttribute('alt') || "";
    } else {
      role = document.querySelector('h1')?.textContent?.trim() || "";
      const titleTag = document.title || "";
      const titleParts = titleTag.split(/[|\-–—]/);
      if (titleParts.length >= 2) {
        if (!role) role = titleParts[0].trim();
        company = titleParts[titleParts.length - 1].trim();
      }
    }

    if (!role && !company) return null;

    return {
      role: role.slice(0, 200),
      company: company.slice(0, 200),
      url: url.split("?")[0],
      source,
      stage: "applied",
    };
  }

  function createClipButton() {
    if (document.querySelector(".acp-clip-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "acp-clip-btn";
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      <span>Clip to Tracker</span>
    `;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const jobData = extractJobFromApplicationPage();
      if (!jobData) {
        btn.querySelector("span").textContent = "Could not detect job";
        setTimeout(() => { btn.querySelector("span").textContent = "Clip to Tracker"; }, 2000);
        return;
      }

      btn.classList.add("acp-clip-saving");
      btn.querySelector("span").textContent = "Saving…";

      const result = await msg("SAVE_JOB", jobData);

      if (result.ok) {
        btn.classList.remove("acp-clip-saving");
        btn.classList.add("acp-clip-saved");
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Clipped ✓</span>
        `;
      } else {
        btn.classList.remove("acp-clip-saving");
        btn.querySelector("span").textContent = result.error || "Error";
        setTimeout(() => { btn.querySelector("span").textContent = "Clip to Tracker"; }, 2000);
      }
    });

    return btn;
  }

  function injectClipButton() {
    const banner = document.querySelector(".acp-autofill-banner");
    if (!banner) return;

    const existing = banner.querySelector(".acp-clip-btn");
    if (existing) return;

    const btn = createClipButton();
    const skipBtn = banner.querySelector(".acp-banner-btn-skip");
    if (skipBtn) {
      banner.insertBefore(btn, skipBtn);
    } else {
      banner.appendChild(btn);
    }
  }

  // --- Init ---

  async function init() {
    const config = await msg("GET_CONFIG");
    if (!config.ok || !config.data.userEmail || !config.data.userProfile) return;

    const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
    if (disabledSites.includes(window.location.hostname)) return;

    setTimeout(() => {
      const fields = detectFormFields(detectATS());
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
