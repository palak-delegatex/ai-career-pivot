import { Resend } from "resend";

const FROM = "AICareerPivot Team <team@ai-career-pivot.com>";
const REPLY_TO = "founders@ai-career-pivot.com";
const SITE = "https://ai-career-pivot.com";
const FOUNDER = "The AICareerPivot Team";

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

export function getEmailTemplate(step: number, firstName: string): EmailTemplate | null {
  const name = firstName || "there";

  switch (step) {
    case 1:
      return {
        subject: "You're on the list. Here's what happens next.",
        previewText: "We're building something different.",
        html: baseHtml(`
          ${h1(`You're on the list, ${name}.`)}
          ${p("Thank you for joining the AICareerPivot waitlist.")}
          ${p("Here's what we're building — and why:")}
          ${p("Most career advice is useless for people with real responsibilities.")}
          ${p("It tells you to \"save 6 months of expenses and make the leap\" — without asking about your mortgage. It says \"do a bootcamp\" — without asking about your kids' daycare schedule. It says \"network your way in\" — without asking how much runway you actually have.")}
          ${p("AICareerPivot does something different. You tell us your actual situation:")}
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li>Your current skills and role</li>
            <li>Your monthly obligations</li>
            <li>Your family constraints</li>
            <li>Where you want to go</li>
          </ul>
          ${p("And we build you a real roadmap. 6 months, 1 year, 2 years. Specific steps. Calibrated to your life.")}
          ${p("We're in early access mode right now, building with a small group of people before we open more widely.")}
          ${p("<strong style=\"color:#f1f5f9;\">One question while you're here:</strong> What's the single biggest thing that's kept you from making a career change so far?")}
          ${p("Hit reply — we read every response.")}
          ${sig()}
          <div style="margin-top:32px;">
            ${cta("Explore AICareerPivot →", utmLink("/", "welcome_cta"))}
          </div>
        `),
      };

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
          ${p("This is the problem AICareerPivot is designed to solve. Not by pretending your constraints don't exist — but by building a roadmap that works <em>within</em> them.")}
          ${p("More on how it works in a few days.")}
          ${sig()}
        `),
      };

    case 3:
      return {
        subject: "How constraint-aware career planning actually works",
        previewText: "The plan that fits your life, not someone else's.",
        html: baseHtml(`
          ${h1("How constraint-aware career planning actually works")}
          ${p(`Hi ${name},`)}
          ${p("Last time I talked about why career advice fails most people. Today I want to show you how we're building something different.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Step 1 — Map your constraints (not just your goals)</p>
          ${p("Before we talk about where you want to go, we ask about what surrounds you: monthly obligations, your financial floor, family situation, and risk tolerance. This isn't to talk you out of a change — it's to build a plan that's actually executable.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Step 2 — Assess your transferable assets</p>
          ${p("Your current skills, relationships, and experience have more value in new contexts than most frameworks acknowledge. We map what you have against what's needed — and what gaps actually matter vs. which ones are noise.")}
          <p style="color:#2dd4bf;font-size:18px;font-weight:600;margin:24px 0 8px 0;">Step 3 — Build the phased roadmap</p>
          <ul style="color:#94a3b8;font-size:16px;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
            <li><strong style="color:#f1f5f9;">6 months:</strong> What you can do without leaving your job</li>
            <li><strong style="color:#f1f5f9;">12 months:</strong> The transition point — when the math makes sense to move</li>
            <li><strong style="color:#f1f5f9;">24 months:</strong> Where you're targeting to be, with checkpoints</li>
          </ul>
          ${p("Every step is tied back to your specific constraints. If your financial floor means you need to maintain 90% of your current income through the transition, the plan accounts for that.")}
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
          ${p("When Marcus went through AICareerPivot, here's what the roadmap showed him:")}
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

    default:
      return null;
  }
}

export async function sendDripEmail(
  to: string,
  firstName: string,
  step: number
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const template = getEmailTemplate(step, firstName);
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
