// ATS platform detection — URL patterns, meta tags, DOM signatures, and resume formatting tips.

export type ATSPlatform =
  | "greenhouse"
  | "workday"
  | "lever"
  | "taleo"
  | "icims"
  | "smartrecruiters"
  | "ashby"
  | "jobvite"
  | "successfactors"
  | "bamboohr"
  | "jazz"
  | "breezy"
  | "recruitee"
  | "workable"
  | "applytojob"
  | "oracle_cloud"
  | "unknown";

export interface ATSSignature {
  platform: ATSPlatform;
  label: string;
  urlPatterns: RegExp[];
  metaTags?: { name?: string; property?: string; contentPattern?: RegExp }[];
  domSignatures?: { selector: string; attribute?: string; pattern?: RegExp }[];
}

export interface ATSDetectionResult {
  detected: boolean;
  platform: ATSPlatform;
  label: string;
  confidence: "high" | "medium" | "low";
  matchedSignal: "url" | "meta" | "dom";
}

export interface ATSFormattingRecommendation {
  platform: ATSPlatform;
  label: string;
  fileFormat: string[];
  tips: string[];
  avoid: string[];
  parserQuirks: string[];
}

// ── ATS Signature Database ─────────────────────────────────────────────────

export const ATS_SIGNATURES: ATSSignature[] = [
  {
    platform: "greenhouse",
    label: "Greenhouse",
    urlPatterns: [
      /boards\.greenhouse\.io/i,
      /job-boards\.greenhouse\.io/i,
      /greenhouse\.io\/.*\/jobs\//i,
    ],
    metaTags: [
      { property: "og:site_name", contentPattern: /greenhouse/i },
    ],
    domSignatures: [
      { selector: "#app_body[class*='greenhouse']" },
      { selector: "meta[name='csrf-param'][content='authenticity_token']" },
      { selector: "#grnhse_app" },
      { selector: "script[src*='greenhouse']" },
    ],
  },
  {
    platform: "workday",
    label: "Workday",
    urlPatterns: [
      /\.myworkdayjobs\.com/i,
      /myworkdaysite\.com/i,
      /workday\.com\/.*\/job\//i,
    ],
    metaTags: [
      { property: "og:site_name", contentPattern: /workday/i },
    ],
    domSignatures: [
      { selector: "[data-automation-id='jobPostingHeader']" },
      { selector: "[data-automation-id='jobPostingPage']" },
      { selector: "div.css-1q2dra3" },
    ],
  },
  {
    platform: "lever",
    label: "Lever",
    urlPatterns: [
      /jobs\.lever\.co/i,
      /lever\.co\/.*\/apply/i,
    ],
    metaTags: [
      { property: "og:site_name", contentPattern: /lever/i },
    ],
    domSignatures: [
      { selector: ".posting-page" },
      { selector: ".posting-headline" },
      { selector: "[data-qa='job-description']" },
      { selector: "div.posting-apply" },
    ],
  },
  {
    platform: "taleo",
    label: "Oracle Taleo",
    urlPatterns: [
      /\.taleo\.net/i,
      /taleo\.net\/careersection/i,
    ],
    domSignatures: [
      { selector: "#ftlform" },
      { selector: ".titlepage" },
      { selector: "[class*='taleo']" },
      { selector: "#requisitionDescriptionInterface" },
    ],
  },
  {
    platform: "icims",
    label: "iCIMS",
    urlPatterns: [
      /\.icims\.com/i,
      /icims\.com\/jobs\//i,
    ],
    domSignatures: [
      { selector: ".iCIMS_MainWrapper" },
      { selector: "#iCIMS_Header" },
      { selector: "[class*='icims']" },
      { selector: ".iCIMS_JobDescription" },
    ],
  },
  {
    platform: "smartrecruiters",
    label: "SmartRecruiters",
    urlPatterns: [
      /jobs\.smartrecruiters\.com/i,
      /smartrecruiters\.com\/.*\/posting\//i,
    ],
    metaTags: [
      { property: "og:site_name", contentPattern: /smartrecruiters/i },
    ],
    domSignatures: [
      { selector: ".job-details" },
      { selector: "[class*='smartrecruiters']" },
    ],
  },
  {
    platform: "ashby",
    label: "Ashby",
    urlPatterns: [
      /jobs\.ashbyhq\.com/i,
      /ashbyhq\.com\/.*\/application/i,
    ],
    domSignatures: [
      { selector: ".ashby-job-posting-brief-title" },
      { selector: ".ashby-job-posting-description" },
      { selector: "[class*='ashby']" },
    ],
  },
  {
    platform: "jobvite",
    label: "Jobvite",
    urlPatterns: [
      /jobs\.jobvite\.com/i,
      /jobvite\.com\/.*\/job\//i,
    ],
    domSignatures: [
      { selector: ".jv-page-body" },
      { selector: ".jv-job-detail" },
      { selector: "[class*='jobvite']" },
    ],
  },
  {
    platform: "successfactors",
    label: "SAP SuccessFactors",
    urlPatterns: [
      /successfactors\.com/i,
      /successfactors\.eu/i,
      /jobs\.sap\.com/i,
    ],
    domSignatures: [
      { selector: "[class*='successfactors']" },
      { selector: "#jobReqCareerPage" },
    ],
  },
  {
    platform: "bamboohr",
    label: "BambooHR",
    urlPatterns: [
      /\.bamboohr\.com\/careers/i,
      /\.bamboohr\.com\/jobs/i,
    ],
    domSignatures: [
      { selector: "[class*='BambooHR']" },
      { selector: ".BambooHR-ATS-board" },
    ],
  },
  {
    platform: "jazz",
    label: "JazzHR",
    urlPatterns: [
      /\.applytojob\.com/i,
      /app\.jazz\.co/i,
    ],
    domSignatures: [
      { selector: ".jazzhr-job-board" },
      { selector: "[class*='jazzhr']" },
    ],
  },
  {
    platform: "breezy",
    label: "Breezy HR",
    urlPatterns: [
      /\.breezy\.hr/i,
    ],
    domSignatures: [
      { selector: "[class*='breezy']" },
      { selector: ".breezy-careers" },
    ],
  },
  {
    platform: "recruitee",
    label: "Recruitee",
    urlPatterns: [
      /\.recruitee\.com/i,
      /careers\.recruitee\.com/i,
    ],
    domSignatures: [
      { selector: "[class*='recruitee']" },
      { selector: "#recruitee-careers" },
    ],
  },
  {
    platform: "workable",
    label: "Workable",
    urlPatterns: [
      /apply\.workable\.com/i,
      /jobs\.workable\.com/i,
    ],
    domSignatures: [
      { selector: "[class*='workable']" },
      { selector: "#workable-job" },
    ],
  },
  {
    platform: "oracle_cloud",
    label: "Oracle Cloud HCM",
    urlPatterns: [
      /\.oraclecloud\.com\/hcmUI\/CandidateExperience/i,
    ],
    domSignatures: [
      { selector: "[class*='oracle']" },
    ],
  },
];

