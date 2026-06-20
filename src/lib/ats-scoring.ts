// Deterministic ATS scoring engine with formatting checks and weighted keyword matching.
// LLM is used only for semantic gap analysis; all formatting and keyword matching is algorithmic.

// ── Types ────────────────────────────────────────────────────────────────────

export interface FormattingIssue {
  issue: string;
  severity: "critical" | "warning" | "minor";
  fix: string;
  category: "tables" | "images" | "fonts" | "headers" | "columns" | "characters" | "length" | "file_format" | "dates" | "sections" | "contact" | "links" | "bullets" | "spacing";
}

export interface KeywordMatch {
  keyword: string;
  matched: boolean;
  matchType: "exact" | "variant" | "semantic" | null;
  foundIn: string[];
  weight: number;
  category: "required" | "preferred" | "keyword";
  suggestedSection: string | null;
}

export interface SectionScore {
  section: string;
  present: boolean;
  keywordsFound: string[];
  keywordsMissing: string[];
  coverage: number;
}

export interface MatchRateBreakdown {
  overallScore: number;
  formattingScore: number;
  keywordScore: number;
  formattingIssues: FormattingIssue[];
  keywordMatches: KeywordMatch[];
  sectionScores: SectionScore[];
  summary: {
    totalKeywords: number;
    matchedKeywords: number;
    missingKeywords: number;
    exactMatches: number;
    variantMatches: number;
    semanticMatches: number;
    requiredHit: number;
    requiredTotal: number;
    preferredHit: number;
    preferredTotal: number;
  };
}

export interface ParsedSection {
  name: string;
  normalizedName: string;
  content: string;
  startIndex: number;
}

