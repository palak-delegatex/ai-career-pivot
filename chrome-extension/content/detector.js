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
    greenhouse: {
      hostPattern: /greenhouse\.io/,
      selectors: {
        title: [".app-title", ".posting-headline h2", "#header h1", "h1.heading", "h1"],
        company: [".company-name", "#header .company", "span.company-name"],
        location: [".location", ".body--metadata div"],
        salary: [],
        description: ["#content", ".content-intro", "#app_body"],
        applyButton: ["#apply_button", 'a[href*="#app"]', ".btn-apply"],
      },
      source: "greenhouse",
    },
    lever: {
      hostPattern: /lever\.co/,
      selectors: {
        title: [".posting-headline h2", ".posting-title", "h2"],
        company: [".posting-headline .company", ".main-header-logo img"],
        location: [".posting-categories .location", ".sort-by-commitment", ".posting-categories .workplaceTypes"],
        salary: [],
        description: [".posting-page .content", '[data-qa="job-description"]', ".section-wrapper .section"],
        applyButton: [".posting-btn-submit", 'a[href*="apply"]'],
      },
      source: "lever",
    },
    workday: {
      hostPattern: /myworkdayjobs\.com/,
      selectors: {
        title: ['[data-automation-id="jobPostingHeader"]', "h2.css-1saizt3", "h2"],
        company: [],
        location: ['[data-automation-id="locations"]', ".css-cygeeu dd"],
        salary: [],
        description: ['[data-automation-id="jobPostingDescription"]', ".css-hboir5"],
        applyButton: ['a[data-automation-id="jobPostingApplyButton"]'],
      },
      source: "workday",
    },
    smartrecruiters: {
      hostPattern: /smartrecruiters\.com/,
      selectors: {
        title: ["h1.job-title", ".job-title", "h1"],
        company: [".company-name", ".company"],
        location: [".job-location", ".location"],
        salary: [],
        description: [".job-description", ".job-sections"],
        applyButton: [".apply-btn", 'a[href*="apply"]'],
      },
      source: "smartrecruiters",
    },
    ashby: {
      hostPattern: /ashbyhq\.com/,
      selectors: {
        title: ["h1.ashby-job-posting-brief-title", "h1"],
        company: [],
        location: [".ashby-job-posting-brief-location", '[class*="location"]'],
        salary: ['[class*="compensation"]'],
        description: [".ashby-job-posting-description", '[class*="description"]'],
        applyButton: ['a[href*="application"]', 'button[type="submit"]'],
      },
      source: "ashby",
    },
    taleo: {
      hostPattern: /taleo\.net/,
      selectors: {
        title: [".titlepage h1", ".requisitioncontenttitle", "h1"],
        company: [],
        location: [".location", ".contentlinepanel .displayfield"],
        salary: [],
        description: ["#requisitionDescriptionInterface", ".reqcontenttext", ".jobdescriptionc"],
        applyButton: ['a[href*="jobapply"]', ".applybutton"],
      },
      source: "taleo",
    },
    icims: {
      hostPattern: /icims\.com/,
      selectors: {
        title: [".iCIMS_Header h1", ".header-title", "h1"],
        company: [".iCIMS_CompanyName", ".company-name"],
        location: [".iCIMS_JobHeaderData .location", ".header-location"],
        salary: [],
        description: [".iCIMS_JobDescription", ".iCIMS_MainWrapper .description"],
        applyButton: ['a[href*="candidate"]', ".iCIMS_ApplyButton"],
      },
      source: "icims",
    },
    oracleCloud: {
      hostPattern: /oraclecloud\.com/,
      selectors: {
        title: [".job-title", "h1"],
        company: [],
        location: [".job-location", ".location"],
        salary: [],
        description: [".job-description", ".description"],
        applyButton: ['a[href*="apply"]', 'button[type="submit"]'],
      },
      source: "oracle_cloud",
    },
  };

  const ATS_PLATFORMS = {
    greenhouse: { label: "Greenhouse", fileFormat: ["PDF", "DOCX"], tip: "Include a standalone Skills section with comma-separated keywords" },
    workday: { label: "Workday", fileFormat: ["DOCX"], tip: "DOCX preferred — Workday's PDF parser is less reliable. Avoid headers/footers." },
    lever: { label: "Lever", fileFormat: ["PDF", "DOCX"], tip: "Lever's parser is forgiving — include a Summary section for keyword matching" },
    taleo: { label: "Oracle Taleo", fileFormat: ["DOCX"], tip: "Use the simplest formatting possible — Taleo has the least reliable parser" },
    icims: { label: "iCIMS", fileFormat: ["DOCX", "PDF"], tip: "Put name, email, phone on the first 3 lines for best parsing" },
    smartrecruiters: { label: "SmartRecruiters", fileFormat: ["PDF", "DOCX"], tip: "Skills sections are weighted heavily — put key skills early" },
    ashby: { label: "Ashby", fileFormat: ["PDF", "DOCX"], tip: "Modern parser — clean formatting works well, full-text search indexes everything" },
    oracle_cloud: { label: "Oracle Cloud HCM", fileFormat: ["DOCX", "PDF"], tip: "Follow the employer's specific format instructions carefully" },
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

  function detectATS() {
    const board = detectBoard();
    if (!board) return null;
    const source = board.source;
    const atsInfo = ATS_PLATFORMS[source];
    if (!atsInfo) return null;
    return {
      platform: source,
      label: atsInfo.label,
      fileFormat: atsInfo.fileFormat,
      tip: atsInfo.tip,
    };
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
        const atsInfo = detectATS();
        window.dispatchEvent(
          new CustomEvent("acp-job-detected", { detail: { jobData, board, atsInfo } })
        );
      }
    }, 800);
  }

  const observer = new MutationObserver(detectAndNotify);
  observer.observe(document.body, { childList: true, subtree: true });

  detectAndNotify();

  window.__acpDetector = { detectBoard, extractJobData, findApplyButton, detectATS, BOARD_CONFIGS, ATS_PLATFORMS };
})();
