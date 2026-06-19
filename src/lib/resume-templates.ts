export type TemplateKey =
  | "executive"
  | "classic"
  | "modern"
  | "minimal"
  | "bold"
  | "creative"
  | "compact"
  | "tech"
  | "elegant"
  | "impact"
  | "two-column"
  | "swiss"
  | "soft"
  | "metric"
  | "noir"
  | "terminal"
  | "data"
  | "pivot"
  | "storyteller"
  | "healthcare-pro"
  | "clinical"
  | "educator"
  | "academic-cv"
  | "banker"
  | "analyst"
  | "fresh-start"
  | "intern"
  | "consulting"
  | "startup-lean"
  | "federal"
  | "sales-pro"
  | "ux-craft";

export type StyleCategory = "traditional" | "modern" | "creative" | "technical" | "career-pivot";
export type IndustryTag = "corporate" | "startup" | "academic" | "healthcare" | "education" | "finance" | "entry-level";

export interface TemplatePdfConfig {
  fontFamily: "sans" | "serif" | "mono";
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  mutedColor: string;
  bgColor: string;
  headingSize: number;
  subheadingSize: number;
  bodySize: number;
  headingStyle: "uppercase" | "capitalize" | "normal";
  headingWeight: "bold" | "extrabold";
  sectionDivider: "solid" | "dashed" | "double" | "none" | "thick";
  skillPillStyle: "filled" | "outlined" | "text" | "dark" | "gradient";
  layout: "standard" | "two-column" | "compact" | "centered";
  nameAlign: "left" | "center";
}

export interface TemplateConfig {
  key: TemplateKey;
  name: string;
  description: string;
  category: StyleCategory;
  industries: IndustryTag[];
  atsScore: number;
  features: string[];
  pdfConfig: TemplatePdfConfig;
  aiPrompt: string;
}

export const TEMPLATE_KEYS: TemplateKey[] = [
  "executive",
  "classic",
  "modern",
  "minimal",
  "bold",
  "creative",
  "compact",
  "tech",
  "elegant",
  "impact",
  "two-column",
  "swiss",
  "soft",
  "metric",
  "noir",
  "terminal",
  "data",
  "pivot",
  "storyteller",
  "healthcare-pro",
  "clinical",
  "educator",
  "academic-cv",
  "banker",
  "analyst",
  "fresh-start",
  "intern",
  "consulting",
  "startup-lean",
  "federal",
  "sales-pro",
  "ux-craft",
];

