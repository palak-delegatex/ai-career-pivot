(() => {
  "use strict";

  const COVER_LETTER_PATTERN =
    /cover.?letter|motivation.?letter|letter.?of.?interest/i;
  const OPEN_QUESTION_PATTERN =
    /why.+want|why.+interest|tell.+about|describe.+experience|what.+bring|what.+make|how.+contribute|additional.?info|anything.+else|please.+explain|elaborate/i;
  const SKIP_FIELD_PATTERN =
    /first.?name|last.?name|full.?name|email|phone|linkedin|address|city|state|zip|salary|gender|race|ethnic|veteran|disability|visa|sponsor|website|github|portfolio/i;

  function msg(type, payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, payload }, resolve);
    });
  }

  function getFieldLabel(textarea) {
    if (textarea.labels?.[0]) return textarea.labels[0].textContent.trim();

    const id = textarea.id;
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label) return label.textContent.trim();
    }

    const parent = textarea.closest(
      ".field, .form-group, .form-field, .question, [class*='field'], [class*='question']"
    );
    if (parent) {
      const label = parent.querySelector(
        "label, .label, legend, [class*='label'], [class*='question-text']"
      );
      if (label && label.textContent.trim().length < 300) {
        return label.textContent.trim();
      }
    }

    const prev = textarea.previousElementSibling;
    if (
      prev &&
      (prev.tagName === "LABEL" || prev.tagName === "P" || prev.tagName === "SPAN") &&
      prev.textContent.trim().length < 300
    ) {
      return prev.textContent.trim();
    }

    return (
      textarea.getAttribute("aria-label") ||
      textarea.placeholder ||
      textarea.name ||
      ""
    );
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

    if (
      OPEN_QUESTION_PATTERN.test(label) ||
      (label.endsWith("?") && label.length > 15)
    ) {
      return { type: "answer", label, question: label };
    }

    if (
      textarea.rows >= 3 ||
      textarea.getAttribute("data-min-rows") >= "3" ||
      (textarea.style.minHeight && parseInt(textarea.style.minHeight) >= 80)
    ) {
      if (label.length > 20 && !SKIP_FIELD_PATTERN.test(combined)) {
        return { type: "answer", label, question: label };
      }
    }

    return null;
  }

  function createGenerateButton(field, textarea) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "acp-ai-gen-btn";
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z"/>
      </svg>
      <span>Generate with AI</span>
    `;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleGenerate(field, textarea, btn);
    });

    return btn;
  }

  async function getJobContext() {
    const detectedJob = window.__acpDetector
      ? (() => {
          const board = window.__acpDetector.detectBoard();
          return board ? window.__acpDetector.extractJobData(board) : null;
        })()
      : null;

    if (detectedJob) {
      return {
        jobDescription: detectedJob.description,
        jobTitle: detectedJob.role,
        company: detectedJob.company,
      };
    }

    const stored = await chrome.storage.session
      .get("lastJobContext")
      .catch(() => ({}));
    if (stored?.lastJobContext) return stored.lastJobContext;

    return {};
  }

  async function handleGenerate(field, textarea, btn) {
    const origHTML = btn.innerHTML;
    btn.classList.add("acp-ai-gen-loading");
    btn.innerHTML = `
      <span class="acp-ai-spinner"></span>
      <span>Generating...</span>
    `;
    btn.disabled = true;

    try {
      const jobContext = await getJobContext();

      const result = await msg("AI_GENERATE", {
        type: field.type,
        question: field.question || null,
        jobDescription: jobContext.jobDescription || null,
        jobTitle: jobContext.jobTitle || null,
        company: jobContext.company || null,
      });

      if (!result.ok) {
        throw new Error(result.error || "Generation failed");
      }

      showReviewModal(result.data.text, textarea, field, jobContext);
    } catch (err) {
      showError(btn, err.message);
    } finally {
      btn.innerHTML = origHTML;
      btn.classList.remove("acp-ai-gen-loading");
      btn.disabled = false;
    }
  }

  function showError(btn, message) {
    const tooltip = document.createElement("div");
    tooltip.className = "acp-ai-gen-error";
    tooltip.textContent = message;
    btn.parentElement.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 4000);
  }

  function showReviewModal(text, textarea, field, jobContext) {
    const existing = document.querySelector(".acp-ai-review-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "acp-ai-review-overlay";

    const title =
      field.type === "cover-letter"
        ? "Review Cover Letter"
        : "Review Answer";

    const questionLine =
      field.type === "answer" && field.question
        ? `<div class="acp-review-question">${escapeHtml(field.question)}</div>`
        : "";

    overlay.innerHTML = `
      <div class="acp-ai-review-modal">
        <div class="acp-review-header">
          <div class="acp-review-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z"/>
            </svg>
            <span>${title}</span>
          </div>
          <button class="acp-review-close" type="button">&times;</button>
        </div>
        ${questionLine}
        <textarea class="acp-review-editor" spellcheck="true">${escapeHtml(text)}</textarea>
        <div class="acp-review-footer">
          <div class="acp-review-meta">
            <span class="acp-review-wordcount"></span>
          </div>
          <div class="acp-review-actions">
            <button type="button" class="acp-review-btn acp-review-btn-regen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Regenerate
            </button>
            <button type="button" class="acp-review-btn acp-review-btn-cancel">Cancel</button>
            <button type="button" class="acp-review-btn acp-review-btn-insert">Insert</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const editor = overlay.querySelector(".acp-review-editor");
    const wordCount = overlay.querySelector(".acp-review-wordcount");
    const closeBtn = overlay.querySelector(".acp-review-close");
    const cancelBtn = overlay.querySelector(".acp-review-btn-cancel");
    const insertBtn = overlay.querySelector(".acp-review-btn-insert");
    const regenBtn = overlay.querySelector(".acp-review-btn-regen");

    function updateWordCount() {
      const words = editor.value.trim().split(/\s+/).filter(Boolean).length;
      wordCount.textContent = `${words} words`;
    }
    updateWordCount();
    editor.addEventListener("input", updateWordCount);

    closeBtn.addEventListener("click", () => overlay.remove());
    cancelBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    insertBtn.addEventListener("click", () => {
      setTextareaValue(textarea, editor.value);
      overlay.remove();
      textarea.classList.add("acp-field-highlight");
      setTimeout(() => textarea.classList.remove("acp-field-highlight"), 1500);
    });

    regenBtn.addEventListener("click", async () => {
      regenBtn.disabled = true;
      regenBtn.innerHTML = `<span class="acp-ai-spinner"></span> Regenerating...`;
      editor.classList.add("acp-review-editor-loading");

      try {
        const result = await msg("AI_GENERATE", {
          type: field.type,
          question: field.question || null,
          jobDescription: jobContext.jobDescription || null,
          jobTitle: jobContext.jobTitle || null,
          company: jobContext.company || null,
        });

        if (!result.ok) throw new Error(result.error);
        editor.value = result.data.text;
        updateWordCount();
      } catch (err) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "acp-ai-gen-error";
        errorDiv.style.position = "relative";
        errorDiv.textContent = err.message;
        overlay.querySelector(".acp-review-footer").prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
      } finally {
        editor.classList.remove("acp-review-editor-loading");
        regenBtn.disabled = false;
        regenBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Regenerate`;
      }
    });

    editor.focus();
  }

  function setTextareaValue(textarea, value) {
    const nativeSet =
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value"
      )?.set ||
      Object.getOwnPropertyDescriptor(
        textarea.constructor.prototype,
        "value"
      )?.set;

    if (nativeSet) {
      nativeSet.call(textarea, value);
    } else {
      textarea.value = value;
    }

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    textarea.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function scanAndInject() {
    const textareas = document.querySelectorAll("textarea");

    for (const textarea of textareas) {
      if (textarea.offsetParent === null) continue;
      if (textarea.dataset.acpAiScanned) continue;
      textarea.dataset.acpAiScanned = "1";

      const field = classifyField(textarea);
      if (!field) continue;

      const btn = createGenerateButton(field, textarea);

      const wrapper = textarea.closest(
        ".field, .form-group, .form-field, .question, [class*='field'], [class*='question']"
      );
      if (wrapper) {
        wrapper.style.position = wrapper.style.position || "relative";
        wrapper.appendChild(btn);
      } else {
        textarea.parentElement.style.position =
          textarea.parentElement.style.position || "relative";
        textarea.insertAdjacentElement("afterend", btn);
      }
    }
  }

  async function init() {
    const config = await msg("GET_CONFIG");
    if (!config.ok || !config.data.userEmail) return;

    setTimeout(scanAndInject, 2000);

    const observer = new MutationObserver(() => {
      clearTimeout(observer._timer);
      observer._timer = setTimeout(scanAndInject, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  init();
})();
