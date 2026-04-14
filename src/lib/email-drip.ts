import { Resend } from "resend";

const FROM = "AICareerPivot Team <team@ai-career-pivot.com>";
const REPLY_TO = "founders@ai-career-pivot.com";
const SITE = "https://ai-career-pivot.com";
const FOUNDER = "The AICareerPivot Team";

export const TIER_THRESHOLDS: Record<number, string> = {
  1: "mover",
  3: "trailblazer",
  5: "pioneer",
  10: "architect",
};

function utmLink(path: string, campaign: string) {
  return `${SITE}${path}?utm_source=email&utm_medium=nurture&utm_campaign=${campaign}`;
}

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
    <div style="margin-bottom:32px;">
      <span style="color:#2dd4bf;font-weight:700;font-size:18px;">AICareerPivot</span>
    </div>
    ${content}
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #1e293b;">
      <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;">
        You're receiving this because you joined the AICareerPivot waitlist.<br>
        <a href="${utmLink("/", "unsubscribe")}" style="color:#475569;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function p(text: string) {
  return `<p style="color:#94a3b8;font-size:16px;line-height:1.7;margin:0 0 16px 0;">${text}</p>`;
}

function h1(text: string) {
  return `<h1 style="color:#f1f5f9;font-size:26px;font-weight:700;line-height:1.3;margin:0 0 24px 0;">${text}</h1>`;
}

function cta(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:#0d9488;color:#f9fafb;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">${text}</a>`;
}

function sig() {
  return `<p style="color:#64748b;font-size:15px;line-height:1.6;margin:24px 0 0 0;">${FOUNDER}</p>`;
}

export interface EmailTemplate {
  subject: string;
  previewText: string;
  html: string;
}

export interface EmailOpts {
  intakeSkillCount?: number;
  referralCode?: string;
  referralCount?: number;
  referralName?: string;
  nextTierName?: string;
  nextTierCount?: number;
}

