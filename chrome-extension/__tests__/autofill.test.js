import { describe, it, expect, beforeEach } from "vitest";

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

const RESUME_FILE_PATTERNS = /resume|cv|curriculum/i;
const RESUME_ACCEPT_TYPES = /\.pdf|\.doc|\.docx|application\/pdf|application\/msword/i;

describe("Field Identification", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function makeInput(attrs = {}) {
    const input = document.createElement("input");
    input.type = attrs.type || "text";
    for (const [k, v] of Object.entries(attrs)) {
      if (k !== "type") input.setAttribute(k, v);
    }
    document.body.appendChild(input);
    return input;
  }

  it("identifies firstName by name attribute", () => {
    expect(identifyField(makeInput({ name: "firstName" }))).toBe("firstName");
    expect(identifyField(makeInput({ name: "first_name" }))).toBe("firstName");
    expect(identifyField(makeInput({ name: "fname" }))).toBe("firstName");
  });

  it("identifies lastName", () => {
    expect(identifyField(makeInput({ name: "lastName" }))).toBe("lastName");
    expect(identifyField(makeInput({ name: "surname" }))).toBe("lastName");
    expect(identifyField(makeInput({ name: "family_name" }))).toBe("lastName");
  });

  it("identifies email", () => {
    expect(identifyField(makeInput({ name: "email" }))).toBe("email");
    expect(identifyField(makeInput({ id: "email_address" }))).toBe("email");
    expect(identifyField(makeInput({ type: "email", placeholder: "Your email" }))).toBe("email");
  });

  it("identifies phone", () => {
    expect(identifyField(makeInput({ name: "phone" }))).toBe("phone");
    expect(identifyField(makeInput({ name: "mobile_number" }))).toBe("phone");
    expect(identifyField(makeInput({ autocomplete: "tel" }))).toBe("phone");
  });

  it("identifies LinkedIn URL field", () => {
    expect(identifyField(makeInput({ name: "linkedin_url" }))).toBe("linkedin");
    expect(identifyField(makeInput({ placeholder: "LinkedIn profile" }))).toBe("linkedin");
  });

  it("identifies currentTitle / position", () => {
    expect(identifyField(makeInput({ name: "current_title" }))).toBe("currentTitle");
    expect(identifyField(makeInput({ name: "job_title" }))).toBe("currentTitle");
  });

  it("identifies github", () => {
    expect(identifyField(makeInput({ name: "github" }))).toBe("github");
    expect(identifyField(makeInput({ placeholder: "GitHub profile" }))).toBe("github");
  });

  it("identifies by aria-label", () => {
    expect(identifyField(makeInput({ "aria-label": "First Name" }))).toBe("firstName");
  });

  it("returns null for unrecognized fields", () => {
    expect(identifyField(makeInput({ name: "captcha_code" }))).toBeNull();
    expect(identifyField(makeInput({ name: "custom_field_123" }))).toBeNull();
  });
});

describe("Skip Patterns", () => {
  it("skips cover letter fields", () => {
    expect(SKIP_PATTERNS.test("cover_letter")).toBe(true);
    expect(SKIP_PATTERNS.test("coverLetter")).toBe(true);
  });

  it("skips salary/compensation fields", () => {
    expect(SKIP_PATTERNS.test("salary_expectation")).toBe(true);
    expect(SKIP_PATTERNS.test("expected_salary")).toBe(true);
  });

  it("skips EEO fields", () => {
    expect(SKIP_PATTERNS.test("gender")).toBe(true);
    expect(SKIP_PATTERNS.test("race_ethnicity")).toBe(true);
    expect(SKIP_PATTERNS.test("veteran_status")).toBe(true);
    expect(SKIP_PATTERNS.test("disability")).toBe(true);
  });

  it("skips visa/sponsorship fields", () => {
    expect(SKIP_PATTERNS.test("visa_status")).toBe(true);
    expect(SKIP_PATTERNS.test("sponsorship")).toBe(true);
    expect(SKIP_PATTERNS.test("relocation")).toBe(true);
  });

  it("does not skip regular fields", () => {
    expect(SKIP_PATTERNS.test("first_name")).toBe(false);
    expect(SKIP_PATTERNS.test("email")).toBe(false);
    expect(SKIP_PATTERNS.test("phone")).toBe(false);
  });
});

