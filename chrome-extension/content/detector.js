(() => {
  "use strict";

  const BOARD_CONFIGS = {
    linkedin: {
      hostPattern: /linkedin\.com/,
      selectors: {
        title: [
          ".job-details-jobs-unified-top-card__job-title",
          ".jobs-unified-top-card__job-title",
          "h1.t-24",
          "h2.t-24",
        ],
        company: [
          ".job-details-jobs-unified-top-card__company-name",
          ".jobs-unified-top-card__company-name",
          ".jobs-unified-top-card__subtitle-primary-grouping .app-aware-link",
        ],
        location: [
          ".job-details-jobs-unified-top-card__bullet",
          ".jobs-unified-top-card__bullet",
        ],
        salary: [
          ".job-details-jobs-unified-top-card__job-insight--highlight span",
          ".salary-main-rail__data-estimation",
        ],
        description: [
          ".jobs-description__content",
          ".jobs-box__html-content",
          "#job-details",
        ],
        applyButton: [
          ".jobs-apply-button",
          ".jobs-s-apply button",
        ],
      },
      source: "linkedin",
    },
    indeed: {
      hostPattern: /indeed\.com/,
      selectors: {
        title: [
          ".jobsearch-JobInfoHeader-title",
          "h1[data-testid='jobsearch-JobInfoHeader-title']",
          ".icl-u-xs-mb--xs h1",
        ],
        company: [
          "[data-testid='inlineHeader-companyName']",
          ".jobsearch-InlineCompanyRating a",
          ".icl-u-lg-mr--sm a",
        ],
        location: [
          "[data-testid='inlineHeader-companyLocation']",
          ".jobsearch-JobInfoHeader-subtitle div:last-child",
        ],
        salary: [
          "#salaryInfoAndJobType span",
          "[data-testid='attribute_snippet_testid']",
        ],
        description: [
          "#jobDescriptionText",
          ".jobsearch-jobDescriptionText",
        ],
        applyButton: [
          "#indeedApplyButton",
          ".jobsearch-IndeedApplyButton-newDesign",
        ],
      },
      source: "indeed",
    },
    glassdoor: {
      hostPattern: /glassdoor\.com/,
      selectors: {
        title: [
          "[data-test='job-title']",
          ".css-1vg6q84",
          "h1",
        ],
        company: [
          "[data-test='employer-name']",
          ".css-87uc0g",
          ".employerName",
        ],
        location: [
          "[data-test='location']",
          ".css-56kyx5",
        ],
        salary: [
          "[data-test='detailSalary']",
          ".css-1bluz6i",
        ],
        description: [
          ".jobDescriptionContent",
          "[data-test='description']",
          ".desc",
        ],
        applyButton: [
          "[data-test='applyButton']",
          ".gd-apply-button",
        ],
      },
      source: "glassdoor",
    },
    ziprecruiter: {
      hostPattern: /ziprecruiter\.com/,
      selectors: {
        title: [
          ".job_title",
          "h1.job-title",
          "h1",
        ],
        company: [
          ".hiring_company_text",
          "a.t_company_name",
        ],
        location: [
          ".location_text",
          ".job_location",
        ],
        salary: [
          ".salary_range",
        ],
        description: [
          ".jobDescriptionSection",
          ".job_description",
        ],
        applyButton: [
          "#apply_button",
          ".apply_now",
        ],
      },
      source: "other",
    },
  };

  function queryFirst(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function textOf(selectors) {
    const el = queryFirst(selectors);
    return el?.textContent?.trim() || "";
  }

  function detectBoard() {
    const host = window.location.hostname;
    for (const [, config] of Object.entries(BOARD_CONFIGS)) {
      if (config.hostPattern.test(host)) return config;
    }
    return null;
  }

  function extractJobData(board) {
    const title = textOf(board.selectors.title);
    const company = textOf(board.selectors.company);
    if (!title && !company) return null;

    const descriptionEl = queryFirst(board.selectors.description);
    const description = descriptionEl?.innerText?.trim() || "";

    return {
      role: title,
      company: company,
      location: textOf(board.selectors.location),
      salary: textOf(board.selectors.salary),
      description,
      url: window.location.href.split("?")[0],
      source: board.source,
    };
  }

  function findApplyButton(board) {
    return queryFirst(board.selectors.applyButton);
  }

  let lastUrl = "";
  let debounceTimer = null;

  function detectAndNotify() {
    const currentUrl = window.location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    const board = detectBoard();
    if (!board) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const jobData = extractJobData(board);
      if (jobData) {
        window.dispatchEvent(
          new CustomEvent("acp-job-detected", { detail: { jobData, board } })
        );
      }
    }, 800);
  }

  const observer = new MutationObserver(detectAndNotify);
  observer.observe(document.body, { childList: true, subtree: true });

  detectAndNotify();

  window.__acpDetector = { detectBoard, extractJobData, findApplyButton, BOARD_CONFIGS };
})();
