export interface SuccessStory {
  id: string;
  firstName: string;
  initials: string;
  industry: string;
  beforeRole: string;
  afterRole: string;
  timeline: string;
  keyMetric: string;
  quote: string;
  gradient: string;
  accentColor: string;
}

export const successStories: SuccessStory[] = [
  {
    id: "sarah-k",
    firstName: "Sarah",
    initials: "SK",
    industry: "Technology",
    beforeRole: "Senior Engineer",
    afterRole: "Product Lead",
    timeline: "4 months",
    keyMetric: "+40% salary",
    quote:
      "AICareerPivot mapped my engineering skills to product gaps I never saw. Four months later, I lead a team of 12.",
    gradient: "from-teal-500 to-emerald-500",
    accentColor: "teal",
  },
  {
    id: "marcus-t",
    firstName: "Marcus",
    initials: "MT",
    industry: "Finance",
    beforeRole: "Financial Analyst",
    afterRole: "AI Strategy Consultant",
    timeline: "6 months",
    keyMetric: "2x client rate",
    quote:
      "The roadmap cut through certification noise and told me exactly which two to start with for my background.",
    gradient: "from-sky-500 to-blue-600",
    accentColor: "sky",
  },
  {
    id: "priya-r",
    firstName: "Priya",
    initials: "PR",
    industry: "Marketing",
    beforeRole: "Marketing Manager",
    afterRole: "ML Ops Lead",
    timeline: "8 months",
    keyMetric: "+$25K salary",
    quote:
      "As a single parent, I couldn't quit and figure it out. The plan let me upskill nights and weekends.",
    gradient: "from-violet-500 to-purple-600",
    accentColor: "violet",
  },
  {
    id: "elena-v",
    firstName: "Elena",
    initials: "EV",
    industry: "Education",
    beforeRole: "High School Teacher",
    afterRole: "AI Curriculum Designer",
    timeline: "5 months",
    keyMetric: "+60% salary",
    quote:
      "It showed me my teaching experience was a strength for AI training roles — I'd never considered that angle.",
    gradient: "from-rose-500 to-pink-500",
    accentColor: "rose",
  },
  {
    id: "david-c",
    firstName: "David",
    initials: "DC",
    industry: "Retail",
    beforeRole: "Retail Operations",
    afterRole: "Data Analytics Lead",
    timeline: "7 months",
    keyMetric: "+45% salary",
    quote:
      "The financial planning mapped exactly how to bridge the income gap without touching our emergency fund.",
    gradient: "from-emerald-400 to-teal-600",
    accentColor: "emerald",
  },
  {
    id: "james-l",
    firstName: "James",
    initials: "JL",
    industry: "IT Support",
    beforeRole: "IT Support Specialist",
    afterRole: "Cloud AI Engineer",
    timeline: "9 months",
    keyMetric: "+$35K salary",
    quote:
      "I showed my roadmap to my manager and she funded two certifications. A concrete plan changed everything.",
    gradient: "from-amber-500 to-orange-500",
    accentColor: "amber",
  },
];

export interface TransitionStat {
  label: string;
  percentage: number;
  color: string;
}

export const careerTransitionStats: TransitionStat[] = [
  { label: "Nurse → UX Designer", percentage: 82, color: "from-teal-500 to-emerald-500" },
  { label: "Teacher → Product Manager", percentage: 76, color: "from-sky-500 to-blue-500" },
  { label: "Accountant → Data Scientist", percentage: 71, color: "from-violet-500 to-purple-500" },
  { label: "Retail → AI Ops", percentage: 68, color: "from-amber-500 to-orange-500" },
  { label: "Marketing → ML Engineer", percentage: 64, color: "from-rose-500 to-pink-500" },
];

export interface ToolFeature {
  name: string;
  features: Record<string, boolean | string>;
}

export const toolComparisonData: ToolFeature[] = [
  {
    name: "AICareerPivot",
    features: {
      "Personalized Roadmap": true,
      "Financial Planning": true,
      "Skills Gap Analysis": true,
      "AI-Powered Coaching": true,
      "Resume Tailoring": true,
      "Interview Prep": true,
    },
  },
  {
    name: "Generic Career Coach",
    features: {
      "Personalized Roadmap": false,
      "Financial Planning": false,
      "Skills Gap Analysis": "Limited",
      "AI-Powered Coaching": false,
      "Resume Tailoring": "Manual",
      "Interview Prep": "Manual",
    },
  },
  {
    name: "LinkedIn Learning",
    features: {
      "Personalized Roadmap": false,
      "Financial Planning": false,
      "Skills Gap Analysis": false,
      "AI-Powered Coaching": false,
      "Resume Tailoring": false,
      "Interview Prep": false,
    },
  },
];

export interface RoadmapPhase {
  month: string;
  title: string;
  milestones: string[];
  color: string;
}

export const sampleRoadmap: RoadmapPhase[] = [
  {
    month: "Month 1-2",
    title: "Foundation",
    milestones: ["Skills assessment", "Learning path selected", "First certification started"],
    color: "from-teal-500 to-teal-400",
  },
  {
    month: "Month 3-4",
    title: "Building",
    milestones: ["Portfolio project launched", "Networking events attended", "Mentor connected"],
    color: "from-emerald-500 to-emerald-400",
  },
  {
    month: "Month 5-6",
    title: "Transition",
    milestones: ["Resume tailored", "Applications submitted", "Interview prep complete"],
    color: "from-cyan-500 to-cyan-400",
  },
  {
    month: "Month 7+",
    title: "Launch",
    milestones: ["Offer accepted", "Role started", "Continued growth plan"],
    color: "from-sky-500 to-sky-400",
  },
];