describe("Profile Mapping", () => {
  const profile = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "+1-555-0100",
    linkedin: "https://linkedin.com/in/janedoe",
    currentCompany: "Acme Corp",
    currentTitle: "Staff Engineer",
    website: "https://janedoe.dev",
    github: "https://github.com/janedoe",
    yearsExperience: "8",
    address: "123 Main St",
    city: "Portland",
    state: "OR",
    zip: "97201",
  };

  it("maps all standard fields", () => {
    expect(mapProfileToField("firstName", profile)).toBe("Jane");
    expect(mapProfileToField("lastName", profile)).toBe("Doe");
    expect(mapProfileToField("email", profile)).toBe("jane@example.com");
    expect(mapProfileToField("phone", profile)).toBe("+1-555-0100");
    expect(mapProfileToField("linkedin", profile)).toBe("https://linkedin.com/in/janedoe");
    expect(mapProfileToField("currentCompany", profile)).toBe("Acme Corp");
    expect(mapProfileToField("currentTitle", profile)).toBe("Staff Engineer");
    expect(mapProfileToField("github", profile)).toBe("https://github.com/janedoe");
    expect(mapProfileToField("yearsExperience", profile)).toBe("8");
  });

  it("constructs fullName from first + last", () => {
    expect(mapProfileToField("fullName", profile)).toBe("Jane Doe");
  });

  it("returns null for unknown fields", () => {
    expect(mapProfileToField("unknownField", profile)).toBeNull();
  });
});

describe("Resume File Detection", () => {
  it("matches resume-related names", () => {
    expect(RESUME_FILE_PATTERNS.test("upload_resume")).toBe(true);
    expect(RESUME_FILE_PATTERNS.test("cv_upload")).toBe(true);
    expect(RESUME_FILE_PATTERNS.test("curriculum_vitae")).toBe(true);
  });

  it("matches accepted file types", () => {
    expect(RESUME_ACCEPT_TYPES.test(".pdf")).toBe(true);
    expect(RESUME_ACCEPT_TYPES.test(".doc")).toBe(true);
    expect(RESUME_ACCEPT_TYPES.test(".docx")).toBe(true);
    expect(RESUME_ACCEPT_TYPES.test("application/pdf")).toBe(true);
  });

  it("rejects non-resume patterns", () => {
    expect(RESUME_FILE_PATTERNS.test("profile_picture")).toBe(false);
    expect(RESUME_FILE_PATTERNS.test("cover_photo")).toBe(false);
  });
});

