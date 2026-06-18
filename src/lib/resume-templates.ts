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
  | "noir";

export type StyleCategory = "traditional" | "modern" | "creative" | "technical";
export type IndustryTag = "corporate" | "startup" | "academic";

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
};

export const STYLE_CATEGORIES: { key: StyleCategory; label: string }[] = [
  { key: "traditional", label: "Traditional" },
  { key: "modern", label: "Modern" },
  { key: "creative", label: "Creative" },
  { key: "technical", label: "Technical" },
];

export const INDUSTRY_TAGS: { key: IndustryTag; label: string }[] = [
  { key: "corporate", label: "Corporate" },
  { key: "startup", label: "Startup" },
  { key: "academic", label: "Academic" },
];

export function getTemplateConfig(key: string): TemplateConfig {
  if (key in TEMPLATE_CONFIGS) return TEMPLATE_CONFIGS[key as TemplateKey];
  return TEMPLATE_CONFIGS.modern;
}

export function isValidTemplateKey(key: string): key is TemplateKey {
  return key in TEMPLATE_CONFIGS;
}
