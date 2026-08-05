import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://ai-career-pivot.com";

/**
 * llms.txt / llms-full.txt renderers.
 *
 * These replace the old static files in `public/`, which only listed ~20 of the
 * blog posts and went stale the moment a new post shipped (and accumulated dead
 * slugs for posts that were later renamed/removed). Generating the blog index
 * from `getAllPosts()` at build time means every published post is discoverable
 * and citable by AI engines, and the index refreshes on every deploy with zero
 * maintenance. See AIC-1053 (technical SEO/GEO health audit).
 */

const SUMMARY = `# AICareerPivot

> AI-powered career transition strategist that builds personalized roadmaps based on your skills, finances, and family constraints.

AICareerPivot analyzes your resume, LinkedIn profile, financial situation, and family obligations to create realistic career pivot plans with concrete 6-month, 1-year, and 2-year milestones. Unlike generic career advice, it accounts for mortgages, dependents, income continuity needs, and personal constraints.

## Key Features

- Extracts 20-40 transferable skills from your resume and LinkedIn
- 2-3 personalized career pivot paths ranked by fit
- Financial viability analysis with income continuity planning
- Constraint-aware planning (salary, family, location)
- Concrete milestone roadmaps at 6 months, 1 year, and 2 years
- Skill gap identification with specific action steps
- Resume reframing guide and networking strategy

## Pricing

- Report: $29 one-time — full personalized career pivot roadmap with 30-day money-back guarantee
- Pro: $29/month — unlimited report updates, AI certifications roadmap, ongoing coaching insights
- Lifetime: $149 one-time — all current and future Pro features forever

## Who It's For

- Burned-out professionals ready for change
- Parents who can't just quit and figure it out
- Earners who need income continuity during transition
- Career changers entering a new industry

## Key Links

- Homepage: ${BASE_URL}
- Pricing: ${BASE_URL}/pricing
- How It Works: ${BASE_URL}/how-it-works
- About: ${BASE_URL}/about
- FAQ: ${BASE_URL}/faq
- Blog: ${BASE_URL}/blog`;