describe("ATS-Specific Autofill (Greenhouse)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("detects Greenhouse form fields", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="first_name" placeholder="First Name">
        <input type="text" name="last_name" placeholder="Last Name">
        <input type="email" name="email" placeholder="Email">
        <input type="tel" name="phone" placeholder="Phone">
        <input type="url" name="linkedin_profile" placeholder="LinkedIn URL">
        <input type="file" name="resume" accept=".pdf,.doc,.docx">
      </form>
    `;

    const inputs = document.querySelectorAll('input:not([type="file"]):not([type="hidden"])');
    const identified = [];
    for (const input of inputs) {
      const field = identifyField(input);
      if (field) identified.push(field);
    }

    expect(identified).toContain("firstName");
    expect(identified).toContain("lastName");
    expect(identified).toContain("email");
    expect(identified).toContain("phone");
    expect(identified).toContain("linkedin");
  });

  it("detects Lever form fields", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="Full name">
        <input type="email" name="email" placeholder="Email">
        <input type="tel" name="phone" placeholder="Phone">
        <input type="url" name="urls[LinkedIn]" aria-label="LinkedIn URL">
        <input type="url" name="github_link" aria-label="GitHub profile">
        <input type="url" name="portfolio_link" aria-label="Portfolio">
      </form>
    `;

    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    const results = {};
    for (const input of inputs) {
      const field = identifyField(input);
      if (field) results[field] = true;
    }

    expect(results.email).toBe(true);
    expect(results.phone).toBe(true);
    expect(results.linkedin).toBe(true);
    expect(results.github).toBe(true);
  });

  it("detects Workday form fields", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="input-firstName" aria-label="First Name">
        <input type="text" id="input-lastName" aria-label="Last Name">
        <input type="email" id="input-email" aria-label="Email Address">
        <input type="tel" id="input-phone" aria-label="Phone Number">
        <input type="text" id="input-address" aria-label="Address Line 1">
        <input type="text" id="input-city" aria-label="City">
      </form>
    `;

    const inputs = document.querySelectorAll("input");
    const results = {};
    for (const input of inputs) {
      const field = identifyField(input);
      if (field) results[field] = true;
    }

    expect(results.firstName).toBe(true);
    expect(results.lastName).toBe(true);
    expect(results.email).toBe(true);
    expect(results.phone).toBe(true);
    expect(results.city).toBe(true);
  });

  it("detects Ashby form fields", () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="given_name" placeholder="First Name">
        <input type="text" name="family_name" placeholder="Last Name">
        <input type="email" name="email_address" placeholder="Email">
        <input type="tel" name="phone_number" placeholder="Phone">
        <input type="url" name="linkedin" placeholder="LinkedIn">
        <textarea name="cover_letter" rows="5" placeholder="Cover Letter"></textarea>
      </form>
    `;

    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    const results = {};
    for (const input of inputs) {
      const field = identifyField(input);
      if (field) results[field] = true;
    }

    expect(results.firstName).toBe(true);
    expect(results.lastName).toBe(true);
    expect(results.email).toBe(true);
    expect(results.phone).toBe(true);
    expect(results.linkedin).toBe(true);
  });
});

// --- Radio/Checkbox Pattern Tests ---

const RADIO_PATTERNS = {
  authorization: { pattern: /authorized|legally|right.?to.?work|eligib|legally.?authorized/i, defaultAnswer: "yes" },
  age18: { pattern: /18.?years|over.?18|at.?least.?18|are.?you.?18/i, defaultAnswer: "yes" },
  sponsorship: { pattern: /sponsor|visa.?sponsor|require.?sponsor/i, defaultAnswer: "no" },
  relocation: { pattern: /willing.?to.?relocat|open.?to.?relocat|relocat/i, defaultAnswer: null },
  drugTest: { pattern: /drug.?test|background.?check|submit.?to.?a/i, defaultAnswer: "yes" },
  commute: { pattern: /commute|commuting|travel.?to/i, defaultAnswer: "yes" },
};

describe("Radio Pattern Detection", () => {
  it("matches work authorization questions", () => {
    expect(RADIO_PATTERNS.authorization.pattern.test("Are you authorized to work in the US?")).toBe(true);
    expect(RADIO_PATTERNS.authorization.pattern.test("Are you legally authorized")).toBe(true);
    expect(RADIO_PATTERNS.authorization.pattern.test("Do you have the right to work")).toBe(true);
    expect(RADIO_PATTERNS.authorization.pattern.test("Are you eligible to work")).toBe(true);
  });

  it("matches sponsorship questions", () => {
    expect(RADIO_PATTERNS.sponsorship.pattern.test("Do you require visa sponsorship?")).toBe(true);
    expect(RADIO_PATTERNS.sponsorship.pattern.test("Will you need sponsorship")).toBe(true);
  });

  it("matches age verification", () => {
    expect(RADIO_PATTERNS.age18.pattern.test("Are you 18 years or older?")).toBe(true);
    expect(RADIO_PATTERNS.age18.pattern.test("Are you over 18")).toBe(true);
    expect(RADIO_PATTERNS.age18.pattern.test("Are you at least 18")).toBe(true);
  });

  it("matches drug test / background check", () => {
    expect(RADIO_PATTERNS.drugTest.pattern.test("Are you willing to submit to a background check?")).toBe(true);
    expect(RADIO_PATTERNS.drugTest.pattern.test("Do you agree to a drug test")).toBe(true);
  });

  it("does not match unrelated questions", () => {
    expect(RADIO_PATTERNS.authorization.pattern.test("What is your favorite color?")).toBe(false);
    expect(RADIO_PATTERNS.sponsorship.pattern.test("How many years of experience?")).toBe(false);
  });
});

