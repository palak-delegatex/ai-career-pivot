// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";

const BOARD_CONFIGS = {
  linkedin: {
    hostPattern: /linkedin\.com/,
    selectors: {
      title: [".job-details-jobs-unified-top-card__job-title", ".jobs-unified-top-card__job-title", "h1.t-24", "h2.t-24"],
      company: [".job-details-jobs-unified-top-card__company-name", ".jobs-unified-top-card__company-name"],
      location: [".job-details-jobs-unified-top-card__bullet", ".jobs-unified-top-card__bullet"],
      salary: [".job-details-jobs-unified-top-card__job-insight--highlight span"],
      description: [".jobs-description__content", ".jobs-box__html-content", "#job-details"],
      applyButton: [".jobs-apply-button", ".jobs-s-apply button"],
    },
    source: "linkedin",
  },
  indeed: {
    hostPattern: /indeed\.com/,
    selectors: {
      title: [".jobsearch-JobInfoHeader-title", "h1[data-testid='jobsearch-JobInfoHeader-title']"],
      company: ["[data-testid='inlineHeader-companyName']", ".jobsearch-InlineCompanyRating a"],
      location: ["[data-testid='inlineHeader-companyLocation']"],
      salary: ["#salaryInfoAndJobType span"],
      description: ["#jobDescriptionText", ".jobsearch-jobDescriptionText"],
      applyButton: ["#indeedApplyButton"],
    },
    source: "indeed",
  },
  glassdoor: {
    hostPattern: /glassdoor\.com/,
    selectors: {
      title: ["[data-test='job-title']", ".css-1vg6q84", "h1"],
      company: ["[data-test='employer-name']", ".css-87uc0g"],
      location: ["[data-test='location']"],
      salary: ["[data-test='detailSalary']"],
      description: [".jobDescriptionContent", "[data-test='description']", ".desc"],
      applyButton: ["[data-test='applyButton']"],
    },
    source: "glassdoor",
  },
  ziprecruiter: {
    hostPattern: /ziprecruiter\.com/,
    selectors: {
      title: [".job_title", "h1.job-title", "h1"],
      company: [".hiring_company_text", "a.t_company_name"],
      location: [".location_text", ".job_location"],
      salary: [".salary_range"],
      description: [".jobDescriptionSection", ".job_description"],
      applyButton: ["#apply_button", ".apply_now"],
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
};

function detectBoard(hostname) {
  for (const [, config] of Object.entries(BOARD_CONFIGS)) {
    if (config.hostPattern.test(hostname)) return config;
  }
  return null;
}

describe("Board Detection", () => {
  it("detects LinkedIn", () => {
    const board = detectBoard("www.linkedin.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("linkedin");
  });

  it("detects Indeed", () => {
    const board = detectBoard("www.indeed.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("indeed");
  });

  it("detects Glassdoor", () => {
    const board = detectBoard("www.glassdoor.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("glassdoor");
  });

  it("detects ZipRecruiter", () => {
    const board = detectBoard("www.ziprecruiter.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("other");
  });

  it("detects Greenhouse", () => {
    const board = detectBoard("boards.greenhouse.io");
    expect(board).not.toBeNull();
    expect(board.source).toBe("greenhouse");
  });

  it("detects Lever", () => {
    const board = detectBoard("jobs.lever.co");
    expect(board).not.toBeNull();
    expect(board.source).toBe("lever");
  });

  it("detects Workday", () => {
    const board = detectBoard("company.myworkdayjobs.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("workday");
  });

  it("detects SmartRecruiters", () => {
    const board = detectBoard("jobs.smartrecruiters.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("smartrecruiters");
  });

  it("detects Ashby", () => {
    const board = detectBoard("jobs.ashbyhq.com");
    expect(board).not.toBeNull();
    expect(board.source).toBe("ashby");
  });

  it("returns null for unknown sites", () => {
    expect(detectBoard("www.google.com")).toBeNull();
    expect(detectBoard("example.com")).toBeNull();
  });

  it("matches subdomains", () => {
    expect(detectBoard("jobs.linkedin.com")).not.toBeNull();
    expect(detectBoard("uk.indeed.com")).not.toBeNull();
    expect(detectBoard("de.glassdoor.com")).not.toBeNull();
  });
});

describe("Job Data Extraction", () => {
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

  function extractJobData(board) {
    const title = textOf(board.selectors.title);
    const company = textOf(board.selectors.company);
    if (!title && !company) return null;

    const descriptionEl = queryFirst(board.selectors.description);
    const description = descriptionEl?.innerText?.trim() || "";

    return {
      role: title,
      company,
      location: textOf(board.selectors.location),
      salary: textOf(board.selectors.salary),
      description,
      url: window.location.href.split("?")[0],
      source: board.source,
    };
  }

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("extracts LinkedIn job data", () => {
    document.body.innerHTML = `
      <h1 class="t-24">Senior Software Engineer</h1>
      <div class="jobs-unified-top-card__company-name">Google</div>
      <div class="jobs-unified-top-card__bullet">Mountain View, CA</div>
      <div id="job-details">Build scalable systems using Python and React.</div>
    `;
    const board = BOARD_CONFIGS.linkedin;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Senior Software Engineer");
    expect(data.company).toBe("Google");
    expect(data.location).toBe("Mountain View, CA");
    expect(data.source).toBe("linkedin");
  });

  it("extracts Indeed job data", () => {
    document.body.innerHTML = `
      <h1 data-testid="jobsearch-JobInfoHeader-title">Data Analyst</h1>
      <div data-testid="inlineHeader-companyName">Meta</div>
      <div data-testid="inlineHeader-companyLocation">New York, NY</div>
      <div id="jobDescriptionText">Analyze large datasets using SQL and Python.</div>
    `;
    const board = BOARD_CONFIGS.indeed;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Data Analyst");
    expect(data.company).toBe("Meta");
    expect(data.source).toBe("indeed");
  });

  it("extracts Glassdoor job data", () => {
    document.body.innerHTML = `
      <div data-test="job-title">Product Manager</div>
      <div data-test="employer-name">Amazon</div>
      <div data-test="location">Seattle, WA</div>
      <div data-test="description">Lead product strategy for AWS.</div>
    `;
    const board = BOARD_CONFIGS.glassdoor;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Product Manager");
    expect(data.company).toBe("Amazon");
    expect(data.source).toBe("glassdoor");
  });

  it("extracts ZipRecruiter job data", () => {
    document.body.innerHTML = `
      <h1 class="job-title">Frontend Developer</h1>
      <a class="t_company_name">Stripe</a>
      <div class="job_location">San Francisco, CA</div>
      <div class="job_description">Build payment UIs with React and TypeScript.</div>
    `;
    const board = BOARD_CONFIGS.ziprecruiter;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Frontend Developer");
    expect(data.company).toBe("Stripe");
  });

  it("returns null when no title or company found", () => {
    document.body.innerHTML = "<div>No job data here</div>";
    const board = BOARD_CONFIGS.linkedin;
    const data = extractJobData(board);
    expect(data).toBeNull();
  });

  it("extracts Greenhouse job data", () => {
    document.body.innerHTML = `
      <div id="header"><h1>Backend Engineer</h1><span class="company-name">Figma</span></div>
      <div class="location">San Francisco, CA</div>
      <div id="content">Build APIs with Go and PostgreSQL. Experience with distributed systems required.</div>
    `;
    const board = BOARD_CONFIGS.greenhouse;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Backend Engineer");
    expect(data.company).toBe("Figma");
    expect(data.source).toBe("greenhouse");
  });

  it("extracts Lever job data", () => {
    document.body.innerHTML = `
      <div class="posting-headline"><h2>Staff Engineer</h2><span class="company">Notion</span></div>
      <div class="posting-categories"><div class="location">New York, NY</div></div>
      <div class="posting-page"><div class="content">Lead technical architecture for collaboration features.</div></div>
    `;
    const board = BOARD_CONFIGS.lever;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Staff Engineer");
    expect(data.company).toBe("Notion");
    expect(data.source).toBe("lever");
  });

  it("extracts Workday job data", () => {
    document.body.innerHTML = `
      <h2 data-automation-id="jobPostingHeader">Senior Data Scientist</h2>
      <div data-automation-id="locations">Seattle, WA</div>
      <div data-automation-id="jobPostingDescription">Apply ML models at scale with Python and TensorFlow.</div>
    `;
    const board = BOARD_CONFIGS.workday;
    const data = extractJobData(board);
    expect(data).not.toBeNull();
    expect(data.role).toBe("Senior Data Scientist");
    expect(data.source).toBe("workday");
  });

  it("handles selector fallback chains", () => {
    document.body.innerHTML = `
      <div class="jobs-description__content">Job description content here</div>
      <div class="job-details-jobs-unified-top-card__job-title">Engineer</div>
      <div class="job-details-jobs-unified-top-card__company-name">Apple</div>
    `;
    const board = BOARD_CONFIGS.linkedin;
    const data = extractJobData(board);
    expect(data.role).toBe("Engineer");
    expect(data.company).toBe("Apple");
  });
});