export interface JDKeywords {
  required: string[];
  preferred: string[];
  keywords: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const SECTION_HEADINGS: Record<string, string[]> = {
  contact: ["contact", "personal information", "personal details"],
  summary: ["summary", "objective", "professional summary", "career summary", "profile", "about me", "career objective"],
  experience: ["experience", "work experience", "professional experience", "employment history", "work history", "employment"],
  education: ["education", "academic background", "academic history", "qualifications"],
  skills: ["skills", "technical skills", "core competencies", "competencies", "areas of expertise", "proficiencies", "technologies"],
  certifications: ["certifications", "certificates", "licenses", "credentials", "professional development"],
  projects: ["projects", "key projects", "selected projects"],
  awards: ["awards", "honors", "achievements", "recognition"],
  publications: ["publications", "research"],
  volunteer: ["volunteer", "volunteering", "community involvement"],
};

const SECTION_KEYWORD_WEIGHT: Record<string, number> = {
  skills: 1.0,
  experience: 0.9,
  summary: 0.8,
  projects: 0.8,
  certifications: 0.7,
  education: 0.6,
  awards: 0.5,
  contact: 0.3,
  unknown: 0.4,
};

const MATCH_TYPE_WEIGHT: Record<string, number> = {
  exact: 1.0,
  variant: 0.85,
  semantic: 0.7,
};

const SKILL_VARIANTS: Record<string, string[]> = {
  // Languages
  javascript: ["js", "javascript", "ecmascript", "es6", "es2015", "es2020", "es2021", "es2022"],
  typescript: ["ts", "typescript"],
  python: ["python", "py", "python3"],
  ruby: ["ruby", "rb"],
  php: ["php"],
  "c++": ["c++", "cpp", "cplusplus"],
  "c#": ["c#", "csharp", "c sharp"],
  "objective-c": ["objective-c", "objc", "objective c"],
  java: ["java", "jvm", "j2ee", "jee"],
  go: ["go", "golang"],
  rust: ["rust", "rustlang"],
  swift: ["swift", "ios development", "swiftui"],
  kotlin: ["kotlin", "android development", "jetpack compose"],
  scala: ["scala"],
  perl: ["perl"],
  r: ["r language", "r programming", "rstats", "r-lang"],
  dart: ["dart", "dartlang"],
  lua: ["lua"],
  elixir: ["elixir"],
  haskell: ["haskell"],
  clojure: ["clojure", "clojurescript"],
  shell: ["shell", "bash", "zsh", "shell scripting", "bash scripting"],
  html: ["html", "html5"],
  css: ["css", "css3", "cascading style sheets"],
  sass: ["sass", "scss", "less"],
  // Frontend frameworks
  "react": ["react", "reactjs", "react.js", "react js"],
  "next.js": ["next", "nextjs", "next.js", "next js"],
  "vue.js": ["vue", "vuejs", "vue.js", "vue js", "vue 3", "nuxt", "nuxtjs"],
  angular: ["angular", "angularjs", "angular.js", "angular js"],
  svelte: ["svelte", "sveltekit"],
  ember: ["ember", "emberjs", "ember.js"],
  "tailwind css": ["tailwind", "tailwindcss", "tailwind css"],
  bootstrap: ["bootstrap"],
  "material ui": ["material ui", "mui", "material-ui", "material design"],
  webpack: ["webpack"],
  vite: ["vite", "vitejs"],
  // Backend frameworks
  "node.js": ["node", "nodejs", "node.js", "node js"],
  express: ["express", "expressjs", "express.js"],
  nestjs: ["nestjs", "nest.js", "nest"],
  django: ["django"],
  flask: ["flask"],
  fastapi: ["fastapi", "fast api"],
  "spring boot": ["spring", "spring boot", "springboot", "spring framework"],
  "ruby on rails": ["rails", "ruby on rails", "ror"],
  laravel: ["laravel"],
  ".net": [".net", "dotnet", "asp.net", "asp.net core", ".net core"],
  // Databases
  sql: ["sql", "mysql", "postgresql", "postgres", "mssql", "sql server", "mariadb", "sqlite"],
  nosql: ["nosql", "no-sql"],
  mongodb: ["mongodb", "mongo", "mongoose"],
  redis: ["redis"],
  elasticsearch: ["elasticsearch", "elastic search", "elk", "opensearch"],
  dynamodb: ["dynamodb", "dynamo"],
  cassandra: ["cassandra"],
  neo4j: ["neo4j", "graph database"],
  // Data & Analytics
  "apache spark": ["spark", "apache spark", "pyspark"],
  hadoop: ["hadoop", "hdfs", "mapreduce", "map reduce"],
  kafka: ["kafka", "apache kafka", "event streaming"],
  airflow: ["airflow", "apache airflow"],
  dbt: ["dbt", "data build tool"],
  snowflake: ["snowflake"],
  redshift: ["redshift", "amazon redshift"],
  bigquery: ["bigquery", "big query", "google bigquery"],
  databricks: ["databricks"],
  etl: ["etl", "elt", "data pipeline", "data pipelines"],
  "data warehouse": ["data warehouse", "data warehousing", "dwh"],
  "data modeling": ["data modeling", "data modelling", "dimensional modeling"],
  tableau: ["tableau"],
  "power bi": ["power bi", "powerbi", "power-bi"],
  looker: ["looker"],
  metabase: ["metabase"],
  // Cloud & Infrastructure
  aws: ["aws", "amazon web services", "amazon cloud"],
  gcp: ["gcp", "google cloud", "google cloud platform"],
  azure: ["azure", "microsoft azure", "ms azure"],
  docker: ["docker", "containerization", "containers", "dockerfile"],
  kubernetes: ["kubernetes", "k8s", "kube"],
  terraform: ["terraform", "iac", "infrastructure as code", "hcl"],
  ansible: ["ansible"],
  "cloud formation": ["cloudformation", "cloud formation", "aws cloudformation", "cdk", "aws cdk"],
  lambda: ["lambda", "aws lambda", "serverless functions"],
  "api gateway": ["api gateway", "aws api gateway"],
  s3: ["s3", "aws s3", "object storage"],
  ec2: ["ec2", "aws ec2"],
  ecs: ["ecs", "aws ecs", "fargate"],
  eks: ["eks", "aws eks"],
  gke: ["gke", "google kubernetes engine"],
  aks: ["aks", "azure kubernetes service"],
  heroku: ["heroku"],
  vercel: ["vercel"],
  netlify: ["netlify"],
  "ci/cd": ["ci/cd", "cicd", "ci cd", "continuous integration", "continuous deployment", "continuous delivery"],
  devops: ["devops", "dev ops", "site reliability", "sre"],
  jenkins: ["jenkins"],
  "github actions": ["github actions", "gh actions"],
  gitlab: ["gitlab", "gitlab ci", "gitlab-ci"],
  circleci: ["circleci", "circle ci"],
  // AI & ML
  "machine learning": ["ml", "machine learning"],
  "artificial intelligence": ["ai", "artificial intelligence"],
  "natural language processing": ["nlp", "natural language processing", "text mining"],
  "deep learning": ["dl", "deep learning", "neural networks", "neural network"],
  "computer vision": ["cv", "computer vision", "image recognition", "object detection"],
  tensorflow: ["tensorflow", "tf"],
  pytorch: ["pytorch", "torch"],
  "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
  pandas: ["pandas"],
  numpy: ["numpy"],
  "large language model": ["llm", "large language model", "gpt", "chatgpt", "generative ai", "gen ai"],
  "data science": ["data science", "data scientist"],
  "data analysis": ["data analysis", "analytics", "data analytics", "statistical analysis"],
  "data engineering": ["data engineering", "data engineer"],
  // Testing
  jest: ["jest"],
  mocha: ["mocha"],
  cypress: ["cypress"],
  selenium: ["selenium", "webdriver"],
  playwright: ["playwright"],
  pytest: ["pytest"],
  junit: ["junit"],
  "unit testing": ["unit testing", "unit tests", "unit test"],
  "integration testing": ["integration testing", "integration tests", "integration test"],
  "end-to-end testing": ["e2e", "end-to-end", "end to end", "e2e testing"],
  tdd: ["tdd", "test driven development", "test-driven development"],
  bdd: ["bdd", "behavior driven development", "behaviour driven development"],
  qa: ["qa", "quality assurance", "quality engineering"],
  // Version Control & Collaboration
  git: ["git", "github", "gitlab", "bitbucket", "version control"],
  jira: ["jira", "atlassian"],
  confluence: ["confluence"],
  asana: ["asana"],
  trello: ["trello"],
  slack: ["slack"],
  // Design
  figma: ["figma"],
  sketch: ["sketch"],
  "adobe xd": ["adobe xd", "xd"],
  invision: ["invision"],
  // Security
  oauth: ["oauth", "oauth2", "oauth 2.0", "openid connect", "oidc"],
  owasp: ["owasp"],
  sso: ["sso", "single sign-on", "single sign on"],
  saml: ["saml"],
  "penetration testing": ["penetration testing", "pen testing", "pentest", "pentesting"],
  soc2: ["soc2", "soc 2", "soc2 compliance"],
  // Methodologies & Soft Skills
  agile: ["agile", "scrum", "kanban", "lean", "safe", "scaled agile"],
  "project management": ["pm", "project management", "pmp", "prince2"],
  "product management": ["product management", "product manager", "product owner"],
  "user experience": ["ux", "user experience", "ux design", "ux research"],
  "user interface": ["ui", "user interface", "ui design", "ui/ux", "ux/ui"],
  "stakeholder management": ["stakeholder management", "stakeholder engagement", "stakeholder communication"],
  "cross-functional": ["cross-functional", "cross functional", "cross-team", "cross team"],
  leadership: ["leadership", "team leadership", "people management", "team management"],
  communication: ["communication", "communications", "written communication", "verbal communication"],
  "problem solving": ["problem solving", "problem-solving", "analytical thinking", "critical thinking"],
  mentoring: ["mentoring", "coaching", "mentorship"],
  // APIs & Protocols
  "rest api": ["rest", "restful", "rest api", "restful api", "rest apis"],
  graphql: ["graphql", "gql"],
  grpc: ["grpc", "protobuf", "protocol buffers"],
  websocket: ["websocket", "websockets", "ws", "socket.io"],
  microservices: ["microservices", "microservice", "micro-services", "service-oriented", "soa"],
  // Business Tools
  excel: ["excel", "spreadsheet", "ms excel", "microsoft excel"],
  salesforce: ["salesforce", "sfdc", "salesforce crm"],
  sap: ["sap", "sap erp"],
  hubspot: ["hubspot"],
  "google analytics": ["google analytics", "ga4", "ga"],
  seo: ["seo", "search engine optimization"],
  sem: ["sem", "search engine marketing", "ppc", "pay per click"],
  crm: ["crm", "customer relationship management"],
  erp: ["erp", "enterprise resource planning"],
  // Mobile
  "react native": ["react native", "rn"],
  flutter: ["flutter"],
  "ios": ["ios", "iphone", "ipad"],
  android: ["android"],
  "mobile development": ["mobile development", "mobile app", "mobile apps", "mobile application"],
  // Architecture
  "system design": ["system design", "systems design", "architecture", "software architecture"],
  "design patterns": ["design patterns", "solid principles", "solid", "gang of four"],
  "event-driven": ["event-driven", "event driven", "event sourcing", "cqrs"],
  "domain-driven design": ["ddd", "domain-driven design", "domain driven design"],
};

const ATS_UNFRIENDLY_FONTS = [
  "comic sans", "papyrus", "brush script", "impact", "copperplate",
  "curlz", "jokerman", "chiller", "kristen", "snap itc", "viner hand",
  "lucida handwriting", "mistral", "ravie", "playbill", "harlow",
];

const FANCY_CHARS = /[•‣◦⁃∙▪▫●○■□♦♥♣♠❖✧✨✩✪✰✱✲✳✴✵✶✷✸✹✺✻✼✽❋❍❈❉❂❃❄❅❆❇▶◀▲▼★☆✓✔✕✖✗✘•]/g;

// ── Section Parser ───────────────────────────────────────────────────────────

export function parseResumeIntoSections(text: string): ParsedSection[] {
  const lines = text.split("\n");
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  const headingPattern = /^(?:#{1,3}\s+)?([A-Z][A-Za-z\s&/,]+(?:Experience|Skills|Education|Summary|Objective|Projects|Certifications?|Awards?|Publications?|Contact|Profile|Competencies|Qualifications|History|Details|Background|Expertise|Technologies|Development|Licenses|Credentials|Honors|Recognition|Involvement|Achievements)?)\s*$/;
  const allCapsPattern = /^([A-Z][A-Z\s&/,]{3,})$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let detectedSection: string | null = null;
    const headingMatch = line.match(headingPattern) || line.match(allCapsPattern);

    if (headingMatch) {
      const candidate = headingMatch[1].trim().toLowerCase();
      for (const [sectionKey, aliases] of Object.entries(SECTION_HEADINGS)) {
        if (aliases.some(a => candidate.includes(a) || a.includes(candidate))) {
          detectedSection = sectionKey;
          break;
        }
      }
      if (!detectedSection && headingMatch[0].match(allCapsPattern)) {
        detectedSection = "unknown";
      }
    }

    if (detectedSection) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        name: line.replace(/^#{1,3}\s+/, "").trim(),
        normalizedName: detectedSection,
        content: "",
        startIndex: i,
      };
    } else if (currentSection) {
      currentSection.content += line + "\n";
    } else {
      if (!sections.length && !currentSection) {
        currentSection = {
          name: "Header",
          normalizedName: "contact",
          content: line + "\n",
          startIndex: i,
        };
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

// ── Formatting Checks ────────────────────────────────────────────────────────

export function detectFormattingIssues(text: string, fileType?: string): FormattingIssue[] {
  const issues: FormattingIssue[] = [];

  if (/<table[\s>]/i.test(text) || /<tr[\s>]/i.test(text) || /<td[\s>]/i.test(text)) {
    issues.push({
      issue: "HTML tables detected",
      severity: "critical",
      fix: "Remove all HTML table markup and use plain text with clear section headings instead. Most ATS systems cannot parse table cells correctly.",
      category: "tables",
    });
  }

  const mdTableLines = text.split("\n").filter(l => /^\s*\|.*\|.*\|/.test(l));
  if (mdTableLines.length >= 2) {
    issues.push({
      issue: "Markdown/text tables detected",
      severity: "critical",
      fix: "Replace table layouts with simple bulleted lists. ATS parsers read left-to-right, top-to-bottom and scramble table content.",
      category: "tables",
    });
  }

  const tabColumnLines = text.split("\n").filter(l => {
    const tabs = (l.match(/\t/g) || []).length;
    return tabs >= 2 && l.trim().length > 10;
  });
  if (tabColumnLines.length >= 3) {
    issues.push({
      issue: "Tab-separated columns detected (multi-column layout)",
      severity: "warning",
      fix: "Replace multi-column layouts with single-column format. ATS parsers may merge or scramble column content.",
      category: "columns",
    });
  }

  if (/<img[\s>]/i.test(text) || /data:image\//i.test(text)) {
    issues.push({
      issue: "Embedded images detected",
      severity: "critical",
      fix: "Remove all images, logos, and graphics. ATS systems cannot read image content and they can break document parsing.",
      category: "images",
    });
  }

  if (/\.(png|jpg|jpeg|gif|svg|bmp|ico)\b/i.test(text)) {
    issues.push({
      issue: "Image file references found",
      severity: "warning",
      fix: "Remove image references. If these are profile photos or icons, ATS cannot process them.",
      category: "images",
    });
  }

  const fontMatches = text.toLowerCase().match(/font-family:\s*['"]?([^;'"]+)/gi) || [];
  for (const fontDecl of fontMatches) {
    const fontName = fontDecl.replace(/font-family:\s*['"]?/i, "").toLowerCase();
    if (ATS_UNFRIENDLY_FONTS.some(f => fontName.includes(f))) {
      issues.push({
        issue: `Non-standard font detected: ${fontName.trim()}`,
        severity: "warning",
        fix: "Use ATS-safe fonts: Arial, Calibri, Cambria, Garamond, Georgia, Helvetica, or Times New Roman.",
        category: "fonts",
      });
    }
  }

  if (/<header[\s>]/i.test(text) || /<footer[\s>]/i.test(text)) {
    issues.push({
      issue: "HTML header/footer elements detected",
      severity: "warning",
      fix: "Move header/footer content into the main document body. Many ATS systems skip header and footer regions entirely.",
      category: "headers",
    });
  }

  const fancyCharCount = (text.match(FANCY_CHARS) || []).length;
  if (fancyCharCount > 5) {
    issues.push({
      issue: `${fancyCharCount} special/decorative characters found`,
      severity: "minor",
      fix: "Replace decorative bullets and symbols with standard characters (-, *, or plain bullets). Some ATS systems strip or misread unicode symbols.",
      category: "characters",
    });
  }

  if (/[‘’“”]/g.test(text)) {
    issues.push({
      issue: "Smart quotes (curly quotes) detected",
      severity: "minor",
      fix: "Replace smart quotes with straight quotes. Some older ATS parsers misread curly quote characters.",
      category: "characters",
    });
  }

  if (/column-count|column-width|float:\s*(left|right)/i.test(text)) {
    issues.push({
      issue: "CSS multi-column or float layout detected",
      severity: "critical",
      fix: "Use a single-column layout. CSS columns and floats cause ATS parsers to merge or reorder content incorrectly.",
      category: "columns",
    });
  }

  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 15) {
    issues.push({
      issue: "Resume appears too short (under 15 content lines)",
      severity: "warning",
      fix: "Add more detail to work experience, skills, and achievements. Short resumes score lower in ATS keyword matching.",
      category: "length",
    });
  } else if (lines.length > 200) {
    issues.push({
      issue: "Resume is very long (over 200 content lines)",
      severity: "minor",
      fix: "Consider condensing to 1-2 pages. Very long resumes can timeout some ATS parsers and dilute keyword density.",
      category: "length",
    });
  }

  if (fileType && !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(fileType)) {
    issues.push({
      issue: `File format may not be ATS-compatible: ${fileType}`,
      severity: "warning",
      fix: "Use PDF or DOCX format. These are the most widely supported by ATS systems.",
      category: "file_format",
    });
  }

  // ── Date format consistency ───────────────────────────────────────────
  const dateFormats = {
    slashNumeric: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    dashNumeric: /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    monthYear: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
    yearOnly: /\b(?:19|20)\d{2}\b/g,
  };
  const foundFormats = Object.entries(dateFormats)
    .filter(([, pat]) => pat.test(text))
    .map(([name]) => name);
  if (foundFormats.includes("slashNumeric") || foundFormats.includes("dashNumeric")) {
    if (foundFormats.includes("monthYear")) {
      issues.push({
        issue: "Inconsistent date formats (mixing numeric and month-name styles)",
        severity: "warning",
        fix: "Use a consistent date format throughout. 'Month YYYY' (e.g., 'January 2024') is the most ATS-compatible format.",
        category: "dates",
      });
    }
  }
  if (foundFormats.includes("slashNumeric") && foundFormats.includes("dashNumeric")) {
    issues.push({
      issue: "Mixed date separators (slashes and dashes)",
      severity: "minor",
      fix: "Pick one date format and use it consistently. 'Month YYYY' is safest for ATS parsing.",
      category: "dates",
    });
  }

  // ── Section ordering recommendations ──────────────────────────────────
  const sections = parseResumeIntoSections(text);
  const sectionOrder = sections.map(s => s.normalizedName);
  const experienceIdx = sectionOrder.indexOf("experience");
  const summaryIdx = sectionOrder.indexOf("summary");
  const educationIdx = sectionOrder.indexOf("education");
  const skillsIdx = sectionOrder.indexOf("skills");

  if (experienceIdx >= 0 && summaryIdx >= 0 && summaryIdx > experienceIdx) {
    issues.push({
      issue: "Summary/objective section appears after Experience",
      severity: "warning",
      fix: "Move your Summary or Objective section above Experience. ATS systems and recruiters expect to see it near the top.",
      category: "sections",
    });
  }
  if (experienceIdx >= 0 && skillsIdx >= 0 && skillsIdx < experienceIdx && educationIdx >= 0 && educationIdx < experienceIdx) {
    issues.push({
      issue: "Experience section is buried below Skills and Education",
      severity: "minor",
      fix: "For most roles, place Experience before Education. Lead with your strongest section for the role you're targeting.",
      category: "sections",
    });
  }

  const essentialSections = ["experience", "education", "skills"];
  const missingSections = essentialSections.filter(s => !sectionOrder.includes(s));
  if (missingSections.length > 0) {
    issues.push({
      issue: `Missing essential section${missingSections.length > 1 ? "s" : ""}: ${missingSections.join(", ")}`,
      severity: missingSections.includes("experience") ? "critical" : "warning",
      fix: `Add a ${missingSections.join(", ")} section. ATS systems expect these standard sections and may score lower without them.`,
      category: "sections",
    });
  }

  // ── Contact info completeness ─────────────────────────────────────────
  const contactSection = sections.find(s => s.normalizedName === "contact");
  const fullText = text.slice(0, 800);
  const contactText = contactSection ? contactSection.content + "\n" + fullText : fullText;

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(contactText);
  const hasPhone = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(contactText);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(contactText);

  const missingContact: string[] = [];
  if (!hasEmail) missingContact.push("email");
  if (!hasPhone) missingContact.push("phone number");
  if (!hasLinkedIn) missingContact.push("LinkedIn URL");

  if (missingContact.length > 0) {
    issues.push({
      issue: `Missing contact information: ${missingContact.join(", ")}`,
      severity: missingContact.includes("email") ? "critical" : "warning",
      fix: `Add your ${missingContact.join(", ")} to the top of your resume. ATS systems extract contact details for recruiter follow-up.`,
      category: "contact",
    });
  }

  // ── Hyperlink detection ───────────────────────────────────────────────
  const urlCount = (text.match(/https?:\/\/[^\s)]+/g) || []).length;
  if (urlCount > 5) {
    issues.push({
      issue: `${urlCount} hyperlinks detected`,
      severity: "minor",
      fix: "Limit hyperlinks to essential ones (LinkedIn, portfolio). Some ATS systems strip or break URLs, and excessive links clutter parsed output.",
      category: "links",
    });
  }

  // ── Bullet point consistency ──────────────────────────────────────────
  const bulletTypes = new Set<string>();
  const bulletPatterns: [RegExp, string][] = [
    [/^\s*[-–—]\s/, "dash"],
    [/^\s*[•●◦▪]\s?/, "round-bullet"],
    [/^\s*\*\s/, "asterisk"],
    [/^\s*[►▸▹→]\s?/, "arrow"],
    [/^\s*\d+[.)]\s/, "numbered"],
  ];
  for (const line of lines) {
    for (const [pat, name] of bulletPatterns) {
      if (pat.test(line)) {
        bulletTypes.add(name);
        break;
      }
    }
  }
  if (bulletTypes.size > 2) {
    issues.push({
      issue: `${bulletTypes.size} different bullet styles detected (${[...bulletTypes].join(", ")})`,
      severity: "warning",
      fix: "Use one consistent bullet style throughout your resume. Mixing styles can confuse ATS parsers and looks unprofessional.",
      category: "bullets",
    });
  }

  // ── Excessive whitespace / spacing ────────────────────────────────────
  const emptyLineRuns = text.match(/\n\s*\n\s*\n/g);
  if (emptyLineRuns && emptyLineRuns.length > 3) {
    issues.push({
      issue: "Excessive blank lines detected (large gaps between sections)",
      severity: "minor",
      fix: "Use single blank lines between sections. Excessive whitespace wastes space and some ATS systems collapse it unpredictably.",
      category: "spacing",
    });
  }

  return issues;
}

// ── Keyword Matching ─────────────────────────────────────────────────────────

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9+#./\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STEM_SUFFIXES = [
  { suffix: "ization", base: "" },
  { suffix: "isation", base: "" },
  { suffix: "ifying", base: "ify" },
  { suffix: "ating", base: "ate" },
  { suffix: "ities", base: "ity" },
  { suffix: "ment", base: "" },
  { suffix: "tion", base: "" },
  { suffix: "sion", base: "" },
  { suffix: "ness", base: "" },
  { suffix: "able", base: "" },
  { suffix: "ible", base: "" },
  { suffix: "ment", base: "" },
  { suffix: "ying", base: "y" },
  { suffix: "ling", base: "le" },
  { suffix: "ting", base: "t" },
  { suffix: "ning", base: "n" },
  { suffix: "ring", base: "r" },
  { suffix: "ging", base: "g" },
  { suffix: "ping", base: "p" },
  { suffix: "ing", base: "" },
  { suffix: "ies", base: "y" },
  { suffix: "ive", base: "" },
  { suffix: "ous", base: "" },
  { suffix: "ful", base: "" },
  { suffix: "ity", base: "" },
  { suffix: "ify", base: "" },
  { suffix: "ate", base: "" },
  { suffix: "ize", base: "" },
  { suffix: "ise", base: "" },
  { suffix: "ted", base: "t" },
  { suffix: "ned", base: "n" },
  { suffix: "red", base: "r" },
  { suffix: "ged", base: "g" },
  { suffix: "ped", base: "p" },
  { suffix: "ed", base: "" },
  { suffix: "er", base: "" },
  { suffix: "or", base: "" },
  { suffix: "al", base: "" },
  { suffix: "ly", base: "" },
  { suffix: "es", base: "" },
  { suffix: "s", base: "" },
];

function stemWord(word: string): string[] {
  if (word.length < 4) return [word];
  const stems = new Set<string>([word]);
  for (const { suffix, base } of STEM_SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length + base.length >= 3) {
      stems.add(word.slice(0, -suffix.length) + base);
    }
  }
  return [...stems];
}

function splitCompoundKeyword(keyword: string): string[] {
  return keyword
    .split(/[\/&,;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 1);
}

function getVariants(keyword: string): string[] {
  const normalized = normalizeForMatch(keyword);
  const variants = new Set<string>([normalized]);

  for (const [_canonical, alts] of Object.entries(SKILL_VARIANTS)) {
    if (alts.some(a => a === normalized || normalized.includes(a) || a.includes(normalized))) {
      for (const alt of alts) variants.add(alt);
    }
  }

  if (normalized.includes(" ")) {
    for (const word of normalized.split(" ")) {
      if (word.length > 2) variants.add(word);
    }
  }

  const noSpaces = normalized.replace(/\s+/g, "");
  if (noSpaces !== normalized) variants.add(noSpaces);
  const noDots = normalized.replace(/\./g, "");
  if (noDots !== normalized) variants.add(noDots);
  const noHyphens = normalized.replace(/ /g, "-");
  if (noHyphens !== normalized) variants.add(noHyphens);

  const stems = stemWord(normalized.replace(/\s+/g, ""));
  for (const s of stems) variants.add(s);
  if (normalized.includes(" ")) {
    for (const word of normalized.split(" ")) {
      for (const s of stemWord(word)) variants.add(s);
    }
  }

  return [...variants];
}

function findKeywordInText(keyword: string, text: string): { found: boolean; matchType: "exact" | "variant" | null } {
  const normalizedText = normalizeForMatch(text);
  const normalizedKw = normalizeForMatch(keyword);

  if (normalizedText.includes(normalizedKw)) {
    return { found: true, matchType: "exact" };
  }

  const escaped = normalizedKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundary = new RegExp(`\\b${escaped}\\b`);
  if (wordBoundary.test(normalizedText)) {
    return { found: true, matchType: "exact" };
  }

  const compounds = splitCompoundKeyword(keyword);
  if (compounds.length > 1) {
    const allFound = compounds.every(part => {
      const np = normalizeForMatch(part);
      return normalizedText.includes(np);
    });
    if (allFound) return { found: true, matchType: "exact" };
  }

  const variants = getVariants(keyword);
  for (const variant of variants) {
    if (variant === normalizedKw) continue;
    if (normalizedText.includes(variant)) {
      return { found: true, matchType: "variant" };
    }
    const variantEscaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const variantBoundary = new RegExp(`\\b${variantEscaped}\\b`);
    if (variantBoundary.test(normalizedText)) {
      return { found: true, matchType: "variant" };
    }
  }

  if (normalizedKw.includes(" ")) {
    const kwWords = normalizedKw.split(" ").filter(w => w.length > 2);
    if (kwWords.length >= 2) {
      const matchedWords = kwWords.filter(w =>
        normalizedText.includes(w) || stemWord(w).some(s => normalizedText.includes(s))
      );
      if (matchedWords.length >= Math.ceil(kwWords.length * 0.7)) {
        return { found: true, matchType: "variant" };
      }
    }
  }

  return { found: false, matchType: null };
}

const BEST_SECTION_FOR_KEYWORD: Record<string, string> = {
  required: "Skills or Experience",
  preferred: "Skills",
  keyword: "Summary or Experience",
};

export function matchKeywordsAgainstResume(
  jdKeywords: JDKeywords,
  sections: ParsedSection[],
  semanticMatches?: string[],
  sectionWeights?: Record<string, number>,
  matchTypeWeights?: Record<string, number>
): KeywordMatch[] {
  const results: KeywordMatch[] = [];
  const semanticSet = new Set((semanticMatches || []).map(s => normalizeForMatch(s)));
  const secWeights = sectionWeights ?? SECTION_KEYWORD_WEIGHT;
  const mtWeights = matchTypeWeights ?? MATCH_TYPE_WEIGHT;

  function processKeyword(keyword: string, category: "required" | "preferred" | "keyword") {
    const foundIn: string[] = [];
    let bestMatchType: "exact" | "variant" | "semantic" | null = null;
    let bestWeight = 0;

    for (const section of sections) {
      const { found, matchType } = findKeywordInText(keyword, section.content);
      if (found && matchType) {
        foundIn.push(section.name);
        const sectionWeight = secWeights[section.normalizedName] ?? secWeights.unknown ?? 0.4;
        const typeWeight = mtWeights[matchType] ?? 1.0;
        const combinedWeight = sectionWeight * typeWeight;
        if (combinedWeight > bestWeight) {
          bestWeight = combinedWeight;
          bestMatchType = matchType;
        }
      }
    }

    if (!bestMatchType && semanticSet.has(normalizeForMatch(keyword))) {
      bestMatchType = "semantic";
      bestWeight = mtWeights.semantic ?? MATCH_TYPE_WEIGHT.semantic;
    }

    results.push({
      keyword,
      matched: bestMatchType !== null,
      matchType: bestMatchType,
      foundIn,
      weight: bestWeight,
      category,
      suggestedSection: bestMatchType ? null : BEST_SECTION_FOR_KEYWORD[category],
    });
  }

  for (const kw of jdKeywords.required) processKeyword(kw, "required");
  for (const kw of jdKeywords.preferred) processKeyword(kw, "preferred");
  for (const kw of jdKeywords.keywords) processKeyword(kw, "keyword");

  return results;
}

// ── Score Computation ────────────────────────────────────────────────────────

function computeFormattingScore(issues: FormattingIssue[]): number {
  let penalty = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical": penalty += 15; break;
      case "warning": penalty += 7; break;
      case "minor": penalty += 3; break;
    }
  }
  return Math.max(0, 100 - penalty);
}

function computeKeywordScore(matches: KeywordMatch[]): number {
  if (matches.length === 0) return 100;

  const requiredMatches = matches.filter(m => m.category === "required");
  const preferredMatches = matches.filter(m => m.category === "preferred");
  const otherMatches = matches.filter(m => m.category === "keyword");

  let weightedScore = 0;
  let totalWeight = 0;

  for (const m of requiredMatches) {
    const w = 3;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }
  for (const m of preferredMatches) {
    const w = 2;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }
  for (const m of otherMatches) {
    const w = 1;
    totalWeight += w;
    if (m.matched) weightedScore += w * m.weight;
  }

  if (totalWeight === 0) return 100;
  return Math.round((weightedScore / totalWeight) * 100);
}

function computeSectionScores(sections: ParsedSection[], keywordMatches: KeywordMatch[]): SectionScore[] {
  const standardSections = ["contact", "summary", "experience", "education", "skills", "certifications"];

  return standardSections.map(sectionKey => {
    const section = sections.find(s => s.normalizedName === sectionKey);
    const sectionName = Object.keys(SECTION_HEADINGS).find(k => k === sectionKey) || sectionKey;
    const displayName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

    const kwsInSection = keywordMatches.filter(m =>
      m.foundIn.some(f => {
        const matchSection = sections.find(s => s.name === f);
        return matchSection?.normalizedName === sectionKey;
      })
    );
    const kwsMissingFromSection = keywordMatches.filter(m =>
      !m.matched && m.suggestedSection?.toLowerCase().includes(sectionKey)
    );

    const totalRelevant = kwsInSection.length + kwsMissingFromSection.length;
    const coverage = totalRelevant > 0
      ? Math.round((kwsInSection.length / totalRelevant) * 100)
      : (section ? 100 : 0);

    return {
      section: displayName,
      present: !!section,
      keywordsFound: kwsInSection.map(m => m.keyword),
      keywordsMissing: kwsMissingFromSection.map(m => m.keyword),
      coverage,
    };
  });
}

// ── Main Scoring Function ────────────────────────────────────────────────────

export function computeATSMatchBreakdown(
  resumeText: string,
  jdKeywords: JDKeywords,
  options?: {
    fileType?: string;
    semanticMatches?: string[];
    platformSectionWeights?: Partial<Record<string, number>>;
    platformMatchTypeWeights?: Partial<Record<string, number>>;
  }
): MatchRateBreakdown {
  const sections = parseResumeIntoSections(resumeText);
  const formattingIssues = detectFormattingIssues(resumeText, options?.fileType);

  const effectiveSectionWeights = { ...SECTION_KEYWORD_WEIGHT };
  if (options?.platformSectionWeights) {
    for (const [k, v] of Object.entries(options.platformSectionWeights)) {
      if (v !== undefined) effectiveSectionWeights[k] = v;
    }
  }
  const effectiveMatchWeights = { ...MATCH_TYPE_WEIGHT };
  if (options?.platformMatchTypeWeights) {
    for (const [k, v] of Object.entries(options.platformMatchTypeWeights)) {
      if (v !== undefined) effectiveMatchWeights[k] = v;
    }
  }

  const keywordMatches = matchKeywordsAgainstResume(
    jdKeywords, sections, options?.semanticMatches,
    effectiveSectionWeights, effectiveMatchWeights
  );
  const sectionScores = computeSectionScores(sections, keywordMatches);

  const formattingScore = computeFormattingScore(formattingIssues);
  const keywordScore = computeKeywordScore(keywordMatches);

  const overallScore = Math.round(formattingScore * 0.3 + keywordScore * 0.7);

  const matched = keywordMatches.filter(m => m.matched);
  const missing = keywordMatches.filter(m => !m.matched);
  const requiredKws = keywordMatches.filter(m => m.category === "required");
  const preferredKws = keywordMatches.filter(m => m.category === "preferred");

  return {
    overallScore,
    formattingScore,
    keywordScore,
    formattingIssues,
    keywordMatches,
    sectionScores,
    summary: {
      totalKeywords: keywordMatches.length,
      matchedKeywords: matched.length,
      missingKeywords: missing.length,
      exactMatches: matched.filter(m => m.matchType === "exact").length,
      variantMatches: matched.filter(m => m.matchType === "variant").length,
      semanticMatches: matched.filter(m => m.matchType === "semantic").length,
      requiredHit: requiredKws.filter(m => m.matched).length,
      requiredTotal: requiredKws.length,
      preferredHit: preferredKws.filter(m => m.matched).length,
      preferredTotal: preferredKws.length,
    },
  };
}

// ── Standalone Formatting Score (no JD needed) ───────────────────────────────

export function computeStandaloneFormattingScore(
  resumeText: string,
  fileType?: string
): { score: number; issues: FormattingIssue[] } {
  const issues = detectFormattingIssues(resumeText, fileType);
  return { score: computeFormattingScore(issues), issues };
}