// --- Next/Submit Button Pattern Tests ---

const NEXT_BTN_TEXT_PATTERNS = /^(next|continue|save\s*(?:&|and)\s*continue|proceed|save\s*(?:&|and)\s*next)$/i;
const SUBMIT_BTN_TEXT_PATTERNS = /^(submit|submit\s*application|apply|apply\s*now|send\s*application|complete\s*application)$/i;

describe("Navigation Button Detection", () => {
  it("detects next page buttons", () => {
    expect(NEXT_BTN_TEXT_PATTERNS.test("Next")).toBe(true);
    expect(NEXT_BTN_TEXT_PATTERNS.test("Continue")).toBe(true);
    expect(NEXT_BTN_TEXT_PATTERNS.test("Save & Continue")).toBe(true);
    expect(NEXT_BTN_TEXT_PATTERNS.test("Save and Continue")).toBe(true);
    expect(NEXT_BTN_TEXT_PATTERNS.test("Proceed")).toBe(true);
    expect(NEXT_BTN_TEXT_PATTERNS.test("Save & Next")).toBe(true);
  });

  it("detects submit buttons", () => {
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Submit")).toBe(true);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Submit Application")).toBe(true);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Apply")).toBe(true);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Apply Now")).toBe(true);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Send Application")).toBe(true);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Complete Application")).toBe(true);
  });

  it("does not false positive on non-submit buttons", () => {
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Save")).toBe(false);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Cancel")).toBe(false);
    expect(SUBMIT_BTN_TEXT_PATTERNS.test("Back")).toBe(false);
    expect(NEXT_BTN_TEXT_PATTERNS.test("Submit")).toBe(false);
  });
});

// --- Date Field Pattern Tests ---

describe("Date Field Detection", () => {
  const DATE_GRADUATION_PATTERN = /graduat|completion.?date/i;
  const DATE_START_PATTERN = /start.?date|earliest.?start|availab/i;

  it("matches graduation date fields", () => {
    expect(DATE_GRADUATION_PATTERN.test("Graduation Date")).toBe(true);
    expect(DATE_GRADUATION_PATTERN.test("graduation_year")).toBe(true);
    expect(DATE_GRADUATION_PATTERN.test("Expected completion date")).toBe(true);
  });

  it("matches start date / availability fields", () => {
    expect(DATE_START_PATTERN.test("Start Date")).toBe(true);
    expect(DATE_START_PATTERN.test("Earliest Start")).toBe(true);
    expect(DATE_START_PATTERN.test("Availability")).toBe(true);
    expect(DATE_START_PATTERN.test("When can you start? Available")).toBe(true);
  });
});

// --- Checkbox Pattern Tests ---

describe("Checkbox Agreement Detection", () => {
  const AGREEMENT_PATTERN = /terms|conditions|agree|acknowledge|consent|privacy.?policy|certif/i;
  const MARKETING_PATTERN = /marketing|newsletter|subscribe|opt.?in|notification/i;

  it("matches terms/conditions checkboxes", () => {
    expect(AGREEMENT_PATTERN.test("I agree to the terms and conditions")).toBe(true);
    expect(AGREEMENT_PATTERN.test("I acknowledge and consent")).toBe(true);
    expect(AGREEMENT_PATTERN.test("I certify that the above is true")).toBe(true);
    expect(AGREEMENT_PATTERN.test("Privacy Policy")).toBe(true);
  });

  it("does not match marketing checkboxes", () => {
    expect(MARKETING_PATTERN.test("Subscribe to our newsletter")).toBe(true);
    expect(MARKETING_PATTERN.test("Opt in to marketing emails")).toBe(true);
    expect(MARKETING_PATTERN.test("Receive notifications")).toBe(true);
  });

  it("excludes marketing from agreement fills", () => {
    const context = "Subscribe to our newsletter and marketing updates";
    const isAgreement = AGREEMENT_PATTERN.test(context) && !MARKETING_PATTERN.test(context);
    expect(isAgreement).toBe(false);
  });
});
