export interface InterviewQuestion {
  id: string;
  question: string;
  type: "behavioral" | "technical";
  category: string;
  difficulty: "easy" | "medium" | "hard";
  starHint?: string;
  followUps?: string[];
}

export interface PivotArchetype {
  id: string;
  label: string;
  from: string;
  to: string;
  behavioral: InterviewQuestion[];
  technical: InterviewQuestion[];
}

const GENERAL_BEHAVIORAL: InterviewQuestion[] = [
  { id: "gb-1", question: "Tell me about a time you had to learn a new skill quickly to meet a deadline.", type: "behavioral", category: "Learning Agility", difficulty: "easy", starHint: "Focus on the specific skill, the time pressure, and measurable outcomes.", followUps: ["What resources did you use?", "How did you decide what to prioritize?"] },
  { id: "gb-2", question: "Describe a situation where you disagreed with your manager's decision. How did you handle it?", type: "behavioral", category: "Conflict Resolution", difficulty: "medium", starHint: "Emphasize diplomacy, data-driven reasoning, and the outcome for the team.", followUps: ["Would you do anything differently?", "How did this affect your relationship?"] },
  { id: "gb-3", question: "Tell me about a project that failed. What did you learn?", type: "behavioral", category: "Resilience", difficulty: "medium", starHint: "Own the failure honestly, then pivot to concrete lessons and how you applied them.", followUps: ["How did you communicate the failure to stakeholders?", "What systems did you put in place to prevent recurrence?"] },
  { id: "gb-4", question: "Give an example of when you had to influence someone without direct authority.", type: "behavioral", category: "Influence", difficulty: "hard", starHint: "Show how you built alignment through empathy, data, or shared goals.", followUps: ["What resistance did you face?", "How did you know you'd succeeded?"] },
  { id: "gb-5", question: "Describe a time you had to make a decision with incomplete information.", type: "behavioral", category: "Decision Making", difficulty: "hard", starHint: "Explain your framework for risk assessment and how you mitigated unknowns.", followUps: ["What was the outcome?", "What would you do with more information now?"] },
  { id: "gb-6", question: "Tell me about a time you received critical feedback. How did you respond?", type: "behavioral", category: "Growth Mindset", difficulty: "easy", starHint: "Demonstrate humility and specific behavioral changes you made.", followUps: ["How did the feedback change your approach long-term?"] },
  { id: "gb-7", question: "Describe when you went above and beyond your job description.", type: "behavioral", category: "Initiative", difficulty: "easy", starHint: "Quantify the impact of your extra effort.", followUps: ["How did your manager react?", "Did this become part of your role?"] },
  { id: "gb-8", question: "Tell me about a time you had to manage multiple competing priorities.", type: "behavioral", category: "Time Management", difficulty: "medium", starHint: "Show your prioritization framework and how you communicated trade-offs.", followUps: ["What did you deprioritize?", "How did stakeholders react?"] },
  { id: "gb-9", question: "Give an example of when you mentored or coached someone.", type: "behavioral", category: "Leadership", difficulty: "medium", starHint: "Focus on your approach, the mentee's growth, and measurable progress.", followUps: ["How did you adapt your style to their needs?"] },
  { id: "gb-10", question: "Tell me about a time you had to adapt your communication style for a different audience.", type: "behavioral", category: "Communication", difficulty: "easy", starHint: "Show awareness of audience needs and the impact of tailored communication." },
  { id: "gb-11", question: "Describe a situation where you had to build consensus among stakeholders with conflicting interests.", type: "behavioral", category: "Stakeholder Management", difficulty: "hard", starHint: "Focus on understanding each party's underlying needs, not just positions." },
  { id: "gb-12", question: "Tell me about a time you identified a process improvement and implemented it.", type: "behavioral", category: "Process Improvement", difficulty: "medium", starHint: "Quantify the before/after impact — time saved, errors reduced, cost cut." },
  { id: "gb-13", question: "Give an example of when you had to work with a difficult colleague.", type: "behavioral", category: "Teamwork", difficulty: "medium", starHint: "Show empathy and focus on the working relationship outcome, not blame." },
  { id: "gb-14", question: "Describe when you had to deliver bad news to a stakeholder or client.", type: "behavioral", category: "Communication", difficulty: "hard", starHint: "Show transparency, preparation, and how you offered a path forward." },
  { id: "gb-15", question: "Tell me about a time you successfully managed a cross-functional project.", type: "behavioral", category: "Cross-Functional Leadership", difficulty: "hard", starHint: "Highlight coordination across teams, managing dependencies, and alignment." },
  { id: "gb-16", question: "Describe a time when you had to pivot your strategy based on new data.", type: "behavioral", category: "Adaptability", difficulty: "medium", starHint: "Show analytical thinking and willingness to change course despite sunk costs." },
  { id: "gb-17", question: "Give an example of how you built trust with a new team.", type: "behavioral", category: "Relationship Building", difficulty: "easy", starHint: "Focus on specific trust-building actions and their impact on collaboration." },
  { id: "gb-18", question: "Tell me about a time you had to advocate for resources or budget.", type: "behavioral", category: "Business Acumen", difficulty: "hard", starHint: "Show ROI thinking and how you built the business case." },
  { id: "gb-19", question: "Describe when you took ownership of a mistake.", type: "behavioral", category: "Accountability", difficulty: "easy", starHint: "Demonstrate accountability and focus on the corrective actions you took." },
  { id: "gb-20", question: "Tell me about a time you had to onboard into a completely new domain.", type: "behavioral", category: "Learning Agility", difficulty: "medium", starHint: "Perfect for career pivoters — show your learning strategy and how fast you ramped up." },
];