// ── URL-based Detection ────────────────────────────────────────────────────

export function detectATSFromURL(url: string): ATSDetectionResult {
  for (const sig of ATS_SIGNATURES) {
    for (const pattern of sig.urlPatterns) {
      if (pattern.test(url)) {
        return {
          detected: true,
          platform: sig.platform,
          label: sig.label,
          confidence: "high",
          matchedSignal: "url",
        };
      }
    }
  }

  return {
    detected: false,
    platform: "unknown",
    label: "Unknown",
    confidence: "low",
    matchedSignal: "url",
  };
}

// ── ATS-Specific Resume Formatting Recommendations ─────────────────────────

export const ATS_FORMATTING_RECOMMENDATIONS: ATSFormattingRecommendation[] = [
  {
    platform: "greenhouse",
    label: "Greenhouse",
    fileFormat: ["PDF", "DOCX"],
    tips: [
      "Use standard section headings — Greenhouse parses 'Experience', 'Education', 'Skills' reliably",
      "Include a standalone Skills section with comma-separated keywords",
      "Use reverse chronological order for work experience",
      "Place contact info at the top in plain text, not in a header/footer",
    ],
    avoid: [
      "Tables or multi-column layouts — Greenhouse flattens them row-by-row",
      "Images, logos, or embedded graphics",
      "Creative fonts or decorative characters",
    ],
    parserQuirks: [
      "Greenhouse auto-populates application fields from the uploaded resume — check that parsed fields are correct before submitting",
      "LinkedIn profile URL in your resume header helps Greenhouse cross-reference your profile",
    ],
  },
  {
    platform: "workday",
    label: "Workday",
    fileFormat: ["DOCX", "PDF"],
    tips: [
      "DOCX is preferred over PDF — Workday's parser handles DOCX structure more reliably",
      "Use standard heading names exactly: 'Work Experience', 'Education', 'Skills'",
      "Include full dates (Month Year) for employment periods",
      "Spell out abbreviations at least once — Workday keyword matching is literal",
    ],
    avoid: [
      "PDF with complex formatting — Workday sometimes loses content from styled PDFs",
      "Headers and footers — Workday skips them entirely",
      "Two-column layouts — content gets interleaved incorrectly",
      "Text boxes or floating elements",
    ],
    parserQuirks: [
      "Workday often requires manual re-entry of parsed fields — review every auto-filled field",
      "Workday's keyword search is exact-match; include both acronyms and spelled-out forms",
      "Some Workday instances truncate resumes beyond 2 pages",
    ],
  },
  {
    platform: "lever",
    label: "Lever",
    fileFormat: ["PDF", "DOCX"],
    tips: [
      "Lever's parser is relatively forgiving — both PDF and DOCX work well",
      "Use clear section breaks with bold or larger text headings",
      "Include a Summary/Objective section at the top for keyword matching",
      "List skills as a bulleted or comma-separated list for clean extraction",
    ],
    avoid: [
      "Overly designed resumes with graphics or icons",
      "Unusual section names — Lever maps to standard categories",
    ],
    parserQuirks: [
      "Lever supports LinkedIn-import for applications — your LinkedIn profile should mirror your resume",
      "Lever's search indexes the full resume text, so natural keyword placement helps",
    ],
  },
  {
    platform: "taleo",
    label: "Oracle Taleo",
    fileFormat: ["DOCX"],
    tips: [
      "Taleo strongly prefers DOCX — its PDF parser is unreliable",
      "Use the most basic formatting possible: Times New Roman or Arial, 10-12pt",
      "Use simple bullet points (• or -) not custom symbols",
      "Include exact job titles and company names on their own lines",
      "Spell out all acronyms at first use",
    ],
    avoid: [
      "PDF files — Taleo's PDF parsing is notoriously unreliable",
      "Any tables, columns, or text boxes",
      "Headers, footers, and page numbers",
      "Hyperlinks embedded in text (use plain URLs instead)",
      "Fancy characters, smart quotes, or em-dashes",
    ],
    parserQuirks: [
      "Taleo is one of the oldest ATS platforms and has the worst parser — simplicity is critical",
      "Taleo's keyword matching is case-insensitive but exact — 'JavaScript' won't match a search for 'JS'",
      "Many Taleo instances have character limits on fields; keep descriptions concise",
      "Taleo sometimes splits multi-line bullet points into separate entries",
    ],
  },
  {
    platform: "icims",
    label: "iCIMS",
    fileFormat: ["DOCX", "PDF"],
    tips: [
      "Use standard section headings — iCIMS maps content to predefined categories",
      "Put your name, email, and phone on the first 3 lines",
      "Use simple formatting with consistent structure throughout",
      "Include location (City, State) near your contact information",
    ],
    avoid: [
      "Complex layouts or graphics",
      "Headers/footers for critical contact info",
      "Unusual fonts or heavy formatting",
    ],
    parserQuirks: [
      "iCIMS auto-creates a candidate profile from your resume — verify parsed fields in the portal",
      "iCIMS supports keyword search and boolean queries — match JD language exactly",
    ],
  },
  {
    platform: "smartrecruiters",
    label: "SmartRecruiters",
    fileFormat: ["PDF", "DOCX"],
    tips: [
      "SmartRecruiters has a modern parser — both PDF and DOCX work well",
      "Include a professional summary with targeted keywords",
      "Use consistent date formatting throughout",
      "List certifications in a dedicated section",
    ],
    avoid: [
      "Excessive formatting or design elements",
      "Non-standard section names",
    ],
    parserQuirks: [
      "SmartRecruiters supports LinkedIn Easy Apply — ensure your LinkedIn and resume are consistent",
      "Its AI matching weighs skills sections heavily — put key skills early",
    ],
  },
  {
    platform: "ashby",
    label: "Ashby",
    fileFormat: ["PDF", "DOCX"],
    tips: [
      "Ashby is newer with a modern parser — clean formatting works well",
      "Include a skills section with technology-specific keywords",
      "Use standard reverse-chronological format",
    ],
    avoid: [
      "Overly creative formatting",
      "Embedded images or charts",
    ],
    parserQuirks: [
      "Ashby allows candidates to see their application status — your parsed resume is visible to you",
      "Ashby's search is full-text, so keyword placement throughout the document matters",
    ],
  },
  {
    platform: "jobvite",
    label: "Jobvite",
    fileFormat: ["DOCX", "PDF"],
    tips: [
      "Use clear, standard formatting with consistent fonts",
      "Include keywords from the job description in natural context",
      "Place contact info at the document top, not in a header",
    ],
    avoid: [
      "Tables or multi-column layouts",
      "Graphics, charts, or embedded images",
    ],
    parserQuirks: [
      "Jobvite's parser works best with structured DOCX files",
      "Jobvite supports social referrals — your public profiles should match",
    ],
  },
  {
    platform: "successfactors",
    label: "SAP SuccessFactors",
    fileFormat: ["DOCX", "PDF"],
    tips: [
      "Use straightforward formatting — SuccessFactors has an enterprise-grade but literal parser",
      "Include exact job titles that match the posting",
      "Use standard date formats (Month Year) consistently",
    ],
    avoid: [
      "Complex PDF layouts",
      "Tables or multi-column designs",
      "Creative section names",
    ],
    parserQuirks: [
      "SuccessFactors is common in large enterprises — follow the employer's specific instructions carefully",
      "Some SuccessFactors instances require you to re-enter resume data manually after upload",
    ],
  },
  {
    platform: "bamboohr",
    label: "BambooHR",
    fileFormat: ["PDF", "DOCX"],
    tips: [
      "BambooHR's job board is simpler — most applications go directly to the hiring manager",
      "Clear, readable formatting matters more than ATS optimization here",
      "Include a compelling summary since humans read these more directly",
    ],
    avoid: [
      "Overly long resumes — BambooHR is used by SMBs where hiring managers review directly",
    ],
    parserQuirks: [
      "BambooHR is often used by smaller companies — your resume may be reviewed by a non-recruiter",
    ],
  },
];

export function getFormattingRecommendations(
  platform: ATSPlatform
): ATSFormattingRecommendation | null {
  return ATS_FORMATTING_RECOMMENDATIONS.find((r) => r.platform === platform) ?? null;
}

export function getGenericRecommendations(): ATSFormattingRecommendation {
  return {
    platform: "unknown",
    label: "General ATS",
    fileFormat: ["DOCX", "PDF"],
    tips: [
      "Use a single-column layout with standard section headings",
      "Use standard fonts: Arial, Calibri, Times New Roman (10-12pt)",
      "Include keywords from the job description naturally throughout your resume",
      "Put contact info at the top in plain text",
      "Use reverse chronological order for experience",
      "Include both acronyms and full terms for key skills (e.g., 'Machine Learning (ML)')",
    ],
    avoid: [
      "Tables, text boxes, columns, or any complex layout",
      "Images, logos, graphics, charts, or icons",
      "Headers and footers for important content",
      "Creative or non-standard fonts",
      "Special characters or decorative symbols",
    ],
    parserQuirks: [
      "When in doubt, DOCX is the safest format across all ATS platforms",
      "Always review auto-populated fields after uploading your resume",
      "Match your resume language exactly to the job description for best keyword scores",
    ],
  };
}
