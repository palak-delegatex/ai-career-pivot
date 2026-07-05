// Programmatic pivot-page dataset for the `/pivot/[from]-to-[role]` template (AIC-697 / AIC-688).
//
// CTO template build notes:
//  - Route slug is `${fromSlug}-to-${toSlug}` (e.g. /pivot/teacher-to-product-manager).
//    Look pages up by `slug`. `getPivot(slug)` and `getAllPivotSlugs()` helpers are provided
//    for generateStaticParams + the page component.
//  - Render FAQPage + Article JSON-LD from `faq` and the page copy, mirroring the blog
//    FAQPage implementation shipped in commit f22b996 / 13d5913.
//  - `bodyBlocks` are 2–3 answer-first sections; `tldr` mirrors the blog TL;DR slot.
//  - Every entry ends with a CTA into the assessment ("Start your pivot plan").

export interface PivotFaqItem {
  question: string;
  answer: string;
}

export interface PivotBodyBlock {
  heading: string;
  body: string;
}

export interface PivotPage {
  /** URL slug: `${fromSlug}-to-${toSlug}` */
  slug: string;
  fromSlug: string;
  toSlug: string;
  /** Display names */
  fromRole: string;
  toRole: string;
  /** SEO */
  headline: string;
  description: string;
  keywords: string[];
  /** Answer-first bullets for the TL;DR slot */
  tldr: string[];
  /** 2–3 body sections */
  bodyBlocks: PivotBodyBlock[];
  /** Skills that carry over directly — rendered as chips */
  transferableSkills: string[];
  /** Realistic transition window */
  timeline: string;
  /** 3–6 Q&A for the FAQPage JSON-LD + accordion */
  faq: PivotFaqItem[];
}

const CTA =
  "The fastest way to know if this pivot is realistic for *you* is to run your actual background through it. Start a free AICareerPivot assessment — it maps your transferable skills to the target role, flags the real gaps, and builds a week-by-week plan.";