const ARCHETYPES: PivotArchetype[] = [
  {
    id: "eng-to-pm",
    label: "Engineer to Product Manager",
    from: "Software Engineer",
    to: "Product Manager",
    behavioral: [
      { id: "epm-b1", question: "Tell me about a time you identified a user need that wasn't in any requirements document.", type: "behavioral", category: "Customer Empathy", difficulty: "medium", starHint: "Show how you discovered the need, validated it, and influenced the roadmap." },
      { id: "epm-b2", question: "Describe when you had to say no to a feature request from a senior stakeholder.", type: "behavioral", category: "Prioritization", difficulty: "hard", starHint: "Use data/framework to justify the decision, not just opinion." },
      { id: "epm-b3", question: "Give an example of when you translated a complex technical concept for a non-technical audience.", type: "behavioral", category: "Communication", difficulty: "easy", starHint: "Focus on the analogy or framework you used and whether they took action on it." },
      { id: "epm-b4", question: "Tell me about a trade-off decision you made between speed and quality.", type: "behavioral", category: "Decision Making", difficulty: "medium", starHint: "Show your framework for evaluating trade-offs and how you aligned the team." },
      { id: "epm-b5", question: "Describe a time you used data to change the direction of a project.", type: "behavioral", category: "Data-Driven Thinking", difficulty: "medium", starHint: "Quantify the impact of the data-driven pivot." },
      { id: "epm-b6", question: "Tell me about when you had to align engineering and design teams on a product decision.", type: "behavioral", category: "Cross-Functional Leadership", difficulty: "hard", starHint: "Show how you navigated competing priorities and found common ground." },
      { id: "epm-b7", question: "Give an example of a product you built or improved based on user feedback.", type: "behavioral", category: "User Research", difficulty: "easy", starHint: "Show the feedback loop: collect, analyze, implement, measure." },
      { id: "epm-b8", question: "Describe a time you had to scope down a project mid-sprint.", type: "behavioral", category: "Agile Thinking", difficulty: "medium", starHint: "Show how you identified what to cut and communicated the change." },
    ],
    technical: [
      { id: "epm-t1", question: "How would you prioritize features for a new product launch with limited engineering resources?", type: "technical", category: "Prioritization Frameworks", difficulty: "medium" },
      { id: "epm-t2", question: "Walk me through how you'd define success metrics for a new feature.", type: "technical", category: "Product Metrics", difficulty: "easy" },
      { id: "epm-t3", question: "How would you approach a situation where your A/B test results are inconclusive?", type: "technical", category: "Experimentation", difficulty: "hard" },
      { id: "epm-t4", question: "Design a product roadmap for a career transition platform. What would you build first and why?", type: "technical", category: "Product Strategy", difficulty: "hard" },
      { id: "epm-t5", question: "How would you handle a situation where your engineers disagree with the product direction?", type: "technical", category: "Stakeholder Alignment", difficulty: "medium" },
      { id: "epm-t6", question: "Explain how you would run a product discovery process for a new market segment.", type: "technical", category: "Product Discovery", difficulty: "medium" },
      { id: "epm-t7", question: "What frameworks do you use to evaluate build vs. buy decisions?", type: "technical", category: "Strategic Thinking", difficulty: "medium" },
      { id: "epm-t8", question: "How would you measure the ROI of reducing technical debt?", type: "technical", category: "Product Metrics", difficulty: "hard" },
    ],
  },
  {
    id: "finance-to-ds",
    label: "Finance to Data Science",
    from: "Finance",
    to: "Data Science",
    behavioral: [
      { id: "fds-b1", question: "Tell me about a time you used data analysis to influence a business decision in your finance role.", type: "behavioral", category: "Data-Driven Impact", difficulty: "easy", starHint: "Bridge your finance analytics experience to data science methodology." },
      { id: "fds-b2", question: "Describe when you had to present complex quantitative findings to non-technical executives.", type: "behavioral", category: "Data Communication", difficulty: "medium", starHint: "Show how you simplified without losing accuracy." },
      { id: "fds-b3", question: "Give an example of when you automated a manual financial process.", type: "behavioral", category: "Automation Mindset", difficulty: "medium", starHint: "Focus on the tools used, time saved, and error reduction." },
      { id: "fds-b4", question: "Tell me about a time you identified a trend in financial data that others missed.", type: "behavioral", category: "Analytical Thinking", difficulty: "medium", starHint: "Show your analytical process and business impact of the insight." },
      { id: "fds-b5", question: "Describe how you handled a situation where your model's predictions conflicted with expert opinion.", type: "behavioral", category: "Model Advocacy", difficulty: "hard", starHint: "Balance model confidence with domain expertise." },
      { id: "fds-b6", question: "Tell me about your journey learning a new programming language or data tool.", type: "behavioral", category: "Learning Agility", difficulty: "easy", starHint: "Show structured learning approach and practical application." },
      { id: "fds-b7", question: "Describe a time you had to clean messy data to make it usable for analysis.", type: "behavioral", category: "Data Quality", difficulty: "easy", starHint: "Focus on your systematic approach and the impact on downstream analysis." },
      { id: "fds-b8", question: "Give an example of when you collaborated with engineers on a data pipeline or reporting system.", type: "behavioral", category: "Cross-Functional Work", difficulty: "medium", starHint: "Show how you bridged the gap between business and engineering." },
    ],
    technical: [
      { id: "fds-t1", question: "Explain the difference between supervised and unsupervised learning. Give a finance use case for each.", type: "technical", category: "ML Fundamentals", difficulty: "easy" },
      { id: "fds-t2", question: "How would you build a model to predict customer churn using transaction data?", type: "technical", category: "Predictive Modeling", difficulty: "medium" },
      { id: "fds-t3", question: "Walk me through how you'd handle class imbalance in a fraud detection dataset.", type: "technical", category: "Data Challenges", difficulty: "hard" },
      { id: "fds-t4", question: "Explain overfitting and how you'd prevent it in a regression model.", type: "technical", category: "Model Evaluation", difficulty: "medium" },
      { id: "fds-t5", question: "How would you design a recommendation system for financial products?", type: "technical", category: "System Design", difficulty: "hard" },
      { id: "fds-t6", question: "Compare SQL and Python/pandas for data analysis. When would you use each?", type: "technical", category: "Tools & Languages", difficulty: "easy" },
      { id: "fds-t7", question: "How would you validate that a time-series forecast for revenue is reliable?", type: "technical", category: "Time Series", difficulty: "hard" },
      { id: "fds-t8", question: "Explain how you'd use A/B testing to evaluate a new pricing strategy.", type: "technical", category: "Experimentation", difficulty: "medium" },
    ],
  },
  {
    id: "marketing-to-pm",
    label: "Marketing to Product Manager",
    from: "Marketing",
    to: "Product Manager",
    behavioral: [
      { id: "mpm-b1", question: "Tell me about a time you used customer research to shape a campaign that could have been a product feature.", type: "behavioral", category: "Product Thinking", difficulty: "medium", starHint: "Show how marketing insights translate to product decisions." },
      { id: "mpm-b2", question: "Describe when you had to balance brand goals with conversion metrics.", type: "behavioral", category: "Trade-off Analysis", difficulty: "medium", starHint: "Show your framework for quantifying qualitative brand value." },
      { id: "mpm-b3", question: "Give an example of a data-driven marketing decision that changed user behavior.", type: "behavioral", category: "Data-Driven Impact", difficulty: "easy", starHint: "Quantify the behavioral shift and connect it to business outcomes." },
      { id: "mpm-b4", question: "Tell me about a time you managed a product launch cross-functionally.", type: "behavioral", category: "Cross-Functional Leadership", difficulty: "hard", starHint: "Highlight coordination, timeline management, and stakeholder alignment." },
      { id: "mpm-b5", question: "Describe how you've used funnel analysis to identify drop-off points.", type: "behavioral", category: "Analytical Thinking", difficulty: "medium", starHint: "Show the analysis process and resulting product/marketing changes." },
      { id: "mpm-b6", question: "Tell me about when you had to advocate for the user experience over short-term revenue.", type: "behavioral", category: "User Advocacy", difficulty: "hard", starHint: "Demonstrate product mindset by showing long-term thinking." },
      { id: "mpm-b7", question: "Give an example of how you defined and tracked KPIs for a marketing initiative.", type: "behavioral", category: "Metrics", difficulty: "easy", starHint: "Show structured goal-setting and measurement." },
      { id: "mpm-b8", question: "Describe a time you ran experiments to optimize user engagement.", type: "behavioral", category: "Experimentation", difficulty: "medium", starHint: "Show hypothesis-driven approach with measurable results." },
    ],
    technical: [
      { id: "mpm-t1", question: "How would you define the key metrics for a new SaaS product?", type: "technical", category: "Product Metrics", difficulty: "medium" },
      { id: "mpm-t2", question: "Walk me through creating a product requirements document for a feature you'd want to build.", type: "technical", category: "Product Documentation", difficulty: "easy" },
      { id: "mpm-t3", question: "How would you run a pricing experiment for a subscription product?", type: "technical", category: "Pricing Strategy", difficulty: "hard" },
      { id: "mpm-t4", question: "Explain how you'd use cohort analysis to measure product-market fit.", type: "technical", category: "Analytics", difficulty: "medium" },
      { id: "mpm-t5", question: "Design an onboarding flow for a career transition app. What would you measure?", type: "technical", category: "UX Strategy", difficulty: "medium" },
      { id: "mpm-t6", question: "How would you prioritize a backlog of 20 feature requests with limited data?", type: "technical", category: "Prioritization", difficulty: "hard" },
      { id: "mpm-t7", question: "What's your approach to competitive analysis for product positioning?", type: "technical", category: "Market Analysis", difficulty: "easy" },
      { id: "mpm-t8", question: "How would you design a referral program to increase organic growth?", type: "technical", category: "Growth Strategy", difficulty: "medium" },
    ],
  },
  {
    id: "teacher-to-ux",
    label: "Teacher to UX Designer",
    from: "Education",
    to: "UX Design",
    behavioral: [
      { id: "tux-b1", question: "Tell me about a time you redesigned a lesson plan based on student feedback.", type: "behavioral", category: "User-Centered Design", difficulty: "easy", starHint: "Frame students as users and lesson plans as products." },
      { id: "tux-b2", question: "Describe how you adapted your teaching for students with different learning styles.", type: "behavioral", category: "Accessibility", difficulty: "medium", starHint: "Connect this to designing for diverse user needs." },
      { id: "tux-b3", question: "Give an example of when you used observation to identify a gap in understanding.", type: "behavioral", category: "User Research", difficulty: "easy", starHint: "Show systematic observation skills that transfer to UX research." },
      { id: "tux-b4", question: "Tell me about a curriculum or tool you created that solved a real problem for your colleagues.", type: "behavioral", category: "Design Thinking", difficulty: "medium", starHint: "Show problem identification, iteration, and adoption metrics." },
      { id: "tux-b5", question: "Describe when you had to simplify a complex concept for your audience.", type: "behavioral", category: "Information Architecture", difficulty: "easy", starHint: "Show your ability to structure information for comprehension." },
      { id: "tux-b6", question: "Tell me about a time you tested a new teaching approach and iterated based on results.", type: "behavioral", category: "Iterative Design", difficulty: "medium", starHint: "Frame this as a prototype-test-iterate cycle." },
      { id: "tux-b7", question: "Give an example of how you collaborated with parents or administrators on improving student outcomes.", type: "behavioral", category: "Stakeholder Management", difficulty: "hard", starHint: "Show how you balanced multiple stakeholder needs." },
      { id: "tux-b8", question: "Describe how you created an inclusive environment for diverse learners.", type: "behavioral", category: "Inclusive Design", difficulty: "medium", starHint: "Connect classroom inclusion to digital accessibility principles." },
    ],
    technical: [
      { id: "tux-t1", question: "Walk me through your process for conducting a usability test.", type: "technical", category: "UX Research", difficulty: "easy" },
      { id: "tux-t2", question: "How would you create a user persona for a career transition app?", type: "technical", category: "User Personas", difficulty: "easy" },
      { id: "tux-t3", question: "Design the information architecture for an online learning platform.", type: "technical", category: "Information Architecture", difficulty: "medium" },
      { id: "tux-t4", question: "How would you measure the success of a UX redesign?", type: "technical", category: "UX Metrics", difficulty: "medium" },
      { id: "tux-t5", question: "Walk me through how you'd approach a design critique session.", type: "technical", category: "Design Process", difficulty: "easy" },
      { id: "tux-t6", question: "How would you design an onboarding experience for users who are not tech-savvy?", type: "technical", category: "Accessibility", difficulty: "hard" },
      { id: "tux-t7", question: "Explain the difference between qualitative and quantitative UX research. When would you use each?", type: "technical", category: "Research Methods", difficulty: "medium" },
      { id: "tux-t8", question: "How would you handle a design disagreement with a developer about feasibility?", type: "technical", category: "Cross-Functional Work", difficulty: "medium" },
    ],
  },
  {
    id: "ops-to-analytics",
    label: "Operations to Data Analytics",
    from: "Operations",
    to: "Data Analyst",
    behavioral: [
      { id: "oda-b1", question: "Tell me about a time you used operational data to improve efficiency.", type: "behavioral", category: "Data-Driven Ops", difficulty: "easy", starHint: "Show how you collected, analyzed, and acted on operational metrics." },
      { id: "oda-b2", question: "Describe when you created a dashboard or report that changed how your team worked.", type: "behavioral", category: "Data Visualization", difficulty: "medium", starHint: "Focus on the insight that drove behavioral change." },
      { id: "oda-b3", question: "Give an example of when you identified an operational bottleneck using data.", type: "behavioral", category: "Root Cause Analysis", difficulty: "medium", starHint: "Show systematic analysis and quantified improvement." },
      { id: "oda-b4", question: "Tell me about a time you had to reconcile conflicting data from different sources.", type: "behavioral", category: "Data Quality", difficulty: "hard", starHint: "Show detective work and systematic validation." },
      { id: "oda-b5", question: "Describe how you automated a reporting or tracking process.", type: "behavioral", category: "Automation", difficulty: "medium", starHint: "Quantify time savings and error reduction." },
      { id: "oda-b6", question: "Tell me about when you presented data findings that led to a policy change.", type: "behavioral", category: "Influence with Data", difficulty: "hard", starHint: "Show how you made data actionable for decision makers." },
      { id: "oda-b7", question: "Give an example of forecasting demand or capacity in your operations role.", type: "behavioral", category: "Forecasting", difficulty: "medium", starHint: "Connect operational forecasting to analytical methods." },
      { id: "oda-b8", question: "Describe a time you trained colleagues on using data tools or dashboards.", type: "behavioral", category: "Data Literacy", difficulty: "easy", starHint: "Show your ability to democratize data access." },
    ],
    technical: [
      { id: "oda-t1", question: "Write a SQL query to find the top 5 customers by revenue in the last quarter.", type: "technical", category: "SQL", difficulty: "easy" },
      { id: "oda-t2", question: "How would you design a KPI dashboard for a logistics operation?", type: "technical", category: "Data Visualization", difficulty: "medium" },
      { id: "oda-t3", question: "Explain the difference between correlation and causation with a business example.", type: "technical", category: "Statistical Thinking", difficulty: "easy" },
      { id: "oda-t4", question: "How would you analyze seasonality in sales data?", type: "technical", category: "Time Series", difficulty: "medium" },
      { id: "oda-t5", question: "Walk me through how you'd clean and prepare a messy CSV for analysis.", type: "technical", category: "Data Wrangling", difficulty: "easy" },
      { id: "oda-t6", question: "How would you set up tracking to measure the impact of a process change?", type: "technical", category: "Measurement", difficulty: "medium" },
      { id: "oda-t7", question: "Explain how you'd use regression analysis to predict staffing needs.", type: "technical", category: "Predictive Analytics", difficulty: "hard" },
      { id: "oda-t8", question: "How would you handle missing data in a customer survey analysis?", type: "technical", category: "Data Quality", difficulty: "medium" },
    ],
  },
  {
    id: "sales-to-cs",
    label: "Sales to Customer Success",
    from: "Sales",
    to: "Customer Success Manager",
    behavioral: [
      { id: "scs-b1", question: "Tell me about a time you turned a dissatisfied customer into a loyal advocate.", type: "behavioral", category: "Customer Recovery", difficulty: "medium", starHint: "Show empathy, root cause analysis, and long-term relationship building." },
      { id: "scs-b2", question: "Describe how you proactively identified an at-risk account before they churned.", type: "behavioral", category: "Proactive Management", difficulty: "hard", starHint: "Show the signals you read and actions you took." },
      { id: "scs-b3", question: "Give an example of when you collaborated with product to solve a customer's problem.", type: "behavioral", category: "Cross-Functional Work", difficulty: "medium", starHint: "Show how you translated customer needs to product requirements." },
      { id: "scs-b4", question: "Tell me about a time you managed a customer's expectations when you couldn't deliver what they wanted.", type: "behavioral", category: "Expectation Management", difficulty: "medium", starHint: "Show transparency and alternative solutions." },
      { id: "scs-b5", question: "Describe when you drove adoption of a new feature among your customer base.", type: "behavioral", category: "Adoption", difficulty: "medium", starHint: "Show your enablement strategy and usage metrics." },
      { id: "scs-b6", question: "Tell me about a time you used customer data to upsell or expand an account.", type: "behavioral", category: "Value-Based Selling", difficulty: "easy", starHint: "Show value-based approach rather than pressure-based." },
      { id: "scs-b7", question: "Give an example of building a scalable customer onboarding process.", type: "behavioral", category: "Process Design", difficulty: "hard", starHint: "Show how you balanced personalization with scale." },
      { id: "scs-b8", question: "Describe a time you handled a product outage or service disruption with customers.", type: "behavioral", category: "Crisis Management", difficulty: "hard", starHint: "Show communication cadence, transparency, and follow-through." },
    ],
    technical: [
      { id: "scs-t1", question: "How would you build a customer health score? What inputs would you use?", type: "technical", category: "Customer Health", difficulty: "medium" },
      { id: "scs-t2", question: "Walk me through how you'd design a QBR (Quarterly Business Review) for a strategic account.", type: "technical", category: "Account Management", difficulty: "easy" },
      { id: "scs-t3", question: "How would you measure and improve net revenue retention?", type: "technical", category: "CS Metrics", difficulty: "hard" },
      { id: "scs-t4", question: "Describe your approach to segmenting a customer base for different engagement models.", type: "technical", category: "Segmentation", difficulty: "medium" },
      { id: "scs-t5", question: "How would you set up a customer feedback loop that drives product improvements?", type: "technical", category: "Voice of Customer", difficulty: "medium" },
      { id: "scs-t6", question: "What playbooks would you create for a new CS team?", type: "technical", category: "Process Design", difficulty: "medium" },
      { id: "scs-t7", question: "How would you handle a customer renewal negotiation when they want a discount?", type: "technical", category: "Renewals", difficulty: "hard" },
      { id: "scs-t8", question: "Design an automated customer lifecycle communication strategy.", type: "technical", category: "Automation", difficulty: "medium" },
    ],
  },
  {
    id: "eng-to-management",
    label: "Engineer to Engineering Manager",
    from: "Software Engineer",
    to: "Engineering Manager",
    behavioral: [
      { id: "eem-b1", question: "Tell me about a time you mentored a junior developer through a challenging problem.", type: "behavioral", category: "Mentorship", difficulty: "easy", starHint: "Show coaching approach rather than just giving the answer." },
      { id: "eem-b2", question: "Describe when you had to manage a team conflict over technical direction.", type: "behavioral", category: "Conflict Resolution", difficulty: "hard", starHint: "Show facilitation skills and how you reached a team decision." },
      { id: "eem-b3", question: "Give an example of when you advocated for your team's needs to leadership.", type: "behavioral", category: "Upward Management", difficulty: "medium", starHint: "Show how you represented team concerns while maintaining organizational alignment." },
      { id: "eem-b4", question: "Tell me about a time you had to let go of being the technical expert.", type: "behavioral", category: "Delegation", difficulty: "medium", starHint: "Show self-awareness about the IC-to-manager transition." },
      { id: "eem-b5", question: "Describe how you've handled underperformance on your team.", type: "behavioral", category: "Performance Management", difficulty: "hard", starHint: "Show empathy, clear expectations, and measurable improvement plans." },
      { id: "eem-b6", question: "Tell me about building a team culture you're proud of.", type: "behavioral", category: "Team Culture", difficulty: "medium", starHint: "Focus on specific practices you introduced and their impact." },
      { id: "eem-b7", question: "Give an example of when you had to make a hiring decision between two strong candidates.", type: "behavioral", category: "Hiring", difficulty: "medium", starHint: "Show your evaluation framework beyond just technical skills." },
      { id: "eem-b8", question: "Describe a time you had to deliver a difficult message to your team about organizational changes.", type: "behavioral", category: "Change Management", difficulty: "hard", starHint: "Show transparency, empathy, and how you maintained team morale." },
    ],
    technical: [
      { id: "eem-t1", question: "How would you balance new feature development with technical debt reduction?", type: "technical", category: "Resource Allocation", difficulty: "medium" },
      { id: "eem-t2", question: "Describe your approach to running effective sprint planning and retros.", type: "technical", category: "Agile Practices", difficulty: "easy" },
      { id: "eem-t3", question: "How would you evaluate whether to build, buy, or open-source a component?", type: "technical", category: "Technical Strategy", difficulty: "hard" },
      { id: "eem-t4", question: "Walk me through how you'd structure a career growth framework for your engineering team.", type: "technical", category: "People Development", difficulty: "medium" },
      { id: "eem-t5", question: "How would you improve the deployment pipeline for a team shipping too slowly?", type: "technical", category: "Engineering Efficiency", difficulty: "medium" },
      { id: "eem-t6", question: "What metrics would you use to measure engineering team productivity without micromanaging?", type: "technical", category: "Team Metrics", difficulty: "hard" },
      { id: "eem-t7", question: "How would you approach migrating a monolith to microservices as a manager?", type: "technical", category: "Architecture Decisions", difficulty: "hard" },
      { id: "eem-t8", question: "Describe your ideal on-call rotation and incident response process.", type: "technical", category: "Operational Excellence", difficulty: "easy" },
    ],
  },
];

