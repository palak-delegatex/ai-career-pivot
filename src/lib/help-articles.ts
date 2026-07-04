export interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  routes: string[];
  content: string;
}

export const helpArticles: HelpArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    summary: "How to create your first career pivot plan",
    routes: ["/onboarding", "/dashboard"],
    content:
      "Upload your resume or enter your details manually, and our AI will extract your skills, experience, and education. Then we generate personalized career transition paths with actionable milestones.",
  },
  {
    id: "resume-upload",
    title: "Resume Upload",
    summary: "Tips for getting the best results from your resume",
    routes: ["/onboarding"],
    content:
      "PDF or DOCX works best. Our AI extracts skills, experience, and education automatically. The more complete your resume, the more targeted your pivot plan will be.",
  },
  {
    id: "linkedin-import",
    title: "LinkedIn Import",
    summary: "Why adding your LinkedIn profile helps",
    routes: ["/onboarding"],
    content:
      "Adding your LinkedIn URL lets us capture endorsements, recommendations, and connections that don't appear on your resume. This enriches your skill profile and strengthens pivot recommendations.",
  },
  {
    id: "profile-review",
    title: "Profile Review",
    summary: "How to review and improve your extracted profile",
    routes: ["/onboarding/profile"],
    content:
      "After extraction, review your career summary, transferable skills, and experience for accuracy. You can edit any field — the better the input, the more targeted your pivot plan.",
  },
  {
    id: "pivot-plans",
    title: "Understanding Your Plans",
    summary: "How to read and compare your career pivot paths",
    routes: ["/onboarding/plan", "/report"],
    content:
      "We generate multiple paths based on your profile. Each has different timelines, risk levels, and earning potential. Milestones are sequenced — start with the 6-month column and build from there.",
  },
  {
    id: "skill-gaps",
    title: "Skill Gap Analysis",
    summary: "How we identify and prioritize skill gaps",
    routes: ["/onboarding/plan", "/gap-analysis", "/report"],
    content:
      "Skill gaps are the differences between your current skills and your target role requirements. We prioritize them by impact — closing the top gaps first gives you the fastest path to your target role.",
  },
  {
    id: "ats-scoring",
    title: "ATS Match Scores",
    summary: "How resume-to-job matching works",
    routes: ["/ats-score", "/job-tracker"],
    content:
      "ATS scoring compares your resume keywords against job descriptions. Exact matches score highest, followed by variants and semantic matches. A score above 70% means you're a strong match.",
  },
  {
    id: "job-tracker",
    title: "Job Tracker",
    summary: "How to organize your job search pipeline",
    routes: ["/job-tracker"],
    content:
      "Drag jobs between stages to track your progress: Saved → Applied → Interview → Offer. Use the chrome extension to save jobs directly from job boards with one click.",
  },
  {
    id: "cover-letter",
    title: "Cover Letter Generator",
    summary: "How AI-generated cover letters work",
    routes: ["/cover-letter"],
    content:
      "Our AI crafts cover letters tailored to the specific job description and your resume. It highlights relevant transferable skills and frames your career transition as a strength.",
  },
  {
    id: "linkedin-optimizer",
    title: "LinkedIn Optimizer",
    summary: "How to improve your LinkedIn profile score",
    routes: ["/linkedin-optimizer"],
    content:
      "We score your LinkedIn profile across 5 sections: Headline, Summary, Experience, Skills, and Education. Each section gets specific suggestions to improve your visibility to recruiters.",
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    summary: "How to navigate your saved reports and plans",
    routes: ["/dashboard"],
    content:
      "Your dashboard shows all saved reports and plans. Click any report to see your full roadmap. Reports are saved permanently — come back anytime to track your progress.",
  },
  {
    id: "chrome-extension",
    title: "Chrome Extension",
    summary: "How to use the browser extension for job saving",
    routes: ["/dashboard", "/job-tracker"],
    content:
      "Install the AICareerPivot Chrome extension to save jobs from LinkedIn, Indeed, Glassdoor, and 9+ job boards with one click. It also autofills application forms and optimizes your LinkedIn profile.",
  },
];

export function getArticlesForRoute(pathname: string): HelpArticle[] {
  return helpArticles.filter((article) =>
    article.routes.some((route) => pathname.startsWith(route))
  );
}