export function getEmailTemplate(
  step: number,
  firstName: string,
  opts?: EmailOpts
): EmailTemplate | null {
  const name = firstName || "there";
  const intakeSkillCount = opts?.intakeSkillCount;

  switch (step) {
    case 1: {
      const referralLink = opts?.referralCode
        ? `${SITE}?ref=${opts.referralCode}`
        : null;
      return {
        subject: "You're on the list. Here's what makes us different.",
        previewText: "Unlike generic career advice, we read your actual experience.",
        html: baseHtml(`
          ${h1(`You're on the list, ${name}.`)}
          ${p("Thank you for joining the AICareerPivot waitlist.")}
          ${p("Here's what we're building — and why it's different from every other career tool you've tried:")}
          ${p("Most career advice is useless for people with real responsibilities. It tells you to \"save 6 months of expenses and make the leap\" — without asking about your mortgage. It says \"do a bootcamp\" — without asking about your kids' daycare schedule. It says \"network your way in\" — without asking how much runway you actually have.")}
          ${p("<strong style=\"color:#f1f5f9;\">But there's a deeper problem: generic advice ignores your actual background.</strong>")}
          ${p("ChatGPT will tell any software engineer to \"pivot into product management.\" It doesn't know that you spent 3 years leading cross-functional teams, that you have domain expertise in healthcare, or that your side project already has paying users.")}
          ${p("AICareerPivot does something different. Before we generate a single recommendation, we run a personalized research phase:")}
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>We analyze your LinkedIn profile — job history, skills, endorsements, career trajectory</li>
            <li>We parse your resume — achievements, tools, certifications, quantified impact</li>
            <li>We review your portfolio or personal site if you have one</li>
          </ul>
          ${p("Then we build your roadmap from <em>your actual experience</em> — not a template.")}
          ${p("<strong style=\"color:#f1f5f9;\">One question while you're here:</strong> What's the single biggest thing that's kept you from making a career change so far?")}
          ${p("Hit reply — we read every response.")}
          ${referralLink ? `
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:32px 0;">
            <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 8px 0;">Want to move up the list?</p>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 12px 0;">Share your personal link and skip the queue.</p>
            <p style="color:#f1f5f9;font-size:14px;margin:0 0 16px 0;word-break:break-all;">→ <a href="${referralLink}" style="color:#2dd4bf;">${referralLink}</a></p>
            <p style="color:#64748b;font-size:13px;margin:0;">1 referral = skip 50 spots &nbsp;·&nbsp; 5 referrals = first cohort + 1 month free</p>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 16px 0;"><strong style="color:#94a3b8;">Copy to share:</strong> "I'm on the waitlist for AICareerPivot — an AI tool that builds career change roadmaps around your real constraints (mortgage, kids, financial obligations). Way more useful than generic advice. If this sounds like you: ${referralLink}"</p>
          ` : ""}
          ${sig()}
          <div style="margin-top:32px;">
            ${cta("Explore AICareerPivot →", utmLink("/", "welcome_cta"))}
          </div>
        `),
      };
    }

    case 2:
      return {
        subject: "The real reason career advice keeps failing you",
        previewText: "It's not your fault. The advice was never built for your situation.",
        html: baseHtml(`
          ${h1("The real reason career advice keeps failing you")}
          ${p(`Hi ${name},`)}
          ${p("I want to share something we've learned from talking to hundreds of people who are stuck in their careers.")}
          ${p("Almost none of them are stuck because they're lazy, lack ambition, or don't know what they want.")}
          ${p("They're stuck because <strong style=\"color:#f1f5f9;\">every career change framework was designed for someone who doesn't exist.</strong>")}
          ${p("The mythical \"pivotable professional\" has:")}
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>No mortgage (or a partner who can cover it alone)</li>
            <li>No dependents who need routine and stability</li>
            <li>12–18 months of savings to burn through</li>
            <li>A partner who can flex their career to support the transition</li>
            <li>The ability to take a significant pay cut for 2–3 years</li>
          </ul>
          ${p("For most people considering a career change, none of that is true.")}
          ${p("So they do what anyone rational does: they wait. \"When the timing is better.\" \"After the kids are in school.\" \"Once we pay off the car.\"")}
          ${p("And years pass.")}
          ${p("But there's a second problem nobody talks about: <strong style=\"color:#f1f5f9;\">even when people are finally ready to act, the advice they get ignores who they actually are.</strong>")}
          ${p("Generic tools ask \"what field do you want to enter?\" They don't ask what you've spent a decade getting really good at. They don't identify the transferable skills buried in your job history that are worth real money in a new context.")}
          ${p("That's why we built a research phase before any recommendation. We read your actual experience first.")}
          ${p("More on exactly how that works in a few days.")}
          ${sig()}
          ${p("<strong style=\"color:#f1f5f9;\">P.S.</strong> — Unlike every other career tool, we actually read your background. Not a quiz. Your real resume. Your actual LinkedIn. We built this because we hate generic advice as much as you do.")}
        `),
      };

    case 3:
      return {
        subject: "How we build your plan (it starts by reading your background)",
        previewText: "We analyze your real experience before generating a single recommendation.",
        html: baseHtml(`
          ${h1("How we build your plan — starting with who you actually are")}
          ${p(`Hi ${name},`)}
          ${p("Last time I talked about why career advice fails most people. Today I want to show you how we do it differently — starting from the very first step.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Step 1 — The research phase (this is what makes us different)</p>
          ${p("Before we generate a single recommendation, we run a personalized research phase on your actual background. You provide your LinkedIn URL, upload your resume, and optionally share your portfolio or personal site.")}
          ${p("Then our AI reads all of it:")}
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>Job history, career trajectory, tenure patterns</li>
            <li>Skills, endorsements, certifications</li>
            <li>Specific achievements and quantified impact from your resume</li>
            <li>Side projects, writing, or technical depth from your portfolio</li>
          </ul>
          ${p("The output is a profile of your transferable assets — the skills and experiences that carry real value across industries, including ones you might not have thought to list.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Step 2 — Map your constraints (not just your goals)</p>
          ${p("We also ask about what surrounds you: monthly obligations, your financial floor, family situation, and risk tolerance. This isn't to talk you out of a change — it's to build a plan that's actually executable.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Step 3 — Build the phased roadmap from your real data</p>
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li><strong style="color:#f1f5f9;">6 months:</strong> What you can do without leaving your job, based on what you already have</li>
            <li><strong style="color:#f1f5f9;">12 months:</strong> The transition point — when the math makes sense to move</li>
            <li><strong style="color:#f1f5f9;">24 months:</strong> Where you're targeting to be, with checkpoints tied to your specific situation</li>
          </ul>
          ${p("Every recommendation is grounded in your actual experience and actual constraints. Not a template. Not generic advice.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Here is what we do when you are ready:</p>
          <ol style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>You give us your LinkedIn URL and resume (takes 2 minutes)</li>
            <li>We extract your transferable skills, industry history, and career trajectory</li>
            <li>Our AI cross-references with 50+ career path patterns and real salary data</li>
            <li>You get a roadmap built for your specific background — not someone who looks vaguely like you</li>
          </ol>
          ${p("We're opening up early access to our first cohort soon. You're on the list — you'll hear first.")}
          ${sig()}
        `),
      };

    case 4:
      return {
        subject: "\"I'd been planning to change careers for 4 years\"",
        previewText: "A story that might sound familiar.",
        html: baseHtml(`
          ${h1("\"I'd been planning to change careers for 4 years\"")}
          ${p(`Hi ${name},`)}
          ${p("I want to share a story.")}
          ${p("(Names changed, but the situation is real — this is someone in our early beta group.)")}
          ${p("Marcus is 38. Senior product manager at a financial services company. He's been \"planning to move into climate tech\" for four years. He has a $3,200/month mortgage, two kids, a wife who took a pay cut 18 months ago for a job she loves, and about $40k in savings.")}
          ${p("Every career coach told him the same thing: \"Get more involved in the climate space, maybe volunteer.\" Generic. Useless.")}
          ${p("When Marcus went through AICareerPivot, the first thing we did was run our research phase on his LinkedIn and resume. We found 31 transferable skills — including 6 that map directly to roles at climate-focused fintech companies he hadn't considered. His experience structuring climate risk disclosures was worth more than he knew.")}
          ${p("Then here's what the roadmap showed him:")}
          <div style="background:#0f172a;border-left:3px solid #2dd4bf;padding:20px 24px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="color:#94a3b8;margin:0 0 12px 0;font-size:15px;"><strong style="color:#2dd4bf;">Months 1–6:</strong> Two specific climate-adjacent skills that overlap with his current PM work. Two companies where his fintech background is actively valued. One adjustment to his savings target.</p>
            <p style="color:#94a3b8;margin:0 0 12px 0;font-size:15px;"><strong style="color:#2dd4bf;">Month 7–12:</strong> A 90-day interview cycle targeting three specific companies, with income continuity as a hard constraint.</p>
            <p style="color:#94a3b8;margin:0;font-size:15px;"><strong style="color:#2dd4bf;">Year 2:</strong> Target role, target comp range, and what success looks like.</p>
          </div>
          ${p("He told us: <em>\"This is the first plan I've had that I actually believe I can execute. Not because it's easy, but because it's mine.\"</em>")}
          ${p("That's what we're building for everyone on this waitlist.")}
          ${p("Early cohort applications open soon.")}
          ${sig()}
        `),
      };

    case 5:
      return {
        subject: "Early cohort is opening — you're invited",
        previewText: "Founding member pricing, locked in forever.",
        html: baseHtml(`
          ${h1("Early cohort is opening — you're invited")}
          ${p(`Hi ${name},`)}
          ${p("We're opening our first cohort of AICareerPivot — and because you've been on the waitlist, you get first access.")}
          <div style="background:#0f172a;border:1px solid #1e293b;padding:24px;border-radius:12px;margin:24px 0;">
            <p style="color:#f1f5f9;font-weight:600;font-size:17px;margin:0 0 16px 0;">What's included:</p>
            <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0;">
              <li>Full constraint-aware career roadmap (6/12/24 months)</li>
              <li>Personalized to your financial situation, family constraints, and target direction</li>
              <li>Unlimited roadmap updates as your situation changes</li>
              <li>Direct access to give feedback that shapes the product</li>
            </ul>
          </div>
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;">
            <p style="color:#2dd4bf;font-weight:700;font-size:20px;margin:0 0 8px 0;">Founding member pricing: $49/month</p>
            <p style="color:#94a3b8;font-size:14px;margin:0;">Regular pricing will be $99/month. Founding members lock in $49 forever.</p>
          </div>
          ${p("We're keeping the first cohort small — 50 people maximum — so we can give each roadmap genuine attention and incorporate your feedback fast.")}
          <div style="margin:32px 0;">
            ${cta("Join the founding cohort — $49/month →", utmLink("/waitlist", "cohort_cta_email5"))}
          </div>
          ${p("If the timing isn't right, no worries — you'll stay on the waitlist and hear about future cohorts.")}
          ${p("Either way, thank you for being here from the beginning.")}
          ${sig()}
          ${p("<strong style=\"color:#f1f5f9;\">P.S.</strong> Have questions before signing up? Hit reply. We're answering every one today.")}
        `),
      };

    // Post-intake confirmation: sent after user completes the research intake
    case 6:
      return {
        subject: `We analyzed ${intakeSkillCount ?? "your"} transferable skills from your background`,
        previewText: "Your personalized career profile is ready.",
        html: baseHtml(`
          ${h1(`Your profile is ready, ${name}.`)}
          ${p("We finished analyzing your background.")}
          ${intakeSkillCount
            ? `<div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;text-align:center;">
                <p style="color:#2dd4bf;font-weight:700;font-size:32px;margin:0 0 8px 0;">${intakeSkillCount}</p>
                <p style="color:#94a3b8;font-size:15px;margin:0;">transferable skills identified from your experience</p>
              </div>`
            : ""}
          ${p("Unlike generic career advice, we didn't start with a template. We started with your LinkedIn, your resume, and your actual career history.")}
          ${p("Here's what we found in your background:")}
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>Skills you've built that carry real value in adjacent fields</li>
            <li>Experience patterns that open specific pivot paths — not generic ones</li>
            <li>Gaps that actually matter vs. gaps that are noise for your target direction</li>
          </ul>
          ${p("Your personalized pivot roadmap is being generated now based on everything we found.")}
          ${p("You'll receive it shortly — and it will be calibrated to your actual background, not a career changer archetype.")}
          ${sig()}
        `),
      };

    // Re-engagement: sent to users who started but didn't finish intake
    case 7:
      return {
        subject: "Your personalized career analysis is ready when you are",
        previewText: "You started your intake — finish it and we'll build your roadmap.",
        html: baseHtml(`
          ${h1(`Your roadmap is waiting, ${name}.`)}
          ${p("You started your career intake a few days ago but didn't finish. No pressure — but we wanted to let you know your analysis is ready to complete.")}
          ${p("Here's what happens when you finish:")}
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>We analyze your LinkedIn profile and resume to identify transferable skills</li>
            <li>We map those skills against realistic pivot paths for your situation</li>
            <li>We build a personalized 6-month, 1-year, and 2-year roadmap from your actual data</li>
          </ul>
          ${p("This is the thing that makes AICareerPivot different: we don't start with generic advice and ask you to apply it. We start with who you actually are and build from there.")}
          ${p("Most career advice ignores your actual background. We don't.")}
          <div style="margin:32px 0;">
            ${cta("Complete my career intake →", utmLink("/intake", "reengagement_cta"))}
          </div>
          ${p("Takes about 3 minutes. We'll handle the rest.")}
          ${sig()}
        `),
      };

    // Referral notification: fires on every referral_count increment
    case 8: {
      const referralLink = opts?.referralCode
        ? `${SITE}?ref=${opts.referralCode}`
        : SITE;
      const count = opts?.referralCount ?? 1;
      const nextTierCount = opts?.nextTierCount;
      const nextTierName = opts?.nextTierName;
      const referralName = opts?.referralName ?? "Someone";
      return {
        subject: "Someone just joined through your link",
        previewText: `${referralName} just joined the AICareerPivot waitlist through your link.`,
        html: baseHtml(`
          ${h1(`${referralName} just joined through your link.`)}
          ${p(`Quick note: ${referralName} just joined the AICareerPivot waitlist through your referral link.`)}
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;text-align:center;">
            <p style="color:#2dd4bf;font-weight:700;font-size:32px;margin:0 0 4px 0;">${count}</p>
            <p style="color:#94a3b8;font-size:15px;margin:0;">total referral${count === 1 ? "" : "s"} — you've moved up ${count * 50} spots</p>
          </div>
          ${nextTierCount && nextTierName
            ? p(`You're <strong style="color:#f1f5f9;">${nextTierCount - count} referral${nextTierCount - count === 1 ? "" : "s"} away</strong> from unlocking <strong style="color:#f1f5f9;">${nextTierName}</strong> tier.`)
            : p("You've reached the top tier. Thank you for spreading the word.")}
          ${p(`→ Share your link again: <a href="${referralLink}" style="color:#2dd4bf;word-break:break-all;">${referralLink}</a>`)}
          ${sig()}
        `),
      };
    }

    // Milestone email: 1 referral (Mover)
    case 9:
      return {
        subject: "You've moved up 50 spots — Mover tier unlocked",
        previewText: "Your first referral just earned you 50 queue spots.",
        html: baseHtml(`
          ${h1(`You've unlocked Mover tier, ${name}.`)}
          ${p("You referred your first person to AICareerPivot.")}
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;">
            <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 8px 0;">✓ You've earned:</p>
            <p style="color:#f1f5f9;font-size:16px;margin:0;">Skip 50 people on the waitlist</p>
          </div>
          ${p("2 more referrals unlocks <strong style=\"color:#f1f5f9;\">Trailblazer</strong> — skip 200 people and guarantee your spot in the first cohort.")}
          ${opts?.referralCode ? p(`→ Keep sharing: <a href="${SITE}?ref=${opts.referralCode}" style="color:#2dd4bf;word-break:break-all;">${SITE}?ref=${opts.referralCode}</a>`) : ""}
          ${sig()}
        `),
      };

    // Milestone email: 3 referrals (Trailblazer)
    case 10:
      return {
        subject: "Trailblazer tier unlocked — first cohort guaranteed",
        previewText: "3 referrals. You're in the first cohort.",
        html: baseHtml(`
          ${h1(`Trailblazer tier, ${name}.`)}
          ${p("You've referred 3 people to AICareerPivot.")}
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;">
            <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 12px 0;">✓ You've earned:</p>
            <p style="color:#f1f5f9;font-size:16px;margin:0 0 8px 0;">Skip 200 people on the waitlist</p>
            <p style="color:#f1f5f9;font-size:16px;margin:0;">Guaranteed spot in our first cohort</p>
          </div>
          ${p("2 more referrals unlocks <strong style=\"color:#f1f5f9;\">Pioneer</strong> — first cohort + 1 month free ($49 value).")}
          ${opts?.referralCode ? p(`→ Keep sharing: <a href="${SITE}?ref=${opts.referralCode}" style="color:#2dd4bf;word-break:break-all;">${SITE}?ref=${opts.referralCode}</a>`) : ""}
          ${sig()}
        `),
      };

    // Milestone email: 5 referrals (Pioneer) — highest priority
    case 11:
      return {
        subject: "You've unlocked first cohort access + 1 free month",
        previewText: "Pioneer tier. First cohort guaranteed plus a month on us.",
        html: baseHtml(`
          ${h1(`Pioneer tier, ${name}.`)}
          ${p("You've referred 5 people to AICareerPivot.")}
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;">
            <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 12px 0;">✓ You've earned:</p>
            <p style="color:#f1f5f9;font-size:16px;margin:0 0 8px 0;">Guaranteed spot in our first cohort</p>
            <p style="color:#f1f5f9;font-size:16px;margin:0;">1 month free when you join ($49 value)</p>
          </div>
          ${p("We'll reach out personally when the cohort opens.")}
          ${p("Thank you — referrals from people who genuinely believe in this make an enormous difference for an early-stage product.")}
          ${opts?.referralCode ? p(`5 more referrals unlocks <strong style="color:#f1f5f9;">Architect</strong> — lifetime founding member pricing ($49/mo locked forever). Keep sharing: <a href="${SITE}?ref=${opts.referralCode}" style="color:#2dd4bf;word-break:break-all;">${SITE}?ref=${opts.referralCode}</a>`) : ""}
          ${sig()}
        `),
      };

    // Milestone email: 10 referrals (Architect)
    case 12:
      return {
        subject: "Architect tier — lifetime founding member pricing locked",
        previewText: "10 referrals. $49/month locked in forever.",
        html: baseHtml(`
          ${h1(`Architect tier, ${name}.`)}
          ${p("You've referred 10 people to AICareerPivot.")}
          <div style="background:#042f2e;border:1px solid #0d9488;padding:20px 24px;border-radius:12px;margin:24px 0;">
            <p style="color:#2dd4bf;font-weight:700;font-size:17px;margin:0 0 12px 0;">✓ You've earned:</p>
            <p style="color:#f1f5f9;font-size:16px;margin:0;">Lifetime founding member pricing — $49/month locked forever</p>
          </div>
          ${p("You're in a very small group. We'll reach out personally before cohort launch.")}
          ${p("Thank you for going this far. It means more than you know.")}
          ${sig()}
        `),
      };

    default:
      return null;
  }
}

// Map milestone referral count to email step
export const MILESTONE_EMAIL_STEP: Record<number, number> = {
  1: 9,
  3: 10,
  5: 11,
  10: 12,
};

export async function sendDripEmail(
  to: string,
  firstName: string,
  step: number,
  opts?: EmailOpts
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const template = getEmailTemplate(step, firstName, opts);
  if (!template) return false;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: template.subject,
    html: template.html,
  });

  if (error) {
    console.error(`Resend error (step ${step}, ${to}):`, error);
    return false;
  }
  return true;
}