export function getArchetypes(): PivotArchetype[] {
  return ARCHETYPES;
}

export function getArchetypeById(id: string): PivotArchetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

export function getGeneralBehavioral(): InterviewQuestion[] {
  return GENERAL_BEHAVIORAL;
}

export function matchArchetype(from: string, to: string): PivotArchetype | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ARCHETYPES.find((a) => {
    const fromMatch = normalize(from).includes(normalize(a.from)) || normalize(a.from).includes(normalize(from));
    const toMatch = normalize(to).includes(normalize(a.to)) || normalize(a.to).includes(normalize(to));
    return fromMatch && toMatch;
  });
}

export function getQuestionsForRole(
  targetRole: string,
  currentRole?: string,
  type?: "behavioral" | "technical"
): InterviewQuestion[] {
  let archetype: PivotArchetype | undefined;

  if (currentRole) {
    archetype = matchArchetype(currentRole, targetRole);
  }

  if (!archetype) {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    archetype = ARCHETYPES.find((a) => normalize(targetRole).includes(normalize(a.to)));
  }

  const questions: InterviewQuestion[] = [];

  if (archetype) {
    if (!type || type === "behavioral") questions.push(...archetype.behavioral);
    if (!type || type === "technical") questions.push(...archetype.technical);
  }

  if (!type || type === "behavioral") {
    const existing = new Set(questions.map((q) => q.id));
    for (const q of GENERAL_BEHAVIORAL) {
      if (!existing.has(q.id)) questions.push(q);
    }
  }

  return questions;
}