export const TEMPLATE_CONFIGS: Record<TemplateKey, TemplateConfig> = {
  executive: {
    key: "executive",
    name: "Executive",
    description: "Serif headings, teal accents. Ideal for leadership roles.",
    category: "traditional",
    industries: ["corporate"],
    atsScore: 98,
    features: [
      "Serif typography for authority",
      "Teal accent section borders",
      "ATS-optimized structure",
      "Elegant skill pills",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#0d9488",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 14,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a traditional, executive-level format with serif-styled section dividers. Formal, authoritative language. Structure for C-suite and director-level readers.",
  },

  classic: {
    key: "classic",
    name: "Classic",
    description: "Centered layout, traditional serif. Safe for any industry.",
    category: "traditional",
    industries: ["corporate", "academic"],
    atsScore: 99,
    features: [
      "Centered name and headings",
      "Traditional serif typography",
      "Maximum ATS compatibility",
      "Conservative, timeless layout",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#334155",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "text",
      layout: "centered",
      nameAlign: "center",
    },
    aiPrompt:
      "Use a traditional, centered resume format with conservative structure. Formal language throughout. Optimized for maximum ATS compatibility.",
  },

  modern: {
    key: "modern",
    name: "Modern",
    description: "Bold teal accents with rounded skill pills. Contemporary feel.",
    category: "modern",
    industries: ["startup", "corporate"],
    atsScore: 96,
    features: [
      "Bold teal accent headings",
      "Rounded skill pills",
      "Contemporary feel",
      "Clean section separation",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0d9488",
      secondaryColor: "#2dd4bf",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "thick",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a contemporary layout with bold accents and subtle stylistic touches. Slightly more personality in language while staying professional.",
  },

  minimal: {
    key: "minimal",
    name: "Minimal",
    description: "Ultra-clean with maximum whitespace. Let content speak.",
    category: "modern",
    industries: ["startup"],
    atsScore: 97,
    features: [
      "Maximum whitespace",
      "Subtle typography",
      "Content-first design",
      "Light, airy layout",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#64748b",
      secondaryColor: "#334155",
      textColor: "#334155",
      mutedColor: "#94a3b8",
      bgColor: "#ffffff",
      headingSize: 12,
      subheadingSize: 10,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use an ultra-clean, streamlined format. Short bullet points, no filler, maximum information density. Let whitespace and content do the talking.",
  },

  bold: {
    key: "bold",
    name: "Bold",
    description: "Dark header block with strong contrast. High impact first impression.",
    category: "modern",
    industries: ["corporate", "startup"],
    atsScore: 95,
    features: [
      "Dark header block",
      "High contrast design",
      "Impactful first impression",
      "Strong visual hierarchy",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0f172a",
      secondaryColor: "#2dd4bf",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "solid",
      skillPillStyle: "dark",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a bold, high-impact format with strong contrast. Confident language, powerful action verbs. Structure for maximum visual impact.",
  },

  creative: {
    key: "creative",
    name: "Creative",
    description: "Gradient sidebar accent. For design-adjacent and startup roles.",
    category: "creative",
    industries: ["startup"],
    atsScore: 88,
    features: [
      "Gradient sidebar accent",
      "Design-forward layout",
      "Creative typography",
      "Unique visual identity",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0d9488",
      secondaryColor: "#06b6d4",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "none",
      skillPillStyle: "gradient",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a creative, design-forward format with personality. Show creative thinking through language choices. Balance creativity with professionalism.",
  },

  compact: {
    key: "compact",
    name: "Compact",
    description: "High density, two-column skills. Fit more on one page.",
    category: "traditional",
    industries: ["corporate"],
    atsScore: 95,
    features: [
      "High information density",
      "Two-column skill layout",
      "Fits more on one page",
      "Efficient use of space",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0d9488",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 11,
      subheadingSize: 9,
      bodySize: 9,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "compact",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a compact, high-density format. Extremely concise bullet points. Abbreviate where appropriate. Maximize information per line.",
  },

  tech: {
    key: "tech",
    name: "Tech",
    description: "Monospace type, code-style headings. Built for engineers.",
    category: "technical",
    industries: ["startup"],
    atsScore: 94,
    features: [
      "Monospace typography",
      "Code-style section headings",
      "Developer-friendly format",
      "Technical skill emphasis",
    ],
    pdfConfig: {
      fontFamily: "mono",
      primaryColor: "#0d9488",
      secondaryColor: "#2dd4bf",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 12,
      subheadingSize: 10,
      bodySize: 9,
      headingStyle: "normal",
      headingWeight: "bold",
      sectionDivider: "dashed",
      skillPillStyle: "dark",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a technical, developer-friendly format. Include code-style section prefixes (// Summary). Emphasize technical skills, tools, and frameworks prominently.",
  },

  elegant: {
    key: "elegant",
    name: "Elegant",
    description: "Centered serif with decorative dividers. Refined and polished.",
    category: "traditional",
    industries: ["corporate", "academic"],
    atsScore: 96,
    features: [
      "Centered serif layout",
      "Decorative dividers",
      "Refined typography",
      "Polished presentation",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#0d9488",
      secondaryColor: "#334155",
      textColor: "#334155",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "none",
      skillPillStyle: "text",
      layout: "centered",
      nameAlign: "center",
    },
    aiPrompt:
      "Use an elegant, refined format with centered headings and serif typography. Polished, sophisticated language. Decorative dividers between sections.",
  },

  impact: {
    key: "impact",
    name: "Impact",
    description: "Top color bar with heavy section weight. Results-focused.",
    category: "modern",
    industries: ["corporate", "startup"],
    atsScore: 97,
    features: [
      "Top color accent bar",
      "Heavy section headings",
      "Results-focused layout",
      "Strong visual hierarchy",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0d9488",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 14,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "thick",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use an impact-driven format emphasizing measurable results. Lead every bullet with a quantifiable achievement. Bold section headings.",
  },

  "two-column": {
    key: "two-column",
    name: "Two-Column",
    description: "Dark sidebar with main content area. Modern and structured.",
    category: "creative",
    industries: ["startup"],
    atsScore: 85,
    features: [
      "Dark sidebar layout",
      "Contact and skills in sidebar",
      "Main content area for experience",
      "Modern structured design",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#2dd4bf",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 12,
      subheadingSize: 10,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "two-column",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a two-column layout. Keep contact info, skills, and certifications concise for sidebar placement. Main area focuses on experience and summary.",
  },

  swiss: {
    key: "swiss",
    name: "Swiss",
    description: "International typographic style. Oversized name, clean grid.",
    category: "creative",
    industries: ["startup"],
    atsScore: 96,
    features: [
      "Oversized name typography",
      "International design style",
      "Clean grid layout",
      "Bold typographic hierarchy",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0f172a",
      secondaryColor: "#ef4444",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 14,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "none",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a Swiss international typographic style. Bold name, clean grid structure. Concise, direct language. Red accent for role title.",
  },

  soft: {
    key: "soft",
    name: "Soft",
    description: "Warm amber tones on cream background. Approachable and friendly.",
    category: "creative",
    industries: ["academic"],
    atsScore: 93,
    features: [
      "Warm amber color palette",
      "Cream background",
      "Approachable, friendly feel",
      "Soft, rounded elements",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#92400e",
      secondaryColor: "#b45309",
      textColor: "#451a03",
      mutedColor: "#78716c",
      bgColor: "#fefce8",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a warm, approachable format with friendly language. Soft transitions between sections. Ideal for education, non-profit, and people-facing roles.",
  },

  metric: {
    key: "metric",
    name: "Metric",
    description: "Key metrics boxes at top. Data-driven and analytical.",
    category: "technical",
    industries: ["corporate", "startup"],
    atsScore: 94,
    features: [
      "Key metric highlight boxes",
      "Data-driven layout",
      "Analytical presentation",
      "Numbers-first approach",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0d9488",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a metrics-driven format. Start with 3-4 key achievement metrics (years experience, projects delivered, revenue impact, team size). Every bullet must include a number.",
  },

  noir: {
    key: "noir",
    name: "Noir",
    description: "Dark background with teal accents. Dramatic and distinctive.",
    category: "creative",
    industries: ["startup"],
    atsScore: 82,
    features: [
      "Dark background theme",
      "Teal accent typography",
      "Dramatic visual impact",
      "Unique and memorable",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#2dd4bf",
      secondaryColor: "#94a3b8",
      textColor: "#e2e8f0",
      mutedColor: "#94a3b8",
      bgColor: "#0f172a",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "extrabold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a bold, dramatic format. Confident, assertive language. Strong action verbs throughout. This resume will render on a dark background.",
  },

  terminal: {
    key: "terminal",
    name: "Terminal",
    description: "Green-on-dark terminal aesthetic. Built for CLI-native engineers.",
    category: "technical",
    industries: ["startup"],
    atsScore: 91,
    features: [
      "Terminal window header",
      "Green monospace typography",
      "Command-line section prefixes",
      "Dark background theme",
    ],
    pdfConfig: {
      fontFamily: "mono",
      primaryColor: "#22c55e",
      secondaryColor: "#16a34a",
      textColor: "#e2e8f0",
      mutedColor: "#64748b",
      bgColor: "#0c0c0c",
      headingSize: 12,
      subheadingSize: 10,
      bodySize: 9,
      headingStyle: "normal",
      headingWeight: "bold",
      sectionDivider: "dashed",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a terminal/CLI-inspired format. Section prefixes use $ (e.g., $ Summary). Technical jargon welcome. Emphasize command-line tools, scripts, and infrastructure.",
  },

  data: {
    key: "data",
    name: "Data",
    description: "Indigo metric boxes with data-driven layout. For analysts and scientists.",
    category: "technical",
    industries: ["corporate", "startup"],
    atsScore: 94,
    features: [
      "Indigo metric highlight boxes",
      "Data-driven layout",
      "Analytical presentation",
      "Numbers-first approach",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#4f46e5",
      secondaryColor: "#312e81",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a data-driven format with indigo accents. Start with 3-4 key metrics (data points processed, models built, accuracy improvements). Every bullet must include a quantifiable result.",
  },

  pivot: {
    key: "pivot",
    name: "Career Pivot",
    description: "Skills-first layout with transferable skills badge. For career changers.",
    category: "career-pivot",
    industries: ["corporate", "startup"],
    atsScore: 95,
    features: [
      "Transferable skills badge",
      "Skills-first ordering",
      "Career narrative section",
      "Cross-industry friendly",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#7c3aed",
      secondaryColor: "#a78bfa",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a career-pivot format emphasizing transferable skills. Lead with a strong career narrative explaining the transition. Group skills by transferability. Reframe past experience in terms of the target role.",
  },

  storyteller: {
    key: "storyteller",
    name: "Storyteller",
    description: "Narrative-driven layout for career transitions. Your journey, told well.",
    category: "career-pivot",
    industries: ["startup", "corporate"],
    atsScore: 92,
    features: [
      "Narrative career summary",
      "Journey-focused structure",
      "Warm, engaging tone",
      "Transition-friendly format",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#7c3aed",
      secondaryColor: "#6d28d9",
      textColor: "#1e1b4b",
      mutedColor: "#6b7280",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "center",
    },
    aiPrompt:
      "Use a narrative, story-driven format. Open with a compelling career summary that tells the transition story. Use warm, engaging language. Connect past roles to future aspirations naturally.",
  },

  "healthcare-pro": {
    key: "healthcare-pro",
    name: "Healthcare Pro",
    description: "Clean blue layout for healthcare professionals. HIPAA-aware structure.",
    category: "traditional",
    industries: ["healthcare"],
    atsScore: 97,
    features: [
      "Healthcare-focused structure",
      "Certifications prominence",
      "Clean blue color scheme",
      "Compliance-friendly layout",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0369a1",
      secondaryColor: "#0284c7",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a healthcare-professional format. Emphasize certifications, licenses, and clinical experience. Include patient care metrics. Use terminology appropriate for healthcare hiring managers.",
  },

  clinical: {
    key: "clinical",
    name: "Clinical",
    description: "Structured clinical format for nursing and allied health roles.",
    category: "traditional",
    industries: ["healthcare"],
    atsScore: 96,
    features: [
      "Clinical experience focus",
      "License & certification section",
      "Structured patient metrics",
      "Professional blue-gray palette",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#1e40af",
      secondaryColor: "#1e3a5f",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "double",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "center",
    },
    aiPrompt:
      "Use a clinical resume format. Prioritize licenses, certifications, and clinical rotations. Include patient population details and care metrics. Formal medical terminology is expected.",
  },

  educator: {
    key: "educator",
    name: "Educator",
    description: "Warm layout for teachers and educators. Highlights methodology and impact.",
    category: "traditional",
    industries: ["education"],
    atsScore: 97,
    features: [
      "Teaching philosophy section",
      "Warm green color scheme",
      "Curriculum & methodology focus",
      "Student outcome metrics",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#15803d",
      secondaryColor: "#166534",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "outlined",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use an education-focused format. Include teaching philosophy, curriculum development, and student outcomes. Highlight pedagogical methods and classroom management achievements.",
  },

  "academic-cv": {
    key: "academic-cv",
    name: "Academic CV",
    description: "Multi-page academic format for research and publications.",
    category: "traditional",
    industries: ["academic", "education"],
    atsScore: 98,
    features: [
      "Publications & grants section",
      "Research focus areas",
      "Traditional academic format",
      "Citation-friendly structure",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#334155",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "text",
      layout: "standard",
      nameAlign: "center",
    },
    aiPrompt:
      "Use a traditional academic CV format. Include research interests, publications, grants, and teaching experience. Formal academic language. List presentations and conference talks.",
  },

  banker: {
    key: "banker",
    name: "Banker",
    description: "Navy pinstripe-inspired layout for finance and banking professionals.",
    category: "traditional",
    industries: ["finance", "corporate"],
    atsScore: 98,
    features: [
      "Navy professional palette",
      "Deal & portfolio metrics",
      "Conservative formatting",
      "Financial terminology focus",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#1e3a5f",
      secondaryColor: "#0c2340",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "double",
      skillPillStyle: "text",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a conservative finance format. Emphasize deal sizes, portfolio values, and financial metrics prominently. Formal, precise language. Include regulatory and compliance experience.",
  },

  analyst: {
    key: "analyst",
    name: "Analyst",
    description: "Chart-inspired layout for financial and business analysts.",
    category: "technical",
    industries: ["finance", "corporate"],
    atsScore: 95,
    features: [
      "Metric highlight boxes",
      "Analytical structure",
      "Financial modeling focus",
      "Data visualization emphasis",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0369a1",
      secondaryColor: "#0c4a6e",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "thick",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use an analyst-focused format. Lead with key analytical achievements and metrics. Emphasize tools (Excel, SQL, Python, Tableau). Include financial modeling and data analysis experience.",
  },

  "fresh-start": {
    key: "fresh-start",
    name: "Fresh Start",
    description: "Bright, optimistic layout for new graduates and career starters.",
    category: "modern",
    industries: ["entry-level"],
    atsScore: 96,
    features: [
      "Education-first layout",
      "Project showcase section",
      "Bright, optimistic palette",
      "Skills-forward design",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0d9488",
      secondaryColor: "#14b8a6",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a fresh graduate format. Lead with education, then projects and internships. Highlight academic achievements, relevant coursework, and extracurriculars. Enthusiastic but professional tone.",
  },

  intern: {
    key: "intern",
    name: "Intern",
    description: "Concise single-page format optimized for internship applications.",
    category: "modern",
    industries: ["entry-level", "startup"],
    atsScore: 95,
    features: [
      "Single-page optimized",
      "Project & coursework focus",
      "Clean, simple structure",
      "Extracurricular highlights",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#6366f1",
      secondaryColor: "#818cf8",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 12,
      subheadingSize: 10,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "filled",
      layout: "compact",
      nameAlign: "left",
    },
    aiPrompt:
      "Use an internship-optimized format. Focus on relevant coursework, academic projects, and skills. Keep it to one page. Highlight leadership in student organizations and relevant extracurriculars.",
  },

  consulting: {
    key: "consulting",
    name: "Consulting",
    description: "Structured case-style layout for management consulting roles.",
    category: "traditional",
    industries: ["corporate", "finance"],
    atsScore: 97,
    features: [
      "Case-study structure",
      "Impact-first bullets",
      "Clean professional layout",
      "Firm-ready formatting",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#0f172a",
      secondaryColor: "#1e293b",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "thick",
      skillPillStyle: "dark",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a consulting-style format. Lead every bullet with measurable impact (revenue, efficiency, cost savings). Structure achievements as situation-action-result. Precise, concise language.",
  },

  "startup-lean": {
    key: "startup-lean",
    name: "Startup Lean",
    description: "Zero-fluff layout for fast-moving startup environments.",
    category: "modern",
    industries: ["startup"],
    atsScore: 93,
    features: [
      "Zero-fluff structure",
      "Rapid-scan layout",
      "Startup-speak friendly",
      "High density, low waste",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#ea580c",
      secondaryColor: "#f97316",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 12,
      subheadingSize: 10,
      bodySize: 9,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "none",
      skillPillStyle: "filled",
      layout: "compact",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a lean startup format. No fluff — every word earns its place. Emphasize velocity, ownership, and 0-to-1 experience. Use startup terminology naturally. Dense and scannable.",
  },

  federal: {
    key: "federal",
    name: "Federal",
    description: "USAJobs-compatible format for government and public sector roles.",
    category: "traditional",
    industries: ["corporate"],
    atsScore: 99,
    features: [
      "Government-compliant format",
      "GS-level compatible",
      "Maximum ATS score",
      "Detailed experience blocks",
    ],
    pdfConfig: {
      fontFamily: "serif",
      primaryColor: "#1e3a5f",
      secondaryColor: "#0f172a",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "bold",
      sectionDivider: "solid",
      skillPillStyle: "text",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a federal resume format compatible with USAJobs. Include hours per week, supervisor info placeholders, and detailed duty descriptions. Formal government language. Maximum compliance.",
  },

  "sales-pro": {
    key: "sales-pro",
    name: "Sales Pro",
    description: "Results-driven layout with quota attainment highlights.",
    category: "modern",
    industries: ["corporate"],
    atsScore: 95,
    features: [
      "Quota attainment highlights",
      "Revenue metrics up front",
      "Dynamic, energetic palette",
      "Achievement-first structure",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#dc2626",
      secondaryColor: "#b91c1c",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "uppercase",
      headingWeight: "extrabold",
      sectionDivider: "thick",
      skillPillStyle: "filled",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a sales-focused format. Lead with quota attainment percentages and revenue numbers. Emphasize pipeline generation, deal sizes, and client acquisition. Energetic, results-driven language.",
  },

  "ux-craft": {
    key: "ux-craft",
    name: "UX Craft",
    description: "Design-forward layout for UX researchers and product designers.",
    category: "creative",
    industries: ["startup"],
    atsScore: 87,
    features: [
      "Portfolio-ready structure",
      "Design process emphasis",
      "Clean typographic hierarchy",
      "Research & metrics focus",
    ],
    pdfConfig: {
      fontFamily: "sans",
      primaryColor: "#9333ea",
      secondaryColor: "#a855f7",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      bgColor: "#ffffff",
      headingSize: 13,
      subheadingSize: 11,
      bodySize: 10,
      headingStyle: "capitalize",
      headingWeight: "bold",
      sectionDivider: "none",
      skillPillStyle: "gradient",
      layout: "standard",
      nameAlign: "left",
    },
    aiPrompt:
      "Use a UX/design-focused format. Emphasize design process (research, wireframing, testing, iteration). Include usability metrics and user research findings. Reference portfolio pieces.",
  },
};

export const STYLE_CATEGORIES: { key: StyleCategory; label: string }[] = [
  { key: "traditional", label: "Traditional" },
  { key: "modern", label: "Modern" },
  { key: "creative", label: "Creative" },
  { key: "technical", label: "Technical" },
  { key: "career-pivot", label: "Career Pivot" },
];

export const INDUSTRY_TAGS: { key: IndustryTag; label: string }[] = [
  { key: "corporate", label: "Corporate" },
  { key: "startup", label: "Startup" },
  { key: "academic", label: "Academic" },
  { key: "healthcare", label: "Healthcare" },
  { key: "education", label: "Education" },
  { key: "finance", label: "Finance" },
  { key: "entry-level", label: "Entry Level" },
];

export function getTemplateConfig(key: string): TemplateConfig {
  if (key in TEMPLATE_CONFIGS) return TEMPLATE_CONFIGS[key as TemplateKey];
  return TEMPLATE_CONFIGS.modern;
}

export function isValidTemplateKey(key: string): key is TemplateKey {
  return key in TEMPLATE_CONFIGS;
}