export const pivots: PivotPage[] = [
  {
    slug: "teacher-to-product-manager",
    fromSlug: "teacher",
    toSlug: "product-manager",
    fromRole: "Teacher",
    toRole: "Product Manager",
    headline: "From Teacher to Product Manager: The Transferable-Skills Playbook",
    description:
      "Teachers already do 80% of a PM's job — prioritizing, communicating to mixed audiences, and shipping under constraints. Here's how to reframe classroom experience into a product management résumé.",
    keywords: [
      "teacher to product manager",
      "career change from teaching to tech",
      "teacher career change",
      "product manager career pivot",
    ],
    tldr: [
      "Teaching maps unusually well to PM work: stakeholder management, prioritization, and translating complex ideas for different audiences.",
      "The gap is vocabulary and artifacts (PRDs, roadmaps, metrics), not the underlying skills — which is why this pivot is faster than most.",
      "Target associate PM roles or internal transfers at edtech/ops-heavy companies first; they value your domain empathy.",
    ],
    bodyBlocks: [
      {
        heading: "Why teachers make strong PMs",
        body: "Every day, teachers set priorities against a fixed deadline, manage a room of stakeholders with conflicting needs, and turn ambiguous goals into a concrete plan. That is the core loop of product management. The instinct to ask 'what does this person actually need?' — which drives good teaching — is the same instinct behind good discovery and roadmap decisions.",
      },
      {
        heading: "What you need to add",
        body: "The missing pieces are mostly vocabulary and artifacts: writing a PRD, framing work as user stories, reading a funnel, and speaking in metrics (activation, retention, conversion). Ship a small side project or volunteer to own a tool rollout at your school so you have a concrete 'I shipped X, it moved Y' story for interviews.",
      },
      {
        heading: "The realistic on-ramp",
        body: "Most teachers don't jump straight to senior PM. Target associate PM programs, edtech companies (where your domain is a differentiator), or a lateral move into a PM-adjacent role like implementation or customer success first, then transfer internally. " + CTA,
      },
    ],
    transferableSkills: [
      "Stakeholder communication",
      "Prioritization under constraints",
      "Explaining complex ideas simply",
      "Assessment and feedback loops",
      "Curriculum design (≈ roadmapping)",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Can a teacher really become a product manager without a tech background?",
        answer:
          "Yes. PM is a generalist role that rewards communication, prioritization, and user empathy over coding. Teachers already have those. The practical path is to learn the artifacts (PRDs, roadmaps, metrics), build one small shipped project, and target associate PM or edtech roles where classroom experience is an asset rather than a liability.",
      },
      {
        question: "What's the biggest obstacle in the teacher-to-PM pivot?",
        answer:
          "Translation, not ability. Hiring managers don't automatically see 'ran a classroom' as 'managed stakeholders and shipped on a deadline.' The work is re-writing your experience in product language and producing one concrete, metrics-backed example of shipping something.",
      },
      {
        question: "How long does the transition usually take?",
        answer:
          "Typically 6–12 months of focused effort — learning PM fundamentals, building a portfolio project, and interviewing. Teachers who target edtech or take an internal transfer route often move faster because their domain expertise directly reduces the employer's risk.",
      },
    ],
  },
  {
    slug: "teacher-to-ux-designer",
    fromSlug: "teacher",
    toSlug: "ux-designer",
    fromRole: "Teacher",
    toRole: "UX Designer",
    headline: "From Teacher to UX Designer: Turning Lesson Design Into Product Design",
    description:
      "Designing a lesson and designing a user flow are the same skill: sequencing information so a human succeeds without you in the room. Here's how teachers move into UX.",
    keywords: [
      "teacher to ux designer",
      "teaching to ux design career change",
      "ux designer career pivot",
    ],
    tldr: [
      "Lesson design is instructional UX — you already sequence information so people succeed independently.",
      "Build a 2–3 project portfolio; that, not a degree, is what gets UX interviews.",
      "Empathy and user research come naturally to teachers, which is the hardest part to teach designers.",
    ],
    bodyBlocks: [
      {
        heading: "The overlap is bigger than it looks",
        body: "UX design is about reducing friction so a user reaches their goal. Teaching is about reducing friction so a student reaches understanding. Both require empathy, iteration based on feedback, and designing for the person who is confused — not the person who already gets it.",
      },
      {
        heading: "What to build",
        body: "Employers hire UX designers on portfolios, not credentials. Take a free tool like Figma, learn the fundamentals of user research, wireframing, and prototyping, and produce two or three case studies — ideally redesigning something real (a school app, a form parents hate). Show your process, not just the final screens.",
      },
      {
        heading: "Where to start applying",
        body: "Edtech and civic-tech companies value teachers' domain empathy. Junior UX, UX research, or content design roles are natural entry points. " + CTA,
      },
    ],
    transferableSkills: [
      "User empathy",
      "Information sequencing",
      "Iterating on feedback",
      "Accessibility awareness",
      "Communicating design rationale",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Do I need a design degree to become a UX designer?",
        answer:
          "No. UX hiring is portfolio-driven. Two to three strong case studies that show your research and design process will beat a degree with no work to point to. Teachers have a head start on the research and empathy side, which is the hardest part to fake.",
      },
      {
        question: "What's the fastest way for a teacher to build a UX portfolio?",
        answer:
          "Redesign something you already understand deeply — a clunky school system, a parent-facing form, a learning app. Because you know the users and the pain, you can produce a credible end-to-end case study (research → wireframe → prototype → test) faster than someone designing for a domain they don't know.",
      },
      {
        question: "Is UX research or UX design the better first role?",
        answer:
          "For many teachers, UX research or content design is an easier first door because it leans on interviewing, synthesis, and clear writing — skills teaching already builds. You can move into full product design from there once you have industry experience.",
      },
    ],
  },
  {
    slug: "accountant-to-data-analyst",
    fromSlug: "accountant",
    toSlug: "data-analyst",
    fromRole: "Accountant",
    toRole: "Data Analyst",
    headline: "From Accountant to Data Analyst: You Already Speak the Language of Numbers",
    description:
      "Accountants have the hardest-to-teach data-analyst skills already: numeracy, rigor, and business context. The pivot is mostly SQL and visualization on top of what you know.",
    keywords: [
      "accountant to data analyst",
      "accounting to data analytics career change",
      "data analyst career pivot",
    ],
    tldr: [
      "Accountants bring the two things employers can't easily teach: comfort with numbers and business context.",
      "The learnable gap is SQL, a BI tool (Tableau/Power BI), and basic statistics — roughly a 3–6 month lift.",
      "Finance/FP&A analytics roles are the highest-probability first landing spot.",
    ],
    bodyBlocks: [
      {
        heading: "Your unfair advantage",
        body: "Most aspiring data analysts struggle with what accountants take for granted: reading a P&L, understanding what a number means for the business, and being rigorous about reconciliation and accuracy. That domain fluency turns a generic 'here's a chart' into 'here's the chart and why it matters,' which is exactly what makes an analyst valuable.",
      },
      {
        heading: "The skills to add",
        body: "Learn SQL (non-negotiable), one BI tool such as Power BI or Tableau, and enough statistics to avoid drawing wrong conclusions. Python is a bonus, not a requirement, for most analyst roles. Rebuild an analysis you'd normally do in Excel using SQL and a dashboard to prove the transfer.",
      },
      {
        heading: "Where to land first",
        body: "Financial or operations analytics roles let you lead with your existing domain while you grow the technical stack. From there you can specialize into product, marketing, or general BI analytics. " + CTA,
      },
    ],
    transferableSkills: [
      "Numeracy and data rigor",
      "Excel / spreadsheet modeling",
      "Business and financial context",
      "Attention to detail",
      "Reconciliation and validation",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Is accounting a good background for data analytics?",
        answer:
          "It's one of the best. Data analytics rewards numeracy, rigor, and business context — all core to accounting. The main additions are SQL and a visualization tool, which are learnable in a few months on top of skills you already have.",
      },
      {
        question: "Do I need to learn Python to become a data analyst?",
        answer:
          "Not for most analyst roles. SQL plus a BI tool (Power BI or Tableau) covers the majority of job requirements. Python and statistics deepen your options and are worth learning next, but they're rarely a gate for a first analyst role.",
      },
      {
        question: "What kind of analyst role should an accountant target first?",
        answer:
          "Financial analytics or FP&A roles are the highest-probability entry point because you lead with domain expertise you already have and only need to layer on the technical tooling. You can branch into product or marketing analytics once you have the technical reps.",
      },
    ],
  },
  {
    slug: "marketing-manager-to-product-marketing-manager",
    fromSlug: "marketing-manager",
    toSlug: "product-marketing-manager",
    fromRole: "Marketing Manager",
    toRole: "Product Marketing Manager",
    headline: "From Marketing Manager to Product Marketing Manager: The Highest-Leverage Lateral in Tech",
    description:
      "PMM is one of the best-paid, most strategic marketing roles — and it's a natural step up for marketing managers who understand positioning, launches, and the customer.",
    keywords: [
      "marketing manager to product marketing manager",
      "product marketing manager career change",
      "pmm career pivot",
    ],
    tldr: [
      "PMM sits between product, sales, and marketing — a strategic, well-paid step up from general marketing management.",
      "Sharpen positioning, messaging, competitive intel, and sales enablement; deprioritize channel execution.",
      "The pivot is often an internal transfer or a move to a smaller company where you own the whole GTM.",
    ],
    bodyBlocks: [
      {
        heading: "What actually changes",
        body: "As a marketing manager you likely execute campaigns across channels. Product marketing zooms out: you own how a product is positioned, why it beats alternatives, and how sales tells that story. The center of gravity shifts from 'run the campaign' to 'define the message the whole company uses.'",
      },
      {
        heading: "Skills to sharpen",
        body: "Get deliberate about positioning frameworks, competitive analysis, customer research, and sales enablement (decks, battlecards, launch plans). Being able to interview customers and distill a sharp, differentiated message is the single most valued PMM skill.",
      },
      {
        heading: "The path in",
        body: "The cleanest route is an internal move at a company with a product org, or joining a smaller startup where marketing and PMM are the same job. Lead your pitch with a launch you owned and the positioning decisions behind it. " + CTA,
      },
    ],
    transferableSkills: [
      "Messaging and positioning",
      "Campaign and launch execution",
      "Customer insight",
      "Cross-functional coordination",
      "Copywriting and storytelling",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "What's the difference between a marketing manager and a product marketing manager?",
        answer:
          "A marketing manager typically executes campaigns and owns channels; a product marketing manager owns positioning, messaging, launches, and sales enablement for a product. PMM is more strategic and cross-functional, working closely with product and sales, and generally commands higher pay.",
      },
      {
        question: "How do I move into product marketing from general marketing?",
        answer:
          "Sharpen the core PMM skills — positioning, competitive intelligence, customer research, and sales enablement — and get a launch you can point to. The most common routes are an internal transfer at a company with a product team, or joining a smaller startup where you own the entire go-to-market.",
      },
      {
        question: "Is product marketing a good career move financially?",
        answer:
          "Generally yes. PMM roles tend to pay more than equivalent general marketing roles because they sit at the intersection of product, sales, and marketing and directly influence revenue. It's one of the higher-leverage lateral moves available to experienced marketers.",
      },
    ],
  },
  {
    slug: "software-engineer-to-product-manager",
    fromSlug: "software-engineer",
    toSlug: "product-manager",
    fromRole: "Software Engineer",
    toRole: "Product Manager",
    headline: "From Software Engineer to Product Manager: Trading the How for the Why",
    description:
      "Engineers who move into PM bring credibility with the build team and a sharp sense of what's feasible. The shift is learning to own the 'why' and 'what,' not the 'how.'",
    keywords: [
      "software engineer to product manager",
      "engineer to pm career change",
      "technical product manager pivot",
    ],
    tldr: [
      "Engineering-to-PM is a well-worn path; technical credibility is a real advantage with build teams.",
      "The hard shift is influence without authority and prioritizing outcomes over elegant solutions.",
      "Technical PM and platform/API PM roles are the most natural first targets.",
    ],
    bodyBlocks: [
      {
        heading: "Your built-in advantages",
        body: "You can read the codebase, call BS on unrealistic estimates, and earn engineers' trust immediately. You also understand tradeoffs — tech debt, scalability, edge cases — that non-technical PMs learn slowly and painfully. For technical and platform products, that fluency is a genuine moat.",
      },
      {
        heading: "The mindset shift",
        body: "The hardest part isn't learning new tools — it's letting go of owning the solution. PMs win through influence, not authority, and are measured on customer and business outcomes, not code quality. You'll spend far more time with customers, data, and stakeholders than in an IDE.",
      },
      {
        heading: "How to make the move",
        body: "The lowest-risk path is an internal transfer where your team already trusts you. Start by owning a small feature end-to-end — discovery, spec, launch, metrics. Technical PM or API/platform PM roles let you lead with your strength. " + CTA,
      },
    ],
    transferableSkills: [
      "Technical feasibility judgment",
      "Systems thinking",
      "Working closely with engineering",
      "Data and metrics fluency",
      "Debugging (≈ problem diagnosis)",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "Is it hard for a software engineer to become a product manager?",
        answer:
          "The skills gap is small but the mindset shift is real. Engineers bring technical credibility and feasibility judgment for free. The challenge is moving from owning the solution to owning the problem, and influencing outcomes without direct authority. Most succeed via an internal transfer.",
      },
      {
        question: "Should I aim for technical product manager roles?",
        answer:
          "Usually yes, at least first. Technical PM, platform PM, and API/developer-product roles let you lead with your engineering strength and reduce the employer's risk. You can broaden into consumer or growth PM later once you have product reps.",
      },
      {
        question: "Will I take a pay cut moving from engineering to PM?",
        answer:
          "Not necessarily. Senior engineer and senior PM compensation bands overlap heavily, and technical PMs are well paid. Any short-term dip is more likely at the transition point than a permanent ceiling.",
      },
    ],
  },
  {
    slug: "nurse-to-healthcare-data-analyst",
    fromSlug: "nurse",
    toSlug: "healthcare-data-analyst",
    fromRole: "Nurse",
    toRole: "Healthcare Data Analyst",
    headline: "From Nurse to Healthcare Data Analyst: Clinical Insight Meets Data",
    description:
      "Nurses who understand what the data actually means clinically are rare and valuable. This pivot trades bedside hours for analysis while keeping your healthcare expertise central.",
    keywords: [
      "nurse to data analyst",
      "nursing to healthcare analytics",
      "clinical data analyst career change",
    ],
    tldr: [
      "Clinical context is the scarce ingredient in healthcare analytics — you already have it.",
      "Add SQL, a BI tool, and familiarity with EHR/claims data to become hireable.",
      "This is a strong path out of bedside burnout without leaving healthcare.",
    ],
    bodyBlocks: [
      {
        heading: "Why hospitals need clinically-fluent analysts",
        body: "A generic analyst can build a readmissions dashboard; a nurse-analyst knows which readmissions are actually preventable and which metrics will change clinician behavior. That clinical judgment turns raw numbers into decisions, which is why healthcare organizations prize analysts who've worked at the bedside.",
      },
      {
        heading: "The technical add-on",
        body: "Learn SQL, a visualization tool (Power BI or Tableau), and how healthcare data is structured — EHR exports, claims, ICD/CPT codes. You don't need to become a statistician; you need to reliably pull, clean, and present data that clinical leaders trust.",
      },
      {
        heading: "Getting in",
        body: "Quality improvement, informatics, population health, and care-management analytics teams are natural entry points and often recruit from clinical staff. " + CTA,
      },
    ],
    transferableSkills: [
      "Clinical domain knowledge",
      "EHR familiarity",
      "Attention to detail under pressure",
      "Patient-outcome orientation",
      "Communicating with clinicians",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Can a nurse become a data analyst without a technical degree?",
        answer:
          "Yes. Healthcare analytics teams actively value clinical experience because it makes the analysis actionable. The technical gap — SQL, a BI tool, and understanding healthcare data structures — is learnable in months, and your clinical context is the hard-to-teach part you already own.",
      },
      {
        question: "What analytics roles hire nurses?",
        answer:
          "Clinical informatics, quality improvement, population health, and care-management analytics teams frequently recruit from nursing. These roles reward the ability to translate between clinical reality and data, which is exactly a nurse's edge.",
      },
      {
        question: "Is this a good escape from nursing burnout?",
        answer:
          "For many nurses, yes. It moves you off shift work and the physical/emotional load of bedside care while keeping your hard-won clinical knowledge central and valuable. It's a lateral into a healthier work pattern rather than starting over.",
      },
    ],
  },
  {
    slug: "project-manager-to-product-manager",
    fromSlug: "project-manager",
    toSlug: "product-manager",
    fromRole: "Project Manager",
    toRole: "Product Manager",
    headline: "From Project Manager to Product Manager: Owning the Why, Not Just the When",
    description:
      "Project and product management sound alike but reward different instincts. Here's the real gap and how to close it.",
    keywords: [
      "project manager to product manager",
      "pm to pm career change",
      "product manager transition",
    ],
    tldr: [
      "PjM owns delivery (on time, on scope); PM owns the decision of what to build and why.",
      "The gap is discovery, prioritization, and metrics — moving from execution to strategy.",
      "Your delivery credibility is real leverage; lead with it while you build the strategy muscle.",
    ],
    bodyBlocks: [
      {
        heading: "The real difference",
        body: "Project managers are measured on delivering a defined scope on time and budget. Product managers are measured on whether the thing was worth building at all. One optimizes execution; the other decides direction. Confusing the two is the most common reason this pivot stalls.",
      },
      {
        heading: "What to build",
        body: "Develop the muscles PjM doesn't exercise: customer discovery, opportunity sizing, prioritization frameworks, and reading product metrics. Practice defending a 'we should build X, not Y' decision with evidence rather than a Gantt chart.",
      },
      {
        heading: "Making the leap",
        body: "Your organizational credibility means teams already trust you to run things — use that to volunteer for discovery and roadmap work on a live product, then transfer internally. " + CTA,
      },
    ],
    transferableSkills: [
      "Cross-functional coordination",
      "Risk and dependency management",
      "Stakeholder communication",
      "Delivery execution",
      "Scope negotiation",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "Is a project manager the same as a product manager?",
        answer:
          "No. A project manager owns delivery — getting a defined scope shipped on time and budget. A product manager owns the decision of what to build and why, measured on customer and business outcomes. The roles are complementary but reward different skills.",
      },
      {
        question: "What's the hardest part of moving from PjM to PM?",
        answer:
          "Shifting from execution to strategy. You have to develop discovery, prioritization, and metrics judgment, and get comfortable being accountable for outcomes rather than on-time delivery. Your existing delivery credibility helps you earn the chance to prove it.",
      },
      {
        question: "Can I transition internally?",
        answer:
          "Often that's the best route. Because teams already trust you to run things, you can volunteer for roadmap and discovery work on an existing product and make the case for an internal move — lower risk for you and the employer than an outside jump.",
      },
    ],
  },
  {
    slug: "customer-support-to-customer-success-manager",
    fromSlug: "customer-support",
    toSlug: "customer-success-manager",
    fromRole: "Customer Support Rep",
    toRole: "Customer Success Manager",
    headline: "From Customer Support to Customer Success Manager: From Reactive to Strategic",
    description:
      "You already know the product and the customer's pain. CSM turns that into a proactive, revenue-linked, better-paid role. Here's how to make the jump.",
    keywords: [
      "customer support to customer success",
      "support to csm career change",
      "customer success manager pivot",
    ],
    tldr: [
      "Support is reactive and ticket-based; CSM is proactive and tied to retention and expansion revenue.",
      "You already have product mastery and customer empathy — the gap is commercial and account-management skills.",
      "This is one of the most accessible pivots into a higher-paid, career-track role.",
    ],
    bodyBlocks: [
      {
        heading: "Why support is the perfect launchpad",
        body: "CSMs are measured on whether customers renew and expand. Nobody understands why customers churn better than the people answering their tickets. Your product knowledge and pattern-recognition on customer pain are exactly what a CSM uses — just applied proactively instead of reactively.",
      },
      {
        heading: "The skills to grow",
        body: "Learn to think commercially: retention, expansion, and the metrics behind them (churn, NRR). Practice running a proactive account plan and a QBR (quarterly business review) rather than closing tickets. Comfort talking about value and renewals — not just fixes — is the differentiator.",
      },
      {
        heading: "How to move",
        body: "Most companies promote from support into CSM. Volunteer for onboarding or a book of smaller accounts to build the story, then move up. " + CTA,
      },
    ],
    transferableSkills: [
      "Deep product knowledge",
      "Customer empathy",
      "De-escalation and communication",
      "Pattern recognition on churn",
      "Cross-team troubleshooting",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Is customer support a good path into customer success?",
        answer:
          "It's one of the most natural pivots there is. Support builds deep product knowledge and customer empathy — the foundation of the CSM role. The main additions are commercial thinking (retention and expansion) and proactive account management, both learnable on the job.",
      },
      {
        question: "How much more do customer success managers make than support reps?",
        answer:
          "CSM roles typically pay meaningfully more than frontline support because they're tied to revenue retention and expansion, often with a variable component. The exact gap varies by company and segment, but it's a clear step up in both pay and career trajectory.",
      },
      {
        question: "What's the fastest way to get promoted from support to CSM?",
        answer:
          "Volunteer for onboarding, adoption, or a small book of accounts so you can demonstrate proactive, value-focused customer work. Pair that with speaking the commercial language of renewals and expansion, and most companies will move you internally.",
      },
    ],
  },
  {
    slug: "sales-representative-to-solutions-engineer",
    fromSlug: "sales-representative",
    toSlug: "solutions-engineer",
    fromRole: "Sales Representative",
    toRole: "Solutions Engineer",
    headline: "From Sales Rep to Solutions Engineer: The Technical Half of the Deal",
    description:
      "If you love the sales cycle but want to own the technical story instead of the quota, solutions engineering (a.k.a. sales engineering) is the pivot — high pay, less cold outreach.",
    keywords: [
      "sales rep to solutions engineer",
      "sales to sales engineering career change",
      "solutions engineer career pivot",
    ],
    tldr: [
      "Solutions/sales engineers own the technical win: demos, proofs-of-concept, and answering the hard 'can it do X?' questions.",
      "You keep the customer-facing strengths but trade cold outreach and quota pressure for technical depth.",
      "The gap is product and technical fluency, not a CS degree.",
    ],
    bodyBlocks: [
      {
        heading: "The role in one line",
        body: "A solutions engineer is the technical partner to the salesperson — running demos, scoping proofs-of-concept, and translating the customer's technical requirements into 'here's how our product solves it.' You already know how to read a room and drive a deal; now you own the technical credibility inside it.",
      },
      {
        heading: "What to learn",
        body: "Go deep on your product category's technical fundamentals — APIs, integrations, data flows, the common architectures customers ask about. You don't need to code production software, but you need to speak credibly to engineers and demo confidently under tough questions.",
      },
      {
        heading: "Making the switch",
        body: "The easiest move is internal: ask to shadow the SE team and co-run technical calls on your own deals. Sales background plus growing technical depth is a hire-worthy combination. " + CTA,
      },
    ],
    transferableSkills: [
      "Discovery and qualification",
      "Objection handling",
      "Presenting and demoing",
      "Reading buyer motivation",
      "Managing a deal cycle",
    ],
    timeline: "4–9 months",
    faq: [
      {
        question: "Do I need to be a programmer to become a solutions engineer?",
        answer:
          "No. Solutions engineers need enough technical fluency to run demos, scope proofs-of-concept, and answer architecture and integration questions credibly — not to build production software. A sales rep who invests in product and technical depth is a strong candidate.",
      },
      {
        question: "Why move from sales to solutions engineering?",
        answer:
          "It keeps the parts of sales many reps enjoy — customer conversations, driving deals — while reducing cold outreach and pure quota pressure. Compensation is strong, and the role rewards curiosity and technical problem-solving over relentless prospecting.",
      },
      {
        question: "How do I make the transition?",
        answer:
          "The lowest-friction path is internal: shadow the SE team, co-run the technical portions of your own deals, and build up product and technical knowledge until you can own the technical win yourself. Then apply for or transfer into an SE role.",
      },
    ],
  },
  {
    slug: "journalist-to-content-strategist",
    fromSlug: "journalist",
    toSlug: "content-strategist",
    fromRole: "Journalist",
    toRole: "Content Strategist",
    headline: "From Journalist to Content Strategist: Same Craft, Sturdier Industry",
    description:
      "Journalists already interview, distill, and write on deadline. Content strategy applies that craft to a business audience — with better pay and stability.",
    keywords: [
      "journalist to content strategist",
      "journalism to content marketing career change",
      "content strategist career pivot",
    ],
    tldr: [
      "Reporting skills — interviewing, synthesis, clear writing on deadline — transfer almost directly.",
      "Add SEO, audience/funnel thinking, and content-performance metrics to speak the business's language.",
      "Content marketing and strategy roles are actively hiring ex-journalists for exactly these skills.",
    ],
    bodyBlocks: [
      {
        heading: "The craft transfers",
        body: "A content strategist plans, produces, and measures content that moves a business goal. The core skills — interviewing subject-matter experts, distilling complexity, and writing clearly under deadline — are the journalist's daily work. Companies increasingly want that editorial rigor in their content.",
      },
      {
        heading: "What's new",
        body: "Learn the commercial layer: SEO fundamentals, mapping content to an audience and funnel stage, and reading performance metrics (traffic, engagement, conversions). The shift is from 'is this a good story?' to 'does this content earn attention and move the business?'",
      },
      {
        heading: "Where to start",
        body: "Content marketing, editorial, and content strategy roles at tech and B2B companies value newsroom experience. Build two or three business-context writing samples and an understanding of one company's content funnel. " + CTA,
      },
    ],
    transferableSkills: [
      "Interviewing and research",
      "Clear, fast writing",
      "Distilling complexity",
      "Editorial judgment",
      "Meeting deadlines",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Is content strategy a realistic pivot for a journalist?",
        answer:
          "Very. The core editorial skills transfer almost directly, and companies actively seek out journalists for their interviewing, synthesis, and writing discipline. The main additions are SEO, audience/funnel thinking, and content metrics — a few months of learning.",
      },
      {
        question: "Will I have to give up 'real' writing?",
        answer:
          "Not entirely, but the goal changes. Content strategy writing serves a business objective, so you'll balance craft with SEO and conversion goals. Many journalists find it a fair trade for better pay, stability, and a less precarious industry.",
      },
      {
        question: "What samples do I need to get hired?",
        answer:
          "Two or three pieces written for a business audience — a how-to, a thought-leadership article, a customer story — plus evidence you understand how content maps to an audience and a funnel. That reframes your clips into a content-strategy portfolio.",
      },
    ],
  },
  {
    slug: "graphic-designer-to-ux-designer",
    fromSlug: "graphic-designer",
    toSlug: "ux-designer",
    fromRole: "Graphic Designer",
    toRole: "UX Designer",
    headline: "From Graphic Designer to UX Designer: From Making It Look Good to Making It Work",
    description:
      "Graphic designers have the visual craft; UX adds research, interaction, and problem-framing. Here's how to bridge the gap and command higher pay.",
    keywords: [
      "graphic designer to ux designer",
      "graphic design to ux career change",
      "ux design career pivot",
    ],
    tldr: [
      "You already own visual craft and design tools — the missing half is research, interaction, and outcomes.",
      "Rebuild your portfolio around problems solved and user evidence, not just polished visuals.",
      "UX pays more and is more resilient than most pure graphic-design roles.",
    ],
    bodyBlocks: [
      {
        heading: "What carries over — and what doesn't",
        body: "Visual hierarchy, typography, layout, and tool fluency all transfer. What UX adds is the front half of the process: understanding the user's problem, designing interactions and flows, and validating with research. UX is judged on whether people succeed, not only on whether it looks good.",
      },
      {
        heading: "Rebuild the portfolio",
        body: "Graphic-design portfolios show outcomes; UX portfolios show thinking. Convert or create two or three case studies that walk through the problem, your research, the flows you designed, what you tested, and what changed. That process narrative is what hiring managers screen for.",
      },
      {
        heading: "Learning the gaps",
        body: "Pick up user research basics, interaction design, prototyping in Figma, and enough about accessibility and usability heuristics to defend your decisions. " + CTA,
      },
    ],
    transferableSkills: [
      "Visual hierarchy and layout",
      "Typography and color",
      "Design tool fluency (Figma)",
      "Brand and systems thinking",
      "Presenting design work",
    ],
    timeline: "4–9 months",
    faq: [
      {
        question: "Is it easy to switch from graphic design to UX design?",
        answer:
          "It's one of the shorter design pivots because the visual craft and tools transfer. The work is adding the UX half — research, interaction design, and outcome validation — and reframing your portfolio around problems solved rather than finished visuals.",
      },
      {
        question: "Why is my graphic-design portfolio not enough for UX roles?",
        answer:
          "UX hiring managers look for process and decision-making, not just polished screens. They want to see how you understood a user problem, what you researched, the flows you designed, and how testing changed your work. Reframing your portfolio around that narrative is essential.",
      },
      {
        question: "Does UX pay more than graphic design?",
        answer:
          "Generally yes. Product/UX design roles tend to pay more and are more in demand than pure graphic-design roles, which is a major reason for the pivot's popularity.",
      },
    ],
  },
  {
    slug: "administrative-assistant-to-project-coordinator",
    fromSlug: "administrative-assistant",
    toSlug: "project-coordinator",
    fromRole: "Administrative Assistant",
    toRole: "Project Coordinator",
    headline: "From Administrative Assistant to Project Coordinator: The First Rung Into Project Management",
    description:
      "Admins already keep people, schedules, and details on track. Project coordination formalizes that into a career ladder toward project and program management.",
    keywords: [
      "administrative assistant to project coordinator",
      "admin to project management career change",
      "project coordinator career pivot",
    ],
    tldr: [
      "Coordination, scheduling, and stakeholder wrangling are already your daily work.",
      "Add project vocabulary and one methodology (Agile/PMP basics) to formalize the skills.",
      "Project coordinator is the on-ramp to project and eventually program management.",
    ],
    bodyBlocks: [
      {
        heading: "You're closer than you think",
        body: "Administrative assistants already track deadlines, coordinate across people, manage logistics, and keep things from falling through the cracks. Project coordination is the same skill set with a project framework wrapped around it — and a clear promotion ladder above it.",
      },
      {
        heading: "What to add",
        body: "Learn the project vocabulary (scope, milestones, dependencies, RAID logs) and one lightweight methodology such as Agile or CAPM/PMP fundamentals. Get comfortable with a tool like Asana, Jira, or Monday. A recognized entry certification can help you clear résumé screens.",
      },
      {
        heading: "The path up",
        body: "Volunteer to coordinate a real project at your current job to earn the title, then step from coordinator to project manager to program manager over time. " + CTA,
      },
    ],
    transferableSkills: [
      "Scheduling and logistics",
      "Detail tracking",
      "Cross-team coordination",
      "Documentation",
      "Stakeholder communication",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Can an administrative assistant become a project coordinator?",
        answer:
          "Yes, and it's a natural step. Admins already coordinate people, schedules, and details — the heart of project coordination. Adding project vocabulary, a methodology, and a tool like Asana or Jira formalizes those skills into a role with a clear career ladder.",
      },
      {
        question: "Do I need a PMP to become a project coordinator?",
        answer:
          "No. A full PMP is aimed at experienced project managers. For a coordinator role, an entry-level credential like CAPM or a short Agile course is more than enough to clear screens; hands-on coordination experience matters more.",
      },
      {
        question: "Where does the project coordinator path lead?",
        answer:
          "Coordinator is typically the first rung: coordinator → project manager → program manager, with rising pay and scope at each step. It's one of the clearest ladders out of administrative work.",
      },
    ],
  },
  {
    slug: "financial-analyst-to-data-scientist",
    fromSlug: "financial-analyst",
    toSlug: "data-scientist",
    fromRole: "Financial Analyst",
    toRole: "Data Scientist",
    headline: "From Financial Analyst to Data Scientist: Scaling Up From Excel to Models",
    description:
      "Financial analysts already model, forecast, and reason about uncertainty. Data science adds programming and machine learning on a foundation you already have.",
    keywords: [
      "financial analyst to data scientist",
      "finance to data science career change",
      "data scientist career pivot",
    ],
    tldr: [
      "Modeling, forecasting, and statistical intuition already exist in your finance toolkit.",
      "The real lift is Python, ML fundamentals, and moving beyond spreadsheets to code.",
      "Consider data analyst as a stepping stone if you want a faster first move.",
    ],
    bodyBlocks: [
      {
        heading: "The foundation is there",
        body: "Financial analysts build models, forecast under uncertainty, and reason about scenarios and sensitivities. That quantitative intuition — knowing when a result is suspicious, how to frame a question numerically — is exactly what separates good data scientists from people who just run libraries.",
      },
      {
        heading: "The genuine gap",
        body: "Data science is more technical than analytics: expect to learn Python (pandas, scikit-learn), the statistics behind machine learning, and how to work with larger, messier data than a spreadsheet holds. This is a bigger lift than a pure analyst pivot — be honest with yourself about the study time.",
      },
      {
        heading: "Two viable routes",
        body: "You can grind toward data scientist directly, or move to data analyst first (SQL + BI) and grow into science from inside a data team. The stepping-stone route lands income sooner. " + CTA,
      },
    ],
    transferableSkills: [
      "Quantitative modeling",
      "Forecasting under uncertainty",
      "Statistical intuition",
      "Business framing of problems",
      "Excel / advanced spreadsheets",
    ],
    timeline: "9–18 months",
    faq: [
      {
        question: "Can a financial analyst realistically become a data scientist?",
        answer:
          "Yes, but it's one of the more technical pivots. Your modeling and statistical intuition are a strong foundation; the real work is learning Python, machine-learning fundamentals, and handling data beyond spreadsheets. Plan for 9–18 months of serious study.",
      },
      {
        question: "Should I become a data analyst first?",
        answer:
          "Often that's the pragmatic route. Data analyst (SQL plus a BI tool) is reachable in a few months and lets you join a data team, earn while you learn, and grow into data science from the inside rather than making one long leap.",
      },
      {
        question: "How much programming do I need for data science?",
        answer:
          "More than for analytics. Python with pandas and scikit-learn is effectively required, along with the statistics that underpin models. You don't need software-engineering depth, but you do need to be genuinely comfortable writing and debugging code.",
      },
    ],
  },
  {
    slug: "hr-generalist-to-people-analytics-analyst",
    fromSlug: "hr-generalist",
    toSlug: "people-analytics-analyst",
    fromRole: "HR Generalist",
    toRole: "People Analytics Analyst",
    headline: "From HR Generalist to People Analytics Analyst: Turning HR Instinct Into Data",
    description:
      "People analytics is one of the fastest-growing HR specialties. Generalists who understand the human context behind the data are exactly who these teams want.",
    keywords: [
      "hr to people analytics",
      "hr generalist to data analyst career change",
      "people analytics career pivot",
    ],
    tldr: [
      "HR context — attrition drivers, engagement, hiring funnels — is the scarce ingredient in people analytics.",
      "Add SQL, a BI tool, and basic statistics to turn intuition into evidence.",
      "It's a higher-paid, more strategic specialty within a field you already know.",
    ],
    bodyBlocks: [
      {
        heading: "Why HR context matters",
        body: "People analytics answers questions like why attrition is spiking or which hiring sources produce the best employees. A generalist already knows the human story behind those numbers — what a bad manager looks like, why people really quit — which keeps the analysis grounded and actionable.",
      },
      {
        heading: "The technical add",
        body: "Learn SQL, a visualization tool (Power BI or Tableau), and enough statistics to distinguish correlation from causation. Practice on your own org's data: build a real attrition or hiring-funnel dashboard that tells leadership something they didn't know.",
      },
      {
        heading: "Positioning the move",
        body: "Many people-analytics roles sit inside HR, so an internal transfer is often the smoothest path. Lead with an HR problem you quantified. " + CTA,
      },
    ],
    transferableSkills: [
      "HR domain knowledge",
      "Employee lifecycle understanding",
      "Confidentiality and judgment",
      "Stakeholder partnering",
      "Survey and engagement data literacy",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "What is people analytics and is it a good career move?",
        answer:
          "People analytics uses data to answer workforce questions — attrition, engagement, hiring effectiveness, DEI. It's one of the fastest-growing, higher-paid HR specialties, and HR generalists are well positioned because they understand the human context that makes the data actionable.",
      },
      {
        question: "What technical skills do I need to move into people analytics?",
        answer:
          "SQL, a BI/visualization tool such as Power BI or Tableau, and basic statistics to interpret results responsibly. You can practice on your own organization's HR data, which also produces a portfolio piece for interviews.",
      },
      {
        question: "Is an internal transfer the best way in?",
        answer:
          "Frequently, yes. People-analytics functions often live within HR, so building a data-backed project on a real HR problem and pitching an internal move is usually smoother than switching companies cold.",
      },
    ],
  },
  {
    slug: "retail-manager-to-operations-manager",
    fromSlug: "retail-manager",
    toSlug: "operations-manager",
    fromRole: "Retail Manager",
    toRole: "Operations Manager",
    headline: "From Retail Manager to Operations Manager: Same Discipline, Bigger Stage",
    description:
      "Running a store is running a P&L, a team, and a supply chain in miniature. Operations management scales that discipline across a business — often at desk hours and better pay.",
    keywords: [
      "retail manager to operations manager",
      "retail to operations career change",
      "operations manager career pivot",
    ],
    tldr: [
      "Store management already exercises the core ops muscles: P&L, staffing, inventory, and process.",
      "Add process-improvement frameworks (Lean/Six Sigma) and data fluency to scale up.",
      "It's a path off retail hours into corporate operations without abandoning your experience.",
    ],
    bodyBlocks: [
      {
        heading: "You already run operations",
        body: "A store manager owns a P&L, schedules staff, manages inventory and shrink, hits targets, and keeps a process running under pressure. That's operations management at a single-location scale. The pivot is about applying the same discipline to larger, more complex systems.",
      },
      {
        heading: "What to strengthen",
        body: "Pick up formal process-improvement methods (Lean, Six Sigma basics), sharpen your data and spreadsheet skills, and learn to speak in operational metrics — throughput, cost per unit, SLA, utilization. A Lean/Six Sigma yellow or green belt is a credible résumé signal.",
      },
      {
        heading: "Where to aim",
        body: "Distribution, fulfillment, and multi-site operations roles value retail leaders who've managed people and margins in the real world. " + CTA,
      },
    ],
    transferableSkills: [
      "P&L ownership",
      "Team leadership and scheduling",
      "Inventory and supply management",
      "Process discipline under pressure",
      "Hitting operational targets",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Does retail management count as operations experience?",
        answer:
          "Yes. Running a store means owning a P&L, managing staff, controlling inventory, and keeping a process running to targets — the core of operations management at one location. The pivot is scaling that discipline to larger systems and learning the associated frameworks.",
      },
      {
        question: "What should I learn to move into corporate operations?",
        answer:
          "Formal process-improvement methods (Lean or Six Sigma basics), stronger data and spreadsheet skills, and fluency in operational metrics like throughput, cost per unit, and utilization. A yellow or green belt certification is a useful, attainable credential.",
      },
      {
        question: "Will I escape retail hours?",
        answer:
          "Usually. Corporate operations, distribution, and fulfillment management roles are more likely to follow standard business hours than store management, which is a common motivation for the move alongside better pay.",
      },
    ],
  },
  {
    slug: "lawyer-to-legal-operations-manager",
    fromSlug: "lawyer",
    toSlug: "legal-operations-manager",
    fromRole: "Lawyer",
    toRole: "Legal Operations Manager",
    headline: "From Lawyer to Legal Operations Manager: Practice the Business of Law, Not the Billable Hour",
    description:
      "Legal ops runs the legal department like a business — tech, vendors, process, and budget. It's a growing escape route from billable-hour burnout that keeps your legal fluency central.",
    keywords: [
      "lawyer to legal operations",
      "attorney career change",
      "legal ops career pivot",
    ],
    tldr: [
      "Legal ops manages process, technology, vendors, and budgets for a legal team — business skills applied to law.",
      "Your legal fluency is the moat; the additions are ops, data, and project-management skills.",
      "It's a fast-growing, in-house path away from billable-hour pressure.",
    ],
    bodyBlocks: [
      {
        heading: "What legal ops actually is",
        body: "Legal operations makes a legal department run efficiently: selecting and managing legal tech, controlling outside-counsel spend, standardizing processes, and reporting on metrics. It's the business and management layer of law — ideal for lawyers who like structure and improvement more than litigation or deal grind.",
      },
      {
        heading: "The skills to add",
        body: "Layer project management, data/reporting, vendor management, and process design on top of your legal knowledge. Familiarity with contract-lifecycle management, e-billing, and matter-management tools is a strong signal. Your ability to read legal risk keeps you credible with the lawyers you support.",
      },
      {
        heading: "Making the move",
        body: "In-house legal departments and fast-growing companies are building legal-ops functions. An internal shift from practicing attorney to ops is common and low-risk. " + CTA,
      },
    ],
    transferableSkills: [
      "Legal domain expertise",
      "Risk assessment",
      "Contract fluency",
      "Precision and analysis",
      "Managing outside counsel",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "What does a legal operations manager do?",
        answer:
          "Legal ops runs the business side of a legal department: managing legal technology, controlling outside-counsel spend, designing efficient processes, and reporting on metrics. It's a management and operations role that leans on legal fluency without requiring you to practice.",
      },
      {
        question: "Is legal ops a good escape from practicing law?",
        answer:
          "For many lawyers, yes. It moves you off the billable-hour treadmill and adversarial work while keeping your legal knowledge valuable. It's an in-house, fast-growing function with a healthier pace than most private-practice roles.",
      },
      {
        question: "What skills do I need to add as a lawyer moving into legal ops?",
        answer:
          "Project management, data and reporting, vendor management, and process design, plus familiarity with legal tech like contract-lifecycle-management and e-billing tools. Your legal expertise remains the foundation that makes you credible in the role.",
      },
    ],
  },
  {
    slug: "copywriter-to-content-designer",
    fromSlug: "copywriter",
    toSlug: "content-designer",
    fromRole: "Copywriter",
    toRole: "Content Designer",
    headline: "From Copywriter to Content Designer: Words That Do a Job Inside the Product",
    description:
      "Content design (UX writing) shapes the words inside products — buttons, errors, flows. For copywriters, it's a higher-paid, more stable path that uses your craft in a new context.",
    keywords: [
      "copywriter to content designer",
      "copywriting to ux writing career change",
      "content designer career pivot",
    ],
    tldr: [
      "Content design is product writing: microcopy, flows, and error states that help users succeed.",
      "Your writing craft transfers; the additions are UX process, research, and systems thinking.",
      "It pays more and is more resilient than most freelance/agency copywriting.",
    ],
    bodyBlocks: [
      {
        heading: "The role in context",
        body: "Content designers (also called UX writers) craft the words users read inside a product — button labels, empty states, error messages, onboarding flows. The goal isn't persuasion for its own sake; it's clarity that reduces confusion and helps someone finish a task. Your instinct for tone and concision is directly useful.",
      },
      {
        heading: "What to learn",
        body: "Add UX fundamentals: how flows work, how to collaborate with designers and PMs, how to test copy with users, and how to write to a design system with consistent voice and patterns. Learn to justify word choices with usability reasoning, not just taste.",
      },
      {
        heading: "Building proof",
        body: "Create a small portfolio of before/after product-copy improvements with the reasoning behind each. Product teams hire on that thinking. " + CTA,
      },
    ],
    transferableSkills: [
      "Concise, clear writing",
      "Voice and tone control",
      "Editing and simplification",
      "Audience awareness",
      "Working to a brief",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "What's the difference between copywriting and content design?",
        answer:
          "Copywriting persuades — ads, landing pages, campaigns. Content design writes the functional words inside a product to help users complete tasks: buttons, errors, onboarding, empty states. It's more collaborative and research-informed, and it sits within product teams.",
      },
      {
        question: "Is content design a good move for a copywriter?",
        answer:
          "Often yes. It tends to pay more and offer more stability than freelance or agency copywriting, while still using your core craft. The additions are UX process, collaboration with designers and PMs, and writing to a design system.",
      },
      {
        question: "How do I build a content-design portfolio from copywriting work?",
        answer:
          "Create a few before/after examples of product microcopy — rewrite a confusing error message, an onboarding flow, or an empty state — and explain the usability reasoning behind each change. That thinking, not polished prose alone, is what product teams evaluate.",
      },
    ],
  },
  {
    slug: "operations-manager-to-program-manager",
    fromSlug: "operations-manager",
    toSlug: "program-manager",
    fromRole: "Operations Manager",
    toRole: "Program Manager",
    headline: "From Operations Manager to Program Manager: Coordinating Complexity at Scale",
    description:
      "Program management orchestrates many projects and teams toward a strategic goal. For operations managers, it's a natural, well-paid step into cross-functional leadership.",
    keywords: [
      "operations manager to program manager",
      "operations to program management career change",
      "program manager career pivot",
    ],
    tldr: [
      "Program managers coordinate multiple projects and teams toward a strategic outcome.",
      "Ops leaders already do cross-functional coordination, risk management, and execution.",
      "Add program-management frameworks and stakeholder-influence skills to formalize the move.",
    ],
    bodyBlocks: [
      {
        heading: "The natural progression",
        body: "Operations managers already coordinate across teams, manage risk, and drive execution against targets. Program management scales that to a portfolio of related projects aligned to a strategic goal — think 'launch the new region' rather than 'run the warehouse.' The core competency, orchestrating complexity, is the same.",
      },
      {
        heading: "What to develop",
        body: "Sharpen structured program frameworks (roadmaps, dependency mapping, governance), executive communication, and influence without authority across senior stakeholders. In tech, learn how programs interact with product and engineering; in other industries, learn the domain's delivery model.",
      },
      {
        heading: "Positioning yourself",
        body: "Frame a large, cross-functional initiative you've led as a 'program,' with the outcome and the coordination it required. " + CTA,
      },
    ],
    transferableSkills: [
      "Cross-functional coordination",
      "Risk and dependency management",
      "Execution against targets",
      "Stakeholder communication",
      "Resource planning",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "What's the difference between operations management and program management?",
        answer:
          "Operations management keeps an ongoing function running efficiently; program management orchestrates a set of related projects toward a specific strategic outcome, often cross-functionally and with a defined end state. Program management leans more on influence, governance, and strategic alignment.",
      },
      {
        question: "Is program management a step up from operations?",
        answer:
          "It's typically a lateral-to-upward move with strong pay, especially in tech. Operations leaders bring exactly the coordination, risk, and execution skills programs need; the additions are formal frameworks and executive-level stakeholder influence.",
      },
      {
        question: "How do I position my operations experience for a program role?",
        answer:
          "Identify a large cross-functional initiative you led, frame it as a program with a clear strategic outcome, and describe the dependencies, stakeholders, and governance you managed. That reframing translates ops experience into program-management language.",
      },
    ],
  },
  {
    slug: "small-business-owner-to-growth-marketer",
    fromSlug: "small-business-owner",
    toSlug: "growth-marketer",
    fromRole: "Small Business Owner",
    toRole: "Growth Marketer",
    headline: "From Small Business Owner to Growth Marketer: You've Already Run Every Channel",
    description:
      "You've done the ads, the email, the SEO, and the analytics — with your own money on the line. Growth marketing formalizes that hard-won, full-funnel experience.",
    keywords: [
      "business owner to growth marketer",
      "entrepreneur to marketing career change",
      "growth marketer career pivot",
    ],
    tldr: [
      "Running your own business means you've already touched the whole funnel with real stakes.",
      "Formalize it: sharpen analytics, experimentation, and one or two channels to expert depth.",
      "Startups value operators who understand acquisition, retention, and unit economics.",
    ],
    bodyBlocks: [
      {
        heading: "Real stakes are the differentiator",
        body: "Growth marketing is about moving acquisition, activation, and retention metrics through experimentation. As an owner you've run ads, built email lists, wrangled SEO, and watched what actually converts — with your own money at risk. That end-to-end, results-obsessed instinct is what growth teams hire for.",
      },
      {
        heading: "Where to sharpen",
        body: "Deepen your analytics (funnels, cohorts, attribution), learn structured experimentation (A/B testing, hypothesis-driven iteration), and pick one or two channels to master at a professional depth. Get fluent in the metrics language: CAC, LTV, conversion rate, retention.",
      },
      {
        heading: "How to land the role",
        body: "Package your business results as growth case studies — what you tried, what moved the metric, what you'd do with a real budget. Startups especially value ex-founders. " + CTA,
      },
    ],
    transferableSkills: [
      "Full-funnel marketing",
      "Budget and ROI discipline",
      "Analytics and iteration",
      "Resourcefulness under constraints",
      "Customer understanding",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Can a former business owner get hired as a growth marketer?",
        answer:
          "Yes, and it's a compelling story. Owners have run the full funnel with real money on the line — acquisition, retention, analytics — which is exactly what growth marketing rewards. The work is formalizing that experience into case studies and sharpening analytics and experimentation.",
      },
      {
        question: "What growth skills should I strengthen?",
        answer:
          "Analytics (funnels, cohorts, attribution), structured experimentation and A/B testing, and deep expertise in one or two channels. Fluency in growth metrics like CAC, LTV, and retention lets you speak the language hiring managers expect.",
      },
      {
        question: "Do startups value entrepreneurial experience for marketing roles?",
        answer:
          "Very much. Startups prize operators who understand unit economics and can run scrappy, results-driven experiments. Framing your business outcomes as growth case studies makes your ownership experience a hiring asset rather than a gap.",
      },
    ],
  },
  {
    slug: "call-center-agent-to-customer-success-manager",
    fromSlug: "call-center-agent",
    toSlug: "customer-success-manager",
    fromRole: "Call Center Agent",
    toRole: "Customer Success Manager",
    headline: "From Call Center Agent to Customer Success Manager: Off the Queue, Into the Career Ladder",
    description:
      "High-volume customer conversations gave you real skills. Customer success turns them into a proactive, relationship-driven, better-paid role with room to grow.",
    keywords: [
      "call center to customer success",
      "call center agent career change",
      "customer success manager pivot",
    ],
    tldr: [
      "You already handle customers, objections, and pressure at volume — a strong CSM foundation.",
      "Move from reactive queue work to proactive account management tied to retention revenue.",
      "Onboarding, support, or SaaS CSM roles are the realistic first steps up.",
    ],
    bodyBlocks: [
      {
        heading: "The skills you don't credit yourself for",
        body: "Handling back-to-back customer calls builds composure, fast rapport, clear explanation, and de-escalation — all core to customer success. What changes is the mode: from clearing a queue to proactively guiding a set of accounts toward value and renewal.",
      },
      {
        heading: "What to add",
        body: "Learn the SaaS/customer-success basics: onboarding, adoption, retention and expansion, and the metrics (churn, NRR) behind them. Familiarity with a CRM and comfort discussing value rather than just resolving issues is the key upgrade.",
      },
      {
        heading: "The realistic ladder",
        body: "Target a junior CSM, onboarding specialist, or support-to-success role, especially at software companies. Frame your best save or upsell as proof. " + CTA,
      },
    ],
    transferableSkills: [
      "High-volume customer handling",
      "De-escalation",
      "Clear verbal communication",
      "Composure under pressure",
      "Building quick rapport",
    ],
    timeline: "4–9 months",
    faq: [
      {
        question: "Can a call center agent become a customer success manager?",
        answer:
          "Yes. High-volume customer work builds composure, communication, and de-escalation — the foundation of customer success. The shift is from reactive queue work to proactive account management tied to retention, plus learning SaaS metrics and a CRM.",
      },
      {
        question: "What's the first realistic step up from a call center?",
        answer:
          "A junior CSM, onboarding specialist, or support-to-success role at a software company is the usual first rung. These roles value your customer-handling reps while giving you room to learn the commercial, relationship-driven side.",
      },
      {
        question: "How much can I improve my pay with this move?",
        answer:
          "Customer success generally pays more than frontline call-center work and offers a genuine career ladder toward senior CSM and team-lead roles. It's one of the more attainable pivots into a higher-paid, growth-oriented track.",
      },
    ],
  },
  {
    slug: "bank-teller-to-data-analyst",
    fromSlug: "bank-teller",
    toSlug: "data-analyst",
    fromRole: "Bank Teller",
    toRole: "Data Analyst",
    headline: "From Bank Teller to Data Analyst: From Handling Numbers to Interpreting Them",
    description:
      "Tellers are precise with numbers, trusted with sensitive data, and fluent in banking operations. Data analytics builds on all three — a realistic climb with the right skills.",
    keywords: [
      "bank teller to data analyst",
      "banking to data analytics career change",
      "data analyst career pivot",
    ],
    tldr: [
      "Numerical accuracy, data sensitivity, and banking-domain knowledge are real starting assets.",
      "Learn SQL, Excel to an advanced level, and a BI tool to become hireable.",
      "Internal moves into a bank's analytics or reporting team are the highest-probability path.",
    ],
    bodyBlocks: [
      {
        heading: "Your starting assets",
        body: "Tellers are meticulous with numbers, handle sensitive financial data responsibly, and understand banking products and customer behavior. Those are genuine analyst foundations — accuracy, data-handling discipline, and domain context that a generic analyst lacks.",
      },
      {
        heading: "The learning plan",
        body: "Build advanced Excel, then SQL (the core analyst skill), then a BI tool like Power BI or Tableau. Practice by turning banking scenarios — transaction patterns, product uptake, branch performance — into a dashboard. Consider a recognized data-analytics certificate to clear résumé screens.",
      },
      {
        heading: "The internal advantage",
        body: "Large banks have big analytics and reporting teams and often prefer internal candidates who know the business. Ask about internal mobility and analyst-adjacent openings. " + CTA,
      },
    ],
    transferableSkills: [
      "Numerical accuracy",
      "Handling sensitive data",
      "Banking product knowledge",
      "Customer interaction",
      "Compliance awareness",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Is bank teller experience useful for a data analyst role?",
        answer:
          "Yes. Tellers bring numerical precision, responsible data handling, and banking-domain knowledge — a real head start. The learnable gap is SQL, advanced Excel, and a BI tool, after which your domain context becomes a genuine advantage in financial-services analytics.",
      },
      {
        question: "How do I get my first analyst role from a teller position?",
        answer:
          "Build the technical skills, create a small banking-themed dashboard portfolio, and pursue internal mobility — large banks have sizable analytics and reporting teams and often favor internal candidates who already understand the business.",
      },
      {
        question: "Do I need a certificate to become a data analyst?",
        answer:
          "It's optional but helpful for career changers with no analyst title yet. A recognized data-analytics certificate can get your résumé past screens; ultimately, demonstrable SQL and a portfolio project matter more than the certificate itself.",
      },
    ],
  },
  {
    slug: "social-worker-to-ux-researcher",
    fromSlug: "social-worker",
    toSlug: "ux-researcher",
    fromRole: "Social Worker",
    toRole: "UX Researcher",
    headline: "From Social Worker to UX Researcher: You Already Run the Hardest Interviews",
    description:
      "UX research is structured empathy — interviewing people, synthesizing needs, and advocating for them. Social workers do a harder version of this every day.",
    keywords: [
      "social worker to ux researcher",
      "social work to ux research career change",
      "ux researcher career pivot",
    ],
    tldr: [
      "Interviewing, synthesizing needs, and advocacy are the core of UX research — and your daily practice.",
      "Add research methods vocabulary, usability testing, and how research drives product decisions.",
      "It's a meaningful, better-paid path that keeps your people-centered work at the core.",
    ],
    bodyBlocks: [
      {
        heading: "The skills already run deep",
        body: "UX researchers interview users, uncover unspoken needs, synthesize findings, and advocate for the human on the other side of the product. Social workers conduct emotionally complex interviews, assess real needs, document rigorously, and advocate for vulnerable people — a harder version of the same craft.",
      },
      {
        heading: "What to translate and learn",
        body: "Learn the UX-research vocabulary and toolkit: qualitative and usability testing methods, survey design, affinity mapping, and how findings feed product and design decisions. The shift is applying your interviewing and synthesis skills to product problems and communicating them to designers, PMs, and engineers.",
      },
      {
        heading: "Getting in",
        body: "Build a small research portfolio — run a study on any product, document your method and insights, and show the recommendation. Mixed-methods and qualitative-research roles are natural entry points. " + CTA,
      },
    ],
    transferableSkills: [
      "In-depth interviewing",
      "Needs assessment",
      "Empathy and rapport",
      "Rigorous documentation",
      "Advocating for people",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Can a social worker become a UX researcher?",
        answer:
          "Yes — it's an unusually strong fit. UX research is structured empathy: interviewing, synthesizing needs, and advocating for users. Social workers do a more demanding version daily. The main work is learning UX-research methods and how findings drive product decisions.",
      },
      {
        question: "What do I need to learn to move into UX research?",
        answer:
          "The research toolkit and vocabulary — qualitative interviewing framed for products, usability testing, survey design, affinity mapping — plus how research influences design and product choices. Your interviewing and synthesis skills already transfer directly.",
      },
      {
        question: "How do I show UX-research ability without industry experience?",
        answer:
          "Run a small self-directed study on any product: define a question, interview a handful of users, synthesize findings, and present a recommendation. That end-to-end case study demonstrates method and communication, which is what hiring teams screen for.",
      },
    ],
  },
  {
    slug: "qa-tester-to-data-analyst",
    fromSlug: "qa-tester",
    toSlug: "data-analyst",
    fromRole: "QA Tester",
    toRole: "Data Analyst",
    headline: "From QA Tester to Data Analyst: From Finding Bugs to Finding Insights",
    description:
      "QA testers already think in edge cases, reproduce issues methodically, and often touch SQL. Data analytics is a short, logical next step.",
    keywords: [
      "qa tester to data analyst",
      "qa to data analytics career change",
      "quality assurance to data analyst pivot",
    ],
    tldr: [
      "QA builds analytical rigor, hypothesis-testing, and often some SQL already.",
      "Fill the gap with deeper SQL, a BI tool, and basic statistics.",
      "Product and quality analytics roles let you lead with your existing domain.",
    ],
    bodyBlocks: [
      {
        heading: "A short bridge",
        body: "QA testing is inherently analytical: you form hypotheses about where software breaks, test them methodically, and document findings precisely. Many testers already write SQL to verify data and use bug-tracking analytics. Data analysis applies that same investigative mindset to business questions instead of defects.",
      },
      {
        heading: "Closing the gap",
        body: "Deepen SQL beyond validation queries, learn a BI tool (Power BI or Tableau), and add basic statistics so you interpret results correctly. Rebuild a quality or release dashboard — defect rates, coverage, release health — as a portfolio piece.",
      },
      {
        heading: "First roles",
        body: "Product analytics, quality/engineering analytics, and general BI roles value your software context. " + CTA,
      },
    ],
    transferableSkills: [
      "Hypothesis-driven investigation",
      "Attention to detail",
      "Methodical reproduction",
      "Basic SQL",
      "Documentation and reporting",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Is QA a good background for becoming a data analyst?",
        answer:
          "Yes — it's a short bridge. QA builds analytical rigor, hypothesis-testing, and often some SQL already. Deepening SQL, adding a BI tool, and learning basic statistics is usually enough to make the move, with your software context as a bonus.",
      },
      {
        question: "What should a QA tester learn first to become an analyst?",
        answer:
          "Go beyond validation queries into analytical SQL (joins, aggregations, window functions), pick up Power BI or Tableau, and learn enough statistics to interpret results responsibly. A dashboard built from quality/release data makes a natural portfolio piece.",
      },
      {
        question: "What analyst roles suit an ex-QA tester?",
        answer:
          "Product analytics, quality or engineering analytics, and general business-intelligence roles are strong fits because your software and testing background gives you domain context most career changers lack.",
      },
    ],
  },
  {
    slug: "mechanical-engineer-to-data-analyst",
    fromSlug: "mechanical-engineer",
    toSlug: "data-analyst",
    fromRole: "Mechanical Engineer",
    toRole: "Data Analyst",
    headline: "From Mechanical Engineer to Data Analyst: Quantitative Rigor, New Domain",
    description:
      "Engineers bring math, modeling, and analytical discipline that most aspiring analysts lack. The pivot is mostly tools and business context, not fundamentals.",
    keywords: [
      "mechanical engineer to data analyst",
      "engineering to data analytics career change",
      "engineer data analyst pivot",
    ],
    tldr: [
      "Quantitative reasoning and analytical rigor already exceed the analyst bar.",
      "Learn SQL, a BI tool, and business context; consider Python for a data-science trajectory.",
      "Manufacturing, supply-chain, and operations analytics value your engineering domain.",
    ],
    bodyBlocks: [
      {
        heading: "You clear the hard bar already",
        body: "Mechanical engineers work with data, models, and statistics daily and are trained to reason quantitatively about messy real-world systems. That analytical maturity is the part most aspiring analysts struggle with — you're starting well ahead of the fundamentals.",
      },
      {
        heading: "What to add",
        body: "Learn SQL and a BI tool, and get comfortable framing business (not just physical) problems. If you want to aim higher, Python and machine learning open a data-science path. Engineers often over-index on modeling and under-index on communicating insights simply — practice that.",
      },
      {
        heading: "Domain-matched entry",
        body: "Manufacturing, supply-chain, quality, and operations analytics roles reward engineering domain knowledge and are a natural first landing. " + CTA,
      },
    ],
    transferableSkills: [
      "Quantitative reasoning",
      "Modeling and simulation",
      "Statistical analysis",
      "Systematic problem-solving",
      "Technical documentation",
    ],
    timeline: "3–6 months",
    faq: [
      {
        question: "Is mechanical engineering a good background for data analytics?",
        answer:
          "Excellent. Engineers bring quantitative reasoning, modeling, and statistical rigor that exceed the analyst bar. The pivot mostly requires learning SQL, a BI tool, and business framing — your analytical fundamentals are already strong.",
      },
      {
        question: "Should I aim for data analyst or data scientist?",
        answer:
          "Data analyst is the faster landing and needs SQL plus a BI tool. If you enjoy programming, your math background makes data science reachable too — add Python and machine learning. Many engineers start as analysts and grow into science from there.",
      },
      {
        question: "What industries should an engineer target for analytics roles?",
        answer:
          "Manufacturing, supply chain, quality, energy, and operations analytics all value engineering domain knowledge, making them the highest-probability first roles where your background is an asset rather than a translation problem.",
      },
    ],
  },
  {
    slug: "it-support-to-cybersecurity-analyst",
    fromSlug: "it-support",
    toSlug: "cybersecurity-analyst",
    fromRole: "IT Support Specialist",
    toRole: "Cybersecurity Analyst",
    headline: "From IT Support to Cybersecurity Analyst: The Most Common On-Ramp Into Security",
    description:
      "IT support is the classic launchpad into cybersecurity. You already understand systems, networks, and how things break — now learn to defend them.",
    keywords: [
      "it support to cybersecurity analyst",
      "help desk to cybersecurity career change",
      "cybersecurity analyst career pivot",
    ],
    tldr: [
      "Help desk / IT support is the most common feeder into security roles.",
      "Add security fundamentals plus a credential like Security+ to clear the first gate.",
      "SOC analyst is the typical entry-level security role for people with IT support experience.",
    ],
    bodyBlocks: [
      {
        heading: "Why support is the launchpad",
        body: "You already troubleshoot systems, understand networks and user behavior, and see how things fail in the real world. Security builds directly on that: instead of restoring service, you detect, investigate, and respond to threats. Hiring managers know IT support builds exactly this foundation.",
      },
      {
        heading: "The credential path",
        body: "Learn security fundamentals — networking, common attack types, logging and monitoring — and earn an entry credential such as CompTIA Security+. Home-lab practice (setting up a SIEM, analyzing logs, running through detection scenarios) turns theory into an interview story.",
      },
      {
        heading: "Your first security role",
        body: "A SOC (security operations center) analyst role is the standard entry point, monitoring alerts and investigating incidents. From there you can specialize into threat hunting, GRC, or cloud security. " + CTA,
      },
    ],
    transferableSkills: [
      "Systems and network troubleshooting",
      "Incident triage",
      "User support and awareness",
      "Documentation",
      "Working under SLAs",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Is IT support a good way into cybersecurity?",
        answer:
          "It's the most common on-ramp. Support builds real understanding of systems, networks, and failure modes — the foundation of security work. Adding security fundamentals and a credential like Security+ typically gets you to an entry-level SOC analyst role.",
      },
      {
        question: "What certification should I get to move into cybersecurity?",
        answer:
          "CompTIA Security+ is the standard entry credential and clears many résumé screens. Pair it with hands-on home-lab practice — setting up monitoring, analyzing logs, working through detection scenarios — so you can talk about real experience in interviews.",
      },
      {
        question: "What's the typical first cybersecurity job?",
        answer:
          "A SOC (security operations center) analyst role, monitoring security alerts and investigating incidents, is the usual entry point for people coming from IT support. It's the launchpad for specializing later into threat hunting, cloud security, or governance and compliance.",
      },
    ],
  },
  {
    slug: "consultant-to-product-manager",
    fromSlug: "consultant",
    toSlug: "product-manager",
    fromRole: "Management Consultant",
    toRole: "Product Manager",
    headline: "From Management Consultant to Product Manager: From Recommending to Building",
    description:
      "Consultants bring structured thinking, stakeholder skills, and business acumen. The PM shift is ownership — living with the outcome instead of handing off a deck.",
    keywords: [
      "consultant to product manager",
      "consulting to product management career change",
      "management consultant pm pivot",
    ],
    tldr: [
      "Structured problem-solving, stakeholder management, and business framing transfer directly.",
      "The shift is from recommending to owning outcomes and getting technical enough to earn engineers' trust.",
      "Ex-consultants are actively recruited into PM, especially at growth-stage companies.",
    ],
    bodyBlocks: [
      {
        heading: "The strong overlap",
        body: "Consultants structure ambiguous problems, marshal stakeholders, and reason about business impact — all central to product management. Many companies actively recruit consultants into PM roles because that analytical and communication toolkit is hard to teach.",
      },
      {
        heading: "The real adjustment",
        body: "Consulting ends at the recommendation; product management begins there. You'll own the outcome, live with the tradeoffs, and iterate for months — no clean handoff. You also need enough technical and product fluency to earn engineers' respect and make feasibility calls, which the slide-deck world doesn't build.",
      },
      {
        heading: "Making the move",
        body: "Leverage your firm's alumni network and exit opportunities, and get reps with a real product — ship something, read the metrics, own the result. " + CTA,
      },
    ],
    transferableSkills: [
      "Structured problem-solving",
      "Stakeholder management",
      "Business and market analysis",
      "Executive communication",
      "Working under ambiguity",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "Do consultants make good product managers?",
        answer:
          "Often, yes. Consultants bring structured problem-solving, stakeholder management, and business framing that transfer directly to PM. Many companies recruit consultants into product roles. The main adjustments are owning outcomes over time and building enough technical fluency to work credibly with engineers.",
      },
      {
        question: "What's the hardest part of the consulting-to-PM switch?",
        answer:
          "Moving from recommending to owning. Consulting ends at the deliverable; product management means living with the decision, iterating for months, and being accountable for the result — plus getting technical enough to earn the build team's trust.",
      },
      {
        question: "How do I break into product management from consulting?",
        answer:
          "Use your firm's alumni network and exit-opportunity channels, and get hands-on reps with a real product — ship something, own the metrics, and be able to tell an end-to-end product story rather than a case-study narrative.",
      },
    ],
  },
  {
    slug: "marketing-manager-to-ai-content-strategist",
    fromSlug: "marketing-manager",
    toSlug: "ai-content-strategist",
    fromRole: "Marketing Manager",
    toRole: "AI Content Strategist",
    headline: "From Marketing Manager to AI Content Strategist: Lead the AI Content Shift Instead of Fearing It",
    description:
      "AI is rewriting content workflows. Marketers who master AI-assisted strategy, quality control, and workflow design become more valuable, not less. Here's the pivot.",
    keywords: [
      "marketing manager to ai content strategist",
      "ai content strategy career change",
      "ai marketing career pivot",
    ],
    tldr: [
      "AI content strategy is a fast-emerging specialty — designing AI-assisted content systems, not just prompts.",
      "Your marketing judgment is what keeps AI output on-brand, accurate, and effective.",
      "This is a defensive-and-offensive pivot: it future-proofs a marketing career against AI disruption.",
    ],
    bodyBlocks: [
      {
        heading: "The role emerging now",
        body: "AI content strategists design how a team uses AI to produce content at scale — choosing tools, building prompt and review workflows, setting quality and brand guardrails, and keeping a human editorial standard. The value isn't generating text; it's orchestrating AI plus human judgment to produce content that actually performs.",
      },
      {
        heading: "What to learn",
        body: "Get genuinely fluent with modern AI writing tools, prompt design, and — critically — how to evaluate and correct AI output for accuracy, voice, and SEO. Learn to design a repeatable content workflow where AI drafts and humans direct and verify. Your existing brand and audience judgment is the differentiator.",
      },
      {
        heading: "Why now",
        body: "Companies are scrambling for marketers who can harness AI responsibly rather than be replaced by it. Position yourself as the person who made AI content work without sacrificing quality. " + CTA,
      },
    ],
    transferableSkills: [
      "Brand and editorial judgment",
      "Content strategy and planning",
      "SEO and audience insight",
      "Quality control",
      "Cross-team workflow design",
    ],
    timeline: "2–5 months",
    faq: [
      {
        question: "What does an AI content strategist do?",
        answer:
          "They design how a team uses AI to create content: selecting tools, building prompt and review workflows, setting brand and quality guardrails, and ensuring AI-assisted output is accurate, on-voice, and effective. The role blends marketing judgment with AI fluency rather than just writing prompts.",
      },
      {
        question: "Will AI make marketing managers obsolete?",
        answer:
          "It's reshaping the work, not eliminating the judgment. Marketers who learn to direct and quality-control AI become more valuable because they combine AI leverage with brand, audience, and strategy sense that models lack. This pivot turns the disruption into an advantage.",
      },
      {
        question: "How long does it take to pivot into AI content strategy?",
        answer:
          "Because you're building on existing marketing expertise, it can be relatively quick — often a couple of months of focused learning on AI tools, prompt design, output evaluation, and workflow design, plus a portfolio showing AI-assisted content you shipped with quality controls.",
      },
    ],
  },
  {
    slug: "administrative-assistant-to-executive-assistant",
    fromSlug: "administrative-assistant",
    toSlug: "executive-assistant",
    fromRole: "Administrative Assistant",
    toRole: "Executive Assistant",
    headline: "From Administrative Assistant to Executive Assistant: From Task Support to Strategic Partner",
    description:
      "The EA role is a meaningful step up in pay, autonomy, and influence. It rewards judgment, discretion, and the ability to be a leader's force multiplier.",
    keywords: [
      "administrative assistant to executive assistant",
      "admin to ea career change",
      "executive assistant career pivot",
    ],
    tldr: [
      "EA is a step up in pay and influence — a strategic partner to a leader, not just task support.",
      "The differentiators are judgment, discretion, prioritization, and proactivity.",
      "Often an internal promotion; demonstrate you can anticipate needs and manage complexity.",
    ],
    bodyBlocks: [
      {
        heading: "The real difference",
        body: "Administrative work is largely task execution; an executive assistant is a strategic partner who manages a leader's time, priorities, and information flow, and often represents them. It rewards anticipation — solving problems before they land on the executive's desk — and sound judgment under confidentiality.",
      },
      {
        heading: "What to develop",
        body: "Sharpen prioritization, discretion with sensitive information, stakeholder communication at senior levels, and proactive problem-solving. Learn the business well enough to make good calls on the executive's behalf. Polished written communication and calendar/priority triage are daily differentiators.",
      },
      {
        heading: "How to get there",
        body: "Many EAs are promoted internally. Take on higher-stakes coordination, show you can be trusted with ambiguity and confidentiality, and make the case. " + CTA,
      },
    ],
    transferableSkills: [
      "Calendar and priority management",
      "Discretion and trust",
      "Written communication",
      "Multitasking",
      "Anticipating needs",
    ],
    timeline: "3–9 months",
    faq: [
      {
        question: "What's the difference between an admin assistant and an executive assistant?",
        answer:
          "An administrative assistant mostly executes tasks; an executive assistant is a strategic partner to a leader — managing their time, priorities, and information, exercising judgment on their behalf, and handling confidential matters. EAs have more autonomy, influence, and pay.",
      },
      {
        question: "How do I move up to an executive assistant role?",
        answer:
          "Develop judgment, discretion, and proactive problem-solving; take on higher-stakes coordination; and demonstrate you can be trusted with ambiguity and confidential information. Many EAs are promoted internally after proving they can anticipate a leader's needs.",
      },
      {
        question: "Is executive assistant a good career move?",
        answer:
          "For those who enjoy being a high-trust force multiplier, yes. It offers a clear step up in pay, autonomy, and access, and can lead further into chief-of-staff or operations roles over time.",
      },
    ],
  },
  {
    slug: "warehouse-worker-to-supply-chain-analyst",
    fromSlug: "warehouse-worker",
    toSlug: "supply-chain-analyst",
    fromRole: "Warehouse Worker",
    toRole: "Supply Chain Analyst",
    headline: "From Warehouse Worker to Supply Chain Analyst: From Moving Product to Optimizing the Flow",
    description:
      "You've seen where the supply chain actually breaks. Analytics turns that ground-truth knowledge into a desk-based, better-paid role optimizing the whole system.",
    keywords: [
      "warehouse worker to supply chain analyst",
      "warehouse to supply chain career change",
      "supply chain analyst career pivot",
    ],
    tldr: [
      "Frontline warehouse experience gives you real insight into where the supply chain breaks.",
      "Add Excel, SQL, and supply-chain fundamentals to move into analysis.",
      "Internal moves into inventory, logistics, or planning analytics are the realistic path.",
    ],
    bodyBlocks: [
      {
        heading: "Ground truth is valuable",
        body: "Analysts who've never touched a warehouse floor miss the real-world frictions — where inventory piles up, why picks slow down, how process breaks under volume. Having lived it, you can spot problems and sanity-check data in a way pure spreadsheet analysts can't.",
      },
      {
        heading: "The skill build",
        body: "Learn advanced Excel, then SQL, plus supply-chain fundamentals (inventory management, demand planning, logistics KPIs). Practice by analyzing a real warehouse metric — throughput, accuracy, cycle time — and proposing an improvement backed by data. A supply-chain or analytics certificate can help.",
      },
      {
        heading: "The internal ladder",
        body: "Ask about inventory, logistics, or planning analyst openings where you already work; employers value people who understand operations from the ground up. " + CTA,
      },
    ],
    transferableSkills: [
      "Operational ground truth",
      "Inventory and logistics knowledge",
      "Process awareness",
      "Reliability and safety discipline",
      "Working to targets",
    ],
    timeline: "6–12 months",
    faq: [
      {
        question: "Can a warehouse worker become a supply chain analyst?",
        answer:
          "Yes. Frontline experience gives you genuine insight into where supply chains break, which is valuable in analysis. Adding Excel, SQL, and supply-chain fundamentals lets you move into inventory, logistics, or planning analytics — often through an internal transfer.",
      },
      {
        question: "What should I learn to move into supply chain analysis?",
        answer:
          "Advanced Excel, SQL, and supply-chain fundamentals like inventory management, demand planning, and logistics KPIs. Analyzing a real operational metric and proposing a data-backed improvement makes a strong portfolio and interview story.",
      },
      {
        question: "Is an internal move the best route?",
        answer:
          "Usually. Employers value candidates who understand operations from the ground up, so pursuing inventory, logistics, or planning analyst roles at your current company is often the highest-probability path into the field.",
      },
    ],
  },
];

/** Look up a single pivot page by its full slug (`from-to-role`). */
export function getPivot(slug: string): PivotPage | undefined {
  return pivots.find((p) => p.slug === slug);
}

/** All slugs — use for generateStaticParams in the /pivot/[from]-to-[role] route. */
export function getAllPivotSlugs(): string[] {
  return pivots.map((p) => p.slug);
}

/** Pivots that share a "from" role — useful for cross-linking related pages. */
export function getPivotsFromRole(fromSlug: string): PivotPage[] {
  return pivots.filter((p) => p.fromSlug === fromSlug);
}

/** Pivots that share a "to" role — useful for cross-linking related pages. */
export function getPivotsToRole(toSlug: string): PivotPage[] {
  return pivots.filter((p) => p.toSlug === toSlug);
}
