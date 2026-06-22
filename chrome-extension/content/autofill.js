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

  // --- Custom dropdown/combobox handling ---

  async function setCustomDropdownValue(trigger, value) {
    if (!value || !trigger) return false;

    trigger.click();
    await new Promise((r) => setTimeout(r, 300));

    const listboxId = trigger.getAttribute("aria-controls") || trigger.getAttribute("aria-owns");
    let listbox = listboxId ? document.getElementById(listboxId) : null;
    if (!listbox) {
      listbox = document.querySelector('[role="listbox"]:not([hidden]), [role="listbox"][style*="display"]');
    }
    if (!listbox) {
      listbox = trigger.closest("[data-automation-id]")?.querySelector('[role="listbox"]');
    }
    if (!listbox) {
      trigger.click();
      return false;
    }

    const valueLower = value.toLowerCase();
    const options = listbox.querySelectorAll('[role="option"], li, [data-automation-id*="option"]');

    let bestMatch = null;
    let bestScore = 0;

    for (const opt of options) {
      const text = opt.textContent.trim().toLowerCase();
      if (text === valueLower) { bestMatch = opt; bestScore = 100; break; }
      if (text.includes(valueLower) || valueLower.includes(text)) {
        if (50 > bestScore) { bestMatch = opt; bestScore = 50; }
      }
      const words = valueLower.split(/\s+/);
      if (words.some(w => w.length > 2 && text.includes(w))) {
        if (30 > bestScore) { bestMatch = opt; bestScore = 30; }
      }
    }

    if (bestMatch && bestScore >= 30) {
      bestMatch.click();
      await new Promise((r) => setTimeout(r, 150));
      return true;
    }

    trigger.click();
    return false;
  }

  async function setReactSelectValue(container, value) {
    if (!value || !container) return false;

    const input = container.querySelector('input[role="combobox"], input[aria-autocomplete]');
    if (input) {
      input.focus();
      setFieldValue(input, value);
      await new Promise((r) => setTimeout(r, 300));

      const menu = document.querySelector('[class*="menu"], [class*="listbox"], [role="listbox"]');
      if (menu) {
        const options = menu.querySelectorAll('[class*="option"], [role="option"]');
        for (const opt of options) {
          if (opt.textContent.trim().toLowerCase().includes(value.toLowerCase())) {
            opt.click();
            await new Promise((r) => setTimeout(r, 150));
            return true;
          }
        }
      }
    }
    return false;
  }

  // --- Radio/checkbox handling ---

  const RADIO_PATTERNS = {
    authorization: { pattern: /authorized|legally|right.?to.?work|eligib|legally.?authorized/i, defaultAnswer: "yes" },
    age18: { pattern: /18.?years|over.?18|at.?least.?18|are.?you.?18/i, defaultAnswer: "yes" },
    sponsorship: { pattern: /sponsor|visa.?sponsor|require.?sponsor/i, defaultAnswer: "no" },
    relocation: { pattern: /willing.?to.?relocat|open.?to.?relocat|relocat/i, defaultAnswer: null },
    nonCompete: { pattern: /non.?compete|non.?disclosure|nda/i, defaultAnswer: null },
    drugTest: { pattern: /drug.?test|background.?check|submit.?to.?a/i, defaultAnswer: "yes" },
    commute: { pattern: /commute|commuting|travel.?to/i, defaultAnswer: "yes" },
  };

  function detectAndFillRadios(profile) {
    const filled = [];
    const radioGroups = new Map();

    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      const name = radio.name;
      if (!name || radio.dataset.acpFilled) return;
      if (!radioGroups.has(name)) radioGroups.set(name, []);
      radioGroups.get(name).push(radio);
    });

    for (const [name, radios] of radioGroups) {
      if (radios.some((r) => r.checked)) continue;

      const context = radios.map((r) => {
        const label = r.labels?.[0]?.textContent || "";
        const parent = r.closest(".field, .form-group, [class*='field'], [class*='question']");
        const parentLabel = parent?.querySelector("label, .label, legend, [class*='label']")?.textContent || "";
        return parentLabel + " " + label;
      }).join(" ");

      for (const [key, config] of Object.entries(RADIO_PATTERNS)) {
        if (!config.pattern.test(context)) continue;

        let answer = config.defaultAnswer;
        if (key === "authorization" && profile.authorization) answer = profile.authorization;
        if (key === "sponsorship" && profile.sponsorship) answer = profile.sponsorship;
        if (key === "relocation" && profile.relocation) answer = profile.relocation;
        if (!answer) continue;

        const yesPatterns = /^yes$|^true$|^1$|^y$/i;
        const noPatterns = /^no$|^false$|^0$|^n$/i;
        const targetPattern = answer.toLowerCase() === "yes" ? yesPatterns : noPatterns;

        for (const radio of radios) {
          const radioLabel = (radio.labels?.[0]?.textContent || radio.value || "").trim();
          if (targetPattern.test(radioLabel) || radioLabel.toLowerCase() === answer.toLowerCase()) {
            radio.checked = true;
            radio.dispatchEvent(new Event("change", { bubbles: true }));
            radio.dispatchEvent(new Event("input", { bubbles: true }));
            radio.dataset.acpFilled = "true";
            filled.push({ field: key, label: context.slice(0, 60) });
            break;
          }
        }
        break;
      }
    }

    return filled;
  }

  function detectAndFillCheckboxes(profile) {
    const filled = [];

    document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      if (cb.checked || cb.dataset.acpFilled) return;

      const context = [
        cb.labels?.[0]?.textContent,
        cb.closest("label")?.textContent,
        cb.getAttribute("aria-label"),
        cb.name,
      ].filter(Boolean).join(" ");

      if (/terms|conditions|agree|acknowledge|consent|privacy.?policy|certif/i.test(context) &&
          !/marketing|newsletter|subscribe|opt.?in|notification/i.test(context)) {
        cb.checked = true;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        cb.dispatchEvent(new Event("input", { bubbles: true }));
        cb.dataset.acpFilled = "true";
        filled.push({ field: "agreement", label: context.slice(0, 60) });
      }
    });

    return filled;
  }

  // --- Date field handling ---

  function detectAndFillDates(profile) {
    const filled = [];
    const dateInputs = document.querySelectorAll(
      'input[type="date"], input[type="month"], input[data-type="date"], input[class*="date"], input[aria-label*="date" i]'
    );

    for (const input of dateInputs) {
      if (input.value || input.dataset.acpFilled) continue;
      if (input.offsetParent === null) continue;

      const context = getFieldContext(input);

      if (/graduat|completion.?date/i.test(context) && profile.education?.[0]?.year) {
        const year = profile.education[0].year;
        const dateVal = input.type === "month" ? `${year}-06` : `${year}-06-01`;
        setFieldValue(input, dateVal);
        filled.push({ field: "graduationDate", label: context.slice(0, 60) });
      } else if (/start.?date|earliest.?start|availab/i.test(context)) {
        const now = new Date();
        now.setDate(now.getDate() + 14);
        const dateVal = input.type === "month"
          ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
          : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        setFieldValue(input, dateVal);
        filled.push({ field: "startDate", label: context.slice(0, 60) });
      }
    }

    return filled;
  }

  // --- Multi-page form navigation ---

  const NEXT_BTN_SELECTORS = [
    'button[data-automation-id="bottom-navigation-next-button"]',
    'button[data-automation-id="next-button"]',
    'button[aria-label*="Next" i]',
    'button[aria-label*="Continue" i]',
    'button[aria-label*="Save and Continue" i]',
    'input[type="submit"][value*="Next" i]',
    'input[type="submit"][value*="Continue" i]',
    'a.btn[href*="next" i]',
  ];

  const NEXT_BTN_TEXT_PATTERNS = /^(next|continue|save\s*(?:&|and)\s*continue|proceed|save\s*(?:&|and)\s*next)$/i;

  const SUBMIT_BTN_SELECTORS = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[data-automation-id="bottom-navigation-submit-button"]',
    'button[aria-label*="Submit" i]',
  ];

  const SUBMIT_BTN_TEXT_PATTERNS = /^(submit|submit\s*application|apply|apply\s*now|send\s*application|complete\s*application)$/i;

  function findNextButton() {
    for (const sel of NEXT_BTN_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null && !btn.disabled) return btn;
    }

    const allButtons = document.querySelectorAll('button, input[type="submit"], a.btn, a[role="button"]');
    for (const btn of allButtons) {
      if (btn.offsetParent === null || btn.disabled) continue;
      const text = btn.textContent.trim();
      if (NEXT_BTN_TEXT_PATTERNS.test(text)) return btn;
    }

    return null;
  }

  function findSubmitButton() {
    for (const sel of SUBMIT_BTN_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) {
        const text = btn.textContent.trim() || btn.value || "";
        if (SUBMIT_BTN_TEXT_PATTERNS.test(text)) return btn;
      }
    }

    const allButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    for (const btn of allButtons) {
      if (btn.offsetParent === null) continue;
      const text = (btn.textContent || btn.value || "").trim();
      if (SUBMIT_BTN_TEXT_PATTERNS.test(text)) return btn;
    }

    return null;
  }

  function isOnFinalPage() {
    const nextBtn = findNextButton();
    const submitBtn = findSubmitButton();
    return !nextBtn && !!submitBtn;
  }

  function detectPageProgress() {
    const progressBar = document.querySelector(
      '[role="progressbar"], .progress-bar, [class*="progress"], [data-automation-id*="progress"]'
    );
    if (progressBar) {
      const val = progressBar.getAttribute("aria-valuenow") || progressBar.style.width;
      if (val) return { type: "progressbar", value: parseInt(val, 10) };
    }

    const steps = document.querySelectorAll(
      '[class*="step"], [role="tab"], .wizard-step, [data-automation-id*="step"]'
    );
    if (steps.length > 1) {
      const activeStep = document.querySelector(
        '[class*="step"][class*="active"], [class*="step"][class*="current"], [role="tab"][aria-selected="true"], [class*="step"][aria-current]'
      );
      const currentIdx = activeStep ? Array.from(steps).indexOf(activeStep) : -1;
      return { type: "steps", current: currentIdx + 1, total: steps.length };
    }

    return null;
  }

  // --- Submit prevention guard ---

  let submitGuardInstalled = false;

  function installSubmitGuard() {
    if (submitGuardInstalled) return;
    submitGuardInstalled = true;

    document.addEventListener("submit", (e) => {
      const submitter = e.submitter;
      const text = (submitter?.textContent || submitter?.value || "").trim();
      if (!SUBMIT_BTN_TEXT_PATTERNS.test(text)) return;

      if (submitter?.dataset.acpConfirmed === "true") return;

      e.preventDefault();
      e.stopImmediatePropagation();
      showSubmitConfirmation(submitter, e.target);
    }, true);

    const submitBtn = findSubmitButton();
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => {
        if (submitBtn.dataset.acpConfirmed === "true") return;

        e.preventDefault();
        e.stopImmediatePropagation();
        showSubmitConfirmation(submitBtn, submitBtn.closest("form"));
      }, true);
    }
  }

  function showSubmitConfirmation(submitBtn, form) {
    const existing = document.querySelector(".acp-submit-guard-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "acp-submit-guard-overlay";
    overlay.innerHTML = `
      <div class="acp-submit-guard-modal">
        <div class="acp-submit-guard-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Review before submitting</span>
        </div>
        <p class="acp-submit-guard-text">
          You're about to submit this application. Please review all fields before proceeding.
        </p>
        <div class="acp-submit-guard-actions">
          <button class="acp-submit-guard-btn acp-submit-guard-review" type="button">Go back & review</button>
          <button class="acp-submit-guard-btn acp-submit-guard-confirm" type="button">Submit application</button>
        </div>
      </div>
    `;

    overlay.querySelector(".acp-submit-guard-review").addEventListener("click", () => {
      overlay.remove();
    });

    overlay.querySelector(".acp-submit-guard-confirm").addEventListener("click", () => {
      overlay.remove();
      if (submitBtn) {
        submitBtn.dataset.acpConfirmed = "true";
        submitBtn.click();
        setTimeout(() => delete submitBtn.dataset.acpConfirmed, 1000);
      } else if (form) {
        form.submit();
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
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
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"], input[type="date"], input[type="month"], input:not([type]), textarea, select'
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

    if (atsAdapter?.getSelectFields) {
      const customDropdowns = atsAdapter.getSelectFields();
      for (const trigger of customDropdowns) {
        if (processedInputs.has(trigger)) continue;
        if (trigger.offsetParent === null) continue;

        const context = [
          trigger.getAttribute("aria-label"),
          trigger.getAttribute("data-automation-id"),
          trigger.textContent?.trim(),
          trigger.closest("[class*='field'], [data-automation-id]")
            ?.querySelector("label, [class*='label']")?.textContent?.trim(),
        ].filter(Boolean).join(" ");

        const field = identifyField({ ...trigger, name: "", id: "", placeholder: "",
          getAttribute: (a) => a === "aria-label" ? trigger.getAttribute("aria-label") :
            a === "data-automation-id" ? trigger.getAttribute("data-automation-id") : null,
          labels: [], closest: () => null,
        });

        if (field) {
          fields.push({
            input: trigger,
            field,
            needsAttention: false,
            isCustomDropdown: true,
            label: context.slice(0, 60),
          });
        }
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

  // --- Summary pill (persistent, collapsible) ---

  function createSummaryPill(results) {
    const existing = document.querySelector(".acp-autofill-pill");
    if (existing) existing.remove();

    const pill = document.createElement("div");
    pill.className = "acp-autofill-pill";

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
      ? `<span class="acp-pill-ats">${results.atsName}</span>`
      : "";

    const progressHtml = results.pageProgress?.type === "steps"
      ? `<div class="acp-pill-progress">Page ${results.pageProgress.current} of ${results.pageProgress.total}</div>`
      : "";

    const nextPageHtml = results.hasNextPage
      ? `<button class="acp-pill-next-btn" type="button">
          <span>Fill next page</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`
      : "";

    const finalPageHtml = results.isFinalPage
      ? `<div class="acp-pill-final-notice">Final page — review before submitting</div>`
      : "";

    pill.innerHTML = `
      <div class="acp-pill-collapsed">
        <div class="acp-pill-collapsed-content">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${results.filled} field${results.filled !== 1 ? "s" : ""} filled</span>
          ${atsLabel}
        </div>
        <div class="acp-pill-collapsed-actions">
          <button class="acp-pill-expand-btn" type="button" title="Show details">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="acp-pill-close-btn" type="button" title="Dismiss">&times;</button>
        </div>
      </div>
      <div class="acp-pill-expanded" style="display:none">
        <div class="acp-pill-expanded-header">
          <div class="acp-pill-expanded-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Autofill Complete</span>
            ${atsLabel}
          </div>
          <div class="acp-pill-expanded-actions">
            <button class="acp-pill-collapse-btn" type="button" title="Collapse">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button class="acp-pill-close-btn" type="button" title="Dismiss">&times;</button>
          </div>
        </div>
        ${progressHtml}
        <div class="acp-pill-stats">
          <div class="acp-pill-stat">
            <span class="acp-stat-num" style="color:#10b981">${results.filled}</span>
            <span class="acp-stat-label">Filled</span>
          </div>
          <div class="acp-pill-stat">
            <span class="acp-stat-num" style="color:#f59e0b">${results.attention}</span>
            <span class="acp-stat-label">Review</span>
          </div>
          <div class="acp-pill-stat">
            <span class="acp-stat-num" style="color:#64748b">${results.skipped}</span>
            <span class="acp-stat-label">Skipped</span>
          </div>
        </div>
        <div class="acp-pill-details">
          ${filledItems}${resumeHtml}${attentionItems}${skippedItems}
        </div>
        ${nextPageHtml}
        ${finalPageHtml}
        <div class="acp-pill-hint">Click the ✓ icon on any field to clear and manually edit</div>
      </div>
    `;

    const collapsedEl = pill.querySelector(".acp-pill-collapsed");
    const expandedEl = pill.querySelector(".acp-pill-expanded");

    // Expand
    pill.querySelector(".acp-pill-expand-btn").addEventListener("click", () => {
      collapsedEl.style.display = "none";
      expandedEl.style.display = "block";
      pill.classList.add("acp-pill-is-expanded");
    });

    // Collapse
    pill.querySelector(".acp-pill-collapse-btn").addEventListener("click", () => {
      expandedEl.style.display = "none";
      collapsedEl.style.display = "flex";
      pill.classList.remove("acp-pill-is-expanded");
    });

    // Close (all close buttons)
    pill.querySelectorAll(".acp-pill-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => pill.remove());
    });

    // Next page button
    const nextPageBtn = pill.querySelector(".acp-pill-next-btn");
    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        const nextBtn = findNextButton();
        if (nextBtn) {
          pill.remove();
          nextBtn.click();
        }
      });
    }

    document.body.appendChild(pill);
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
      const { input, field, needsAttention, isSelect, isEeo, isCustomDropdown } = entry;

      if (isEeo) {
        continue;
      }

      if (needsAttention) {
        input.classList.add("acp-field-attention");
        attentionFields.push(entry);
        continue;
      }

      if (!field) continue;

      const currentVal = input.value || input.textContent?.trim();
      if (currentVal && currentVal.trim() && !isCustomDropdown) {
        skippedFields.push({ ...entry, label: entry.label || field });
        continue;
      }

      const value = mapProfileToField(field, profile);
      if (!value) {
        skippedFields.push({ ...entry, label: entry.label || field });
        continue;
      }

      await new Promise((r) => setTimeout(r, 80));

      if (isCustomDropdown) {
        const filled = await setCustomDropdownValue(input, value);
        if (filled) {
          filledFields.push({ ...entry, label: entry.label || field });
        } else {
          skippedFields.push({ ...entry, label: entry.label || field });
        }
      } else if (isSelect) {
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

    const radioFilled = detectAndFillRadios(profile);
    for (const r of radioFilled) {
      filledFields.push({ input: null, field: r.field, label: r.label });
    }

    const checkboxFilled = detectAndFillCheckboxes(profile);
    for (const c of checkboxFilled) {
      filledFields.push({ input: null, field: c.field, label: c.label });
    }

    const dateFilled = detectAndFillDates(profile);
    for (const d of dateFilled) {
      filledFields.push({ input: null, field: d.field, label: d.label });
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

    if (isOnFinalPage()) {
      installSubmitGuard();
    }

    const pageProgress = detectPageProgress();
    const nextBtn = findNextButton();

    const results = {
      filled: filledFields.length,
      attention: attentionFields.length,
      skipped: skippedFields.length,
      total: fields.length + radioFilled.length + checkboxFilled.length + dateFilled.length,
      filledFields,
      attentionFields,
      skippedFields,
      resumeAttached,
      resumeDetected,
      atsName: ats?.name ? ats.name.charAt(0).toUpperCase() + ats.name.slice(1) : null,
      hasNextPage: !!nextBtn,
      isFinalPage: isOnFinalPage(),
      pageProgress,
    };

    createSummaryPill(results);
    return results;
  }

  // --- Autofill Card (compact, bottom-right) ---

  function showAutofillCard() {
    if (document.querySelector(".acp-autofill-card")) return;

    const ats = detectATS();
    const atsLabel = ats
      ? `<span class="acp-card-ats">${ats.name.charAt(0).toUpperCase() + ats.name.slice(1)} detected</span>`
      : "";

    const fields = detectFormFields(ats);
    const fieldCount = fields.filter((f) => f.field).length;
    const pageProgress = detectPageProgress();
    const progressHtml = pageProgress?.type === "steps"
      ? `<p class="acp-card-progress">Page ${pageProgress.current} of ${pageProgress.total}</p>`
      : "";

    const card = document.createElement("div");
    card.className = "acp-autofill-card";
    card.innerHTML = `
      <div class="acp-card-header">
        <div class="acp-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>AICareerPivot</span>
        </div>
        ${atsLabel}
      </div>
      <div class="acp-card-body">
        ${progressHtml}
        <p class="acp-card-field-count">${fieldCount} field${fieldCount !== 1 ? "s" : ""} detected</p>
        <div class="acp-card-actions">
          <button class="acp-card-btn acp-card-btn-fill" type="button">Autofill</button>
          <button class="acp-card-btn acp-card-btn-skip" type="button">Not now</button>
        </div>
        <a href="#" class="acp-card-never-link">Never on this site</a>
      </div>
    `;

    const fillBtn = card.querySelector(".acp-card-btn-fill");
    const skipBtn = card.querySelector(".acp-card-btn-skip");
    const neverLink = card.querySelector(".acp-card-never-link");

    fillBtn.addEventListener("click", async () => {
      fillBtn.textContent = "Filling...";
      fillBtn.disabled = true;
      const result = await runAutofill();

      let statusText = `Filled ${result.filled} of ${result.total} fields`;
      if (result.attention) statusText += ` — ${result.attention} need review`;

      card.querySelector(".acp-card-field-count").textContent = statusText;
      fillBtn.remove();

      if (result.hasNextPage) {
        const nextPageBtn = document.createElement("button");
        nextPageBtn.className = "acp-card-btn acp-card-btn-next";
        nextPageBtn.type = "button";
        nextPageBtn.innerHTML = `
          <span>Continue to next page</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        `;
        nextPageBtn.addEventListener("click", () => {
          const nextBtn = findNextButton();
          if (nextBtn) {
            card.remove();
            nextBtn.click();
          }
        });
        card.querySelector(".acp-card-actions").prepend(nextPageBtn);
        skipBtn.textContent = "Review first";
      } else if (result.isFinalPage) {
        const reviewNote = document.createElement("p");
        reviewNote.className = "acp-card-final-note";
        reviewNote.textContent = "Final page — review all fields before submitting";
        card.querySelector(".acp-card-body").appendChild(reviewNote);
        skipBtn.textContent = "Done";
      } else {
        skipBtn.textContent = "Done";
        setTimeout(() => card.remove(), 4000);
      }

      neverLink.remove();
    });

    skipBtn.addEventListener("click", () => card.remove());

    neverLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const host = window.location.hostname;
      const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
      if (!disabledSites.includes(host)) {
        disabledSites.push(host);
        await chrome.storage.sync.set({ disabledSites });
      }
      card.remove();
    });

    document.body.appendChild(card);

    injectClipButton();
  }

  function showResumeUploadBanner(fileInputs) {
    if (!fileInputs.length) return;
    const card = document.querySelector(".acp-autofill-card");
    if (!card) return;

    const existing = card.querySelector(".acp-card-btn-resume");
    if (existing) return;

    const skipBtn = card.querySelector(".acp-card-btn-skip");
    const resumeBtn = document.createElement("button");
    resumeBtn.className = "acp-card-btn acp-card-btn-resume";
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
        resumeBtn.classList.add("acp-card-btn-resume-done");
      } catch (err) {
        resumeBtn.textContent = "Upload Resume";
        resumeBtn.disabled = false;
      }
    });

    if (skipBtn) {
      card.insertBefore(resumeBtn, skipBtn);
    } else {
      card.appendChild(resumeBtn);
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
    const card = document.querySelector(".acp-autofill-card");
    if (!card) return;

    const existing = card.querySelector(".acp-clip-btn");
    if (existing) return;

    const btn = createClipButton();
    const skipBtn = card.querySelector(".acp-card-btn-skip");
    if (skipBtn) {
      card.insertBefore(btn, skipBtn);
    } else {
      card.appendChild(btn);
    }
  }

  // --- Init ---

  let lastPageUrl = "";
  let pageChangeDebounce = null;

  function onPageChange() {
    const currentUrl = window.location.href;
    if (currentUrl === lastPageUrl) return;
    lastPageUrl = currentUrl;

    if (pageChangeDebounce) clearTimeout(pageChangeDebounce);
    pageChangeDebounce = setTimeout(() => {
      const existingCard = document.querySelector(".acp-autofill-card");
      const existingPill = document.querySelector(".acp-autofill-pill");
      if (existingCard) existingCard.remove();
      if (existingPill) existingPill.remove();

      const fields = detectFormFields(detectATS());
      const fileInputs = detectFileInputs();

      if (fields.some(f => f.field) || fileInputs.length) {
        showAutofillCard();
        for (const fi of fileInputs) createResumeUploadBtn(fi);
        if (fileInputs.length) showResumeUploadBanner(fileInputs);
      }
    }, 1000);
  }

  async function init() {
    const config = await msg("GET_CONFIG");
    if (!config.ok || !config.data.userEmail || !config.data.userProfile) return;

    const { disabledSites = [] } = await chrome.storage.sync.get("disabledSites");
    if (disabledSites.includes(window.location.hostname)) return;

    lastPageUrl = window.location.href;

    setTimeout(() => {
      const fields = detectFormFields(detectATS());
      const fileInputs = detectFileInputs();

      if (fields.some(f => f.field) || fileInputs.length) showAutofillCard();

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

      onPageChange();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("popstate", onPageChange);
    window.addEventListener("hashchange", onPageChange);
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
