// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

const COVER_LETTER_PATTERN = /cover.?letter|motivation.?letter|letter.?of.?interest/i;
const OPEN_QUESTION_PATTERN = /why.+want|why.+interest|tell.+about|describe.+experience|what.+bring|what.+make|how.+contribute|additional.?info|anything.+else|please.+explain|elaborate/i;
const SKIP_FIELD_PATTERN = /first.?name|last.?name|full.?name|email|phone|linkedin|address|city|state|zip|salary|gender|race|ethnic|veteran|disability|visa|sponsor|website|github|portfolio/i;

function getFieldLabel(textarea) {
  if (textarea.labels?.[0]) return textarea.labels[0].textContent.trim();

  const id = textarea.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) return label.textContent.trim();
  }

  const parent = textarea.closest(".field, .form-group, .form-field, .question");
  if (parent) {
    const label = parent.querySelector("label, .label, legend");
    if (label && label.textContent.trim().length < 300) {
      return label.textContent.trim();
    }
  }

  return textarea.getAttribute("aria-label") || textarea.placeholder || textarea.name || "";
}

function classifyField(textarea) {
  const label = getFieldLabel(textarea);
  const name = textarea.name || "";
  const id = textarea.id || "";
  const combined = `${label} ${name} ${id}`;

  if (SKIP_FIELD_PATTERN.test(combined)) return null;

  if (COVER_LETTER_PATTERN.test(combined)) {
    return { type: "cover-letter", label };
  }

  if (OPEN_QUESTION_PATTERN.test(label) || (label.endsWith("?") && label.length > 15)) {
    return { type: "answer", label, question: label };
  }

  if (
    textarea.rows >= 3 ||
    textarea.getAttribute("data-min-rows") >= "3"
  ) {
    if (label.length > 20 && !SKIP_FIELD_PATTERN.test(combined)) {
      return { type: "answer", label, question: label };
    }
  }

  return null;
}

describe("Cover Letter Detection", () => {
  it("detects cover letter patterns", () => {
    expect(COVER_LETTER_PATTERN.test("cover_letter")).toBe(true);
    expect(COVER_LETTER_PATTERN.test("Cover Letter")).toBe(true);
    expect(COVER_LETTER_PATTERN.test("coverLetter")).toBe(true);
    expect(COVER_LETTER_PATTERN.test("motivation_letter")).toBe(true);
    expect(COVER_LETTER_PATTERN.test("letter_of_interest")).toBe(true);
  });

  it("does not match unrelated fields", () => {
    expect(COVER_LETTER_PATTERN.test("first_name")).toBe(false);
    expect(COVER_LETTER_PATTERN.test("email")).toBe(false);
    expect(COVER_LETTER_PATTERN.test("newsletter")).toBe(false);
  });
});

describe("Open Question Detection", () => {
  it("detects common question patterns", () => {
    expect(OPEN_QUESTION_PATTERN.test("Why do you want to work here?")).toBe(true);
    expect(OPEN_QUESTION_PATTERN.test("Tell us about your experience")).toBe(true);
    expect(OPEN_QUESTION_PATTERN.test("What would you bring to the team?")).toBe(true);
    expect(OPEN_QUESTION_PATTERN.test("Describe your experience with leadership")).toBe(true);
    expect(OPEN_QUESTION_PATTERN.test("How would you contribute to our mission?")).toBe(true);
    expect(OPEN_QUESTION_PATTERN.test("Is there anything else you'd like us to know?")).toBe(true);
    expect(OPEN_QUESTION_PATTERN.test("Please explain your interest in this role")).toBe(true);
  });

  it("does not match simple fields", () => {
    expect(OPEN_QUESTION_PATTERN.test("first_name")).toBe(false);
    expect(OPEN_QUESTION_PATTERN.test("email")).toBe(false);
    expect(OPEN_QUESTION_PATTERN.test("phone")).toBe(false);
  });
});

describe("Field Classification", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function makeTextarea(attrs = {}) {
    const ta = document.createElement("textarea");
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "rows") ta.rows = v;
      else ta.setAttribute(k, v);
    }
    document.body.appendChild(ta);
    return ta;
  }

  it("classifies cover letter textareas", () => {
    const ta = makeTextarea({ name: "cover_letter", rows: 5 });
    const result = classifyField(ta);
    expect(result).not.toBeNull();
    expect(result.type).toBe("cover-letter");
  });

  it("classifies open question textareas", () => {
    const ta = makeTextarea({
      "aria-label": "Why do you want to work here?",
      rows: 4,
    });
    const result = classifyField(ta);
    expect(result).not.toBeNull();
    expect(result.type).toBe("answer");
    expect(result.question).toContain("Why do you want to work here?");
  });

  it("classifies question-mark labels as answers", () => {
    const ta = makeTextarea({
      "aria-label": "What makes you a great fit for this role?",
      rows: 3,
    });
    const result = classifyField(ta);
    expect(result).not.toBeNull();
    expect(result.type).toBe("answer");
  });

  it("skips fields with skip patterns", () => {
    const ta1 = makeTextarea({ name: "salary_expectations", rows: 2 });
    expect(classifyField(ta1)).toBeNull();

    const ta2 = makeTextarea({ name: "visa_status", rows: 2 });
    expect(classifyField(ta2)).toBeNull();
  });

  it("skips simple name/email fields", () => {
    const ta = makeTextarea({ name: "first_name" });
    expect(classifyField(ta)).toBeNull();
  });

  it("classifies large textareas with descriptive labels as answers", () => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-group";
    const label = document.createElement("label");
    label.textContent = "Describe a challenging project you led and the outcome";
    const ta = document.createElement("textarea");
    ta.rows = 5;
    wrapper.appendChild(label);
    wrapper.appendChild(ta);
    document.body.appendChild(wrapper);

    const result = classifyField(ta);
    expect(result).not.toBeNull();
    expect(result.type).toBe("answer");
  });
});

describe("Label Extraction", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("extracts from associated label element", () => {
    document.body.innerHTML = `
      <label for="cover">Write your cover letter</label>
      <textarea id="cover"></textarea>
    `;
    const ta = document.querySelector("textarea");
    expect(getFieldLabel(ta)).toBe("Write your cover letter");
  });

  it("extracts from aria-label", () => {
    document.body.innerHTML = `<textarea aria-label="Additional information"></textarea>`;
    const ta = document.querySelector("textarea");
    expect(getFieldLabel(ta)).toBe("Additional information");
  });

  it("extracts from placeholder", () => {
    document.body.innerHTML = `<textarea placeholder="Tell us about yourself"></textarea>`;
    const ta = document.querySelector("textarea");
    expect(getFieldLabel(ta)).toBe("Tell us about yourself");
  });

  it("falls back to name attribute", () => {
    document.body.innerHTML = `<textarea name="additional_info"></textarea>`;
    const ta = document.querySelector("textarea");
    expect(getFieldLabel(ta)).toBe("additional_info");
  });
});
