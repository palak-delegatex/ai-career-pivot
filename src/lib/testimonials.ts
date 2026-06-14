export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
}

export interface CaseStudy extends Testimonial {
  borderGradient: string;
  beforeRole: string;
  afterRole: string;
  timeline: string;
  keyMetric: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "Most career advice ignores that you have a mortgage, kids, and a partner who also has a career. AICareerPivot finally accounts for the real constraints.",
    name: "Sarah K.",
    role: "Senior Engineer → Product Lead",
    initials: "SK",
    gradient: "from-teal-500 to-emerald-500",
  },
  {
    quote:
      "I was paralyzed by the number of AI certifications out there. The roadmap cut through the noise and told me exactly which two to start with for my background.",
    name: "Marcus T.",
    role: "Financial Analyst → AI Strategy Consultant",
    initials: "MT",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    quote:
      "As a single parent, I can’t afford to quit and ‘figure it out.’ The 6-month plan gave me a way to upskill nights and weekends without risking my income.",
    name: "Priya R.",
    role: "Marketing Manager → ML Ops Lead",
    initials: "PR",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    quote:
      "I showed my roadmap to my manager and she actually funded two of the certifications. Having a concrete plan changed the conversation entirely.",
    name: "James L.",
    role: "IT Support → Cloud AI Engineer",
    initials: "JL",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    quote:
      "Other tools gave me generic advice. This one read my actual resume and told me my teaching experience was a strength for AI training roles — I’d never considered that.",
    name: "Elena V.",
    role: "High School Teacher → AI Curriculum Designer",
    initials: "EV",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    quote:
      "The financial planning piece sold me. It mapped out exactly how to bridge the income gap during my transition without touching our emergency fund.",
    name: "David C.",
    role: "Retail Operations → Data Analytics Lead",
    initials: "DC",
    gradient: "from-emerald-400 to-teal-600",
  },
];

export const caseStudies: CaseStudy[] = [
  {
    name: "Sarah K.",
    initials: "SK",
    gradient: "from-teal-500 to-emerald-500",
    borderGradient: "from-teal-500 via-emerald-500 to-cyan-500",
    beforeRole: "Senior Engineer",
    afterRole: "Product Lead",
    timeline: "4 months",
    keyMetric: "+40% comp increase",
    quote:
      "Most career advice ignores that you have a mortgage, kids, and a partner who also has a career. AICareerPivot finally accounts for the real constraints.",
    role: "Senior Engineer → Product Lead",
  },
  {
    name: "Marcus T.",
    initials: "MT",
    gradient: "from-sky-500 to-blue-600",
    borderGradient: "from-sky-500 via-blue-500 to-indigo-500",
    beforeRole: "Financial Analyst",
    afterRole: "AI Strategy Consultant",
    timeline: "6 months",
    keyMetric: "2x client rate",
    quote:
      "I was paralyzed by the number of AI certifications out there. The roadmap cut through the noise and told me exactly which two to start with for my background.",
    role: "Financial Analyst → AI Strategy Consultant",
  },
  {
    name: "Priya R.",
    initials: "PR",
    gradient: "from-violet-500 to-purple-600",
    borderGradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    beforeRole: "Marketing Manager",
    afterRole: "ML Ops Lead",
    timeline: "8 months",
    keyMetric: "$25K salary uplift",
    quote:
      "As a single parent, I can’t afford to quit and ‘figure it out.’ The 6-month plan gave me a way to upskill nights and weekends without risking my income.",
    role: "Marketing Manager → ML Ops Lead",
  },
];