const FULL_DOC = `# AICareerPivot — Full Product Documentation

> AI-powered career transition strategist that builds personalized roadmaps based on your skills, finances, and family constraints.

Website: ${BASE_URL}

## What It Does

AICareerPivot helps professionals navigate career transitions with realistic, actionable plans. Unlike generic career advice, it accounts for your whole-life context: mortgages, dependents, income continuity needs, and personal constraints.

The AI analyzes your actual resume and LinkedIn profile to extract 20-40 transferable skills, then builds custom transition roadmaps grounded in labor market data, salary benchmarks, and real industry transition patterns.

## How It Works

### Step 1: We Read Your Background
Share your LinkedIn, resume, and portfolio. The AI analyzes your experience, job history, transferable skills, and achievements.

### Step 2: AI Builds Your Strategy
Combines your background with financial situation and family constraints. Creates a custom transition roadmap — not generic advice. Identifies which skills transfer vs. which are gaps. Calculates financial viability and income continuity strategy. Sequences milestones to minimize financial risk.

### Step 3: Execute with Confidence
Get concrete milestones for 6 months, 1 year, and 2 years. Includes skill gap analysis, specific resources, certifications, projects by milestone, resume reframing guide, and networking strategy for your target industry.

## Pricing

### Report — $29 (One-Time)
- 2-3 personalized career pivot paths ranked by fit
- 6-month, 1-year, and 2-year milestone roadmaps
- Transferable skills analysis (20-40 skills extracted)
- Skill gap identification with action steps
- Financial considerations for each path
- Constraint-aware planning (salary, family, location)
- Permanent access to your report
- 30-day money-back guarantee

### Pro — $29/month
- Everything in the one-time report
- Unlimited report updates as your situation changes
- AI certifications roadmap
- Ongoing career coaching insights
- Priority support
- Cancel anytime

### Lifetime — $149 (One-Time)
- All current and future Pro features — forever
- No recurring charges
- Priority support
- Early-adopter recognition
- Product Hunt exclusive, limited to first 100 supporters

## Who It's For

- Burned-out professionals ready for change
- Parents who can't just quit and figure it out
- Earners who need income continuity during transition
- Career changers entering a new industry
- Remote workers exploring new opportunities
- Ambitious employees who want faster growth

## Core Methodology

1. **Whole-Life Context** — Accounts for mortgages, dependents, and partners with their own careers.
2. **Financial Realism** — Calculates financial runway, factors in income continuity requirements, designs transition paths that don't require quitting impulsively.
3. **Skills-First Mapping** — Identifies transferable skills, quantifies gaps, recommends efficient learning paths.
4. **Time-Horizoned Planning** — Concrete milestones at 6 months, 1 year, and 2 years with clear next steps.
5. **Evidence-Based Recommendations** — Grounded in labor market data, industry transition patterns, and real salary benchmarks.

## FAQ

### How long does a career pivot typically take?
12-24 months when planned properly. AICareerPivot creates realistic timelines based on your specific situation.

### Do I need a lot of savings?
Not necessarily. AICareerPivot designs transition paths that maintain income continuity — many pivots can be staged while you're still employed.

### Can I change careers if I have a family?
Yes — this is exactly what AICareerPivot is designed for. It factors in family constraints, dependent care costs, and household obligations.

### What types of pivots are supported?
Technical to management, industry transitions, corporate to entrepreneurship, in-person to remote, individual contributor to leadership, and more.

### How is this different from a career coach?
Career coaches charge $150-500/hour and often give generic advice. AICareerPivot provides data-informed, personalized roadmaps with labor market evidence at a fraction of the cost ($29 one-time).

### How is this different from ChatGPT?
ChatGPT gives generic advice unless you spend 30-45 minutes carefully prompting it with your full background. AICareerPivot extracts your transferable skills automatically and outputs a structured roadmap. Most users get better output in 5 minutes than from an hour of ChatGPT prompting.

### What information do I need to provide?
Current role/industry, key skills, target direction, financial situation (income/savings/expenses), timeline and risk tolerance, and family constraints.

### Will it include specific actions?
Yes — concrete next steps for each milestone: which skills to build, certifications to pursue, networking strategies, resume reframing, and job search timing.

### Is my data secure?
Yes. Your resume and profile data are processed securely, never shared with third parties, and you can request deletion anytime. Payment is handled by Stripe.`;

const KEY_LINKS_FULL = `## Key Links

- Homepage: ${BASE_URL}
- Pricing: ${BASE_URL}/pricing
- How It Works: ${BASE_URL}/how-it-works
- About: ${BASE_URL}/about
- FAQ: ${BASE_URL}/faq
- Blog: ${BASE_URL}/blog`;

/**
 * Full, always-fresh index of every published blog post, newest first. Emitted
 * as a Markdown link list with descriptions — the format AI crawlers parse to
 * discover and cite individual articles.
 */
function blogIndex(withDescriptions: boolean): string {
  const posts = getAllPosts();
  const lines = posts.map((post) => {
    const url = `${BASE_URL}/blog/${post.slug}`;
    if (withDescriptions) {
      return `- [${post.title}](${url}) — ${post.description}`;
    }
    return `- [${post.title}](${url})`;
  });
  return lines.join("\n");
}

export function renderLlmsTxt(): string {
  const posts = getAllPosts();
  return `${SUMMARY}

## Blog — Full Index (${posts.length} guides for career changers)

${blogIndex(false)}

## Extended Documentation

- [Full product details, FAQ, and blog index](${BASE_URL}/llms-full.txt)
`;
}

export function renderLlmsFullTxt(): string {
  const posts = getAllPosts();
  return `${FULL_DOC}

## Blog — Full Index

AICareerPivot publishes practical, honest guides for career changers pivoting into AI and adjacent roles. All ${posts.length} published guides, newest first:

${blogIndex(true)}

${KEY_LINKS_FULL}
`;
}
